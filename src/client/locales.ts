/**
 * 前端示例的字典与命名空间。
 * 导出 NS、DemoKey、zh、en；中文字典是键集事实源。
 */

/** 示例行使用的字典命名空间。 */
export const NS = 'dsh-plugin-template';

/** 中文字典。 */
export const zh = {
  'dock.label': '模板前端已加载',
  'dock.counter': '点击次数：{count}',
  'dock.action': '点一下',
} as const;

/** 英文字典，键集与中文一致。 */
export const en: Record<DemoKey, string> = {
  'dock.label': 'Template frontend loaded',
  'dock.counter': 'Clicks: {count}',
  'dock.action': 'Click',
};

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** 示例行文案，键集取自中文字典。 */
    'dsh-plugin-template': DemoKey;
  }
}

/** 示例行可用的字典键。 */
export type DemoKey = keyof typeof zh;
