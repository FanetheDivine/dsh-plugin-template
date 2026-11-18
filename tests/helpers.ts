// 单元测试公共设施：极简可编程的 ctx 模拟。测试目标是 src 的纯函数与 apply 接线。
import type {
  SettingsFormPathOp,
  SettingsFormScope,
  SettingsFormScopeSnapshot,
} from '@deepseek-ai/dsh-client-ui-primitives';

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
  const activeTools = new Set<unknown>();
  const effectDisposers: Array<() => void> = [];
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
        activeTools.add(def);
        return () => {
          activeTools.delete(def);
        };
      },
    },
    effect(fn: () => unknown) {
      const disposer = fn();
      if (typeof disposer === 'function') effectDisposers.push(disposer as () => void);
      return () => true;
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
    _activeTools: activeTools,
    /** 触发某事件的全部监听。 */
    _emit: (type: string, ...args: unknown[]) => {
      for (const fn of onCallbacks.get(type) ?? []) fn(...args);
    },
    /** 模拟插件卸载：执行全部 effect 清理函数。 */
    _dispose: () => {
      for (const fn of effectDisposers.splice(0)) fn();
    },
    _loggerCalls: loggerCalls,
  };
  return ctx as unknown as Context & {
    _onCallbacks: Map<string, ((...args: unknown[]) => unknown)[]>;
    _registeredTools: Array<{ name?: string; description?: string }>;
    _activeTools: Set<{ name?: string; description?: string }>;
    _emit: (type: string, ...args: unknown[]) => void;
    _dispose: () => void;
    _loggerCalls: Array<{ level: 'debug' | 'info' | 'warn'; args: unknown[] }>;
  };
}

/** 热重载引用：`.get()` 读取实时值，`set` 模拟宿主写入新值。 */
export interface FakeVolatile<T> {
  get(): T;
  set(value: T): void;
}

