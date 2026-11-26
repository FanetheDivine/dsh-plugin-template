---
description: "工具参数声明改为手写普通 JSON 并受 zod 类型约束的实施任务"
---

# Tasks: 工具参数声明的无损 JSON 与手写声明

**Input**: Design documents from `/specs/025-tool-params-lossless-json/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: 规格 FR-005 至 FR-009 要求测试，本次包含测试任务。

**Organization**: 按用户故事组织，每个阶段完成一个 commit。阶段顺序按依赖排列：依赖升级前置，文档后置。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 不同文件且无未完成依赖，可并行。
- **[Story]**: `US1` 至 `US5` 对应规格中的用户故事。
- 所有路径均相对于仓库根目录。

## Phase 1: Setup - 规格归档

**Purpose**: 固定范围、决策与验证方式。

- [x] T001 归档 `specs/025-tool-params-lossless-json/` 的规格、计划、研究、数据模型、快速验证与需求检查清单。

**Commit**: `docs(025): 工具参数声明无损 JSON 与 zod 示例规格`（已提交）

---

## Phase 2: User Story 4 - 宿主依赖对齐 0.2.2-rc.5 (Priority: P2)

**Goal**: 10 个 `@deepseek-ai/dsh-*` 依赖与排除表对齐 `0.2.2-rc.5`，后续改动在目标宿主版本上验证。

**Independent Test**: `tests/dependency-versions.test.ts` 通过，`pnpm install` 成功。

### Implementation for User Story 4

- [ ] T002 [US4] 把 `package.json` 的 10 个 `@deepseek-ai/dsh-*` 改为 `0.2.2-rc.5`。
- [ ] T003 [P] [US4] 把 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 10 条改为 `@<包名>@0.2.2-rc.5`。
- [ ] T004 [US4] 运行 `pnpm install` 更新 `pnpm-lock.yaml`，再运行 `pnpm test:code tests/dependency-versions.test.ts`；出现 rc.5 接口变化导致的类型错误时按 P-D-004 处理。

**Checkpoint**: 依赖一致，可在 rc.5 上继续。

---

## Phase 3: User Story 2 - 手写声明与 zod 投影保持一致 (Priority: P1) 🎯 MVP

**Goal**: `demo_echo` 的 `parameters` 是手写 JSON Schema 常量，受 `satisfies` 与两条类型断言约束；zod 只负责类型与校验。

**Independent Test**: `pnpm typecheck` 通过；手动改一处字面量后类型检查失败。

### Implementation for User Story 2

- [ ] T005 [US2] 改写 `src/demo-tool.ts`：
  - 保留 `echoArgsSchema`，新增 `export type EchoArgs = z.infer<typeof echoArgsSchema>`。
  - 新增映射类型 `RequiredKeys<T>`、`JsonSchemaOf<T>`、`ParametersSchemaOf<T>`、`Assert<T>`、`Equal<A, B>`。
  - 新增 `export const ECHO_PARAMETERS`，内容为 `type: 'object'`、`properties.text`（`type: 'string'`、`minLength: 1`、`description: '要回显的文本'`）、`required: ['text']`、`additionalProperties: false`，用 `as const satisfies ParametersSchemaOf<EchoArgs>`。
  - 新增两条类型断言：必填键集合、属性键集合与 `EchoArgs` 相等。
  - `buildDemoTool` 的 `parameters` 改用 `ECHO_PARAMETERS`。
- [ ] T006 [US2] 更新 `tests/plugin.test.ts` 的声明断言为 JSON Schema 根对象，保留工具行为断言。
- [ ] T007 [US2] 运行 `pnpm typecheck`；按 [quickstart.md](./quickstart.md) S3 制造三处漂移确认失败后改回。

**Checkpoint**: 声明形态与类型约束就位；完成后提交 `feat(025): 手写工具声明并受 zod 类型约束`。

---

## Phase 4: User Story 3 - 测试按宿主规则拦截不合规声明 (Priority: P2)

**Goal**: 校验函数按宿主规则判断无损 JSON；全部已注册工具的声明通过校验；手写声明与 zod 投影一致。

**Independent Test**: 校验函数对含不可枚举键的声明失败，对 `ECHO_PARAMETERS` 通过并返回深拷贝。

### Implementation for User Story 3

- [ ] T008 [P] [US3] 新增 `tests/support/lossless-json.ts`：导出按宿主规则校验的函数，递归检查值域（拒绝 `NaN`、`Infinity`、`-0`）、对象原型（`null` 或 `Object.prototype`）、键可枚举且为字符串、数组原型与连续性、循环引用；通过时返回深拷贝，失败时抛出含路径的 `Error`。
- [ ] T009 [US3] 新增 `tests/tool-schema.test.ts`：
  - 经 `apply` 的真实注册入口校验全部已注册工具的 `parameters`。
  - 断言 `ECHO_PARAMETERS` 与 `z.toJSONSchema(echoArgsSchema)` 剔除 `$schema` 与 `~standard` 后结构相等。
  - 断言 `z.toJSONSchema` 的原始输出未通过校验，注释说明宿主限制与升级后的简化方式。
  - 覆盖 FR-009 列出的非法值。
- [ ] T010 [US3] 运行 `pnpm test:code`，按 [quickstart.md](./quickstart.md) S2、S4、S5、S6 核对。

**Checkpoint**: 漂移与非法声明都会被测试拦住；完成后提交 `test(025): 工具声明校验与一致性测试`。

---

## Phase 5: User Story 1 - 文档说明工具声明的约定 (Priority: P1)

**Goal**: 开发者按 `docs/how-it-works.md` 能写出符合约定的声明。

**Independent Test**: 阅读「参数声明」小节，规则、报错、触发路径与写法与代码一致。

### Implementation for User Story 1

- [ ] T011 [US1] 改写 `docs/how-it-works.md` 的「参数声明」小节：
  - 保留无损 JSON 的判定规则、报错信息与 `better-mcp` 触发路径。
  - 写法改为：zod 声明类型与校验，`parameters` 手写并以 `as const satisfies` 约束，一致性由测试保证。
  - 说明当前写法存在的原因（zod 输出带不可枚举 `~standard`），以及宿主能直接接受 zod 输出后的简化方式。

**Checkpoint**: 文档与代码一致；完成后提交 `docs(025): 参数声明写法说明`。

---

## Phase 6: User Story 5 - 宿主升级时可核对该约定能否简化 (Priority: P3)

**Goal**: 维护者升级宿主时有可执行的核对项。

**Independent Test**: `docs/development.md` 的「依赖升级」小节含核对项与简化步骤。

### Implementation for User Story 5

- [ ] T012 [US5] 在 `docs/development.md` 新增「依赖升级」小节：升级 `@deepseek-ai/dsh-*` 的同步要求（链接宪章原则 I）、升级后提醒实机测试、核对宿主能否直接接受 `z.toJSONSchema` 输出并能接受时的简化步骤。
- [ ] T013 [P] [US5] 在 `docs/development.md` 的测试表补充 `tests/tool-schema.test.ts` 与 `tests/support/lossless-json.ts`。

**Checkpoint**: 升级有据可依；完成后提交 `docs(025): 依赖升级核对项`。

---

## Phase 7: Polish - 收尾

- [ ] T014 在 `CHANGELOG.md` 记录声明写法、测试与依赖升级。
- [ ] T015 运行 `pnpm format && pnpm full-check`，按 [quickstart.md](./quickstart.md) 核对全部场景。
- [ ] T016 提醒用户按 `0.2.2-rc.5` 执行实机测试。

**Commit**: 完成后提交 `chore(025): 变更记录与全量校验`。

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**：已完成。
- **Phase 2 (US4)**：无依赖，必须最先执行，后续阶段在 rc.5 上验证。
- **Phase 3 (US2)**：依赖 Phase 2。
- **Phase 4 (US3)**：依赖 Phase 3 的 `ECHO_PARAMETERS` 与 `EchoArgs`。
- **Phase 5 (US1)**：依赖 Phase 3、Phase 4，文档按最终代码写。
- **Phase 6 (US5)**：与 Phase 5 无文件冲突，可并行。
- **Phase 7**：依赖全部阶段。

### Within Each Phase

- T002 与 T003 改不同文件，可并行；T004 依赖两者。
- T008 与 T005 改不同文件；T009 依赖 T005、T008。
- T012 与 T013 同文件不同小节，串行执行。

### Parallel Opportunities

- Phase 2：T002 与 T003。
- Phase 5 与 Phase 6：不同文档，可并行。

## Implementation Strategy

### MVP First

Phase 3 完成即得到手写声明与类型约束，工具行为不变。

### Incremental Delivery

1. Phase 2 升级依赖。
2. Phase 3 落地声明与类型约束。
3. Phase 4 补齐测试。
4. Phase 5、Phase 6 更新文档。
5. Phase 7 收尾并全量校验。

## Notes

- 提交 `4427571` 的「参数声明」小节描述的是旧的 zod 转换写法，Phase 5 覆盖它。
- 不新增依赖；校验函数只在测试侧使用。
- 发布路径不含 zod 转声明的运行时逻辑。
