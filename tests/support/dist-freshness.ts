// 产物新鲜度检查：产物缺失或构建输入晚于产物时给出构建提示。
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 参与构建的固定文件（相对仓库根）。 */
const BUILD_INPUT_FILES = [
  'tsdown.config.ts',
  'tsconfig.json',
  'tsconfig.build.json',
  'package.json',
] as const;

/** 参与构建的源码目录（相对仓库根）。 */
const BUILD_INPUT_DIRS = ['src'] as const;

/** 构建应生成的发布产物（相对仓库根）。 */
const BUILD_PRODUCTS = [
  'dist/client.js',
  'dist/index.mjs',
  'dist/index.d.ts',
  'dist/client/index.d.ts',
] as const;

/** 仓库根目录（tests/support 的上两级）。 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 递归列出目录下的文件，返回相对仓库根的路径。 */
function listFiles(root: string, relativeDir: string): string[] {
  const absolute = path.join(root, relativeDir);
  const files: string[] = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(root, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

/** 读取文件的修改时间（毫秒）；文件不存在时返回 undefined。 */
function mtimeOf(root: string, relative: string): number | undefined {
  try {
    return statSync(path.join(root, relative)).mtimeMs;
  } catch {
    return undefined;
  }
}

/** 判断产物是否新鲜：全部产物存在，且没有构建输入晚于最旧产物。 */
export function assertFreshDist(root: string = ROOT): void {
  const products = BUILD_PRODUCTS.map((relative) => ({
    relative,
    mtime: mtimeOf(root, relative),
  }));
  const missing = products.filter((product) => product.mtime === undefined);
  const present = products.filter((product) => product.mtime !== undefined);
  if (present.length === 0) throw new Error(formatIssue(missing, []));

  const oldestProduct = Math.min(...present.map((product) => product.mtime as number));
  const inputs = [...BUILD_INPUT_DIRS.flatMap((dir) => listFiles(root, dir)), ...BUILD_INPUT_FILES];
  const stale = inputs.filter((relative) => {
    const modified = mtimeOf(root, relative);
    return modified !== undefined && modified > oldestProduct;
  });
  if (missing.length === 0 && stale.length === 0) return;
  throw new Error(formatIssue(missing, stale));
}

/** 组装失败信息：列出缺失与过期文件，给出修复命令。 */
function formatIssue(missing: Array<{ relative: string }>, stale: string[]): string {
  const lines = ['产物缺失或已过期：'];
  if (missing.length > 0) lines.push(`- 缺失：${missing.map((item) => item.relative).join('、')}`);
  if (stale.length > 0) lines.push(`- 晚于产物：${stale.join('、')}`);
  lines.push('请运行 pnpm build：该命令重建产物，并在末尾运行 test:dist。');
  return lines.join('\n');
}
