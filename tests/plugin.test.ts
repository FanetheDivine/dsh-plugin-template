// dsh-plugin-template 单元测试（vitest）：模块契约 / 配置校验（严格模式）/
// demo 工具（zod 参数校验）/ apply 接线（工具注册 + 事件监听 + 日志）。
// 测试目标是 src 的纯函数与 apply 接线，不依赖真实宿主。
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../src/config.ts';
import { DEMO_TOOL_NAME, PLUGIN_LABEL } from '../src/constants.ts';
import { buildDemoTool, parseEchoArgs } from '../src/demo-tool.ts';
import { apply, inject, name } from '../src/index.ts';
import { makeCtx } from './helpers.ts';

describe('模块契约', () => {
  it('插件入口导出 name / inject / apply', () => {
    expect(name).toBe('dsh-plugin-template'); // 与 cordis.patch.yml 的 id 一致
    expect(inject).toEqual(['tools', 'llm', 'tokenMeter', 'sessions']);
    expect(typeof apply).toBe('function');
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
      'agent/session-start',
      'agent/pre-step',
      'agent/turn-stopping',
    ]) {
      expect(ctx._onCallbacks.has(ev)).toBe(true);
    }
    const infos = ctx._loggerCalls.filter((c) => c.level === 'info').map((c) => String(c.args[0]));
    expect(infos.some((s) => s.includes('apply: demoEnabled=true'))).toBe(true);
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
