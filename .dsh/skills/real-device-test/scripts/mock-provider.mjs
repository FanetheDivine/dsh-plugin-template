// 实机测试 mock provider：无网络，按用户消息中的标记返回脚本化响应。
// 模型：mock-model。
// 标记：
//   ECHO_CASE:<文本>  首次请求调用 demo_echo，收到工具结果后用文本回复结果
//   其他消息          回复「mock：已收到」
// 每次请求都追加到 profile 目录的 requests.jsonl，供事后核对。
import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** profile 目录。脚本复制到 profile 目录后运行，env 可覆盖。 */
export const root = process.env.RDT_PROFILE_DIR ?? dirname(fileURLToPath(import.meta.url));
const dshPkg =
  process.env.RDT_DSH_PKG ??
  join(execSync('npm root -g', { encoding: 'utf8' }).trim(), '@deepseek-ai', 'dsh', 'package.json');
const require = createRequire(dshPkg);
const { LlmAdapter } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-llm')));

export const name = 'rdt-mock';
export const inject = ['llm'];

/** 被测工具名。 */
export const TOOL_NAME = 'demo_echo';

/** 提取消息中的全部文本，包含工具结果里的文本。 */
function blockTexts(content) {
  return (content ?? []).flatMap((b) =>
    b.type === 'text' ? [b.text ?? ''] : b.type === 'tool-result' ? blockTexts(b.content) : [],
  );
}

/** 把消息列表拼成纯文本。 */
export function plain(messages) {
  return messages
    .filter(Boolean)
    .flatMap((m) => blockTexts(m.content))
    .join('\n');
}

export function apply(ctx) {
  class Mock extends LlmAdapter {
    calls = [];
    providerInfo(id) {
      return { id, name: 'Real device test mock' };
    }
    async listModels(provider) {
      return [{ provider, id: 'mock-model', name: 'mock-model', inputModalities: ['text'] }];
    }
    async resolveModel(provider, model) {
      return { provider, id: model, name: model, inputModalities: ['text'] };
    }
    async *stream(o) {
      if (o.signal?.aborted) {
        yield {
          type: 'finish',
          reason: { kind: 'aborted', failure: { message: 'aborted', code: 'ABORTED' } },
        };
        return;
      }
      this.calls.push(o);
      try {
        appendFileSync(
          join(root, 'requests.jsonl'),
          `${JSON.stringify(o, (k, v) => (k === 'signal' ? undefined : v))}\n`,
        );
      } catch {
        // 记录失败不影响响应
      }
      const usage = (out) => ({
        type: 'usage',
        usage: { inputTokens: Math.ceil(plain(o.messages).length / 4) + 1, outputTokens: out },
      });
      const last = o.messages.at(-1);
      // 宿主会在用户消息后追加运行时上下文，因此读取最后一条 assistant 之后的全部用户消息
      const lastAssistant = o.messages.map((m) => m.role).lastIndexOf('assistant');
      const userText = plain(o.messages.slice(lastAssistant + 1).filter((m) => m.role === 'user'));
      const marker = /ECHO_CASE:(\S+)/.exec(userText);

      // 收到工具结果：把结果作为最终回复。新版宿主用 tool 角色，旧版放进 user 消息的 tool-result 块
      const hasToolResult =
        last?.role === 'tool' || (last?.content ?? []).some((b) => b.type === 'tool-result');
      if (hasToolResult) {
        const text = `mock：工具返回 ${plain([last])}`;
        yield { type: 'block-end', index: 0, block: { type: 'text', text } };
        yield usage(text.length);
        yield { type: 'finish', reason: { kind: 'stop' } };
        return;
      }
      // 带标记且工具可用：调用工具
      if (marker && (o.tools ?? []).some((t) => t.name === TOOL_NAME)) {
        yield {
          type: 'block-end',
          index: 0,
          block: {
            type: 'tool-call',
            id: `mock-${this.calls.length}`,
            name: TOOL_NAME,
            arguments: JSON.stringify({ text: marker[1] }),
          },
        };
        yield usage(20);
        yield { type: 'finish', reason: { kind: 'tool-calls' } };
        return;
      }
      const text = marker ? 'mock：工具不可用' : 'mock：已收到';
      yield { type: 'block-end', index: 0, block: { type: 'text', text } };
      yield usage(text.length);
      yield { type: 'finish', reason: { kind: 'stop' } };
    }
  }
  const adapter = new Mock();
  ctx.llm.registerAdapter(['mock'], adapter);
  ctx.provide('rdtMock', adapter);
}