/** 构造一个热重载引用。 */
export function volatile<T>(initial: T): FakeVolatile<T> {
  let value = initial;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
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

/** 客户端服务名。 */
export type ClientServiceName = 'slots' | 'locale' | 'configForms';

/** 全部客户端服务名。 */
const CLIENT_SERVICES: ClientServiceName[] = ['slots', 'locale', 'configForms'];

/** 客户端 ctx 模拟的观测字段。 */
export interface ClientMockState {
  _localeRegistrations: ClientLocaleRegistration[];
  _slotInjections: string[];
  _slotRegistrations: ClientSlotRegistration[];
  /** 当前未被清理的字典注册。 */
  _activeLocales: Set<ClientLocaleRegistration>;
  /** 当前未被清理的槽位注册。 */
  _activeSlots: Set<ClientSlotRegistration>;
  _effects: string[];
  _configFormRequests: string[];
  /** `configForms.get` 返回过的表单。 */
  _configFormScopes: FakeConfigFormScope<Record<string, unknown>>[];
  /** 客户端 ctx 模拟的槽位与字典注册，以及 effect 清理。 */
  _effectDisposers: Array<() => void>;
  /** `ctx.inject` 声明过的依赖组，按调用顺序。 */
  _injectGroups: string[][];
}

/** 一个 `ctx.inject` 依赖组的运行态。 */
interface InjectGroup {
  deps: string[];
  callback: (ctx: unknown) => unknown;
  disposers: Array<() => void>;
  active: boolean;
}

/**
 * 可编程客户端 ctx 模拟：记录 locale.register、slots.inject、slots.register 与 effect。
 * 服务可用性可变：`ctx.inject` 在依赖全部可用时执行回调，服务撤掉时清理该组，
 * 重新就绪时再次执行。不可用服务的直接访问抛错，与 cordis 一致。
 * @param options.services - 初始可用的服务，默认全部可用。
 */
export function makeClientCtx(options: { services?: ClientServiceName[] } = {}) {
  const available = new Set<string>(options.services ?? CLIENT_SERVICES);
  const groups: InjectGroup[] = [];
  const state: ClientMockState = {
    _localeRegistrations: [],
    _slotInjections: [],
    _slotRegistrations: [],
    _activeLocales: new Set(),
    _activeSlots: new Set(),
    _effects: [],
    _configFormRequests: [],
    _configFormScopes: [],
    _effectDisposers: [],
    _injectGroups: [],
  };
  const noop = () => true;
  /** 访问不可用服务时抛错。 */
  const require = <T>(name: ClientServiceName, value: T): T => {
    if (!available.has(name)) throw new Error(`cannot get required service "${name}"`);
    return value;
  };
  const localeService = {
    register(ns: string, dicts: Record<string, Record<string, string>>) {
      const entry = { ns, dicts };
      state._localeRegistrations.push(entry);
      state._activeLocales.add(entry);
      return () => state._activeLocales.delete(entry);
    },
  };
  const configFormsService = {
    get(entryId: string) {
      state._configFormRequests.push(entryId);
      const fake = makeConfigFormScope<Record<string, unknown>>({
        status: 'ready',
        value: { demoEnabled: true, prefix: 'demo' },
      });
      state._configFormScopes.push(fake);
      return fake.scope;
    },
  };
  const slotsService = {
    inject(name: string, fn: () => unknown) {
      state._slotInjections.push(name);
      const disposer = fn();
      return typeof disposer === 'function' ? disposer : noop;
    },
    register(opts: Record<string, unknown>, component: unknown) {
      const entry = { options: opts, component };
      state._slotRegistrations.push(entry);
      state._activeSlots.add(entry);
      return () => state._activeSlots.delete(entry);
    },
  };

  /** 依赖全部可用且尚未加载的组加载一次。 */
  const load = (group: InjectGroup) => {
    if (group.active || !group.deps.every((dep) => available.has(dep))) return;
    group.active = true;
    // 子 ctx：effect 与槽位注入的清理归入该组，随组卸载
    const child = Object.create(ctx) as typeof ctx;
    Object.defineProperties(child, {
      effect: {
        value(fn: () => unknown, label?: string) {
          state._effects.push(label ?? '');
          const disposer = fn();
          if (typeof disposer === 'function') group.disposers.push(disposer as () => void);
          return typeof disposer === 'function' ? disposer : noop;
        },
      },
      slots: {
        value: {
          ...slotsService,
          inject(name: string, fn: () => unknown) {
            const disposer = slotsService.inject(name, fn);
            group.disposers.push(disposer as () => void);
            return disposer;
          },
        },
      },
    });
    group.callback(child);
  };
  /** 卸载一组并执行其清理。 */
  const unload = (group: InjectGroup) => {
    if (!group.active) return;
    group.active = false;
    for (const disposer of group.disposers.splice(0).reverse()) disposer();
  };

  const ctx = {
    effect(fn: () => unknown, label?: string) {
      state._effects.push(label ?? '');
      const disposer = fn();
      if (typeof disposer === 'function') state._effectDisposers.push(disposer as () => void);
      return typeof disposer === 'function' ? disposer : noop;
    },
    inject(deps: string[], callback: (ctx: unknown) => unknown) {
      state._injectGroups.push([...deps]);
      const group: InjectGroup = { deps: [...deps], callback, disposers: [], active: false };
      groups.push(group);
      state._effectDisposers.push(() => unload(group));
      load(group);
      return noop;
    },
    get locale() {
      return require('locale', localeService);
    },
    get configForms() {
      return require('configForms', configFormsService);
    },
    get slots() {
      return require('slots', slotsService);
    },
    /** 让服务变为可用，并加载依赖已齐的组。 */
    _grant(...names: ClientServiceName[]) {
      for (const name of names) available.add(name);
      for (const group of groups) load(group);
    },
    /** 撤掉服务，并卸载依赖它的组。 */
    _revoke(...names: ClientServiceName[]) {
      for (const name of names) available.delete(name);
      for (const group of groups) {
        if (group.deps.some((dep) => !available.has(dep))) unload(group);
      }
    },
    /** 模拟前端插件卸载：执行全部 effect 清理函数。 */
    _dispose() {
      for (const disposer of state._effectDisposers.splice(0)) disposer();
    },
  };
  return Object.assign(ctx, state) as unknown as Context & ClientMockState & typeof ctx;
}

/** 宿主配置表单的假实现：可写入快照、记录写操作。 */
export interface FakeConfigFormScope<T> {
  scope: SettingsFormScope<T>;
  /** 每次 `mutate` 提交的写操作。 */
  writes: SettingsFormPathOp[][];
  /** 替换宿主快照并通知订阅者。 */
  publish(next?: Partial<SettingsFormScopeSnapshot<T>>): void;
  /** 当前的订阅者数量。 */
  subscriberCount(): number;
}

/**
 * 构造一个宿主配置表单。
 * @param initial - 初始快照字段，`status` 默认 `ready`、`writable` 默认 `true`。
 */
export function makeConfigFormScope<T>(initial: {
  value?: T | undefined;
  base?: unknown;
  user?: unknown;
  status?: 'loading' | 'ready' | 'unavailable';
  writable?: boolean;
  revision?: number | undefined;
}): FakeConfigFormScope<T> {
  let snapshot: SettingsFormScopeSnapshot<T> = {
    status: initial.status ?? 'ready',
    value: initial.value,
    base: initial.base,
    user: initial.user,
    writable: initial.writable ?? true,
    revision: initial.revision ?? 1,
  };
  const listeners = new Set<() => void>();
  const writes: SettingsFormPathOp[][] = [];
  return {
    scope: {
      getSnapshot: () => snapshot,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      mutate: async (ops) => {
        writes.push([...ops]);
        return true;
      },
    },
    writes,
    publish: (next) => {
      snapshot = { ...snapshot, ...next };
      for (const listener of listeners) listener();
    },
    subscriberCount: () => listeners.size,
  };
}
