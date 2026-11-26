# Research: 工具参数声明的无损 JSON 与 zod 示例

## R-01 宿主判定无损 JSON 的实现

**Decision**: 以 `@deepseek-ai/dsh-util-values@0.2.2-rc.5` 的 `walkJsonValue(value, true)` 为唯一规则来源，测试侧实现等价校验。

**Rationale**: `projectToolSchema(definition, true)` 调用 `snapshotJsonValue`；返回 `undefined` 时抛出 `tool "<name>" parameters must be lossless JSON before schema projection`。规则逐条为：

- 值域：`null`、布尔、字符串、有限数字；`Object.is(value, -0)` 为真时拒绝。
- 数组：原型必须是 `Array.prototype`；`Reflect.ownKeys(array).length` 必须等于 `length + 1`，即除 `length` 外只有连续下标。
- 对象：原型是 `null` 或 `Object.prototype`；全部自有键都是可枚举的字符串键。
- 引用：同一路径上重复出现即视为循环，拒绝；不同分支共享同一对象可通过。

**Alternatives considered**: 用 `JSON.stringify` 往返。它接受不可枚举键与 `-0`，与该规则不等价。

## R-02 `z.toJSONSchema` 的输出形状

**Decision**: 在仓库内实测 zod `4.6.6`：返回对象的 `Reflect.ownKeys` 为 `$schema`、`type`、`properties`、`required`、`additionalProperties`、`~standard`；其中 `~standard` 不可枚举，`Object.keys` 看不到它。

**Rationale**: 展开复制 `const { $schema: _schema, ...rest } = json` 后，`Reflect.ownKeys` 只剩四个可枚举键，满足 R-01 的键规则。

**zod 无法直接产出合规声明**：`v4/core/to-json-schema.js` 的 `finalize()` 在返回前无条件 `Object.defineProperty(finalized, "~standard", { enumerable: false, writable: false })`；实测描述符的 `configurable` 为 `false`，`delete` 抛 `TypeError`。`toJSONSchema` 的参数只有 `target`、`io`、`metadata`、`override`、`unrepresentable` 等，没有跳过该键的开关。Standard Schema 的 `schema['~standard'].jsonSchema.output()` 走同一个 `finalize()`，输出同样带该键。复制因此是必需步骤。

**Alternatives considered**: `JSON.parse(JSON.stringify(json))` 同样可用，但读不出剔除 `$schema` 的意图；`delete` 因属性不可配置而失败。

## R-03 宿主注册阶段不校验参数声明

**Decision**: 缺陷只能在声明生成处修复，测试必须直接校验声明，而不是等待注册报错。

**Rationale**: `ToolsService.register` 只校验 `output.schema`、`timeoutMs` 与保留名 `run_code`；`parameters` 原样存入注册表。`apply` 的模拟 ctx 也不校验。

**Alternatives considered**: 在插件内包一层注册校验。它不影响宿主行为，只会增加模板复杂度。

## R-04 `demo_echo` 的声明产出方式

**Decision**: zod schema 只负责参数类型与运行时校验；`parameters` 是手写的普通 JSON Schema 常量，用 `as const satisfies ParametersSchemaOf<EchoArgs>` 受类型约束。

**Rationale**:

- `ToolDefinition.parameters` 在 `@deepseek-ai/dsh-llm` 的类型是 `Record<string, unknown>`，注释为「JSON Schema object for the arguments」；模板当前传入属性映射 `{ text: { … } }`，模型看到的参数表缺少 `type: object` 与 `properties` 包裹。
- 宿主拒绝 zod 的直接输出（R-02），手写声明让发布路径不含任何转换与剔除逻辑。
- zod 仍是类型的唯一来源：`z.infer` 推出参数类型，`satisfies` 把手写声明钉到该类型上。

**Alternatives considered**:

