# Quickstart: 合并后清理的交付流程

## 前置条件

- Git Bash、`gh` 已登录、Node 24 与 pnpm。
- 验证脚本行为用 `pnpm vitest run tests/worktree-extension.test.ts`。

## 场景 1 合并后清理删除远程与本地分支及 worktree

1. 在临时仓库中创建特性 worktree，提交并推送到 bare origin。
2. 把分支合入 `main` 并推送 `main`。
3. 回主工作区运行：

   ```bash
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --merged --path "<worktree>"
   ```

4. 期望：输出含 `"REMOTE_DELETED":true`；`git ls-remote --heads origin "<branch>"` 无输出；`git branch --list "<branch>"` 无非空输出；worktree 目录不存在。

## 场景 2 平台已删除远程分支

1. 完成场景 1 的前两步后，先用 `git push origin --delete "<branch>"` 删除远程分支。
2. 运行同一条清理命令。
3. 期望：清理成功，`REMOTE_DELETED` 为 `false`。

## 场景 3 未合并时拒绝清理

1. 推送分支但未合并。
2. 不带 `--merged` 运行清理。
3. 期望：脚本拒绝，提示清理在 PR 合并后执行；worktree 与本地分支保留。

## 场景 4 源与渲染产物正文一致

```bash
diff <(sed '1,/^---$/d' .specify/extensions/worktree/commands/speckit.worktree.finish.md) \
     <(sed '1,/^---$/d' .dsh/skills/speckit-worktree-finish/SKILL.md)
```

期望：无差异。

## 场景 5 真实 PR 的等待与清理

1. 在测试仓库提交一个小改动，运行交付流程创建 PR。
2. 观察 Agent 等待 CI、检查冲突、处理意见，并保持 worktree 直到合并。
3. 合并 PR 后，确认远程分支、本地分支与 worktree 被删除。