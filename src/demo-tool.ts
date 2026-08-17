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
 */
import type { ToolDefinition, ToolRunContext } from './types.ts';

/** 构建 demo 工具：把传入的文本原样回显，前缀来自配置。 */
export function buildDemoTool(prefix: string): ToolDefinition {
  return {
    name: 'demo_echo',
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
      const text = (args as { text?: unknown }).text;
      if (typeof text !== 'string' || text.trim() === '') {
        return '参数 text 必须是非空字符串';
      }
      return `[${prefix}] (session ${sessionId}) ${text}`;
    },
  };
}
