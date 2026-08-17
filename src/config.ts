/**
 * 插件配置：默认值、键校验与合并。插件 preset 行（cordis.patch.yml 中
 * 同名条目的 config 字段）可覆盖全部键，热更新即时生效。
 */
import { isRecord } from './utils.ts';

/** 插件配置项（全部可选覆盖，未给出的键用默认值）。 */
export type PluginConfig = {
  /** 示例开关：是否注册 demo 工具（false 时不注册）。 */
  demoEnabled: boolean;
  /** 示例文本：工具回显与事件日志使用的前缀。 */
  prefix: string;
};

/** 默认配置（冻结对象，resolveConfig 合并的基底）。 */
export const DEFAULT_CONFIG: Readonly<PluginConfig> = Object.freeze({
  demoEnabled: true,
  prefix: 'demo',
});

/** 合法配置键集合（未知键直接拒绝，避免拼写错误静默失效）。 */
const CONFIG_KEYS = new Set<string>(['demoEnabled', 'prefix']);

/** 归一化原始配置输入：缺省 / null 视为空对象（全部用默认值）。 */
function normalizeConfigInput(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (!isRecord(raw)) throw new Error('dsh-plugin-template: config must be an object');
  return raw;
}

/**
 * 解析合并配置：校验未知键与类型，返回冻结的完整配置。
 * 允许所有配置留空——未给出的键回退默认值。
 */
export function resolveConfig(raw?: unknown): Readonly<PluginConfig> {
  const input = normalizeConfigInput(raw);
  for (const key of Object.keys(input)) {
    if (!CONFIG_KEYS.has(key)) throw new Error(`dsh-plugin-template: unknown config key "${key}"`);
  }
  const config: PluginConfig = { ...DEFAULT_CONFIG };
  // demoEnabled：布尔开关（缺省 / null 回退默认值）
  const demoEnabled = input.demoEnabled;
  if (demoEnabled !== undefined && demoEnabled !== null) {
    if (typeof demoEnabled !== 'boolean') {
      throw new Error('dsh-plugin-template: config demoEnabled must be a boolean');
    }
    config.demoEnabled = demoEnabled;
  }
  // prefix：非空字符串（缺省 / null / 空串回退默认值）
  const prefix = input.prefix;
  if (prefix !== undefined && prefix !== null) {
    if (typeof prefix !== 'string' || prefix.trim() === '') {
      throw new Error('dsh-plugin-template: config prefix must be a non-empty string');
    }
    config.prefix = prefix;
  }
  return Object.freeze(config);
}
