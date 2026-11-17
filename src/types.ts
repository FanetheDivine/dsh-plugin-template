/**
 * 共享类型：再导出宿主类型与 PluginConfig。
 * 全部为 type-only 导入，编译后不留运行时依赖。
 */

import type { Context, Events } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { ToolDefinition, ToolRunContext } from '@deepseek-ai/dsh-tools';

/** 插件配置类型。 */
export type { PluginConfig } from './config.ts';

/** 宿主类型。插件内统一从这里导入。 */
export type { Agent, Context, Events, ToolDefinition, ToolRunContext };
