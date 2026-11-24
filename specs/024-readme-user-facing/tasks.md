# Tasks: README 面向用户与宪章文档结构调整

**Input**: `specs/024-readme-user-facing/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[quickstart.md](./quickstart.md)

**Tests**: 只改文档，不新增测试（P-003）。

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 在 worktree 根目录运行 `pnpm install`，确认 `pnpm check` 在改动前通过；提交 `specs/024-readme-user-facing/`

---

## Phase 2: User Story 1 - 插件用户快速了解插件 (Priority: P1) 🎯 MVP

**Goal**: README 只含插件名、npm 版本徽标、简介与功能列表。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 第 2 步检查 `README.md`。

- [X] T002 [US1] 按 [research.md](./research.md#r1-readme-正文) R1 重写 `README.md`
- [X] T003 [US1] 运行 `pnpm format && pnpm check`，提交

---

## Phase 3: User Story 2、3 - 宪章与相关文档 (Priority: P2)

**Goal**: 宪章原则 III 把 README 列为用户文档，不计入单一归属；README 规则写入原则 III；相关文档同步。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 第 3、4 步检查。

- [ ] T004 [US2] [US3] 按 [research.md](./research.md#r2-宪章原则-iii) R2 改写 `.specify/memory/constitution.md` 原则 III；版本改为 2.1.0，Last Amended 改为 2026-11-24；Sync Impact Report 记录 2.0.0 → 2.1.0 与原则 III 的调整
- [ ] T005 [P] [US3] 按 R3 修改 `AGENTS.md` 文档索引的 README 条目
- [ ] T006 [P] [US3] 按 R3 修改 `docs/template-conversion.md` 模板变更一节的 README 要求
- [ ] T007 [US3] 运行 `pnpm format && pnpm check`，提交

---

## Dependencies

- Phase 1 → Phase 2 → Phase 3。
- T005 与 T006 改不同文件，可并行。
