// 宿主依赖版本测试：断言 package.json 的 @deepseek-ai/dsh-* 依赖版本一致，
// 且每个依赖以同版本列入 pnpm-workspace.yaml 的 minimumReleaseAgeExclude。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** 仓库根目录（tests/ 的上一级）。 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** dsh 子包的包名前缀。 */
const DSH_PREFIX = '@deepseek-ai/dsh-';

/** 确切版本号：不含 ~、^、范围与通配符。 */
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** 收集 package.json 各依赖字段中的 dsh 子包及其版本。 */
function readDshDependencies(): Map<string, string> {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  const deps = new Map<string, string>();
  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const record = (pkg[field] ?? {}) as Record<string, string>;
    for (const [name, version] of Object.entries(record)) {
      if (name.startsWith(DSH_PREFIX)) deps.set(name, version);
    }
  }
  return deps;
}

/** 读取 pnpm-workspace.yaml 中 minimumReleaseAgeExclude 列表的条目。 */
function readMinimumReleaseAgeExclude(): string[] {
  const lines = readFileSync(path.join(ROOT, 'pnpm-workspace.yaml'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex((line) => /^minimumReleaseAgeExclude:\s*$/.test(line));
  if (start < 0) return [];
  const entries: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const item = /^\s+-\s+['"]?([^'"\s]+)['"]?\s*$/.exec(line);
    if (item) {
      entries.push(item[1]);
      continue;
    }
    if (line.trim() !== '' && !/^\s/.test(line)) break;
  }
  return entries;
}

describe('宿主依赖版本', () => {
  const deps = readDshDependencies();
  const excludes = readMinimumReleaseAgeExclude();

  it('全部 dsh 子包锁定为同一个确切版本', () => {
    expect(deps.size).toBeGreaterThan(0);
    const versions = new Set(deps.values());
    expect([...versions]).toHaveLength(1);
    for (const version of versions) expect(version).toMatch(EXACT_VERSION);
  });

  it('每个 dsh 子包以同版本列入 minimumReleaseAgeExclude', () => {
    const missing = [...deps]
      .map(([name, version]) => `${name}@${version}`)
      .filter((entry) => !excludes.includes(entry));
    expect(missing).toEqual([]);
  });

  it('minimumReleaseAgeExclude 中的 dsh 条目都对应一个依赖', () => {
    const expected = new Set([...deps].map(([name, version]) => `${name}@${version}`));
    const stale = excludes.filter((entry) => entry.startsWith(DSH_PREFIX) && !expected.has(entry));
    expect(stale).toEqual([]);
  });
});
