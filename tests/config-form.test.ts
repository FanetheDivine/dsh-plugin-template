// 配置页草稿模型测试：草稿、校验、保存写操作、恢复默认、放弃与卸载。
import { describe, expect, it } from 'vitest';

import {
  type ConfigFields,
  type ConfigFormState,
  PluginConfigForm,
  ROW_ID,
  ROW_KEY,
} from '../src/client/config-form.ts';
import { makeConfigFormScope } from './helpers.ts';

/** 构造表单与它读取的状态。 */
function setup(initial: { demoEnabled?: boolean; prefix?: string; user?: unknown } = {}) {
  const fake = makeConfigFormScope<ConfigFields>({
    value: { demoEnabled: initial.demoEnabled ?? true, prefix: initial.prefix ?? 'demo' },
    base: { demoEnabled: true, prefix: 'demo' },
    user: initial.user,
  });
  const form = new PluginConfigForm(fake.scope);
  return { fake, form, state: () => form.inject().hooks.configForm.getSnapshot() };
}

describe('配置页常量', () => {
  it('行键与命名空间与宿主配置一致', () => {
    expect(ROW_KEY).toBe('dsh-plugin-template#dsh-plugin-template');
    expect(ROW_ID).toBe('dsh-plugin-template');
  });
});

describe('配置页草稿', () => {
  it('草稿来自宿主值，起初不脏也没有非法值', () => {
    const { state } = setup();
    const current = state();
    expect(current.prefix.text).toBe('demo');
    expect(current.demoEnabled.text).toBe('true');
    expect(current.dirty).toBe(false);
    expect(current.invalid).toBe(false);
    expect(current.available).toBe(true);
  });

  it('命名空间未下发时不渲染控件', () => {
    const fake = makeConfigFormScope<ConfigFields>({ status: 'unavailable' });
    const form = new PluginConfigForm(fake.scope);
    const current: ConfigFormState = form.inject().hooks.configForm.getSnapshot();
    expect(current.available).toBe(false);
  });

  it('空白前缀非法，保存被拒绝', async () => {
    const { fake, form, state } = setup();
    form.inject().edit('prefix', '   ');
    expect(state().prefix.invalid).toBe(true);
    expect(state().dirty).toBe(true);

    await form.inject().save();
    expect(fake.writes).toEqual([]);
    expect(state().prefix.text).toBe('   ');
  });
});

describe('配置页保存', () => {
  it('保存两个字段，一次写入去空白后的前缀', async () => {
    const { fake, form, state } = setup();
    const actions = form.inject();
    actions.edit('demoEnabled', 'false');
    actions.edit('prefix', '  acme  ');

    await actions.save();
    expect(fake.writes).toEqual([
      [
        { op: 'set', path: ['demoEnabled'], value: false },
        { op: 'set', path: ['prefix'], value: 'acme' },
      ],
    ]);
    expect(state().dirty).toBe(false);
    expect(state().failed).toBe(false);
  });

  it('恢复默认提交清除操作', async () => {
    const { fake, form, state } = setup({ user: { prefix: 'acme' } });
    const actions = form.inject();
    expect(state().prefix.overridden).toBe(true);

    actions.resetField('prefix');
    expect(state().prefix.text).toBe('demo');
    expect(state().prefix.overridden).toBe(false);

    await actions.save();
    expect(fake.writes).toEqual([[{ op: 'unset', path: ['prefix'] }]]);
  });

  it('放弃草稿回到宿主值', () => {
    const { form, state } = setup();
    const actions = form.inject();
    actions.edit('prefix', 'acme');
    expect(state().dirty).toBe(true);

    actions.discard();
    expect(state().dirty).toBe(false);
    expect(state().prefix.text).toBe('demo');
  });

  it('只读部署不写入', async () => {
    const fake = makeConfigFormScope<ConfigFields>({
      value: { demoEnabled: true, prefix: 'demo' },
      writable: false,
    });
    const form = new PluginConfigForm(fake.scope);
    const actions = form.inject();
    actions.edit('prefix', 'acme');

    await actions.save();
    expect(fake.writes).toEqual([]);
  });
});

describe('配置页卸载', () => {
  it('卸载后宿主快照变化不再更新状态', () => {
    const { fake, form, state } = setup();
    const before = state();
    form.dispose();

    fake.publish({ value: { demoEnabled: false, prefix: 'gone' } });
    expect(state()).toBe(before);
  });
});
