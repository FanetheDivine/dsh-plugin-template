// dsh-plugin-template 单元测试（vitest）：模块契约 / 配置校验（严格模式）/
// demo 工具（zod 参数校验）/ apply 接线（工具注册 + 事件监听 + 日志）。
// 测试目标是 src 的纯函数与 apply 接线，不依赖真实宿主。
import { describe, expect, it } from 'vitest';

import { Config, readConfig, resolveConfig } from '../src/config.ts';
import { DEMO_TOOL_NAME, PLUGIN_LABEL } from '../src/constants.ts';
import { buildDemoTool, parseEchoArgs } from '../src/demo-tool.ts';
import { apply, inject, name } from '../src/index.ts';
import { makeCtx, volatile } from './helpers.ts';

describe('模块契约', () => {
  it('插件入口导出 name / inject / apply', () => {
    expect(name).toBe('dsh-plugin-template'); // 与 cordis.patch.yml 的 id 一致
    expect(inject).toEqual(['tools', 'llm', 'tokenMeter', 'sessions']);
    expect(typeof apply).toBe('function');
    expect(typeof Config).toBe('function'); // 宿主据此识别 schema
  });
});

describe('读取实时配置 readConfig', () => {
  it('展开热重载引用并校验', () => {
    const config = { demoEnabled: volatile(false), prefix: volatile('p') };
    expect(readConfig(config)).toEqual({ demoEnabled: false, prefix: 'p' });
  });

  it('引用变化后读到新值', () => {
    const prefix = volatile('a');
    const config = { demoEnabled: volatile(true), prefix };
    expect(readConfig(config).prefix).toBe('a');
    prefix.set('b');
    expect(readConfig(config).prefix).toBe('b');
  });

  it('严格校验：未知键、非法值、非对象输入抛错', () => {
    const base = { demoEnabled: volatile(true), prefix: volatile('p') };
    expect(() => readConfig({ ...base, bogus: 1 })).toThrow('unknown config key "bogus"');
    expect(() => readConfig({ ...base, prefix: volatile('  ') })).toThrow(
      'prefix must be a non-empty',
    );
    expect(() => readConfig({ ...base, demoEnabled: volatile('x') })).toThrow('must be a boolean');
    expect(() => readConfig([])).toThrow('config must be an object');
  });

  it('宿主未传入配置时使用默认值', () => {
    expect(readConfig(undefined)).toEqual({ demoEnabled: true, prefix: 'demo' });
  });
});

describe('Config schema', () => {
  it('缺省值与实时读取', () => {
    const parsed = Config({});
    expect(parsed.prefix.get()).toBe('demo');
    expect(parsed.demoEnabled.get()).toBe(true);
  });

  it('空白前缀与非法类型被 schema 拒绝', () => {
    expect(() => Config({ prefix: '  ' })).toThrow();
    expect(() => Config({ demoEnabled: 'yes' })).toThrow();
  });

  it('未知键由 readConfig 拒绝', () => {
    expect(() => readConfig(Config({ bogus: 1 }))).toThrow('unknown config key "bogus"');
  });
});

