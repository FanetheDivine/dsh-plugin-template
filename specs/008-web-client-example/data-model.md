# Data Model: 前端示例

## 示例行注册

槽位注册描述，宿主据此渲染。

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `name` | `conversation.composer.dock` | 会话输入区上方的列表槽位 |
| `id` | `demo` | 同一槽位内唯一 |
| `order` | `5` | 排在内置 `activity`、`usage` 之后 |
| `locale` | `dsh-plugin-template` | 渲染器据此生成 `t` 座 |

组件 props：`{ t: TranslateNS<'dsh-plugin-template'> }`。

## 字典

| 命名空间 | 语言 | 键集 |
| --- | --- | --- |
| `dsh-plugin-template` | `zh` | 键集事实源 |
| `dsh-plugin-template` | `en` | 与 `zh` 完全一致 |

首版键：

| 键 | 中文 | 英文 |
| --- | --- | --- |
| `dock.label` | 模板前端已加载 | Template frontend loaded |
| `dock.counter` | 点击次数：{count} | Clicks: {count} |
| `dock.action` | 点一下 | Click |

## 组件状态

| 状态 | 类型 | 初值 | 变化 |
| --- | --- | --- | --- |
| `count` | `number` | `0` | 点击按钮加一 |

组件卸载时由宿主释放，状态随组件销毁。

## 前端产物

| 属性 | 值 |
| --- | --- |
| 文件 | `dist/client.js` |
| 注册 id | `dsh-plugin-template` |
| 工厂导出 | `inject`、`apply` |
| `inject` 服务 | `slots`、`locale` |
| 外部模块 | 平台种子 |

## 清单声明

| 字段 | 值 |
| --- | --- |
| `exports["./client"].default` | `./dist/client.js` |
| `dsh.client.platform` | `web` |
| `dsh.client.inject` | `@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-conversation`、`@deepseek-ai/dsh-client-ui-renderer` |