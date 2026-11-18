/**
 * 浏览器入口：注册示例行文案、输入区上方的列表项与插件面板的配置页。
 * 导出 inject 与 apply。
 */
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-locale/client';
// Type-only：拉取 conversation.composer.dock 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
// Type-only：拉取 plugins.row.config 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
// Type-only：拉取 ctx.slots 服务。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
// Type-only：拉取 ctx.configForms 服务。
import type {} from '@deepseek-ai/dsh-client-ui-settings/client';
import { type ConfigFields, PluginConfigForm, ROW_ID, ROW_KEY } from './config-form.ts';
import { ConfigPage } from './config-page.tsx';
import { DemoDock } from './demo-dock.tsx';
import { en, NS, zh } from './locales.ts';

/** 需要宿主注入的客户端服务。 */
export const inject = ['slots', 'locale', 'configForms'];

/** 插件在前端启用时调用：注册字典、示例行与面板配置页。 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-template: dictionaries');
  ctx.slots.inject('conversation.composer.dock', () =>
    ctx.slots.register(
      { name: 'conversation.composer.dock', id: 'demo', order: 5, locale: NS },
      DemoDock,
    ),
  );

  // 配置页：宿主为该行提供的表单命名空间是行 id
  const form = new PluginConfigForm(ctx.configForms.get<ConfigFields>(ROW_ID));
  ctx.effect(
    () => () => {
      form.dispose();
    },
    'dsh-plugin-template: config form',
  );
  ctx.slots.inject('plugins.row.config', () =>
    ctx.slots.register(
      { name: 'plugins.row.config', key: ROW_KEY, locale: NS, inject: () => form.inject() },
      ConfigPage,
    ),
  );
}
