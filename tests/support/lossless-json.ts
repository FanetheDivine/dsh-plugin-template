// 无损 JSON 校验：按宿主 snapshotJsonValue 的规则判断声明能否被克隆，通过时返回深拷贝。
// 宿主在枚举工具声明时克隆 parameters，克隆失败会抛错并终止进程；注册阶段不做校验。

/** 校验通过时返回的深拷贝类型。 */
export type LosslessJson = unknown;

/** 判定失败：错误消息含失败路径与原因。 */
export class LosslessJsonError extends Error {
  constructor(path: string, reason: string) {
    super(`${path || '<root>'} ${reason}`);
    this.name = 'LosslessJsonError';
  }
}

/** 合并路径前缀。 */
function childPath(path: string, key: string | number): string {
  return typeof key === 'number' ? `${path}[${key}]` : `${path}.${key}`;
}

/** 对象原型必须是 null 或原生 Object.prototype。 */
function hasPlainObjectPrototype(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/** 数组原型必须是原生 Array.prototype。 */
function hasPlainArrayPrototype(value: unknown[]): boolean {
  return Object.getPrototypeOf(value) === Array.prototype;
}

/** 键全部是字符串且可枚举时返回键列表，否则抛出指出该键的错误。 */
function enumerableStringKeys(value: object, path: string): string[] {
  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    if (typeof key !== 'string') {
      throw new LosslessJsonError(path, `含符号键 ${String(key)}`);
    }
    if (!Object.prototype.propertyIsEnumerable.call(value, key)) {
      throw new LosslessJsonError(path, `键 ${key} 不可枚举`);
    }
  }
  return keys;
}

/** 数组除 length 外只能有连续下标。 */
function isDenseArray(value: unknown[]): boolean {
  if (!Number.isInteger(value.length)) return false;
  return Reflect.ownKeys(value).length === value.length + 1;
}

/**
 * 按宿主规则校验无损 JSON，通过时返回深拷贝。
 * 规则：只允许纯对象、数组、字符串、有限数字、布尔与 null；对象键必须全部是可枚举字符串键；
 * 拒绝 -0、NaN、Infinity、非原生原型、稀疏数组、循环引用。
 */
export function assertLosslessJson(value: unknown): LosslessJson {
  const ancestors = new Set<object>();

  /** 递归校验并返回深拷贝。 */
  function walk(current: unknown, path: string): unknown {
    if (current === null) return null;
    if (typeof current === 'boolean' || typeof current === 'string') return current;
    if (typeof current === 'number') {
      if (!Number.isFinite(current) || Object.is(current, -0)) {
        throw new LosslessJsonError(path, '必须是有限数字且不能是 -0');
      }
      return current;
    }
    if (typeof current !== 'object') {
      throw new LosslessJsonError(path, `不支持的值类型 ${typeof current}`);
    }
    if (ancestors.has(current)) {
      throw new LosslessJsonError(path, '出现循环引用');
    }
    ancestors.add(current);
    try {
      if (Array.isArray(current)) {
        if (!hasPlainArrayPrototype(current)) {
          throw new LosslessJsonError(path, '数组原型不是 Array.prototype');
        }
        if (!isDenseArray(current)) {
          throw new LosslessJsonError(path, '数组必须只有连续下标且不含附加属性');
        }
        return current.map((item, index) => walk(item, childPath(path, index)));
      }
      if (!hasPlainObjectPrototype(current)) {
        throw new LosslessJsonError(path, '对象原型不是 null 或 Object.prototype');
      }
      const keys = enumerableStringKeys(current, path);
      const copy: Record<string, unknown> = {};
      for (const key of keys) {
        copy[key] = walk((current as Record<string, unknown>)[key], childPath(path, key));
      }
      return copy;
    } finally {
      ancestors.delete(current);
    }
  }

  return walk(value, '');
}
