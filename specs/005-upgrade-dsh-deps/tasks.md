# Tasks: 模板宿主依赖对齐 DSH 0.2.2-rc.3

**Input**: Design documents from `specs/005-upgrade-dsh-deps/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[quickstart.md](./quickstart.md)

**Tests**: 复用 `tests/plugin.test.ts`，按 FR-011 更新事件集合与来源日志断言。

**Commit**: 每个阶段一个 commit。CHANGELOG 在本阶段内补充，push 时由 `/speckit-worktree-finish` 复核。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: 依赖与代码对齐 (US1、US2、US3)

**Goal**: 模板在 0.2.2-rc.3 宿主依赖下通过类型检查与测试，示例事件与宿主事件表一致。

**Independent Test**: quickstart 场景 1–4。

- [X] T001 [US1] `package.json`：`@deepseek-ai/dsh-agent`、`@deepseek-ai/dsh-tools` 改为 `0.2.2-rc.3`，`@deepseek-ai/cordis` 改为 `~4.1.0`
- [X] T002 [US2] `package.json`：`zod` 改为 `4.6.6`，`@types/node` 改为 24.x
- [X] T003 [US1] `package.json`：`engines.node` 改为 `>=24.9.0`
- [X] T004 [US1] `pnpm-workspace.yaml`：`minimumReleaseAgeExclude` 换为 `@deepseek-ai/dsh-agent@0.2.2-rc.3` 与 `@deepseek-ai/dsh-tools@0.2.2-rc.3`
- [X] T005 [US1] 运行 `pnpm install --no-frozen-lockfile` 更新 `pnpm-lock.yaml`。见 research R1、R2
- [X] T006 [P] [US3] `src/events.ts`：删除 `agent/session-start` 监听，`agent/created` 记录 `source`。见 research R3
- [X] T007 [P] [US3] `tests/plugin.test.ts`：事件集合去掉 `agent/session-start`，新增来源日志断言
- [X] T008 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: quickstart 场景 1–4 通过。

---

## Phase 2: 文档与记录 (US1、US2)

**Goal**: CHANGELOG 与开发文档写明新版本与 Node 要求。

**Independent Test**: quickstart 场景 4 与 CHANGELOG 条目核对。

- [X] T009 [P] [US1] `CHANGELOG.md` Unreleased 节记录依赖升级、事件迁移与 Node 要求
- [X] T010 [P] [US2] `docs/development.md` 写明 Node 24.9 及以上的运行要求
- [X] T011 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: CHANGELOG 含本次升级条目，文档写明 Node 要求。

---

## Dependencies & Execution Order

- Phase 1 → Phase 2。
- T006 与 T007 文件不同，可并行；T001–T005 顺序执行。

## Implementation Strategy

1. 完成 Phase 1，依赖、事件与测试一致。
2. 完成 Phase 2，记录与文档同步。
3. 请用户验收并运行实机测试，再运行 `/speckit-worktree-finish`。