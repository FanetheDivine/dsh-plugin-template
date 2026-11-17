# Tasks: AGENTS.md 开发流程精简与文档归属调整

**Input**: Design documents from `specs/004-agents-flow-slim/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[quickstart.md](./quickstart.md)

**Tests**: spec 未要求新增测试；每阶段运行 `pnpm format && pnpm check`，验证按 [quickstart.md](./quickstart.md)。

**Commit**: 每个阶段一个 commit。CHANGELOG 在 push 时由 `/speckit-worktree-finish` 补充。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: 宪章 1.6.0 (US2)

**Goal**: 宪章不含开发流程节，原则 V 归属与实际内容一致。

**Independent Test**: quickstart 场景 3。

- [X] T001 [US2] 确认 `.specify/memory/constitution.md` 已删除「开发流程」节
- [X] T002 [US2] 经 `/speckit-constitution` 修改 `.specify/memory/constitution.md` 原则 V 文档结构表：`AGENTS.md` 归属为「通用的信息和指令」，宪章归属为「变更过程中必须遵循的硬约束」
- [X] T003 在同一次修订中把版本升到 1.6.0，更新 Sync Impact Report 与 Last Amended。见 research R3
- [X] T004 运行 `pnpm format && pnpm check`，提交宪章与 `specs/004-agents-flow-slim/`

**Checkpoint**: quickstart 场景 3 通过。

---

## Phase 2: AGENTS.md 与引用 (US1、US2)

**Goal**: `AGENTS.md` 只保留 skill 未覆盖的流程规则；链接指向 `AGENTS.md`。

**Independent Test**: quickstart 场景 2、4。

- [X] T005 [P] [US1] 删除 `AGENTS.md` 开发流程节中的「分支与 worktree」「澄清」「收尾」三段，保留步骤表与「实施」两条规则。见 research R1
- [X] T006 [P] [US2] 把 `docs/development.md` Spec Kit 流程节的宪章开发流程链接改为指向 `AGENTS.md` 的开发流程节，分支与 worktree 规则说明改为由 `/speckit-worktree-create` 提供。见 research R4
- [X] T007 运行 `pnpm format && pnpm check` 与 quickstart 场景 1–4，提交

**Checkpoint**: quickstart 场景 1–4 全部通过。

---

## Dependencies & Execution Order

- Phase 1 → Phase 2。
- T005 与 T006 文件不同，可并行。

## Implementation Strategy

1. 完成 Phase 1，宪章归属生效。
2. 完成 Phase 2，`AGENTS.md` 与链接符合新归属。
3. 请用户验收后运行 `/speckit-worktree-finish`。
