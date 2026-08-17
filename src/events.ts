/**
 * 事件监听 demo：ctx.on(event, listener) 注册监听，监听器随插件卸载自动释放。
 *
 * agent 生命周期事件由 @deepseek-ai/dsh-agent 注入 Events 类型，分三类：
 * - emit（同步通知，返回 void）：agent/created、agent/disposed、agent/status、
 *   agent/session-start、agent/inbox/* 等
 * - waterfall（中间件，最后参数是 next，不调用 next() 即否决链路）：
 *   agent/pre-step（step 进入模型请求前，可拒绝或替换消息）、agent/request、
 *   agent/request-error
 * - serial（按注册顺序依次 await）：agent/turn-stopping（turn 关闭前触发，
 *   可在监听器里 agent.steer() 追加工作）
 *
 * 事件 payload 均携带 agent（Scoped<Agent>），可按 agent 过滤监听。
 */
import type { Context } from './types.ts';

/** 注册全部 demo 事件监听。 */
export function setupDemoListeners(ctx: Context, prefix: string): void {
  // emit：agent 生命周期通知
  ctx.on('agent/created', ({ agent }) => {
    ctx.logger.info(`[${prefix}] agent created: ${agent.id}`);
  });
  ctx.on('agent/disposed', ({ agent }) => {
    ctx.logger.info(`[${prefix}] agent disposed: ${agent.id}`);
  });
  ctx.on('agent/status', ({ agent, status }) => {
    ctx.logger.info(`[${prefix}] agent ${agent.id} status -> ${status}`);
  });
  ctx.on('agent/session-start', ({ agent, source }) => {
    ctx.logger.info(`[${prefix}] agent ${agent.id} session-start (${source})`);
  });

  // waterfall：每个 step 进入模型请求前触发。
  // 先 await 再调用 next() 继续链路；不调用 next() 即否决该 step。
  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    if (signal.aborted) return next();
    ctx.logger.debug(`[${prefix}] pre-step: ${agent.id}`);
    return next();
  });

  // serial：turn 关闭前触发，返回后 turn 提交关闭。
  ctx.on('agent/turn-stopping', ({ agent, turn }) => {
    ctx.logger.info(`[${prefix}] turn ${turn} stopping: ${agent.id}`);
  });
}
