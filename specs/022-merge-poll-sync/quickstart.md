# Quickstart: 合并等待的轮询节奏与合并后 main 同步

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## 前置

- 在 `worktrees/022-merge-poll-sync` 中运行。
- 主工作区位于 `main`。
- 已登录 `gh`。

## 自动验证

```bash
pnpm format && pnpm check
```

期望：全部通过。

## 1. 渲染正文一致

```bash
diff \
  <(sed '1,/^---$/d' .specify/extensions/worktree/commands/speckit.worktree.finish.md) \
  <(sed '1,/^---$/d' .dsh/skills/speckit-worktree-finish/SKILL.md) && echo BODY_SAME
```

期望：输出 `BODY_SAME`。

## 2. 同步脚本整理场景

```bash
pnpm vitest run tests/sync-main.test.ts
```

期望：通过。用例覆盖其他分支、未提交变更、未推送提交、detached HEAD、`main` 领先与默认模式。

## 3. 文本检查

```bash
grep -n -- '--interval' .specify/extensions/worktree/commands/speckit.worktree.finish.md
grep -n -- 'sleep 10\|sleep 30\|date +%s' .specify/extensions/worktree/commands/speckit.worktree.finish.md
grep -n -- '--prepare' .specify/extensions/worktree/commands/speckit.worktree.finish.md
```

期望：

- CI 等待为 `--interval 15`。
- 合并等待含 `start=$(date +%s)`、`sleep 10`、`sleep 30`，阈值 300 秒。
- 清理前调用 `sync-main.sh --json --prepare`。

## 4. 主工作区规则

打开 `AGENTS.md` 的主工作区节，核对：

- 允许 `git fetch`、`git pull` 与可恢复的操作。
- 列出的命令包含 `git stash`、`git switch`、`git branch`、`git reset --hard`、`git worktree remove`、`git branch -D`。
- `git reset --hard` 注明只在目标提交已保存到临时分支时使用。

## 5. 真实流程

本 spec 的交付由 `/speckit-worktree-finish` 执行，观察：

- CI 检查间隔为 15 秒。
- 合并等待前 5 分钟每 10 秒检查一次，之后每 30 秒。
- 合并后先切到主工作区、运行 `sync-main.sh --prepare`，再删除 worktree、本地分支与远程分支。
- 输出包含 `MAIN_COMMIT`、`UPDATED`，以及本次创建的 `STASHED` 与 `TEMP_BRANCH`。