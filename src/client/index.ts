/**
 * 浏览器入口：注册示例行文案与输入区上方的列表项。
 * 导出 inject 与 apply。
 */
import type { Context } from '@deepseek-ai/cordis';
// Type-only：拉取 ctx.locale 服务。
import type {} from '@deepseek-ai/dsh-client-locale/client';
// Type-only：拉取 conversation.composer.dock 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
// Type-only：拉取 ctx.slots 服务。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import { DemoDock } from './demo-dock.tsx';
import { en, NS, zh } from './locales.ts';

/** 需要宿主注入的客户端服务。 */
export const inject = ['slots', 'locale'];

/** 插件在前端启用时调用：注册字典与示例行。 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-template: dictionaries');
  ctx.slots.inject('conversation.composer.dock', () =>
    ctx.slots.register(
      { name: 'conversation.composer.dock', id: 'demo', order: 5, locale: NS },
      DemoDock,
    ),
  );
}
