/**
 * demo_echo 工具：把传入的文本加上前缀后返回。
 * 导出 buildDemoTool 与参数校验函数 parseEchoArgs。
 */
import { z } from 'zod';

import { DEMO_TOOL_NAME } from './constants.ts';
import type { ToolDefinition, ToolRunContext } from './types.ts';

/** 工具参数的 zod schema。 */
const echoArgsSchema = z.object({
  text: z.string().min(1, 'text 必须是非空字符串'),
});

/** parseEchoArgs 的结果。校验失败时携带提示文本。 */
export type EchoArgsParseResult = { ok: true; text: string } | { ok: false; error: string };

/** 校验工具参数。 */
export function parseEchoArgs(args: unknown): EchoArgsParseResult {
  const parsed = echoArgsSchema.safeParse(args);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ');
    return { ok: false, error: `参数不合法：${detail}` };
  }
  return { ok: true, text: parsed.data.text };
}

/** 构建 demo_echo 工具定义。 */
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
      // exec.agent 是发起调用的 agent
      const sessionId = exec.agent?.id ?? 'unknown';
      const parsed = parseEchoArgs(args);
      if (!parsed.ok) return parsed.error;
      return `[${prefix}] (session ${sessionId}) ${parsed.text}`;
    },
  };
}
