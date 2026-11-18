// 前端入口接线测试：断言服务声明、字典与槽位注册参数、双语文案键集与渲染结果。
import type {} from '@deepseek-ai/dsh-client-locale/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { type ConfigFormState, ROW_ID, ROW_KEY } from '../src/client/config-form.ts';
import { ConfigPage } from '../src/client/config-page.tsx';
import { DemoDock } from '../src/client/demo-dock.tsx';
import * as clientEntry from '../src/client/index.ts';
import { en, NS, zh } from '../src/client/locales.ts';
import { type ClientServiceName, makeClientCtx } from './helpers.ts';

const { apply } = clientEntry;
const ALL_SERVICES: ClientServiceName[] = ['slots', 'locale', 'configForms'];

/** 用字典与 `{name}` 模板参数构造翻译函数，行为与宿主 locale 座一致。 */
function translate(dict: Record<string, string>): TranslateNS<typeof NS> {
  return (key, params) =>
    (dict[key] ?? key).replace(/\{(\w+)\}/g, (_match, name: string) =>
      String(params?.[name] ?? ''),
    );
}

/** 配置页的草稿状态。 */
function pageState(overrides: Partial<ConfigFormState> = {}): ConfigFormState {
  return {
    available: true,
    writable: true,
    dirty: false,
    invalid: false,
    saving: false,
    failed: false,
    demoEnabled: { text: 'true', overridden: false, invalid: false },
    prefix: { text: 'demo', overridden: false, invalid: false },
    ...overrides,
  };
}

/** 渲染配置页：用假的选择器 Hook 返回给定状态。 */
function renderConfigPage(
  view: 'page' | 'summary',
  dict: Record<string, string>,
  state = pageState(),
): string {
  const props = {
    view,
    t: translate(dict),
    useConfigForm: <S>(select: (value: ConfigFormState) => S): S => select(state),
    edit: vi.fn(),
    resetField: vi.fn(),
    save: vi.fn(),
    discard: vi.fn(),
  };
  return renderToStaticMarkup(createElement(ConfigPage, props as never));
}

describe('前端入口', () => {
  it('不声明必需服务，按功能分三组等待各自用到的服务', () => {
    expect('inject' in clientEntry).toBe(false);
    const ctx = makeClientCtx();
    apply(ctx);
    expect(ctx._injectGroups).toEqual([
      ['locale'],
      ['slots', 'locale'],
      ['slots', 'locale', 'configForms'],
    ]);
  });

  it('注册双语字典、输入区上方的示例行与面板配置页', () => {
    const ctx = makeClientCtx();
    apply(ctx);

    expect(ctx._localeRegistrations.map((entry) => entry.ns)).toEqual([NS]);
    const dictionary = ctx._localeRegistrations[0];
    expect(Object.keys(dictionary?.dicts ?? {}).sort()).toEqual(['en', 'zh']);

    expect(ctx._slotInjections).toEqual(['conversation.composer.dock', 'plugins.row.config']);
    expect(ctx._slotRegistrations[0]?.options).toMatchObject({
      name: 'conversation.composer.dock',
      id: 'demo',
      order: 5,
      locale: NS,
    });
    expect(ctx._slotRegistrations[0]?.component).toBe(DemoDock);

    expect(ctx._slotRegistrations[1]?.options).toMatchObject({
      name: 'plugins.row.config',
      key: ROW_KEY,
      locale: NS,
    });
    expect(ctx._slotRegistrations[1]?.component).toBe(ConfigPage);

    expect(ctx._effects).toEqual([
      'dsh-plugin-template: dictionaries',
      'dsh-plugin-template: config form',
    ]);
    expect(ctx._configFormRequests).toEqual([ROW_ID]);
    expect(ROW_KEY).toBe(`${ROW_ID}#${ROW_ID}`);
  });

  it('卸载时释放配置表单的订阅', () => {
    const ctx = makeClientCtx();
    apply(ctx);
    const scope = ctx._configFormScopes[0];
    expect(scope?.subscriberCount()).toBe(1);

    ctx._dispose();
    expect(scope?.subscriberCount()).toBe(0);
  });
});

/** 某组服务可用时应注册的内容。 */
function expectedRegistrations(services: ClientServiceName[]) {
  const has = (...names: ClientServiceName[]) => names.every((name) => services.includes(name));
  return {
    dictionary: has('locale'),
    dock: has('slots', 'locale'),
    configPage: has('slots', 'locale', 'configForms'),
  };
}

/** 读取当前生效的注册内容。 */
function activeRegistrations(ctx: ReturnType<typeof makeClientCtx>) {
  const slotNames = [...ctx._activeSlots].map((entry) => entry.options.name);
  return {
    dictionary: ctx._activeLocales.size === 1,
    dock: slotNames.includes('conversation.composer.dock'),
    configPage: slotNames.includes('plugins.row.config'),
  };
}

