/**
 * 插件入口。导出宿主约定的 name、inject 与 apply。
 */
import { resolveConfig } from './config.ts';
import { buildDemoTool } from './demo-tool.ts';
import { setupDemoListeners } from './events.ts';
import type { Context } from './types.ts';

/** 插件名，与 cordis.patch.yml 的 id 一致。 */
export const name = 'dsh-plugin-template';

/** 需要宿主注入的服务。 */
export const inject = ['tools', 'llm', 'tokenMeter', 'sessions'];

/** 插件启用时调用：解析配置、注册工具、监听事件。 */
export function apply(ctx: Context, config?: unknown): void {
  const resolved = resolveConfig(config);
  ctx.logger.info(`[${resolved.prefix}] apply: demoEnabled=${String(resolved.demoEnabled)}`);

  // demoEnabled 为 true 时注册工具
  if (resolved.demoEnabled) {
    ctx.tools.register(buildDemoTool(resolved.prefix));
  }

  setupDemoListeners(ctx, resolved.prefix);
}
