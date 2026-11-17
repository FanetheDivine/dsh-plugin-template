/**
 * agent 事件监听示例，覆盖 emit、waterfall、serial 三类事件。
 * 导出 setupDemoListeners。
 */
import type { Context } from './types.ts';

/** 注册全部 demo 事件监听。 */
export function setupDemoListeners(ctx: Context, prefix: string): void {
  // serial 事件：创建完成前按注册顺序执行，payload 带创建来源
  ctx.on('agent/created', ({ agent, source }) => {
    ctx.logger.info(`[${prefix}] agent created: ${agent.id} (${source})`);
  });

  // emit 事件：同步通知
  ctx.on('agent/disposed', ({ agent }) => {
    ctx.logger.info(`[${prefix}] agent disposed: ${agent.id}`);
  });
  ctx.on('agent/status', ({ agent, status }) => {
    ctx.logger.info(`[${prefix}] agent ${agent.id} status -> ${status}`);
  });

  // waterfall 事件：每个 step 请求模型前触发，调用 next() 继续执行
  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    if (signal.aborted) return next();
    ctx.logger.debug(`[${prefix}] pre-step: ${agent.id}`);
    return next();
  });

  // serial 事件：turn 结束前按注册顺序执行
  ctx.on('agent/turn-stopping', ({ agent, turn }) => {
    ctx.logger.info(`[${prefix}] turn ${turn} stopping: ${agent.id}`);
  });
}
