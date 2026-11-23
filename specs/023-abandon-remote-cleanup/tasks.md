# Tasks: 放弃模式关闭 PR 并清理远程分支

**Input**: [spec.md](./spec.md)、[plan.md](./plan.md)

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 运行 `pnpm install`，提交 `specs/023-abandon-remote-cleanup/`

## Phase 2: 脚本与测试

- [X] T002 `spec-number-lib.sh` 新增 `remote_spec_refs`
- [X] T003 `create-worktree.sh` 与 `check-spec-number.sh` 计入 `abandoned/*` 墓碑
- [X] T004 `finish-worktree.sh` 放弃模式关闭 PR、atomic 删除远程分支并建墓碑，新增 `--keep-remote` 与 JSON 字段
- [X] T005 `tests/worktree-extension.test.ts` 覆盖：有 PR 关闭、无 PR 跳过、删除远程与墓碑、`--keep-remote`、gh 失败继续、墓碑编号不复用、编号校验冲突
- [X] T006 运行 `pnpm format && pnpm check`，提交

## Phase 3: 文档

- [X] T007 更新 `commands/speckit.worktree.finish.md` 与 `.dsh/skills/speckit-worktree-finish/SKILL.md` 的放弃步骤
- [X] T008 更新 `docs/development.md` 与 `CHANGELOG.md`
- [X] T009 运行 `pnpm run full-check`，提交
