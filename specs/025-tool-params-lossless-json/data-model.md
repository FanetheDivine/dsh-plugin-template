# Data Model: 工具参数声明的无损 JSON 与 zod 示例

## 实体

### 工具声明参数

`demo_echo` 注册时交给宿主的 `parameters`：

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `type` | `'object'` | zod 对象的根类型 |
| `properties` | `{ text: { type: 'string', minLength: 1, description } }` | 属性表 |
| `required` | `['text']` | 必填字段 |
| `additionalProperties` | `false` | zod 生成的默认收敛 |
| `$schema` | 不存在 | 生成时剔除 |
| `~standard` | 不存在 | 展开复制丢弃 |

### 无损 JSON 值

校验函数接受的值集合，与宿主 `walkJsonValue` 一致：

| 类别 | 规则 |
| --- | --- |
| `null` / 布尔 / 字符串 | 直接接受 |
| 数字 | 有限值；拒绝 `NaN`、`Infinity`、`-0` |
| 数组 | 原型为 `Array.prototype`；除 `length` 外只有连续下标 |
| 对象 | 原型为 `null` 或 `Object.prototype`；自有键全为可枚举字符串键 |
| 引用 | 沿路径不出现重复对象；不同分支可共享 |

### 校验结果

| 结果 | 形态 | 调用方处理 |
| --- | --- | --- |
| 通过 | 深拷贝，与输入结构相等且无引用共享 | 断言内容与原始声明一致 |
| 失败 | 抛出 `Error`，消息含失败路径与原因 | 测试用 `toThrow` 断言 |

## 关系

- `demo_echo` 的 `parameters` 与 `parseEchoArgs` 的校验共用同一个 zod schema `echoArgsSchema`。
- 每个已注册工具持有恰好一个 `parameters`，都必须是无损 JSON 值。
- 校验函数只读输入，返回的副本可自由改写。

## 状态与校验规则

1. 声明在 `buildDemoTool` 调用时生成一次，之后只读。
2. 声明键集合固定为 `type`、`properties`、`required`、`additionalProperties`。
3. 任一已注册工具的声明校验失败即视为缺陷，不区分工具来源。
4. `z.toJSONSchema` 的原始输出必须校验失败，证明展开复制是必需的。
