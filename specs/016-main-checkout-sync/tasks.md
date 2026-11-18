# Tasks: 主工作区约束与 main 同步

**Input**: `specs/016-main-checkout-sync/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[contracts/sync-main.md](./contracts/sync-main.md)、[quickstart.md](./quickstart.md)

**Tests**: 宪章原则 II 测试同步要求；Phase 2 包含 `sync-main.sh` 的测试。

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 在 worktree 根目录运行 `pnpm install`，确认 `pnpm check` 在改动前通过；提交 `specs/016-main-checkout-sync/`

---

## Phase 2: Foundational - 同步脚本

**Goal**: `sync-main.sh` 按 [contracts/sync-main.md](./contracts/sync-main.md) 工作，供 US2、US3 调用。

**Independent Test**: `pnpm vitest run tests/sync-main.test.ts` 通过。

- [X] T002 [P] 新增 `.specify/extensions/worktree/scripts/bash/sync-main.sh`：
  - 参数只有 `--json` 与 `-h`。
  - 按 research R1 的顺序检查与同步，退出码按 R3。
  - 逻辑包在函数中，最后一行为 `main "$@"; exit $?`，原因见 R2。
  - 文件头注释说明用途、用法与退出码。
- [X] T003 [P] 新增 `tests/sync-main.test.ts`，在临时仓库与 bare origin 中覆盖 [quickstart.md](./quickstart.md) 自动验证表的 9 个场景：
  - 临时仓库提交 `.gitignore`，内容含 `worktrees/` 与一个被忽略的文件名。
  - 用另一个 clone 推送提交，模拟 `origin/main` 前进。
  - 退出码非 0 时断言主工作区 HEAD、分支与文件不变。
- [X] T004 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 同步脚本可独立运行。

---

## Phase 3: User Story 1 - 主工作区只用于同步 (Priority: P1) 🎯 MVP

**Goal**: Agent 从 `AGENTS.md` 得知主工作区约束。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 文档验证第 1、2 步核对。

- [X] T005 [US1] 在 `AGENTS.md` 的「模板说明」与「开发流程」之间新增「主工作区」一节：
  - 主工作区指仓库根目录的检出，即 `git worktree list` 的第一项。
  - 主工作区 MUST 位于 `main` 分支。
  - 主工作区 MUST 保持干净，`git status --porcelain` 输出为空。
  - 在主工作区只运行 `git fetch` 与 `git pull`。
  - 任何变更 MUST 在 worktree 中进行，文档、配置、spec 与代码同样适用。
- [X] T006 [US1] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: `AGENTS.md` 含主工作区约束；宪章不变。

---

## Phase 4: User Story 2 + 3 - 开始前与结束后同步 (Priority: P1)

**Goal**: `/speckit-worktree-create` 与 `/speckit-worktree-finish` 在各自步骤调用 `sync-main.sh`。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 文档验证第 3–5 步核对。

- [X] T007 [P] [US2] 修改 `.specify/extensions/worktree/commands/speckit.worktree.create.md`：
  - 在创建分支与 worktree 之前新增一步，运行 `.specify/extensions/worktree/scripts/bash/sync-main.sh --json`。
  - 退出 0 时继续；退出 2 或 1 时停止并报告 stderr 原因，不创建 worktree。
  - 已在 feature worktree 内时同样先运行该步。
  - Output 段增加同步后的 `MAIN_COMMIT` 与 `UPDATED`。
- [X] T008 [P] [US3] 修改 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 的 Clean up 段：
  - `finish-worktree.sh` 成功后，在主工作区运行 `sync-main.sh --json`。
  - 交付与放弃两种模式都执行。
  - 退出 2 或 1 时报告原因，保留主工作区现状。
  - Output 段增加同步结果。
- [X] T009 [US2] 把 T007、T008 的命令正文同步到 `.dsh/skills/speckit-worktree-create/SKILL.md` 与 `.dsh/skills/speckit-worktree-finish/SKILL.md`，保留 front matter，按 research R4
- [X] T010 [US2] 更新 `docs/development.md`：
  - 流程表第 1 步产出加上主工作区 `main` 同步。
  - 流程表第 7 步产出加上清理后的主工作区 `main` 同步。
  - 测试表与「维护 worktree 扩展」一节加入 `tests/sync-main.test.ts`。
- [X] T011 [US2] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 开始与结束流程都同步主工作区。

---

## Phase 5: Polish

- [ ] T012 按 [quickstart.md](./quickstart.md) 全部步骤验证，在主工作区手工运行一次 `sync-main.sh --json`；勾选本文件任务并提交

---

## Dependencies

- Phase 1 → Phase 2 → Phase 4。
- Phase 3 只依赖 Phase 1，可与 Phase 2 并行。
- T002 与 T003 修改不同文件，可并行。
- T007 与 T008 修改不同文件，可并行；T009 依赖两者。

## Implementation Strategy

- MVP 为 Phase 3：`AGENTS.md` 的约束立即约束后续会话。
- Phase 2 与 Phase 4 让流程自动保持主工作区同步。
