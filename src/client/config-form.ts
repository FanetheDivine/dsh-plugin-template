/**
 * 插件面板配置页的草稿模型：用官方 SettingsFormModel 暂存两个热重载字段。
 * 导出行键、命名空间、PluginConfigForm 与注入面类型。
 */

import type { SnapshotStore } from '@deepseek-ai/dsh-client-store';
import type {
  SettingsFieldSpec,
  SettingsFieldState,
  SettingsFormActions,
  SettingsFormScope,
  SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives';
import { SettingsFormModel } from '@deepseek-ai/dsh-client-ui-primitives';

/** 插件在“插件”页的配置页键：`<包名>#<行 id>`。 */
export const ROW_KEY = 'dsh-plugin-template#dsh-plugin-template';

/** 行 id。同时是宿主配置的条目 id 与表单命名空间。 */
export const ROW_ID = 'dsh-plugin-template';

/** 配置页可编辑的两个字段，取值与宿主 `Config` 的实时值一致。 */
export interface ConfigFields {
  /** 是否注册 demo 工具。 */
  demoEnabled: boolean;
  /** 工具回显与事件日志使用的前缀。 */
  prefix: string;
}

/** 配置页读取的草稿与表单状态。 */
export interface ConfigFormState extends SettingsFormShell {
  /** 开关字段。 */
  demoEnabled: SettingsFieldState;
  /** 前缀字段。 */
  prefix: SettingsFieldState;
}

/** 配置页向槽位组件提供的注入值。 */
export interface ConfigPageInjected extends SettingsFormActions {
  /** 草稿与表单状态。 */
  hooks: { configForm: SnapshotStore<ConfigFormState> };
}

/** 开关字段：草稿是 `true` 或 `false`。 */
const demoEnabledSpec: SettingsFieldSpec = {
  field: 'demoEnabled',
  format: (value) => (value === false ? 'false' : 'true'),
  parse: (text) =>
    text === 'true' || text === 'false' ? { kind: 'set', value: text === 'true' } : undefined,
};

/** 前缀字段：空白草稿非法，保存时写入去掉首尾空白的前缀。 */
const prefixSpec: SettingsFieldSpec = {
  field: 'prefix',
  format: (value) => (typeof value === 'string' ? value : ''),
  parse: (text) => {
    const prefix = text.trim();
    return prefix === '' ? undefined : { kind: 'set', value: prefix };
  },
};

/**
 * 暂存两处编辑，保存时一次写入宿主配置。
 * 保留模式：离开配置页丢弃草稿，写入只发生在保存。
 */
export class PluginConfigForm {
  private readonly form: SettingsFormModel<ConfigFields>;
  private readonly state: SnapshotStore<ConfigFormState>;

  /** @param scope - 宿主为该行提供的配置表单。 */
  constructor(scope: SettingsFormScope<ConfigFields>) {
    this.form = new SettingsFormModel(scope, [demoEnabledSpec, prefixSpec]);
    this.state = this.form.bind(() => ({
      ...this.form.shell(),
      demoEnabled: this.form.field('demoEnabled'),
      prefix: this.form.field('prefix'),
    }));
  }

  /** @returns 配置页向槽位组件提供的注入值。 */
  inject(): ConfigPageInjected {
    return { hooks: { configForm: this.state }, ...this.form.actions() };
  }

  /** 释放对宿主表单的订阅。 */
  dispose(): void {
    this.form.dispose();
  }
}
