/**
 * demo 工具：展示如何通过 ctx.tools.register 注册一个工具。
 *
 * ToolDefinition 由 @deepseek-ai/dsh-tools 提供，核心字段：
 * - name / description：对模型可见的工具名与说明
 * - parameters：参数 schema（对象形式，字段为 string/number/boolean 等 spec）
 * - output：返回值声明——schema 为 JSON Schema，render 把返回值投影为内容块
 * - execute(args, exec)：执行体。args 为模型传入（已冻结）的参数；
 *   exec 携带 agent（发起调用的 agent，可访问其 session）、signal（取消信号）
 *   等，长耗时逻辑必须观察/转发 exec.signal。
 *
 * 参数校验：与 om 的 recall 工具同一模式——面向模型的 parameters 用 JSON
 * 形式，execute 入口再用 zod 做运行时校验（safeParse，非法参数返回提示而非
 * 抛出）；parseEchoArgs 是纯函数，execute 与单元测试共用。
 */
import { z } from 'zod';

import { DEMO_TOOL_NAME } from './constants.ts';
import type { ToolDefinition, ToolRunContext } from './types.ts';

/** demo 工具参数 schema（zod，execute 入口校验用）。 */
const echoArgsSchema = z.object({
  text: z.string().min(1, 'text 必须是非空字符串'),
});

/** parseEchoArgs 的解析结果：非法参数返回错误提示，不抛出。 */
export type EchoArgsParseResult = { ok: true; text: string } | { ok: false; error: string };

/** 解析并校验工具参数（纯函数，供 execute 与单元测试共用）。 */
export function parseEchoArgs(args: unknown): EchoArgsParseResult {
  const parsed = echoArgsSchema.safeParse(args);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ');
    return { ok: false, error: `参数不合法：${detail}` };
  }
  return { ok: true, text: parsed.data.text };
}

/** 构建 demo 工具：把传入的文本原样回显，前缀来自配置。 */
export function buildDemoTool(prefix: string): ToolDefinition {
  return {
    name: DEMO_TOOL_NAME,
    description: `示例工具：把传入的文本原样回显（前缀 ${prefix}）`,
    parameters: {
      text: {
        type: 'string',
        description: '要回显的文本',
        required: true,
      },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    async execute(args: unknown, exec: ToolRunContext) {
      // exec.agent 即发起调用的 agent（可选，见 ToolExecutionInput.agent）
      const sessionId = exec.agent?.id ?? 'unknown';
      const parsed = parseEchoArgs(args);
      if (!parsed.ok) return parsed.error;
      return `[${prefix}] (session ${sessionId}) ${parsed.text}`;
    },
  };
}
