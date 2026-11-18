/**
 * 浏览器入口：注册示例行文案、输入区上方的列表项与插件面板的配置页。
 * 导出 apply；前端服务按功能可选。
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

/**
 * 插件在前端启用时调用。
 * 三项客户端服务都是可选的：每个功能用 `ctx.inject` 只等待自己用到的服务，
 * 服务缺失时该功能不加载，就绪后加载，撤掉后卸载。
 */
export function apply(ctx: Context): void {
  // 字典
  ctx.inject(['locale'], (ctx) => {
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-plugin-template: dictionaries');
  });

  // 输入区上方的示例行
  ctx.inject(['slots', 'locale'], (ctx) => {
    ctx.slots.inject('conversation.composer.dock', () =>
      ctx.slots.register(
        { name: 'conversation.composer.dock', id: 'demo', order: 5, locale: NS },
        DemoDock,
      ),
    );
  });

  // 配置页：宿主为该行提供的表单命名空间是行 id
  ctx.inject(['slots', 'locale', 'configForms'], (ctx) => {
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
  });
}
