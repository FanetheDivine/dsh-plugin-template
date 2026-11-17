// 前端入口接线测试：断言服务声明、字典与槽位注册参数、双语文案键集与渲染结果。
import type {} from '@deepseek-ai/dsh-client-locale/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

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

describe('前端入口', () => {
  it('只声明实际使用的客户端服务', () => {
    expect(inject).toEqual(['slots', 'locale']);
  });

  it('注册双语字典与输入区上方的示例行', () => {
    const ctx = makeClientCtx();
    apply(ctx);

    expect(ctx._localeRegistrations.map((entry) => entry.ns)).toEqual([NS]);
    const dictionary = ctx._localeRegistrations[0];
    expect(Object.keys(dictionary?.dicts ?? {}).sort()).toEqual(['en', 'zh']);

    expect(ctx._slotInjections).toEqual(['conversation.composer.dock']);
    const registration = ctx._slotRegistrations[0];
    expect(registration?.options).toMatchObject({
      name: 'conversation.composer.dock',
      id: 'demo',
      order: 5,
      locale: NS,
    });
    expect(registration?.component).toBe(DemoDock);
    expect(ctx._effects).toContain('dsh-plugin-template: dictionaries');
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