describe('配置校验 resolveConfig', () => {
  it('默认值正确', () => {
    const d = resolveConfig({});
    expect(d.demoEnabled).toBe(true);
    expect(d.prefix).toBe('demo');
  });

  it('整份配置留空（undefined/null）时全部用默认值', () => {
    for (const raw of [undefined, null]) {
      const d = resolveConfig(raw);
      expect(d.demoEnabled).toBe(true);
      expect(d.prefix).toBe('demo');
    }
  });

  it('覆盖项生效', () => {
    const c = resolveConfig({ demoEnabled: false, prefix: 'my-plugin' });
    expect(c.demoEnabled).toBe(false);
    expect(c.prefix).toBe('my-plugin');
  });

  it('单项缺省（null/undefined）该键用默认值，其余覆盖项仍生效；空串视为非法值报错', () => {
    expect(resolveConfig({ prefix: null }).prefix).toBe('demo');
    const mixed = resolveConfig({ demoEnabled: false, prefix: undefined });
    expect(mixed.demoEnabled).toBe(false);
    expect(mixed.prefix).toBe('demo');
    expect(() => resolveConfig({ prefix: '' })).toThrow('prefix must be a non-empty string');
  });

  it('严格校验：未知键 / 非法类型 / 非对象输入直接拒绝（插件加载即报错）', () => {
    expect(() => resolveConfig({ badKey: 1 })).toThrow('unknown config key "badKey"');
    expect(() => resolveConfig({ demoEnabled: 'yes' })).toThrow('demoEnabled must be a boolean');
    expect(() => resolveConfig({ prefix: 42 })).toThrow('prefix must be a non-empty string');
    expect(() => resolveConfig([])).toThrow('config must be an object');
    // 错误消息统一带插件标识，便于在宿主日志中定位来源
    expect(() => resolveConfig({ badKey: 1 })).toThrow(PLUGIN_LABEL);
  });

  it('返回冻结的完整配置（缺省键已补齐）', () => {
    const d = resolveConfig({ prefix: 'p' });
    expect(Object.isFrozen(d)).toBe(true);
    expect(d).toEqual({ demoEnabled: true, prefix: 'p' });
  });
});

