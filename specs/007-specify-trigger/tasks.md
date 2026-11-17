# Tasks: AGENTS.md 立即触发 speckit-specify

**Input**: Design documents from `specs/007-specify-trigger/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[quickstart.md](./quickstart.md)

**Tests**: spec 未要求新增测试；运行 `pnpm format && pnpm check`，验证按 [quickstart.md](./quickstart.md)。

**Commit**: 每个阶段一个 commit。CHANGELOG 在 push 时由 `speckit-worktree-finish` 补充。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: AGENTS.md 修改 (US1、US2)

**Goal**: Agent 收到变更要求后立刻获取 skill `speckit-specify`；`AGENTS.md` 不含诱发确认与重复的内容。

**Independent Test**: quickstart 场景 1–3。

- [X] T001 [US2] 删除 `AGENTS.md` 中「优先通过ask_user_question和用户交互。」一句及其后多余空行
- [X] T002 [US1] 把 `AGENTS.md` 开发流程节首句改为「在用户给出需求、缺陷或其他变更要求时，**立刻**获取 skill `speckit-specify` 的内容，并按流程推进。」
- [X] T003 [US2] 去除 `AGENTS.md` 步骤表 skill 列的前导斜杠，第 1 步执行条件与要求只保留「必做」
- [X] T004 运行 `pnpm format && pnpm check` 与 quickstart 场景 1–3，提交 `AGENTS.md` 与 `specs/007-specify-trigger/`

**Checkpoint**: quickstart 场景 1–3 通过。场景 4 由用户在新会话中验收。

---

## Dependencies & Execution Order

- T001–T003 修改同一文件，顺序执行。
- T004 依赖 T001–T003。

## Implementation Strategy

1. 完成 Phase 1。
2. 请用户在新会话中验收 quickstart 场景 4，通过后运行 `speckit-worktree-finish`。
