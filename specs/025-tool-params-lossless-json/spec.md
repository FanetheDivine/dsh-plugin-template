# Feature Specification: 工具参数声明的无损 JSON 约定与 zod 示例

**Feature Branch**: `docs/025-tool-params-lossless-json`

**Created**: 2026-11-26

**Status**: Approved

**Change Category**: 模板变更

**Input**: User description: "参考 dsh-plugin-lark-bridge 最新的 spec（064，缺陷修复），更新模板中工具定义相关的文档；要走 spec 流程；依赖升级到 0.2.2-rc.5；给出用 zod 的示例和对应的测试文件。"

## Open Decisions

None.

## Clarifications

### Session 2026-11-26

- [D-000] Exploration: lark-bridge 最新 spec 为 `064-tool-params-lossless-json`（缺陷修复）。宿主把工具声明的 `parameters` 当作无损 JSON 克隆；`z.toJSONSchema` 的返回值带不可枚举的 `~standard` 键，克隆失败后抛 `parameters must be lossless JSON`，`dsh-plugin-better-mcp` 每步枚举声明，未捕获的异常终止 DSH 进程。
- [D-000] Exploration: 模板 `src/demo-tool.ts` 用字面量声明 `parameters`，不含 zod 转换产物，不触发该缺陷。模板当前没有 zod 生成声明的示例与对应测试。
- [D-000] Exploration: 宿主 `ToolDefinition.parameters` 的类型是 `Record<string, unknown>`，注释为「JSON Schema object for the arguments」；`defineTool` 才接受属性映射并编译成 JSON Schema。模板 `demo_echo` 的 `parameters` 是属性映射 `{ text: { … } }`。
- [D-000] Exploration: 模板依赖 `@deepseek-ai/dsh-*` 当前锁定 `0.2.2-rc.3`；`0.2.2-rc.5` 已发布，其 `cordis`、`schemastery`、`cordis-plugin-loader` 的版本范围与模板现有声明一致。
- [D-001] Q: zod 示例放在哪里？ -> A: 改造 `demo_echo`，用 zod schema 同时做参数校验与声明生成。
- [D-004] Q: 依赖升级到 0.2.2-rc.5 的范围？ -> A: 全部 `@deepseek-ai/dsh-*` 依赖升级，并同步 `minimumReleaseAgeExclude`。
- [D-006] Q: 是否在 `docs/known-risks.md` 记录该宿主限制？ -> A: 不记录，规则归属 `docs/how-it-works.md`。
- [D-002] Q: `demo_echo` 改造后声明的形态？ -> A: 改为 JSON Schema 根对象，与宿主 `ToolDefinition.parameters` 的约定一致，同时修正现有属性映射形态。
- [D-003] Q: 测试文件的范围？ -> A: 照 lark-bridge：`tests/support/lossless-json.ts` 提供校验函数，`tests/tool-schema.test.ts` 校验全部已注册工具，并更新 `tests/plugin.test.ts` 的声明断言。
- [D-005] Q: 升级后的验证方式？ -> A: 不做实机测试，以 `pnpm full-check` 为准；结束时提醒用户按 `0.2.2-rc.5` 自行执行实机测试。
- [D-000] Exploration: 提交 `4427571` 已在 `docs/how-it-works.md` 增加「参数声明」小节并在 `CHANGELOG.md` 记录。

## Review Record

- 2026-11-26 | Decision: Approved | Scope: current full document | Open items: none | Risks: 不做实机测试，需用户按 `0.2.2-rc.5` 自行执行；单测规则以 lark-bridge 064 记录的 rc.5 `snapshotJsonValue` 为准，与宿主的完全等价未在宿主上验证。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 文档说明工具声明的无损 JSON 约定 (Priority: P1)

开发者按 `docs/how-it-works.md` 编写工具时，读到 `parameters` 必须是宿主可克隆的无损 JSON，以及用 zod 生成声明的写法。

**Why this priority**: 违反该约定会让宿主在枚举声明时抛出未捕获的异常并终止进程，注册阶段没有任何提示。

**Independent Test**: 阅读 `docs/how-it-works.md` 的「参数声明」小节，确认含规则、报错信息、触发路径与 zod 写法，且与示例代码一致。

**Acceptance Scenarios**:

1. **Given** 开发者要给工具生成参数声明，**When** 阅读文档，**Then** 知道声明 MUST 是无损 JSON 及其判定规则。
2. **Given** 开发者使用 `z.toJSONSchema`，**When** 阅读文档，**Then** 知道需要展开复制以剔除不可枚举的 `~standard` 键，并能在模板里找到示例。

---

### User Story 2 - 模板提供用 zod 生成声明的示例 (Priority: P1)

模板里有一个工具，用 zod schema 同时完成参数校验与声明生成，声明通过宿主的无损 JSON 校验。

**Why this priority**: 开发者复制模板示例，示例本身必须是正确的写法。

**Independent Test**: 读取注册后的工具声明，断言结构与键；用合法与非法参数各调用一次。

**Acceptance Scenarios**:

1. **Given** 插件已注册 `demo_echo`，**When** 读取其 `parameters`，**Then** 它是无损 JSON 的 JSON Schema 根对象，且不含 `$schema` 与 `~standard`。
2. **Given** 模型传入合法参数，**When** 调用执行，**Then** 行为与现状一致。
3. **Given** 模型传入非法参数，**When** 调用执行，**Then** 返回参数不合法的提示。

---

### User Story 3 - 测试按宿主规则拦截不合规声明 (Priority: P2)

维护者新增或修改工具声明时，测试按宿主的无损 JSON 规则校验全部已注册工具，越界写法在提交前失败。

