/**
 * demo_echo 工具：把传入的文本加上前缀后返回。
 * 导出 buildDemoTool、参数校验函数 parseEchoArgs 与手写参数声明 ECHO_PARAMETERS。
 */
import { z } from 'zod';

import { DEMO_TOOL_NAME } from './constants.ts';
import type { ToolDefinition, ToolRunContext } from './types.ts';

/** 工具参数的 zod schema：参数类型与运行时校验的唯一来源。 */
const echoArgsSchema = z.object({
  text: z.string().min(1, 'text 必须是非空字符串'),
});

/** 由 zod schema 推出的参数类型。 */
export type EchoArgs = z.infer<typeof echoArgsSchema>;

/** 必填键：值类型不含 undefined 的键。 */
type RequiredKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];

/** 把参数值类型映射成它允许的 JSON Schema 形状。 */
type JsonSchemaOf<T> = T extends string
  ? { readonly type: 'string'; readonly minLength?: number; readonly description?: string }
  : T extends number
    ? { readonly type: 'number' | 'integer'; readonly description?: string }
    : T extends boolean
      ? { readonly type: 'boolean'; readonly description?: string }
      : T extends readonly (infer U)[]
        ? {
            readonly type: 'array';
            readonly items: JsonSchemaOf<U>;
            readonly description?: string;
          }
        : T extends object
          ? {
              readonly type: 'object';
              readonly properties: { readonly [K in keyof T]-?: JsonSchemaOf<NonNullable<T[K]>> };
              readonly required: readonly RequiredKeys<T>[];
              readonly additionalProperties?: boolean;
              readonly description?: string;
            }
          : never;

/** 工具参数声明：与参数值类型一致的对象根。 */
type ParametersSchemaOf<T> = JsonSchemaOf<T> & { readonly type: 'object' };

/** 类型断言：条件不成立时编译失败。 */
type Assert<T extends true> = T;

/** 结构相等判定。 */
type Equal<A, B> =
  (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

/**
 * demo_echo 的参数声明：宿主只接受无损 JSON，`z.toJSONSchema` 的输出带不可枚举的 `~standard` 键，
 * 因此手写普通 JSON 并用 `satisfies` 钉到 `EchoArgs`。与 zod 投影的一致性由
 * `tests/tool-schema.test.ts` 保证。
 */
export const ECHO_PARAMETERS = {
  type: 'object',
  properties: {
    text: { type: 'string', minLength: 1, description: '要回显的文本' },
  },
  required: ['text'],
  additionalProperties: false,
} as const satisfies ParametersSchemaOf<EchoArgs>;

/**
 * 编译期断言：必填键集合与 zod 推出的类型一致。
 * 导出是为了让类型检查保留它，运行时不存在该符号。
 */
export type AssertRequiredKeysInSync = Assert<
  Equal<(typeof ECHO_PARAMETERS)['required'][number], RequiredKeys<EchoArgs>>
>;

/**
 * 编译期断言：属性键集合与 zod 推出的类型一致。
 * 导出是为了让类型检查保留它，运行时不存在该符号。
 */
export type AssertPropertyKeysInSync = Assert<
  Equal<keyof (typeof ECHO_PARAMETERS)['properties'], keyof EchoArgs>
>;

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
    parameters: ECHO_PARAMETERS,
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