describe('demo 工具 parseEchoArgs / buildDemoTool', () => {
  it('合法参数解析成功', () => {
    expect(parseEchoArgs({ text: 'hello' })).toEqual({ ok: true, text: 'hello' });
  });

  it('非法参数返回错误提示而非抛出（safeParse）', () => {
    expect(parseEchoArgs({}).ok).toBe(false);
    expect(parseEchoArgs({ text: '' }).ok).toBe(false);
    expect(parseEchoArgs({ text: 42 }).ok).toBe(false);
    expect(parseEchoArgs(null).ok).toBe(false);
    const r = parseEchoArgs({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('参数不合法');
  });

  it('工具定义字段完整（name/description/parameters/output/execute）', () => {
    const tool = buildDemoTool('demo');
    expect(tool.name).toBe(DEMO_TOOL_NAME);
    expect(tool.description).toContain('demo');
    expect(tool.parameters).toEqual({
      text: { type: 'string', description: '要回显的文本', required: true },
    });
    expect(typeof tool.execute).toBe('function');
    expect(tool.output.render({ text: 'x' }, 'out')).toEqual([{ type: 'text', text: 'out' }]);
  });

  it('execute：合法参数回显带前缀与 session id，非法参数返回提示', async () => {
    const tool = buildDemoTool('demo');
    const exec = { agent: { id: 'a1' } };
    await expect(tool.execute({ text: 'hi' }, exec)).resolves.toBe('[demo] (session a1) hi');
    await expect(tool.execute({}, exec)).resolves.toContain('参数不合法');
  });
});

describe('apply 接线', () => {
  it('默认配置：注册 demo 工具 + 监听全部事件 + 打印 apply 日志', () => {
    const ctx = makeCtx();
    apply(ctx, {});
    expect(ctx._registeredTools.map((t) => t.name)).toEqual([DEMO_TOOL_NAME]);
    for (const ev of [
      'agent/created',
      'agent/disposed',
      'agent/status',
      'agent/pre-step',
      'agent/turn-stopping',
    ]) {
      expect(ctx._onCallbacks.has(ev)).toBe(true);
    }
    const infos = ctx._loggerCalls.filter((c) => c.level === 'info').map((c) => String(c.args[0]));
    expect(infos.some((s) => s.includes('apply: demoEnabled=true'))).toBe(true);
  });

  it('agent/created 监听：日志带 agent id 与创建来源', () => {
    const ctx = makeCtx();
    apply(ctx, {});
    const listener = ctx._onCallbacks.get('agent/created')?.[0];
    expect(listener).toBeTypeOf('function');
    listener?.({ agent: { id: 'a1' }, source: 'fresh' });
    listener?.({ agent: { id: 'a2' }, source: 'resume' });
    const infos = ctx._loggerCalls.filter((c) => c.level === 'info').map((c) => String(c.args[0]));
    expect(infos).toContain('[demo] agent created: a1 (fresh)');
    expect(infos).toContain('[demo] agent created: a2 (resume)');
  });

  it('demoEnabled=false：不注册工具，但事件监听照常', () => {
    const ctx = makeCtx();
    apply(ctx, { demoEnabled: false });
    expect(ctx._registeredTools).toHaveLength(0);
    expect(ctx._onCallbacks.has('agent/created')).toBe(true);
    const infos = ctx._loggerCalls.filter((c) => c.level === 'info').map((c) => String(c.args[0]));
    expect(infos.some((s) => s.includes('apply: demoEnabled=false'))).toBe(true);
  });

  it('pre-step 监听：signal 已中止时直接放行，正常时 await 后放行', async () => {
    const ctx = makeCtx();
    apply(ctx, {});
    const listener = ctx._onCallbacks.get('agent/pre-step')?.[0];
    expect(listener).toBeTypeOf('function');
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    await listener?.({ agent: { id: 'a1' }, signal: new AbortController().signal }, next);
    expect(nextCalled).toBe(true);
    const aborted = new AbortController();
    aborted.abort();
    nextCalled = false;
    await listener?.({ agent: { id: 'a1' }, signal: aborted.signal }, next);
    expect(nextCalled).toBe(true);
  });
});

describe('配置热重载', () => {
  /** 构造热重载引用配置并 apply。 */
  function setup(initial: { demoEnabled?: boolean; prefix?: string } = {}) {
    const ctx = makeCtx();
    const config = {
      demoEnabled: volatile(initial.demoEnabled ?? true),
      prefix: volatile(initial.prefix ?? 'demo'),
    };
    apply(ctx, config);
    return { ctx, config };
  }

  it('apply 订阅 loader/volatile-update', () => {
    const { ctx } = setup();
    expect(ctx._onCallbacks.has('loader/volatile-update')).toBe(true);
  });

  it('prefix 变化后重新注册工具，说明与回显使用新前缀', async () => {
    const { ctx, config } = setup();
    config.prefix.set('hot');
    ctx._emit('loader/volatile-update', [['prefix']]);
    const active = [...ctx._activeTools];
    expect(active).toHaveLength(1);
    expect(active[0]?.description).toContain('hot');
    const tool = buildDemoTool('hot');
    await expect(tool.execute({ text: 'x' }, { agent: { id: 's' } })).resolves.toBe(
      '[hot] (session s) x',
    );
  });

  it('demoEnabled 变为 false 后注销工具，变回 true 后重新注册', () => {
    const { ctx, config } = setup();
    expect(ctx._activeTools.size).toBe(1);
    config.demoEnabled.set(false);
    ctx._emit('loader/volatile-update', [['demoEnabled']]);
    expect(ctx._activeTools.size).toBe(0);
    config.demoEnabled.set(true);
    ctx._emit('loader/volatile-update', [['demoEnabled']]);
    expect(ctx._activeTools.size).toBe(1);
  });

  it('demoEnabled 初始为 false 时不注册，开启后注册', () => {
    const { ctx, config } = setup({ demoEnabled: false });
    expect(ctx._activeTools.size).toBe(0);
    config.demoEnabled.set(true);
    ctx._emit('loader/volatile-update', []);
    expect(ctx._activeTools.size).toBe(1);
  });

  it('事件日志使用新前缀', () => {
    const { ctx, config } = setup();
    config.prefix.set('hot');
    ctx._emit('loader/volatile-update', [['prefix']]);
    ctx._emit('agent/created', { agent: { id: 'a1' }, source: 'fresh' });
    const infos = ctx._loggerCalls.map((c) => String(c.args[0]));
    expect(infos).toContain('[hot] agent created: a1 (fresh)');
  });

  it('读取失败时保持原状并记录警告', () => {
    const { ctx, config } = setup();
    config.prefix.set('   ');
    ctx._emit('loader/volatile-update', [['prefix']]);
    expect([...ctx._activeTools][0]?.description).toContain('demo');
    expect(ctx._loggerCalls.some((c) => c.level === 'warn')).toBe(true);
  });

  it('插件卸载时注销工具', () => {
    const { ctx } = setup();
    ctx._dispose();
    expect(ctx._activeTools.size).toBe(0);
  });
});
