# 前端入口契约

`src/client/index.ts` 的导出与宿主加载行为。

## 导出

| 符号 | 形态 | 约束 |
| --- | --- | --- |
| `apply(ctx)` | 函数 | 不读取任何服务，只声明三组 `ctx.inject` 回调 |
| `inject` | 不再导出 | 前端入口不声明必需服务 |

## 组契约

| 组 | `ctx.inject` 依赖 | 回调行为 |
| --- | --- | --- |
| 字典 | `['locale']` | `ctx.effect` 注册字典，标签 `dsh-plugin-template: dictionaries` |
| 示例行 | `['slots', 'locale']` | `ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register(..., DemoDock))` |
| 配置页 | `['slots', 'locale', 'configForms']` | 构造 `PluginConfigForm`，用 `ctx.effect` 释放；`ctx.slots.inject('plugins.row.config', ...)` 注册 `ConfigPage` |

## 不变项

- 槽位选项 `{ name, id/key, order, locale }` 与 `ROW_ID`、`ROW_KEY`、`NS` 取值不变。
- `package.json` 的 `dsh.client.inject` 与 `exports['./client']` 不变。
- 宿主入口 `src/index.ts` 的 `inject`、`apply`、`Config` 不变。
