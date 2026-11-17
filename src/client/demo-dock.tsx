/**
 * 前端示例行：输入区上方的状态行与计数按钮。
 * 导出 DemoDock 与其 props。
 */
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import { type CSSProperties, useState } from 'react';

import type { NS } from './locales.ts';

/** 示例行组件 props：框架合成的 locale 座。 */
export interface DemoDockProps {
  readonly t: TranslateNS<typeof NS>;
}

/** 示例行：显示本地化文案，按钮点击后计数递增。 */
export function DemoDock({ t }: DemoDockProps) {
  const [count, setCount] = useState(0);
  return (
    <div data-dsh-template-demo style={rowStyle}>
      <span>{t('dock.label')}</span>
      <button type="button" style={buttonStyle} onClick={() => setCount((value) => value + 1)}>
        {t('dock.action')}
      </button>
      <span data-dsh-template-demo-count>{t('dock.counter', { count })}</span>
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  color: 'var(--dsw-alias-label-secondary)',
  fontSize: 'var(--dsw-font-xxs-13-font-size, 12px)',
};

const buttonStyle: CSSProperties = {
  padding: '2px 8px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 'var(--dsw-radius-sm)',
  background: 'var(--dsw-alias-button-tool-bar-fill)',
  color: 'var(--dsw-alias-label-primary)',
  font: 'inherit',
  cursor: 'pointer',
};
