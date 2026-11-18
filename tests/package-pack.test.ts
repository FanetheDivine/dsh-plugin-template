// package.json 打包回归测试：npm pack --dry-run 断言 tarball 只含发布所需文件。
// files 字段（package.json）决定分发内容：dist + cordis.patch.yml + README.md；
// src / tests / scripts 等开发文件不得进包。产物由 build 生成，过期时测试失败。
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { assertFreshDist } from './support/dist-freshness.ts';

/** 仓库根目录（tests/ 的上一级）。 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 打包结果的缓存：同一进程内只执行一次 npm pack。 */
let cachedPaths: Set<string> | undefined;

/** 执行 npm pack --dry-run --json，返回 tarball 内文件路径集合。 */
function packedPaths(): Set<string> {
  if (cachedPaths !== undefined) return cachedPaths;
  assertFreshDist();
  const res = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    // Windows 下 npm 是 npm.cmd，需经 shell 启动
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    throw new Error(`npm pack --dry-run 失败：${String(res.stderr ?? res.stdout ?? '未知错误')}`);
  }
  // npm pack --json 输出数组（单个包 = 单元素数组），取所有包的文件列表
  const report = JSON.parse(String(res.stdout ?? '[]')) as Array<{
    files?: Array<{ path: string }>;
  }>;
  cachedPaths = new Set(report.flatMap((p) => p.files ?? []).map((f) => f.path));
  return cachedPaths;
}

describe('npm 包内容（npm pack --dry-run）', () => {
  it('tarball 含 dist/cordis.patch.yml/README.md，不含 src/tests/scripts', () => {
    const packed = packedPaths();
    expect(packed.has('dist/index.mjs')).toBe(true);
    expect(packed.has('dist/index.d.ts')).toBe(true);
    expect(packed.has('dist/client.js')).toBe(true);
    expect(packed.has('cordis.patch.yml')).toBe(true);
    expect(packed.has('README.md')).toBe(true);
    expect([...packed].some((p) => p.startsWith('src/'))).toBe(false);
    expect([...packed].some((p) => p.startsWith('tests/'))).toBe(false);
    expect([...packed].some((p) => p.startsWith('scripts/'))).toBe(false);
  }, 30_000);

  it('前端产物以包名注册闭包工厂', () => {
    // 打包会先构建；读取的产物与包内容一致
    packedPaths();
    const client = readFileSync(path.join(ROOT, 'dist', 'client.js'), 'utf8');
    expect(client).toContain('window.__ModuleLoader__.load(');
    expect(client).toContain('id: "dsh-plugin-template"');
    expect(client).toContain('exports.inject');
    expect(client).toContain('exports.apply');
  });
});