- 运行时用 `z.toJSONSchema` 转换（lark-bridge 的做法）。它需要在发布代码里复制并剔除键，且宿主限制解除前一直保留这段逻辑。
- 用 `z.toJSONSchema(schema).properties` 拼回属性映射。它偏离宿主约定，也仍依赖 zod 输出。

## R-05 依赖对齐

**Decision**: 10 个 `@deepseek-ai/dsh-*` 依赖一并升到 `0.2.2-rc.5`，`pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 同步为同版本前缀。

**Rationale**: 宪章原则 I 要求 `dsh-*` 锁定同一确切版本，并以 `<包名>@<版本>` 列入排除表。`npm view` 已确认 10 个包在 `0.2.2-rc.5` 均有发布。`@deepseek-ai/dsh@0.2.2-rc.5` 声明的 `cordis` 为 `~4.1.0`、`cordis-plugin-loader` 为 `~1.1.0`、`schemastery` 为 `~3.19.0`，与模板现有声明一致，无需变更。

**Alternatives considered**: 只升部分包。`tests/dependency-versions.test.ts` 会失败。

## R-06 测试覆盖入口

**Decision**: 经 `apply` 的真实注册入口收集已注册工具，即 `makeCtx()._registeredTools`。

**Rationale**: `tests/helpers.ts` 的 `makeCtx` 已记录 `tools.register` 的入参，`tests/plugin.test.ts` 也据此断言。直接构造工具会漏掉注册条件。

**Alternatives considered**: 只断言 `buildDemoTool` 的返回值。它不覆盖 `apply` 的接线。

## R-07 验证方式

**Decision**: 运行 `pnpm format && pnpm full-check`，不启动宿主。

**Rationale**: `full-check` 含类型、lint、`code` 项目测试、构建与 `dist` 项目测试，覆盖本次改动面。规格 D-005 决定不做实机测试，风险记入 Review Record。

**Alternatives considered**: 只跑 `pnpm check`。它不构建产物，包内容与前端注册契约得不到验证。
## R-08 类型约束能拦住哪些漂移

**Decision**: 用 `satisfies` 加两条类型断言，覆盖属性值类型、属性键集合与必填键集合。

**Rationale**: 仓库内实测（`tsc --strict`）：

- `satisfies` 拦住属性值类型错误、缺失 `required`、多余属性，各 1 处编译错误。
- `required: []` 能通过 `satisfies`，因此另加 `Assert<Equal<(typeof P)['required'][number], RequiredKeys<EchoArgs>>>` 与 `Assert<Equal<keyof (typeof P)['properties'], keyof EchoArgs>>` 两条断言。

映射类型 `JsonSchemaOf<T>` 只覆盖模板用到的节点（`string`、`number`、`boolean`、数组、对象），新参数类型不在其中时需扩展映射。

**Alternatives considered**: 只用 `satisfies Record<string, unknown>`。它只保证是对象，不提供任何约束。

## R-09 与 zod 投影的一致性由测试保证

**Decision**: `tests/tool-schema.test.ts` 断言手写声明等于 `z.toJSONSchema(echoArgsSchema)` 剔除 `$schema` 与 `~standard` 后的结果。

**Rationale**: 类型层只能约束 `z.infer` 推得出的部分；`minLength`、`description`、`additionalProperties` 这类注解只有在值与 zod 投影比较时才能发现漂移。zod 升级改变投影时该测试先失败。

**Alternatives considered**: 只靠类型约束。它看不到注解字段的漂移。

## R-10 宿主升级的核对点

**Decision**: `docs/development.md` 新增「依赖升级」小节，核对宿主能否直接接受 zod 输出；`docs/how-it-works.md` 的参数声明小节说明现状与简化条件。

**Rationale**: 手写声明是绕过当前限制的成本，需要一条可执行的回收路径。宪章原则 III 要求机制归 `how-it-works.md`、维护流程归 `docs/development.md`，两处各写各的归属内容。

**Alternatives considered**: 只写在测试注释里。维护者升级依赖时不会翻测试。

