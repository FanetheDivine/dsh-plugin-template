/**
 * 测试使用的平台组件入口：直接把 `@deepseek-ai/dsh-client-ui-primitives` 指向包的源码。
 * 已发布的 lib 内联了未声明的第三方依赖（shiki、katex 等），源码只依赖 react、clsx
 * 与 dsh-client-store；vitest 能处理源码里的 CSS Module。
 */

export { Switch } from '@deepseek-ai/dsh-client-ui-primitives/src/Switch.tsx';
export type { SettingsFieldProps } from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/fields.tsx';
export {
  SettingsSecretField,
  SettingsValueField,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/fields.tsx';
export type {
  SettingsFieldSpec,
  SettingsFieldState,
  SettingsFieldWrite,
  SettingsFormActions,
  SettingsFormPathOp,
  SettingsFormScope,
  SettingsFormScopeSnapshot,
  SettingsFormShell,
  SettingsSecretSpec,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/form-model.ts';
export {
  SettingsFormModel,
  settingsNumberField,
  settingsTextField,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/form-model.ts';
export type {
  SettingsFormLabels,
  SettingsFormProps,
} from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/SettingsForm.tsx';
export { SettingsForm } from '@deepseek-ai/dsh-client-ui-primitives/src/settings-form/SettingsForm.tsx';
