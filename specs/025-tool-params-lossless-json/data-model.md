# Data Model: 工具参数声明的无损 JSON 与手写声明

## 实体

### 手写参数声明

`demo_echo` 的 `parameters`，一个 `as const` 的普通 JSON 常量：

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `type` | `'object'` | 对象根 |
| `properties.text.type` | `'string'` | 与 zod 的 `z.string()` 对应 |
| `properties.text.minLength` | `1` | 与 `z.string().min(1)` 对应 |
| `properties.text.description` | `'要回显的文本'` | 模型看到的说明 |
| `required` | `['text']` | 与 `z.infer` 的必填键一致 |
| `additionalProperties` | `false` | 与 zod 投影一致 |

### zod 投影

`z.toJSONSchema(echoArgsSchema)` 的输出：

| 键 | 处理 |
| --- | --- |
| `$schema` | 剔除，模型不需要 |
| `type`、`properties`、`required`、`additionalProperties` | 与手写声明逐字段相等 |
| `~standard` | 不可枚举、不可配置；一致性测试剔除后比较 |

### 类型约束

| 约束 | 覆盖 |
| --- | --- |
| `as const satisfies ParametersSchemaOf<EchoArgs>` | 属性键集合、属性值类型、`required` 存在 |
| `Assert<Equal<required[number], RequiredKeys<EchoArgs>>>` | 必填键集合精确相等 |
| `Assert<Equal<keyof properties, keyof EchoArgs>>` | 属性键集合精确相等 |

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

- `echoArgsSchema` 是参数类型与运行时校验的唯一来源；`EchoArgs` 由它推出。
- `ECHO_PARAMETERS` 是手写常量，受 `EchoArgs` 派生出的类型约束。
- 一致性测试把 `ECHO_PARAMETERS` 与 zod 投影绑定，任一侧漂移都会失败。
- 每个已注册工具持有恰好一个 `parameters`，都必须是无损 JSON 值。

## 状态与校验规则

1. `ECHO_PARAMETERS` 是模块级常量，注册时直接引用，不做转换。
2. 声明键集合固定为 `type`、`properties`、`required`、`additionalProperties`。
3. `z.toJSONSchema` 的原始输出必须通不过无损 JSON 校验，作为手写声明的理由记录在测试里。
4. 宿主升级后若能直接接受 zod 输出，删除 `ECHO_PARAMETERS` 与一致性测试，改为 `parameters: 投影`。
