/**
 * 前端字典与命名空间。
 * 导出 NS、TemplateKey、zh、en；中文字典是键集事实源。
 */

/** 前端使用的字典命名空间，与插件名一致。 */
export const NS = 'dsh-plugin-template';

/** 中文字典。 */
export const zh = {
  'dock.label': '模板前端已加载',
  'dock.counter': '点击次数：{count}',
  'dock.action': '点一下',
  'config.summary': '演示工具与事件日志的开关和回显前缀',
  'config.demoEnabled.title': '启用 demo 工具',
  'config.demoEnabled.description': '开启后向模型提供 demo_echo 工具，关闭后立即注销。',
  'config.prefix.title': '回显前缀',
  'config.prefix.description': 'demo_echo 的说明与事件日志使用此前缀。',
  'config.prefix.invalid': '前缀需要至少一个非空白字符。',
  'config.overridden': '已覆盖',
  'config.reset': '恢复默认',
  'config.unavailable': '模板配置不可用。',
  'config.readOnly': '此部署以只读方式保存设置。',
  'config.saveFailed': '此部署未接受这些值，已保留以便修改。',
  'config.save': '保存',
  'config.saving': '保存中…',
} as const;

/** 英文字典，键集与中文一致。 */
export const en: Record<TemplateKey, string> = {
  'dock.label': 'Template frontend loaded',
  'dock.counter': 'Clicks: {count}',
  'dock.action': 'Click',
  'config.summary': 'The demo tool switch and the echo prefix of the event log',
  'config.demoEnabled.title': 'Enable the demo tool',
  'config.demoEnabled.description':
    'Offers demo_echo to the model; turning it off unregisters the tool immediately.',
  'config.prefix.title': 'Echo prefix',
  'config.prefix.description': 'demo_echo and the event log use this prefix.',
  'config.prefix.invalid': 'The prefix needs at least one non-blank character.',
  'config.overridden': 'Overridden',
  'config.reset': 'Restore default',
  'config.unavailable': 'Template settings are unavailable.',
  'config.readOnly': 'This deployment stores settings read-only.',
  'config.saveFailed':
    'The deployment did not accept these values; they were left for you to correct.',
  'config.save': 'Save',
  'config.saving': 'Saving…',
};

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 模板前端文案，键集取自中文字典。 */
    'dsh-plugin-template': TemplateKey;
  }
}

/** 模板前端可用的字典键。 */
export type TemplateKey = keyof typeof zh;
