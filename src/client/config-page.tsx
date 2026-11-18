/**
 * 插件面板配置页：`summary` 一行描述，`page` 用官方表单控件渲染两个字段。
 * 导出 ConfigPage 与其 props。
 */

// Type-only：拉取 plugins.row.config 槽位声明。
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client';
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives';
import { SettingsForm, SettingsValueField, Switch } from '@deepseek-ai/dsh-client-ui-primitives';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type CSSProperties, useId } from 'react';

import type { ConfigPageInjected } from './config-form.ts';
import type { NS } from './locales.ts';

/** 配置页组件 props：行配置页的运行时值、字典与注入面。 */
export type ConfigPageProps = PropsRuntime<'plugins.row.config'> &
  PropsLocale<typeof NS> &
  InjectFace<ConfigPageInjected>;

/** 表单框架文案。 */
function formLabels(t: ConfigPageProps['t']): SettingsFormLabels {
  return {
    unavailable: t('config.unavailable'),
    readOnly: t('config.readOnly'),
    saveFailed: t('config.saveFailed'),
    save: t('config.save'),
    saving: t('config.saving'),
  };
}

/**
 * 渲染模板插件在“插件”页的行配置。
 * @param props - 视图名、已暂存的表单，以及编辑、保存与放弃动作。
 * @returns `page` 渲染表单，`summary` 渲染该行缺失描述时的一行文案。
 */
export function ConfigPage(props: ConfigPageProps) {
  const { t } = props;
  const id = useId();
  const state = props.useConfigForm((value) => value);
  if (props.view === 'summary') return t('config.summary');
  const disabled = !state.writable || state.saving;
  const title = t('config.demoEnabled.title');
  return (
    <SettingsForm
      labels={formLabels(t)}
      state={state}
      onSave={props.save}
      onDiscard={props.discard}
    >
      <div data-dsh-template-config style={rowStyle}>
        <div style={textStyle}>
          <span style={titleStyle}>{title}</span>
          <p style={descriptionStyle}>{t('config.demoEnabled.description')}</p>
        </div>
        <Switch
          checked={state.demoEnabled.text === 'true'}
          disabled={disabled}
          label={title}
          onChange={(next) => {
            props.edit('demoEnabled', next ? 'true' : 'false');
          }}
        />
      </div>
      <div data-dsh-template-config-prefix style={fieldStyle}>
        <SettingsValueField
          id={`${id}-prefix`}
          label={t('config.prefix.title')}
          hint={t('config.prefix.description')}
          invalidLabel={t('config.prefix.invalid')}
          overriddenLabel={t('config.overridden')}
          resetLabel={t('config.reset')}
          text={state.prefix.text}
          overridden={state.prefix.overridden}
          invalid={state.prefix.invalid}
          disabled={disabled}
          onEdit={(text) => {
            props.edit('prefix', text);
          }}
          onReset={() => {
            props.resetField('prefix');
          }}
        />
      </div>
    </SettingsForm>
  );
}

/** 开关行：标题与说明在左，开关在右，与官方配置页的开关行一致。 */
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '12px 0',
};

/** 开关行的文字列。 */
const textStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
};

/** 字段标题：13px、中等字重。 */
const titleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.5,
  color: 'var(--dsw-alias-label-primary)',
};

/** 字段说明：12px、次级文字色。 */
const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-secondary)',
};

/** 前缀字段外层：与上一字段之间画 0.5px 的 l2 分隔线。 */
const fieldStyle: CSSProperties = {
  borderTop: '0.5px solid var(--dsw-alias-border-l2)',
};