**Why this priority**: 人工审查容易漏掉不可枚举键。

**Independent Test**: 对含不可枚举键的声明运行校验，断言失败并指出路径；对示例声明运行校验，断言通过且返回独立的深拷贝。

**Acceptance Scenarios**:

1. **Given** 声明含不可枚举键，**When** 运行校验，**Then** 校验失败并指出键路径。
2. **Given** 声明是纯 JSON，**When** 运行校验，**Then** 返回深拷贝，修改副本不影响原始声明。
3. **Given** `z.toJSONSchema` 原样输出，**When** 运行校验，**Then** 校验失败，证明展开复制是必要的。

---

### User Story 4 - 宿主依赖对齐 0.2.2-rc.5 (Priority: P2)

模板的 `@deepseek-ai/dsh-*` 依赖与 `minimumReleaseAgeExclude` 对齐 `0.2.2-rc.5`，与 lark-bridge 文档所依据的宿主版本一致。

**Why this priority**: 文档中的宿主规则以该版本为准。

**Independent Test**: `tests/dependency-versions.test.ts` 通过，`pnpm install` 成功，`pnpm full-check` 通过。

**Acceptance Scenarios**:

1. **Given** 升级完成，**When** 检查 `package.json` 与 `pnpm-workspace.yaml`，**Then** 全部 `dsh-*` 为同一确切版本 `0.2.2-rc.5`。
2. **Given** 升级完成，**When** 运行 `pnpm full-check`，**Then** 类型、lint、测试与构建通过。

### Edge Cases

- zod 升级后 `~standard` 变为可枚举键：声明多出该键，测试 MUST 能发现。
- 换用其他 schema 库生成声明：同样 MUST 满足无损 JSON 规则。
- 嵌套对象携带不可枚举键：校验 MUST 递归。
- 数字 `-0`、`NaN`、`Infinity`、循环引用、非原生原型：校验 MUST 拒绝。
- 升级后宿主类型有变化导致类型检查失败：按实际错误修正，不扩大到其他功能。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `docs/how-it-works.md` MUST 说明 `parameters` 是无损 JSON，含判定规则、报错信息、触发路径与 zod 写法，并与示例代码一致。
- **FR-002**: `demo_echo` 的 `parameters` MUST 由 zod schema 经 `z.toJSONSchema` 生成，展开复制并剔除 `$schema`，结果不含 `~standard`。
- **FR-003**: `demo_echo` 的 `parameters` MUST 是 JSON Schema 根对象：`type` 为 `object`，`properties` 含 `text`，`required` 含 `text`。
- **FR-004**: `demo_echo` 的参数校验、回显格式与失败提示 MUST 保持现状，校验与声明共用同一个 zod schema。
- **FR-005**: `tests/support/lossless-json.ts` MUST 提供按宿主规则校验的复用函数：递归检查值域、原型、键可枚举性、数组稠密度与循环引用，通过时返回深拷贝，失败时抛出含路径的错误。
- **FR-006**: `tests/tool-schema.test.ts` MUST 经真实注册入口收集全部已注册工具并逐个校验声明。
- **FR-007**: 测试 MUST 证明 `z.toJSONSchema` 的原始输出不合规，`demo_echo` 的声明合规，且校验函数对非法值（不可枚举键、嵌套不可枚举键、`NaN`、`Infinity`、`-0`、循环引用、非原生原型、稀疏数组）失败。
- **FR-008**: `tests/plugin.test.ts` 的声明断言 MUST 更新为新的声明形态。
- **FR-009**: 全部 `@deepseek-ai/dsh-*` 依赖 MUST 锁定 `0.2.2-rc.5`，并以同版本列入 `minimumReleaseAgeExclude`；`pnpm-lock.yaml` 同步更新。
- **FR-010**: `docs/development.md` 的测试表 MUST 列出新增的测试文件与支撑文件。
- **FR-011**: README 的功能描述 MUST 与 `demo_echo` 的用户可见行为保持一致。
- **FR-012**: `CHANGELOG.md` MUST 记录本次变更，包括依赖升级。
- **FR-013**: 升级后 MUST 提醒用户按 `0.2.2-rc.5` 执行实机测试。
- **FR-014**: `docs/known-risks.md` MUST 保持不变。

### Key Entities

- **工具声明参数**：注册时交给宿主的 `parameters`，模型可见的 JSON Schema。
- **无损 JSON 校验**：宿主克隆声明的判定规则；测试侧实现等价函数。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 校验函数对含不可枚举 `~standard` 键的声明返回失败，对示例声明返回深拷贝并通过。
- **SC-002**: 全部已注册工具的声明在一次校验中全部通过。
- **SC-003**: `pnpm full-check` 通过，新增测试在 `demo_echo` 声明回退为未剔除 `~standard` 的写法时失败。
- **SC-004**: `package.json` 中全部 `@deepseek-ai/dsh-*` 版本为 `0.2.2-rc.5`，`tests/dependency-versions.test.ts` 通过。

## Assumptions

- 宿主无损 JSON 规则以 `@deepseek-ai/dsh-tools@0.2.2-rc.5` 的 `snapshotJsonValue` 为准，规则来自 lark-bridge 064 的研究记录。
- `cordis`、`cordis-plugin-loader`、`schemastery` 的声明与 `0.2.2-rc.5` 一致，无需变更。
- 模板的 `zod` 版本 `4.6.6` 保持不变。
- 不做实机测试；风险是宿主行为与单测规则不再等价时无法发现，由用户按 `0.2.2-rc.5` 自行执行实机测试覆盖。
