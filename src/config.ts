/**
 * 插件配置：schema、默认值与严格校验。
 * 导出 Config、PluginConfig、DEFAULT_CONFIG、resolveConfig 与 readConfig。
 */
import Schema from '@deepseek-ai/schemastery';

import { DEFAULT_PREFIX, PLUGIN_LABEL } from './constants.ts';
import type { Volatile } from './types.ts';
import { isRecord } from './utils.ts';

/** 宿主传给 apply 的配置：每个字段是热重载引用，用 `.get()` 读取实时值。 */
export interface Config {
  /** 是否注册 demo 工具。 */
  demoEnabled: Volatile<boolean>;
  /** 工具回显与事件日志使用的前缀。 */
  prefix: Volatile<string>;
}

/**
 * 配置 schema。`.volatile()` 字段修改后不重启插件，并出现在“插件”面板的配置页。
 * schema 不拒绝未知键，严格校验由 resolveConfig 完成。
 */
export const Config: Schema<Config> = Schema.object({
  demoEnabled: Schema.boolean().default(true).volatile(),
  prefix: Schema.string().default(DEFAULT_PREFIX).pattern(/\S/).volatile(),
}) as unknown as Schema<Config>;

/** 配置项的实时取值。 */
export type PluginConfig = {
  /** 是否注册 demo 工具。 */
  demoEnabled: boolean;
  /** 工具回显与事件日志使用的前缀。 */
  prefix: string;
};

/** 默认配置。 */
export const DEFAULT_CONFIG: Readonly<PluginConfig> = Object.freeze({
  demoEnabled: true,
  prefix: DEFAULT_PREFIX,
});

/** 合法的配置键。出现其他键时报错。 */
const CONFIG_KEYS = new Set<string>(['demoEnabled', 'prefix']);

/** 把缺省或 null 的输入转为空对象。 */
function normalizeConfigInput(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (!isRecord(raw)) throw new Error(`${PLUGIN_LABEL}: config must be an object`);
  return raw;
}

/** 校验配置并与默认值合并，返回冻结的完整配置。 */
export function resolveConfig(raw?: unknown): Readonly<PluginConfig> {
  const input = normalizeConfigInput(raw);
  for (const key of Object.keys(input)) {
    if (!CONFIG_KEYS.has(key)) throw new Error(`${PLUGIN_LABEL}: unknown config key "${key}"`);
  }
  const config: PluginConfig = { ...DEFAULT_CONFIG };
  // demoEnabled 必须是布尔值
  const demoEnabled = input.demoEnabled;
  if (demoEnabled !== undefined && demoEnabled !== null) {
    if (typeof demoEnabled !== 'boolean') {
      throw new Error(`${PLUGIN_LABEL}: config demoEnabled must be a boolean`);
    }
    config.demoEnabled = demoEnabled;
  }
  // prefix 必须是非空字符串
  const prefix = input.prefix;
  if (prefix !== undefined && prefix !== null) {
    if (typeof prefix !== 'string' || prefix.trim() === '') {
      throw new Error(`${PLUGIN_LABEL}: config prefix must be a non-empty string`);
    }
    config.prefix = prefix;
  }
  return Object.freeze(config);
}

/** 判断值是否是热重载引用。 */
function isVolatileRef(value: unknown): value is { get(): unknown } {
  return isRecord(value) && typeof value.get === 'function';
}

/** 读取宿主传入配置的当前值：展开热重载引用后交给 resolveConfig 校验。 */
export function readConfig(config?: unknown): Readonly<PluginConfig> {
  if (!isRecord(config)) return resolveConfig(config);
  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    values[key] = isVolatileRef(value) ? value.get() : value;
  }
  return resolveConfig(values);
}
