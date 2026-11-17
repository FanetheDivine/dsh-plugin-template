# Tasks: 交付流程的基线同步与无上限等待

**Input**: Design documents from `specs/010-pr-sync-wait/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: `sync-baseline.sh` 的新增行为写在 `tests/worktree-extension.test.ts`；skill 正文按 [quickstart.md](./quickstart.md) 人工核对。每阶段运行 `pnpm format && pnpm check`。

**Commit**: 每个阶段一个 commit。CHANGELOG 在 push 时由 `/speckit-worktree-finish` 按宪章原则 V 补充。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: User Story 1 — 提 PR 前与基线同步 (Priority: P1)

**Goal**: 推送前把最新的 `origin/main` 合入分支、解决冲突、更新锁文件、提交，然后推送并创建 PR。

**Independent Test**: [quickstart.md](./quickstart.md) 场景 1–3。

- [ ] T001 [US1] 新建 `.specify/extensions/worktree/scripts/bash/sync-baseline.sh`：参数 `--json`、`--no-install`、`--base-ref <ref>`（默认 `origin/main`）；`git fetch origin` 后判断基线是否已是当前分支祖先，是则输出 `MERGED=false`、`SYNCED=true` 并退出 `0`（data-model 状态 2）
- [ ] T002 [US1] 在 `sync-baseline.sh` 实现合入路径：以 `--no-edit` 合入基线，成功后运行 `pnpm install` 并输出 `MERGED=true`、`INSTALLED=true`、`SYNCED=true`；`--no-install` 时跳过安装并置 `INSTALLED=false`（data-model 状态 3）
- [ ] T003 [US1] 在 `sync-baseline.sh` 实现冲突与失败路径：合入冲突时保留工作区并以退出码 `3` 结束（`SYNCED=false`）；拉取失败以退出码 `1` 结束且不改工作区；`--json` 输出含 `BRANCH`、`BASE_REF`、`BASE_COMMIT`、`MERGED`、`INSTALLED`、`SYNCED`（data-model 状态 1、4）
- [ ] T004 [P] [US1] 在 `tests/worktree-extension.test.ts` 新增用例：基线已包含时不产生提交且不安装依赖；基线前进时产生合入提交并置 `MERGED=true`；冲突时退出码 `3` 且 `git status` 有冲突文件；`--no-install` 时 `INSTALLED=false`
- [ ] T005 [US1] 改写 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 的 Deliver mode：质量门禁与 CHANGELOG 之后运行 `sync-baseline.sh`；退出码 `3` 时解决冲突并重新运行脚本；完成后 commit、`git push -u`、`gh pr create --fill --base main`
- [ ] T006 [US1] 同步 `.dsh/skills/speckit-worktree-finish/SKILL.md`：正文与 T005 的命令源一致，frontmatter 保留 `name`、`metadata`（research R7）
- [ ] T007 [US1] 按 [quickstart.md](./quickstart.md) 场景 1–3 验证脚本，运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 交付流程在推送前完成基线同步。

---

## Phase 2: User Story 2 — 评论复核后重新同步基线 (Priority: P1)

**Goal**: 确认评论中的缺陷后，先按 Phase 1 的方式重新同步基线，再修复与重推。

**Independent Test**: [quickstart.md](./quickstart.md) 场景 5 的同步段。

- [ ] T008 [US2] 在 `speckit.worktree.finish.md` 的等待处理中写明：收到反馈并确认存在缺陷时，先运行 `sync-baseline.sh`、冲突时按同一流程解决，再修复缺陷，然后重新运行质量门禁并推送
- [ ] T009 [US2] 同步 `.dsh/skills/speckit-worktree-finish/SKILL.md` 的对应段落，运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 评论修复路径同样包含基线同步。

---

## Phase 3: User Story 3 — 评论与合并合并成一个无上限等待 (Priority: P1)

**Goal**: 一个后台等待同时处理 CI、评论、冲突与合并，无时间上限，合并即刻结束并进入清理。

**Independent Test**: [quickstart.md](./quickstart.md) 场景 4–6。

- [ ] T010 [US3] 把 `speckit.worktree.finish.md` 的 CI 等待改为无截止：去掉 `timeout 3600`，`gh pr checks "<PR>" --watch --fail-fast --interval 30` 的退出码只区分通过与非零失败，去掉"截止时间到期后重启"的说明
- [ ] T011 [US3] 合并评审等待与合并等待为一个后台轮询：单次轮询依次读取 PR 状态与 `mergedAt`、`mergeable`、反馈计数与 `reviewDecision`；命中 `MERGED`、`CLOSED`、`CONFLICTING`、新反馈任一即退出；`MERGED` 优先（data-model 交付等待表，research R4/R5）
- [ ] T012 [US3] 在 `speckit.worktree.finish.md` 写明退出后的动作：`CONFLICTING` 与确认有缺陷的反馈回到基线同步，再依次重新等待 CI 与评论及合并；同一时刻只保留一个等待任务，重新进入时新建任务（FR-011、FR-012、R6）
- [ ] T013 [US3] 写明合并与清理的关系：`MERGED` 立即进入清理；`CLOSED` 停止且不清理；流程不关注合并操作本身是否带来问题（FR-009、FR-010、FR-013、FR-014）
- [ ] T014 [US3] 同步 `.dsh/skills/speckit-worktree-finish/SKILL.md` 的等待段落与 `## Waits run in the background` 节，删除全部截止时间表述（research R4）
- [ ] T015 [US3] 更新 `.specify/extensions.yml` 中 `after_implement` 的 description 与 prompt，说明推送、无上限等待与合并后清理
- [ ] T016 [US3] 运行 `pnpm format && pnpm check`，按 [quickstart.md](./quickstart.md) 场景 4–6 核对 skill 文本，提交

**Checkpoint**: 交付流程全部等待无时间上限，合并即刻清理。

---

## Phase 4: Polish — 文档与端到端校验

- [ ] T017 [P] 更新 `docs/development.md` 流程表第 7 步的产出描述，写明推送前的基线同步与合并后清理
- [ ] T018 按 [quickstart.md](./quickstart.md) 场景 1–6 全部验证；复查 spec 的 FR-001 至 FR-016 在 skill 与脚本中都有对应行为，缺失项补到对应文件，运行 `pnpm format && pnpm check`，提交

---

## Dependencies & Execution Order

- Phase 1 先做，Phase 2、Phase 3 依赖 T001–T003 的脚本与 T005 的正文。
- Phase 2 与 Phase 3 修改同一文件的相邻段落，顺序执行以避免冲突。
- Phase 4 依赖前三个阶段。

## Parallel Opportunities

- T004 与 T001–T003 的脚本实现可按接口并行。
- T017 与 Phase 3 的实现可并行。

## Implementation Strategy

- MVP：Phase 1 + Phase 3。完成后推送前同步基线，等待无时间上限且合并即清理。
- Phase 2 把同一同步步骤接入评论路径，Phase 4 收尾文档与校验。
