/**
 * 共享类型：全部来自 @deepseek-ai 官方包（type-only 导入，编译期擦除，运行时零依赖）。
 *
 * dsh-agent / dsh-tools 通过 declare module '@deepseek-ai/cordis' 增强 Context/Events，
 * 使 ctx.tools / ctx.on('agent/...') 等获得与真实宿主一致的类型；
 * ctx.on / ctx.get 等 mixin 方法由 cordis 自身声明，无需本地补充。
 */

import type { Context, Events } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools';

/** 插件配置类型（来自 config.ts，供外部 preset 与类型使用者引用）。 */
export type { PluginConfig } from './config.ts';

/** 宿主类型再导出：插件 API 与工具签名统一从这里取型，避免依赖不同版本的 dsh-* 包类型面。 */
export type { Agent, Context, Events, ToolDefinition, ToolRunContext };
