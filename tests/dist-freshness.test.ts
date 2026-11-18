// 产物新鲜度检查的行为测试：在临时目录构造构建输入与产物，覆盖新鲜、过期、缺失三种状态。
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { assertFreshDist } from './support/dist-freshness.ts';

/** 构建输入的固定文件（相对仓库根）。 */
const INPUT_FILES = ['tsdown.config.ts', 'tsconfig.json', 'tsconfig.build.json', 'package.json'];

/** 构建应生成的产物（相对仓库根）。 */
const PRODUCT_FILES = [
  'dist/client.js',
  'dist/index.mjs',
  'dist/index.d.ts',
  'dist/client/index.d.ts',
];

/** 输入的默认时间戳（秒），早于产物。 */
const INPUT_SECONDS = 1_700_000_000;

/** 产物的默认时间戳（秒），晚于输入。 */
const PRODUCT_SECONDS = 1_700_000_100;

/** 本用例创建的临时目录，结束时清理。 */
const createdDirs: string[] = [];

afterEach(() => {
  for (const dir of createdDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** 写入文件并设置修改时间，返回文件绝对路径。 */
function write(root: string, relative: string, seconds: number): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, '// fixture\n');
  utimesSync(file, seconds, seconds);
}

/** 在临时目录构造一个构建输入与产物齐全的项目，返回根目录。 */
function createProject(options: {
  inputSeconds?: number;
  productSeconds?: number | null;
  products?: string[];
  inputs?: string[];
}): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'dsh-dist-freshness-'));
  createdDirs.push(root);
  for (const relative of options.inputs ?? ['src/client/index.ts', ...INPUT_FILES]) {
    write(root, relative, options.inputSeconds ?? INPUT_SECONDS);
  }
  if (options.productSeconds !== null) {
    for (const relative of options.products ?? PRODUCT_FILES) {
      write(root, relative, options.productSeconds ?? PRODUCT_SECONDS);
    }
  }
  return root;
}

describe('assertFreshDist', () => {
  it('产物晚于构建输入时通过', () => {
    const root = createProject({});
    expect(() => assertFreshDist(root)).not.toThrow();
  });

  it('构建输入晚于产物时失败并指出过期文件与修复命令', () => {
    const root = createProject({});
    write(root, 'src/client/index.ts', PRODUCT_SECONDS + 50);
    expect(() => assertFreshDist(root)).toThrow(/src\/client\/index\.ts/);
    expect(() => assertFreshDist(root)).toThrow(/pnpm build/);
  });

  it('产物全部缺失时失败并列出修复命令', () => {
    const root = createProject({ productSeconds: null });
    expect(() => assertFreshDist(root)).toThrow(/dist\/client\.js/);
    expect(() => assertFreshDist(root)).toThrow(/pnpm build/);
  });

  it('缺少任一产物时失败', () => {
    const root = createProject({ products: PRODUCT_FILES.slice(1) });
    expect(() => assertFreshDist(root)).toThrow(/dist\/client\.js/);
  });
});
