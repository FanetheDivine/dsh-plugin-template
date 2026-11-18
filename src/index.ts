/**
 * 插件入口。导出宿主约定的 name、inject、apply 与 Config。
 */
import { type PluginConfig, readConfig } from './config.ts';
import { buildDemoTool } from './demo-tool.ts';
import { setupDemoListeners } from './events.ts';
import type { Context } from './types.ts';

export { Config } from './config.ts';

/** 插件名，与 cordis.patch.yml 的 id 一致。 */
export const name = 'dsh-plugin-template';

/** 需要宿主注入的服务。 */
export const inject = ['tools', 'llm', 'tokenMeter', 'sessions'];

/**
 * 插件启用时调用：解析配置、注册工具、监听事件。
 * `config` 的字段是热重载引用，保存配置后宿主触发 loader/volatile-update，
 * 插件按新值重新注册工具，不重启。
 */
export function apply(ctx: Context, config?: unknown): void {
  let current: Readonly<PluginConfig> = readConfig(config);
  ctx.logger.info(`[${current.prefix}] apply: demoEnabled=${String(current.demoEnabled)}`);

  // 按当前配置注册工具；工具说明含前缀，配置变化时重新注册
  let unregister: (() => void) | undefined;
  const syncTool = (): void => {
    unregister?.();
    unregister = current.demoEnabled
      ? ctx.tools.register(buildDemoTool(current.prefix))
      : undefined;
  };
  syncTool();
  ctx.effect(() => () => unregister?.(), 'dsh-plugin-template: tool');

  // 热重载：读取失败时保持当前状态
  ctx.on('loader/volatile-update', () => {
    try {
      current = readConfig(config);
    } catch (error) {
      ctx.logger.warn(`[${current.prefix}] config update ignored: ${String(error)}`);
      return;
    }
    ctx.logger.info(
      `[${current.prefix}] config updated: demoEnabled=${String(current.demoEnabled)}`,
    );
    syncTool();
  });

  setupDemoListeners(ctx, () => current.prefix);
}
