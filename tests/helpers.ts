// 单元测试公共设施：极简可编程的 ctx 模拟。测试目标是 src 的纯函数与 apply 接线。
import type { Context } from '../src/types.ts';

/** 构造一条消息（默认 role=user、空 content）。 */
export function makeMessage({
  role = 'user',
  content = [],
  id,
}: {
  role?: string;
  content?: unknown[];
  id?: string;
} = {}) {
  return {
    id: id ?? `msg-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}

/** 构造一个文本内容块。 */
export function textBlock(text: string) {
  return { type: 'text', text };
}

/**
 * 可编程 ctx 模拟：记录 tools.register / ctx.on / logger 调用，
 * 测试据此断言 apply 的工具注册、事件监听与日志输出。
 */
export function makeCtx() {
  const onCallbacks = new Map<string, ((...args: unknown[]) => unknown)[]>();
  const registeredTools: unknown[] = [];
  const loggerCalls: Array<{ level: 'debug' | 'info' | 'warn'; args: unknown[] }> = [];
  const logger = {
    debug: (...args: unknown[]) => {
      loggerCalls.push({ level: 'debug', args });
    },
    info: (...args: unknown[]) => {
      loggerCalls.push({ level: 'info', args });
    },
    warn: (...args: unknown[]) => {
      loggerCalls.push({ level: 'warn', args });
    },
  };
  const ctx = {
    logger,
    tools: {
      register: (def: unknown) => {
        registeredTools.push(def);
      },
    },
    on(type: string, fn: (...args: unknown[]) => unknown) {
      let list = onCallbacks.get(type);
      if (!list) {
        list = [];
        onCallbacks.set(type, list);
      }
      list.push(fn);
      return () => true;
    },
    _onCallbacks: onCallbacks,
    _registeredTools: registeredTools,
    _loggerCalls: loggerCalls,
  };
  return ctx as unknown as Context & {
    _onCallbacks: Map<string, ((...args: unknown[]) => unknown)[]>;
    _registeredTools: Array<{ name?: string }>;
    _loggerCalls: Array<{ level: 'debug' | 'info' | 'warn'; args: unknown[] }>;
  };
}

/** 一条客户端字典注册记录。 */
export interface ClientLocaleRegistration {
  ns: string;
  dicts: Record<string, Record<string, string>>;
}

/** 一条客户端槽位注册记录。 */
export interface ClientSlotRegistration {
  options: Record<string, unknown>;
  component: unknown;
}

/** 客户端 ctx 模拟的观测字段。 */
export interface ClientMockState {
  _localeRegistrations: ClientLocaleRegistration[];
  _slotInjections: string[];
  _slotRegistrations: ClientSlotRegistration[];
  _effects: string[];
}

/**
 * 可编程客户端 ctx 模拟：记录 locale.register、slots.inject、slots.register 与 effect。
 * 测试据此断言前端入口的注册接线。
 */
export function makeClientCtx() {
  const state: ClientMockState = {
    _localeRegistrations: [],
    _slotInjections: [],
    _slotRegistrations: [],
    _effects: [],
  };
  const noop = () => true;
  const ctx = {
    effect(fn: () => unknown, label?: string) {
      state._effects.push(label ?? '');
      const disposer = fn();
      return typeof disposer === 'function' ? disposer : noop;
    },
    locale: {
      register(ns: string, dicts: Record<string, Record<string, string>>) {
        state._localeRegistrations.push({ ns, dicts });
        return noop;
      },
    },
    slots: {
      inject(name: string, fn: () => unknown) {
        state._slotInjections.push(name);
        const disposer = fn();
        return typeof disposer === 'function' ? disposer : noop;
      },
      register(options: Record<string, unknown>, component: unknown) {
        state._slotRegistrations.push({ options, component });
        return noop;
      },
    },
  };
  return Object.assign(ctx, state) as unknown as Context & ClientMockState & typeof ctx;
}
