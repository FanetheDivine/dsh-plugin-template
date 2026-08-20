// package.json 打包回归测试：npm pack --dry-run 断言 tarball 只含发布所需文件。
// files 字段（package.json）决定分发内容：dist + cordis.patch.yml + README.md；
// src / tests / scripts 等开发文件不得进包。
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** 仓库根目录（tests/ 的上一级）。 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 执行 npm pack --dry-run --json，返回 tarball 内文件路径集合。 */
function packedPaths(): Set<string> {
  // pack 依赖 dist（构建产物）；未构建时先 build，保证测试独立可跑
  if (!existsSync(path.join(ROOT, 'dist', 'index.mjs'))) {
    const build = spawnSync('pnpm', ['build'], {
      cwd: ROOT,
      encoding: 'utf8',
      // Windows 下 pnpm 是 pnpm.cmd，需经 shell 启动
      shell: process.platform === 'win32',
    });
    if (build.status !== 0) {
      throw new Error(`pnpm build 失败：${String(build.stderr ?? build.stdout ?? '未知错误')}`);
    }
  }
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
  return new Set(report.flatMap((p) => p.files ?? []).map((f) => f.path));
}

describe('npm 包内容（npm pack --dry-run）', () => {
  it('tarball 含 dist/cordis.patch.yml/README.md，不含 src/tests/scripts', () => {
    const packed = packedPaths();
    expect(packed.has('dist/index.mjs')).toBe(true);
    expect(packed.has('dist/index.d.ts')).toBe(true);
    expect(packed.has('cordis.patch.yml')).toBe(true);
    expect(packed.has('README.md')).toBe(true);
    expect([...packed].some((p) => p.startsWith('src/'))).toBe(false);
    expect([...packed].some((p) => p.startsWith('tests/'))).toBe(false);
    expect([...packed].some((p) => p.startsWith('scripts/'))).toBe(false);
  }, 30_000);
});
