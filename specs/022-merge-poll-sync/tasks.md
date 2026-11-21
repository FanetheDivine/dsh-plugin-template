# Tasks: 合并等待的轮询节奏与合并后 main 同步

**Input**: `specs/022-merge-poll-sync/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[contracts/sync-main.md](./contracts/sync-main.md)、[quickstart.md](./quickstart.md)

**Tests**: 宪章原则 II 要求脚本变更同步测试；Phase 2 覆盖 `sync-main.sh --prepare`。

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

- [ ] T001 在 worktree 根目录运行 `pnpm install`，确认 `pnpm check` 在改动前通过；提交 `specs/022-merge-poll-sync/`

---

## Phase 2: Foundational - 主工作区整理脚本

**Goal**: `sync-main.sh --prepare` 按 [contracts/sync-main.md](./contracts/sync-main.md) 整理主工作区并快进 `main`，默认模式保持现状。

**Independent Test**: `pnpm vitest run tests/sync-main.test.ts` 通过。

- [ ] T002 [P] 修改 `.specify/extensions/worktree/scripts/bash/sync-main.sh`：
  - 新增 `--prepare` 参数，用法与退出码按 [contracts/sync-main.md](./contracts/sync-main.md)。
  - prepare 模式按顺序执行：定位主工作区、stash 未提交变更、detached HEAD 建临时分支、切回 `main`、fetch、`main` 领先时建 `wip/main-<timestamp>` 并 `reset --hard origin/main`、`pull --ff-only`。
  - stash 用 `--include-untracked`，消息为 `worktree-finish: save primary checkout changes`。
  - JSON 增加 `STASHED` 与 `TEMP_BRANCH`；默认模式输出这两个字段的 `false` 与空串。
  - 默认模式不修改主工作区，退出码与现有测试一致。
  - 文件头注释补充 `--prepare` 的用途与退出码。
- [ ] T003 [P] 扩展 `tests/sync-main.test.ts`，按 research R6 覆盖：
  - 其他分支且干净：切回 `main` 后快进。
  - 其他分支的未提交变更：stash 后切回 `main`，stash 可恢复变更。
  - 其他分支的未推送提交：切回 `main` 后提交仍在该分支。
  - `main` 领先 `origin/main`：创建 `wip/main-<timestamp>`，`main` 等于 `origin/main`。
  - detached HEAD 并领先：创建 `wip/detached-<timestamp>`。
  - 默认模式在同样状态下退出 2 且保持原样。
  - 输出包含 `STASHED` 与 `TEMP_BRANCH`。
- [ ] T004 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 整理脚本可独立运行，默认模式无回归。

---

## Phase 3: User Story 1 - 合并等待先密集后稀疏 (Priority: P1) 🎯 MVP

**Goal**: CI 等待 15 秒；合并等待前 5 分钟 10 秒，之后 30 秒；每轮一次 `gh pr view`。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 第 3 步检查文本；在真实 PR 上观察间隔。

- [ ] T005 [US1] 修改 `.specify/extensions/worktree/commands/speckit.worktree.finish.md`：
  - 第 7 步改为 `gh pr checks "<PR>" --watch --fail-fast --interval 15`。
  - 第 8 步每轮只调用一次 `gh pr view "<PR>" --json state,mergedAt,mergeable,reviewDecision,reviews,comments`，用 `jq` 读取。
  - 循环记录 `start=$(date +%s)`，已等待小于 300 秒时 `sleep 10`，否则 `sleep 30`；启动后立即检查一次。
  - 保持判断顺序：合并与关闭 → 冲突 → 评审意见 → 评论数增长。
  - `## Waits run in the background` 节补一句 5 分钟阈值。
- [ ] T006 [US1] 把 T005 的正文同步到 `.dsh/skills/speckit-worktree-finish/SKILL.md`，保留 front matter，按 research R5
- [ ] T007 [US1] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 轮询节奏符合规格；合并判断行为不变。

---

## Phase 4: User Story 2 - 合并后先同步 main 再清理 (Priority: P1)

**Goal**: 交付与放弃都先切主工作区、运行 `sync-main.sh --prepare`，再清理；`AGENTS.md` 允许可恢复操作。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 第 2、4 步验证脚本与规则；本次真实交付验证顺序。

- [ ] T008 [US2] 修改 `.specify/extensions/worktree/commands/speckit.worktree.finish.md`：
  - 新增同步步骤：把会话工作目录切到 `MAIN_WORKTREE` 并 `pwd` 校验；运行 `sync-main.sh --json --prepare`；解析 `MAIN_COMMIT`、`UPDATED`、`STASHED`、`TEMP_BRANCH`；退出 2 或 1 时报告原因并继续清理。
  - 交付模式在 `MERGED` 后先执行同步步骤，再清理；`CLOSED` 不执行同步与清理。
  - 放弃模式在确认后执行同一同步步骤，再清理。
  - `## Clean up` 删除末尾同步步骤；步骤 1 的切目录改由同步步骤承担。
  - `## Output` 报告同步结果、`STASHED` 与 `TEMP_BRANCH`。
- [ ] T009 [US2] 把 T008 的正文同步到 `.dsh/skills/speckit-worktree-finish/SKILL.md`，保留 front matter
- [ ] T010 [P] [US2] 修改 `AGENTS.md` 主工作区节，按 research R7：
  - 目标状态为位于 `main` 且干净；不满足时先用可恢复的操作恢复。
  - 允许 `git fetch`、`git pull` 与可恢复的操作，并给出定义。
  - 列出 `git stash`、`git switch`、`git branch`、`git reset --hard`、`git worktree remove`、`git branch -D`；注明 `git reset --hard` 的临时分支前提。
- [ ] T011 [P] [US2] 更新 `docs/development.md`：
  - 流程表第 7 步产出改为「合并后同步主工作区 `main` 并清理」。
  - `tests/sync-main.test.ts` 的覆盖说明加入 `--prepare` 的整理场景。
- [ ] T012 [US2] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 交付与放弃都在清理前同步 `main`；规则与文档一致。

---

## Phase 5: Polish

- [ ] T013 按 [quickstart.md](./quickstart.md) 全部步骤验证，勾选本文件任务并提交

---

## Dependencies

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5。
- T002 与 T003 修改不同文件，可并行。
- T005 与 T008 修改同一个命令文件，按顺序执行；T006、T009 依赖各自的前一步。
- T010、T011 与 T008 修改不同文件，可并行。

## Implementation Strategy

- MVP 为 Phase 3：轮询节奏单独生效，缩短合并检测延迟。
- Phase 2 先落地脚本，Phase 4 让交付流程调用它。