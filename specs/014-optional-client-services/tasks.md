# Tasks: 前端服务可选

**Input**: `specs/014-optional-client-services/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/client-entry.md](./contracts/client-entry.md)

**Tests**: 宪章原则 IV 要求，包含测试任务。

**Organization**: 按用户故事分组；每个阶段对应一个 commit。

## Phase 1: Setup

- [ ] T001 在 worktree 根目录运行 `pnpm install`，确认 `pnpm check` 在改动前通过

---

## Phase 2: Foundational

**Purpose**: 测试辅助能表达服务的可用性变化，所有用户故事的测试依赖它。

- [ ] T002 修改 `tests/helpers.ts` 的 `makeClientCtx`：增加 `inject(deps, cb)`，记录依赖组到 `_injectGroups`；增加 `_grant(...names)` 与 `_revoke(...names)` 控制可用服务；`inject` 在依赖全部可用时执行 `cb(ctx)`，依赖被撤掉时执行其清理，重新就绪时再次执行
- [ ] T003 修改 `tests/helpers.ts`：`makeClientCtx` 接受 `{ services }` 选项指定初始可用服务，默认三项全部可用；`ctx.locale`、`ctx.slots`、`ctx.configForms` 在服务不可用时访问抛 `cannot get required service`，与 cordis 行为一致

**Checkpoint**: 现有 `tests/client.test.ts` 仍可运行（默认全部可用）。

---

## Phase 3: User Story 1 - 缺少部分前端服务时插件仍能启用 (Priority: P1) 🎯 MVP

**Goal**: 任一前端服务缺失，`apply` 不抛错，依赖已就绪服务的功能照常注册。

**Independent Test**: `pnpm run test:code -- tests/client.test.ts`，8 种服务组合的断言通过。

### Tests

- [ ] T004 [US1] 修改 `tests/client.test.ts`：把“声明实际使用的客户端服务”改为断言前端入口不导出 `inject`，并断言三组依赖为 `['locale']`、`['slots', 'locale']`、`['slots', 'locale', 'configForms']`
- [ ] T005 [US1] 修改 `tests/client.test.ts`：增加 8 种服务组合用例，断言 `apply` 不抛错，字典、示例行、配置页的注册与服务可用性一一对应（FR-001、FR-002、SC-001）
- [ ] T006 [US1] 修改 `tests/client.test.ts`：保留“三服务就绪时的注册内容与现状一致”用例（FR-005）

### Implementation

- [ ] T007 [US1] 修改 `src/client/index.ts`：删除 `export const inject`；`apply` 内用 `ctx.inject(['locale'], ...)` 注册字典，`ctx.inject(['slots', 'locale'], ...)` 注册示例行，`ctx.inject(['slots', 'locale', 'configForms'], ...)` 构造 `PluginConfigForm` 并注册配置页；文件顶部注释同步

**Checkpoint**: US1 测试通过，三服务就绪时行为不变。

---

## Phase 4: User Story 2 - 服务晚于插件就绪时功能自动补齐 (Priority: P2)

**Goal**: 服务晚到时功能自动注册，撤掉时清理，无重复注册。

**Independent Test**: 先无 `configForms` 启用，再 `_grant('configForms')`，配置页出现；`_revoke` 后表单订阅数归零。

- [ ] T008 [US2] 修改 `tests/client.test.ts`：增加“`configForms` 晚就绪后配置页注册”用例（FR-003）
- [ ] T009 [US2] 修改 `tests/client.test.ts`：增加“撤掉服务后注册清理、重新就绪后重新注册且不重复”用例，断言表单订阅数归零与槽位注册数（FR-004、SC-003）
- [ ] T010 [US2] 若 T008 或 T009 暴露 `src/client/index.ts` 的重复注册或清理缺口，修复该文件

**Checkpoint**: US1 与 US2 测试均通过。

---

## Phase 5: User Story 3 - 作者能查到可选服务的写法 (Priority: P2)

**Goal**: 文档说明前端服务可选的写法、取舍与约束。

**Independent Test**: 只读 `docs/how-it-works.md` 前端入口一节，能把另一个前端服务改为可选。

- [ ] T011 [P] [US3] 修改 `docs/how-it-works.md` 的“前端入口”一节：说明前端入口不声明必需服务，按功能用 `ctx.inject` 分组；表格列出三组的依赖、缺失时跳过的功能；更新同文件“前端部分”示例中的 `inject` 行（FR-007）
- [ ] T012 [P] [US3] 修改 `docs/known-risks.md` 的“前端产物”一节：记录 `ctx.inject` 回调是子 fiber，服务撤掉时重跑，回调内资源必须经 `ctx.effect` 登记；记录 `slots` 缺失时无可见效果（FR-008）

**Checkpoint**: 文档与实现一致，且遵守宪章原则 V（单一归属、只放链接）。

---

## Phase 6: Polish

- [ ] T013 在 `CHANGELOG.md` 的 `Unreleased` 下增加 `Changed` 条目：前端服务改为可选，按功能分组加载（FR-009）
- [ ] T014 运行 `pnpm format && pnpm check`，修复问题
- [ ] T015 运行 `pnpm build`，确认 `dist/client.js` 与产物测试通过
- [ ] T016 按 [quickstart.md](./quickstart.md) 核对；提醒用户在真实宿主做实机测试（宪章原则 IV）

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3（MVP）→ Phase 4 → Phase 5 → Phase 6。
- Phase 4 的测试依赖 Phase 3 的实现与 Phase 2 的辅助。
- T011、T012 改不同文件，可并行。
- 其余任务改同一文件，顺序执行。

## Implementation Strategy

1. 完成 Phase 1、2，确认旧测试在新辅助上仍通过。
2. 完成 Phase 3，验证 8 种组合。
3. 依次补 Phase 4、5、6。每个阶段一个 commit。
