# Tasks: 合并后清理的交付流程

**Input**: Design documents from `specs/009-delete-merged-remote-branch/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: 脚本路径新增用例，写在 `tests/worktree-extension.test.ts`；每阶段运行 `pnpm format && pnpm check`。

**Commit**: 每个阶段一个 commit。CHANGELOG 在 push 时由 `/speckit-worktree-finish` 按宪章原则 V 补充。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: User Story 1 — 交付后守护 PR (Priority: P1)

**Goal**: 创建 PR 后等待 CI、确认无冲突、处理评审意见、等待合并。

**Independent Test**: quickstart 场景 5 的等待阶段，或对 `spec.md` 的验收场景 1–4 逐条核对 skill 文本。

- [X] T001 [US1] 重写 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 的 Deliver mode：质量门禁、CHANGELOG、提交、推送并 `gh pr create`；随后等待 CI（`gh pr checks <PR> --watch --fail-fast`）、确认无冲突（`gh pr view <PR> --json mergeable,mergeStateStatus`，`CONFLICTING` 时合入 `origin/main` 并重推）、轮询评审意见并按意见修改（`gh pr view <PR> --json reviews,comments`）、等待合并（`state` 为 `MERGED` 才继续，`CLOSED` 且未合并则停止），每次推送后重新执行 CI 与冲突检查
- [X] T002 [US1] 同步 `.dsh/skills/speckit-worktree-finish/SKILL.md` 的 description 与正文，正文须与 T001 的命令源一致（research R6）
- [X] T003 [US1] 更新 `.specify/extensions.yml` 中 `after_implement` 的 description 与 prompt，说明推送、等待 CI 与合并、合并后清理
- [X] T004 按 [quickstart.md](./quickstart.md) 场景 4 确认正文一致，运行 `pnpm format && pnpm check`，提交

**Checkpoint**: skill 文本覆盖 spec 验收场景 1–4。

---

## Phase 2: User Story 2 — 合并后清理 (Priority: P1)

**Goal**: 合并后删除远程分支、本地分支与 worktree。

**Independent Test**: quickstart 场景 1–3。

- [X] T005 [US2] 在 `.specify/extensions/worktree/scripts/bash/finish-worktree.sh` 增加 `--merged` 交付路径：要求工作区干净；上游存在时要求无未推送提交；上游缺失时视为平台已删除分支；用 `git push origin --delete` 删除远程分支，远程已缺失时跳过；`--json` 输出新增 `REMOTE_DELETED`；更新帮助文本范围
- [X] T006 [US2] 更新 `tests/worktree-extension.test.ts`：交付用例先合并再清理并断言远程分支删除；新增「远程分支已不存在仍成功」「未传 `--merged` 时拒绝」；保留 abandon 用例并断言远程分支未删除
- [X] T007 [US2] 把 `docs/development.md` 流程表第 7 步的产出改为合并后的清理，或以 `abandon` 放弃
- [X] T008 运行 `pnpm format && pnpm check`，按 quickstart 场景 1–3 验证脚本，提交

**Checkpoint**: 脚本在合并后删除远程分支，abandon 行为不变。

---

## Phase 3: Polish — 端到端校验

- [ ] T009 按 [quickstart.md](./quickstart.md) 场景 1–4 全部验证；发现差异时修正并在 `CHANGELOG.md` 说明后提交
- [ ] T010 复查 `spec.md` 的 FR-001 至 FR-009 在 skill 与脚本中都有对应行为，缺失项补到对应文件

---

## Dependencies & Execution Order

- Phase 1 与 Phase 2 修改不同文件，可并行编辑；提交仍按阶段顺序进行，Phase 2 提交前 Phase 1 的 skill 已引用 `--merged`。
- Phase 3 依赖前两个阶段。

## Parallel Opportunities

- T001、T003、T005、T007 文件互不相同，可并行。
- T002 依赖 T001 的正文；T006 依赖 T005 的脚本语义。

## Implementation Strategy

- MVP：Phase 1 + Phase 2。完成后交付流程等待 CI、冲突与合并，合并后删除三种对象。
- Phase 3 用于端到端复核，不新增功能。