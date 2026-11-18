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
import { apply, inject } from '../src/client/index.ts';
import { en, NS, zh } from '../src/client/locales.ts';
import { makeClientCtx } from './helpers.ts';

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
  it('声明实际使用的客户端服务', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms']);
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