/** 三个服务各有或无的全部 8 种组合。 */
const COMBINATIONS: ClientServiceName[][] = Array.from({ length: 8 }, (_, mask) =>
  ALL_SERVICES.filter((_name, index) => (mask >> index) & 1),
);

describe('前端服务可选', () => {
  it.each(COMBINATIONS.map((services) => [services]))(
    '服务 %j 可用时启用成功，注册内容与可用性一一对应',
    (services) => {
      const ctx = makeClientCtx({ services });
      expect(() => apply(ctx)).not.toThrow();
      expect(activeRegistrations(ctx)).toEqual(expectedRegistrations(services));
    },
  );

  it('configForms 缺失时不请求配置表单', () => {
    const ctx = makeClientCtx({ services: ['slots', 'locale'] });
    apply(ctx);
    expect(ctx._configFormRequests).toEqual([]);
  });

  it('configForms 晚就绪后配置页自动注册', () => {
    const ctx = makeClientCtx({ services: ['slots', 'locale'] });
    apply(ctx);
    expect(activeRegistrations(ctx).configPage).toBe(false);

    ctx._grant('configForms');
    expect(activeRegistrations(ctx)).toEqual({ dictionary: true, dock: true, configPage: true });
    expect(ctx._configFormRequests).toEqual([ROW_ID]);
  });

  it('服务撤掉后只清理依赖它的功能，重新就绪后重新注册且不重复', () => {
    const ctx = makeClientCtx();
    apply(ctx);
    const scope = ctx._configFormScopes[0];
    expect(scope?.subscriberCount()).toBe(1);

    ctx._revoke('configForms');
    expect(activeRegistrations(ctx)).toEqual({ dictionary: true, dock: true, configPage: false });
    expect(scope?.subscriberCount()).toBe(0);

    ctx._grant('configForms');
    expect(activeRegistrations(ctx)).toEqual({ dictionary: true, dock: true, configPage: true });
    expect(ctx._activeSlots.size).toBe(2);
    expect(ctx._activeLocales.size).toBe(1);
    expect(ctx._configFormScopes[1]?.subscriberCount()).toBe(1);
  });

  it('locale 撤掉后三项功能都被清理', () => {
    const ctx = makeClientCtx();
    apply(ctx);
    ctx._revoke('locale');
    expect(activeRegistrations(ctx)).toEqual({
      dictionary: false,
      dock: false,
      configPage: false,
    });
    expect(ctx._configFormScopes[0]?.subscriberCount()).toBe(0);
  });
});

describe('示例行', () => {
  it('中英字典键集一致且无空文案', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    expect(Object.values(zh).every((text) => text.trim() !== '')).toBe(true);
    expect(Object.values(en).every((text) => text.trim() !== '')).toBe(true);
  });

  it('按字典渲染中文与英文文案', () => {
    const zhHtml = renderToStaticMarkup(createElement(DemoDock, { t: translate(zh) }));
    expect(zhHtml).toContain('data-dsh-template-demo');
    expect(zhHtml).toContain('模板前端已加载');
    expect(zhHtml).toContain('点击次数：0');

    const enHtml = renderToStaticMarkup(createElement(DemoDock, { t: translate(en) }));
    expect(enHtml).toContain('Template frontend loaded');
    expect(enHtml).toContain('Clicks: 0');
  });
});

describe('配置页', () => {
  it('summary 渲染一行描述', () => {
    expect(renderConfigPage('summary', zh)).toContain('演示工具与事件日志的开关和回显前缀');
    expect(renderConfigPage('summary', en)).toContain(
      'The demo tool switch and the echo prefix of the event log',
    );
  });

  it('page 渲染开关、前缀输入与保存按钮', () => {
    const html = renderConfigPage('page', zh);
    expect(html).toContain('data-dsh-template-config');
    expect(html).toContain('启用 demo 工具');
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('回显前缀');
    expect(html).toContain('value="demo"');
    expect(html).toContain('保存');
  });

  it('page 渲染英文文案', () => {
    const html = renderConfigPage('page', en);
    expect(html).toContain('Enable the demo tool');
    expect(html).toContain('Echo prefix');
    expect(html).toContain('Save');
  });

  it('非法前缀显示错误提示，只读时禁用控件', () => {
    const invalid = renderConfigPage(
      'page',
      zh,
      pageState({
        writable: false,
        prefix: { text: ' ', overridden: true, invalid: true },
      }),
    );
    expect(invalid).toContain('前缀需要至少一个非空白字符。');
    expect(invalid).toContain('aria-invalid="true"');
    expect(invalid).toContain('已覆盖');
    expect(invalid).toContain('恢复默认');
    expect(invalid).toContain('此部署以只读方式保存设置。');
    expect(invalid).toMatch(/<input[^>]*disabled/);
    expect(invalid).toMatch(/<button[^>]*role="switch"[^>]*disabled/);
  });

  it('命名空间未下发时显示不可用文案', () => {
    expect(renderConfigPage('page', zh, pageState({ available: false }))).toContain(
      '模板配置不可用。',
    );
  });
});
