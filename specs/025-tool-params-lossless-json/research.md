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

## R-04 `demo_echo` 的声明形态

**Decision**: 用 `z.toJSONSchema` 生成 JSON Schema 根对象，展开复制剔除 `$schema`。

**Rationale**: `ToolDefinition.parameters` 在 `@deepseek-ai/dsh-llm` 的类型是 `Record<string, unknown>`，注释为「JSON Schema object for the arguments」；`defineTool` 才接受属性映射并编译成根对象。模板当前传入属性映射 `{ text: { … } }`，模型看到的参数表缺少 `type: object` 与 `properties` 包裹。改用根对象同时修正现有形态与示例写法。

**Alternatives considered**: 用 `z.toJSONSchema(schema).properties` 取回属性映射。它偏离宿主约定，且与 lark-bridge 的示例不一致。

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
