// 打包报告解析：把 npm pack --json 的输出归一为文件路径列表。
// npm 11 输出数组，npm 12 输出以包名为键的对象，两种形状的包报告字段相同。
/** 判断值是否为普通对象（排除 null 与数组）。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 取出一个包报告的文件路径；形状不符时返回空列表。 */
function filesOf(entry: unknown): string[] {
  if (!isRecord(entry) || !Array.isArray(entry.files)) return [];
  return entry.files.flatMap((file) =>
    isRecord(file) && typeof file.path === 'string' ? [file.path] : [],
  );
}

/** 把 npm pack --json 的报告归一为文件路径列表；无法识别的形状抛出带输出片段的 TypeError。 */
export function packedFilePaths(report: unknown): string[] {
  if (Array.isArray(report)) return report.flatMap(filesOf);
  if (isRecord(report)) return Object.values(report).flatMap(filesOf);
  const snippet = JSON.stringify(report)?.slice(0, 200) ?? String(report);
  throw new TypeError(`无法识别 npm pack --json 的输出形状：${snippet}`);
}
