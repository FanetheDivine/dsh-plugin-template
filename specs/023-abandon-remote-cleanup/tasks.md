# Tasks: 放弃模式关闭 PR 并删除远程分支

**Input**: [spec.md](./spec.md)、[plan.md](./plan.md)

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 运行 `pnpm install`，提交 `specs/023-abandon-remote-cleanup/`

## Phase 2: 脚本、测试与文档

- [X] T002 `finish-worktree.sh` 放弃模式关闭 open PR、删除远程分支，输出 `PR_CLOSED` 与 `WARNINGS`，失败时以 5 退出
- [X] T003 `tests/worktree-extension.test.ts` 覆盖：有 PR 关闭、无 PR 跳过、gh 不可用跳过、删除远程成功、关闭 PR 失败与远程不可达仍完成本地清理
- [X] T004 更新 finish 命令、`.dsh/skills/speckit-worktree-finish/SKILL.md`、`docs/development.md` 与 `CHANGELOG.md`
- [X] T005 运行 `pnpm format && pnpm run full-check`，提交
