/**
 * dsh-plugin-template — dsh 插件最小模板（demo）。
 *
 * 本文件是插件的唯一打包入口（tsdown entry），导出三个约定符号：
 * - name：插件名，loader 识别入口的稳定标识，需与 cordis.patch.yml 的 id 一致
 * - inject：声明注入的服务依赖（tools / llm / tokenMeter / sessions 等），
 *   由宿主按序注入，之后可通过 ctx.xxx 访问；未声明的不保证存在
 * - apply(ctx, config)：插件激活入口——解析配置、注册工具、监听事件
 *
 * 依赖策略：dsh 宿主提供的依赖（cordis / dsh-tools 等）直接复用，
 * 不重复安装运行时依赖；打包时 npm imports 保持 external（tsdown
 * neverBundle），由运行中的宿主提供同一份实例。
 */
import { resolveConfig } from './config.ts';
import { buildDemoTool } from './demo-tool.ts';
import { setupDemoListeners } from './events.ts';
import type { Context } from './types.ts';

/** 插件名（与 cordis.patch.yml 的 id 保持一致）。 */
export const name = 'dsh-plugin-template';

/** 插件注入的服务依赖（dsh 插件常用集合），由宿主按序注入。 */
export const inject = ['tools', 'llm', 'tokenMeter', 'sessions'];

/**
 * 插件激活入口：解析配置 → 注册工具 → 监听事件。
 * 配置来自插件 preset 行（cordis.patch.yml）的 config 字段，热更新生效。
 */
export function apply(ctx: Context, config?: unknown): void {
  const resolved = resolveConfig(config);
  ctx.logger.info(`[${resolved.prefix}] apply: demoEnabled=${String(resolved.demoEnabled)}`);

  // 注册工具：ctx.tools.register(ToolDefinition)；配置关闭时跳过
  if (resolved.demoEnabled) {
    ctx.tools.register(buildDemoTool(resolved.prefix));
  }

  // 监听事件：agent 生命周期 + pre-step 中间件（见 events.ts）
  setupDemoListeners(ctx, resolved.prefix);
}
