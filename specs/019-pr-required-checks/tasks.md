# Tasks: main 合并门禁

**Input**: `specs/019-pr-required-checks/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[quickstart.md](./quickstart.md)

**Tests**: 无源码变更。验证由 [quickstart.md](./quickstart.md) 的真实 API 与 git 操作承担。

**Organization**: 每个阶段对应一个提交；Phase 3 之后的外部操作以 PR 合并提交收尾。

## Phase 1: Setup

- [X] T001 提交 `specs/019-pr-required-checks/`：`spec.md`、`checklists/requirements.md`、`plan.md`、`research.md`、`quickstart.md`、`tasks.md`

---

## Phase 2: Foundational - 仓库文档

**Goal**: 门禁机制写入归属文档，CHANGELOG 记录条目。

**Independent Test**: `pnpm check` 通过；`docs/development.md` 的 CI 节含门禁说明。

- [X] T002 [P] 在 `docs/development.md` 的 CI 节增加门禁说明：
  - `main` 要求 PR 合并前全部 PR check 成功。
  - 分支必须包含最新 `main`。
  - 管理员同样受限。
  - 直接推送保持可用；强推与删除被拒。
  - 改名 CI job 时同步更新规则集。
- [X] T003 [P] 在 `CHANGELOG.md` 的 `## Unreleased` / `### Changed` 增加条目：`main` 启用合并门禁，PR 需通过全部 CI check 且分支包含最新 `main`。
- [X] T004 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 文档与 CHANGELOG 就位，`pnpm check` 通过。

---

## Phase 3: User Story 1 - 未通过 check 的 PR 不能合并 (Priority: P1) 🎯 MVP

**Goal**: 按 [plan.md](./plan.md#规则集载荷) 应用规则集，并验证合并受 check 约束。

**Independent Test**: [quickstart.md](./quickstart.md) 第 1、2 步。

- [ ] T005 [US1] 按名称查询 `main` 规则集，存在则更新，不存在则创建；载荷含 `required_status_checks`（strict）、`non_fast_forward`、`deletion`，`bypass_actors` 为空
- [ ] T006 [US1] 读回 `/rulesets/<id>`，核对规则类型、`strict_required_status_checks_policy`、`required_checks` 与空 `bypass_actors`

---

## Phase 4: User Story 2 - 分支落后 main 时不能合并 (Priority: P2)

**Goal**: 分支落后时合并被拒。

**Independent Test**: [quickstart.md](./quickstart.md) 第 3 步。

- [X] T007 [US2] 推送 `chore/019-pr-required-checks` 并开 PR；读取 `mergeStateStatus`，确认 check 未完成时为 `BLOCKED`
- [ ] T008 [US2] 把 `origin/main` 合入分支后再读，确认为 `CLEAN` 后才合并

---

## Phase 5: User Story 3 - main 不可强推、不可删除 (Priority: P3)

**Goal**: 强推与删除被拒，普通推送保持可用。

**Independent Test**: [quickstart.md](./quickstart.md) 第 4、5 步。

- [ ] T009 [US3] 在临时克隆中强推 `main`、删除 `main`，确认均被拒且远端不变
- [ ] T010 [US3] 用同规则绑定 `probe/push`，确认普通推送成功，再删除探测规则集与分支

---

## Phase 6: Polish

- [ ] T011 合并 PR，确认 `main` 前进；删除远端分支与本地 worktree，主工作区 `main` 与 `origin/main` 一致

## Dependencies

- T001 → T002、T003 → T004。
- T004 → T005 → T006。
- T006 → T007 → T008。
- T007 → T009 → T010。
- T008 → T011。

## Implementation Strategy

规则集是三个故事共同前提，先应用再验证。验证按 PR 生命周期推进：开 PR 时观察 `BLOCKED`，检查通过后合并。T009、T010 独立于 PR。

## Notes

- 规则集不可创建时改用经典分支保护 `PUT /branches/main/protection`，字段对齐 [plan.md](./plan.md#规则集载荷)：`required_status_checks.strict`、`enforce_admins`。
- 回滚：`DELETE /rulesets/<id>`。
