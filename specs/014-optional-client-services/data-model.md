# Data Model: 前端服务可选

## 前端服务

| 服务 | 提供方 | 用途 |
| --- | --- | --- |
| `slots` | `@deepseek-ai/dsh-client-ui-renderer` | `slots.inject` 等待槽位、`slots.register` 注册内容 |
| `locale` | `@deepseek-ai/dsh-client-locale` | `locale.register` 注册字典 |
| `configForms` | `@deepseek-ai/dsh-client-ui-settings` | `configForms.get` 取得配置表单 |

服务共 3 个，每项可取“可用”或“缺失”，组合 8 种。

## 前端功能组

| 组 | 依赖 | 注册内容 | 清理 |
| --- | --- | --- | --- |
| 字典 | `locale` | `locale.register(NS, { zh, en })` | 子 fiber 卸载 |
| 示例行 | `slots`、`locale` | `slots.inject('conversation.composer.dock')` 后 `slots.register` | 子 fiber 卸载 |
| 配置页 | `slots`、`locale`、`configForms` | `configForms.get(ROW_ID)` + `slots.inject('plugins.row.config')` 后 `slots.register` | 组内 `ctx.effect` 释放表单作用域 |

## 状态

单个功能组的三态：

| 状态 | 条件 | 行为 |
| --- | --- | --- |
| 未加载 | 依赖未全部可用 | 不注册 |
| 已加载 | 依赖全部可用 | 回调执行一次 |
| 已卸载 | 加载后依赖被撤掉 | 回调返回的清理执行，可再次加载 |

## 不变量

- 同一组在服务可用期间只执行一次回调，无重复注册。
- 组之间无共享可变状态，一组卸载不影响另一组。
- 宿主入口 `src/index.ts` 的服务声明与配置解析不变。
