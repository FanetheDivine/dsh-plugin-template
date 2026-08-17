/**
 * 零依赖工具函数：不 import 任何运行时包。
 */

/** 判断值是否为普通对象：typeof object 且非 null 且非数组（类型收窄用）。 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
