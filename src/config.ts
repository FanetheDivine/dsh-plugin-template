/**
 * 插件配置：默认值与严格校验。
 * 导出 PluginConfig、DEFAULT_CONFIG 与 resolveConfig。
 */
import { DEFAULT_PREFIX, PLUGIN_LABEL } from './constants.ts';
import { isRecord } from './utils.ts';

/** 插件配置项。 */
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
