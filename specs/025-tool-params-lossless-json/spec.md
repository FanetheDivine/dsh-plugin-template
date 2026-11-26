# Feature Specification: 工具参数声明的无损 JSON 约定与手写声明

**Feature Branch**: `docs/025-tool-params-lossless-json`

**Created**: 2026-11-26

**Status**: Approved

**Change Category**: 模板变更

**Input**: User description: "参考 dsh-plugin-lark-bridge 最新的 spec（064，缺陷修复），更新模板中工具定义相关的文档；要走 spec 流程；依赖升级到 0.2.2-rc.5；zod 写类型与校验，工具声明用手写普通 JSON，用 TS 的 satisfies 与测试保证与 zod 投影一致；为后续 dsh 升级留下检查点。"

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
- [D-007] Q: 工具声明怎么产出？ -> A: zod schema 只负责参数类型与运行时校验；`parameters` 是手写的普通 JSON Schema 常量，用 `as const satisfies` 在类型层与 zod 推出的参数类型对齐。
- [D-008] Q: 手写声明与 zod 投影的一致性怎么保证？ -> A: 测试断言手写声明等于 `z.toJSONSchema` 的输出剔除 `$schema` 与不可枚举的 `~standard` 键；`required` 列表的精确性由一条类型断言补充。
- [D-009] Q: 「宿主升级时检查能否接受 zod 直接产出」记在哪里？ -> A: `docs/development.md` 新增「依赖升级」小节放核对项，`docs/how-it-works.md` 的参数声明小节说明当前写法与简化条件。
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
2. **Given** 开发者想用 zod 生成声明，**When** 阅读文档，**Then** 知道 zod 的输出带不可枚举的 `~standard` 键、当前改用手写声明加类型约束，并能在模板里找到示例与升级核对项。

---

### User Story 2 - 手写声明与 zod 投影保持一致 (Priority: P1)

模板里 `demo_echo` 用 zod schema 声明参数类型并校验，交给宿主的 `parameters` 是手写的普通 JSON Schema 常量；类型约束与测试保证它与 zod 的投影一致，两边不会漂移。

**Why this priority**: 开发者复制模板示例，示例本身必须是正确且不易退化的写法。

**Independent Test**: 读取注册后的工具声明，断言结构与键；对同一 zod schema 的投影做深比较；用合法与非法参数各调用一次。

**Acceptance Scenarios**:

1. **Given** 插件已注册 `demo_echo`，**When** 读取其 `parameters`，**Then** 它是手写的 JSON Schema 根对象，不含 `$schema` 与 `~standard`。
2. **Given** 手写声明与 `z.toJSONSchema` 的投影，**When** 比较两者（剔除 `$schema` 与 `~standard`），**Then** 结构完全相等。
3. **Given** 手写声明改了属性类型、删了必填项或加了多余属性，**When** 运行类型检查，**Then** `satisfies` 约束失败。
4. **Given** 模型传入合法参数，**When** 调用执行，**Then** 行为与现状一致。
5. **Given** 模型传入非法参数，**When** 调用执行，**Then** 返回参数不合法的提示。

---

### User Story 3 - 测试按宿主规则拦截不合规声明 (Priority: P2)

维护者新增或修改工具声明时，测试按宿主的无损 JSON 规则校验全部已注册工具，越界写法在提交前失败。

**Why this priority**: 人工审查容易漏掉不可枚举键。

**Independent Test**: 对含不可枚举键的声明运行校验，断言失败并指出路径；对示例声明运行校验，断言通过且返回独立的深拷贝。

**Acceptance Scenarios**:

1. **Given** 声明含不可枚举键，**When** 运行校验，**Then** 校验失败并指出键路径。
2. **Given** 声明是纯 JSON，**When** 运行校验，**Then** 返回深拷贝，修改副本不影响原始声明。
3. **Given** `z.toJSONSchema` 原样输出，**When** 运行校验，**Then** 校验失败，记录改用手写声明的原因。

---

### User Story 4 - 宿主依赖对齐 0.2.2-rc.5 (Priority: P2)

模板的 `@deepseek-ai/dsh-*` 依赖与 `minimumReleaseAgeExclude` 对齐 `0.2.2-rc.5`，与 lark-bridge 文档所依据的宿主版本一致。

**Why this priority**: 文档中的宿主规则以该版本为准。

**Independent Test**: `tests/dependency-versions.test.ts` 通过，`pnpm install` 成功，`pnpm full-check` 通过。

**Acceptance Scenarios**:

1. **Given** 升级完成，**When** 检查 `package.json` 与 `pnpm-workspace.yaml`，**Then** 全部 `dsh-*` 为同一确切版本 `0.2.2-rc.5`。
2. **Given** 升级完成，**When** 运行 `pnpm full-check`，**Then** 类型、lint、测试与构建通过。

### User Story 5 - 宿主升级时可核对该约定能否简化 (Priority: P3)

维护者升级 `@deepseek-ai/dsh` 时，按开发文档的核对项检查宿主是否已能直接接受 zod 的输出；能接受则删除手写声明与一致性测试，改回直接使用 zod 产出。

**Why this priority**: 手写声明是为绕过当前宿主限制付出的维护成本，限制解除后应当回收。

**Independent Test**: 打开 `docs/development.md` 的「依赖升级」小节，读到核对项与简化步骤。

**Acceptance Scenarios**:

1. **Given** 维护者升级宿主依赖，**When** 阅读开发文档，**Then** 找到「检查宿主能否直接接受 zod 输出」的核对项。
2. **Given** 宿主已能接受 zod 输出，**When** 按文档简化，**Then** 删除手写声明与一致性测试，工具行为不变。

### Edge Cases

- zod 升级后 `~standard` 变为可枚举键：声明多出该键，测试 MUST 能发现。
- 换用其他 schema 库生成声明：同样 MUST 满足无损 JSON 规则。
- 嵌套对象携带不可枚举键：校验 MUST 递归。
- 数字 `-0`、`NaN`、`Infinity`、循环引用、非原生原型：校验 MUST 拒绝。
- 升级后宿主类型有变化导致类型检查失败：按实际错误修正，不扩大到其他功能。
- zod 升级改变投影（字段顺序、新增注解）：一致性测试失败，按 zod 新投影更新手写声明。
- 新增可选参数：`required` 与属性键的类型断言同时提示更新。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `docs/how-it-works.md` MUST 说明 `parameters` 是无损 JSON，含判定规则、报错信息、触发路径与当前写法（手写声明加类型约束），并与示例代码一致。
- **FR-002**: `demo_echo` 的参数类型与运行时校验 MUST 由 `src/demo-tool.ts` 的 zod schema 唯一提供。
- **FR-003**: `demo_echo` 的 `parameters` MUST 是手写的普通 JSON Schema 常量，源码里用 `as const satisfies` 受类型约束。
- **FR-004**: 类型约束 MUST 覆盖属性键集合、属性值类型与必填键集合；任一漂移 MUST 让类型检查失败。
- **FR-005**: 测试 MUST 断言手写声明与 `z.toJSONSchema` 的投影剔除 `$schema` 与 `~standard` 后结构相等。
- **FR-006**: `demo_echo` 的声明 MUST 通过无损 JSON 校验；`z.toJSONSchema` 的原始输出 MUST 校验失败，作为手写声明的理由记录在测试里。
- **FR-007**: `tests/support/lossless-json.ts` MUST 提供按宿主规则校验的复用函数：递归检查值域、原型、键可枚举性、数组稠密度与循环引用，通过时返回深拷贝，失败时抛出含路径的错误。
- **FR-008**: `tests/tool-schema.test.ts` MUST 经真实注册入口收集全部已注册工具并逐个校验声明。
- **FR-009**: 校验函数的测试 MUST 覆盖不可枚举键、嵌套不可枚举键、`NaN`、`Infinity`、`-0`、循环引用、非原生原型、稀疏数组与数组附加属性。
- **FR-010**: `docs/development.md` MUST 新增「依赖升级」小节，含「检查宿主能否直接接受 zod 输出」的核对项与简化步骤。
- **FR-011**: `docs/development.md` 的测试表 MUST 列出新增的测试文件与支撑文件。
- **FR-012**: 全部 `@deepseek-ai/dsh-*` 依赖 MUST 锁定 `0.2.2-rc.5`，并以同版本列入 `minimumReleaseAgeExclude`；`pnpm-lock.yaml` 同步更新。
- **FR-013**: README 的功能描述 MUST 与 `demo_echo` 的用户可见行为保持一致。
- **FR-014**: `CHANGELOG.md` MUST 记录本次变更，包括依赖升级。
- **FR-015**: 升级后 MUST 提醒用户按 `0.2.2-rc.5` 执行实机测试。
- **FR-016**: `docs/known-risks.md` MUST 保持不变。

### Key Entities

- **工具声明参数**：注册时交给宿主的 `parameters`，模型可见的 JSON Schema；手写常量，受类型约束。
- **zod 投影**：`z.toJSONSchema` 对参数 schema 的输出，剔除 `$schema` 与 `~standard` 后与手写声明逐字段相等。
- **无损 JSON 校验**：宿主克隆声明的判定规则；测试侧实现等价函数。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 手写声明的属性类型、属性键、必填键任一被改动而 zod schema 未同步时，`pnpm typecheck` 失败。
- **SC-002**: 一致性测试在 `z.toJSONSchema` 的投影与手写声明不一致时失败。
- **SC-003**: 校验函数对含不可枚举 `~standard` 键的声明返回失败，对 `demo_echo` 的声明返回深拷贝并通过。
- **SC-004**: 全部已注册工具的声明在一次校验中全部通过。
- **SC-005**: `pnpm full-check` 通过。
- **SC-006**: `package.json` 中全部 `@deepseek-ai/dsh-*` 版本为 `0.2.2-rc.5`，`tests/dependency-versions.test.ts` 通过。

## Assumptions

- 宿主无损 JSON 规则以 `@deepseek-ai/dsh-tools@0.2.2-rc.5` 的 `snapshotJsonValue` 为准，规则来自 lark-bridge 064 的研究记录。
- `cordis`、`cordis-plugin-loader`、`schemastery` 的声明与 `0.2.2-rc.5` 一致，无需变更。
- 模板的 `zod` 版本 `4.6.6` 保持不变。
- 不做实机测试；风险是宿主行为与单测规则不再等价时无法发现，由用户按 `0.2.2-rc.5` 自行执行实机测试覆盖。
- 手写声明是当前宿主限制下的写法；宿主能直接接受 zod 输出后，手写声明与一致性测试将被删除。
