# Quickstart: 交付流程的基线同步与无上限等待

## 前置

- 已安装 `gh` 并完成 `gh auth login`。
- 位于特性 worktree 内，工作区干净或改动已提交。
- 依赖安装可离线跳过时传 `--no-install`。

## 场景 1 分支已包含基线

```bash
.specify/extensions/worktree/scripts/bash/sync-baseline.sh --json
```

期望：`SYNCED=true`、`MERGED=false`、`INSTALLED=false`，退出码 `0`。

## 场景 2 基线前进，合入无冲突

1. 在另一个 clone 里改文件并推送到 `origin/main`。
2. 运行脚本。

期望：`MERGED=true`、`SYNCED=true`，`git log -1 --format=%P` 显示两条父提交，锁文件已更新。

## 场景 3 合入冲突

1. 让 `origin/main` 与特性分支改同一文件的相邻行。
2. 运行脚本。

期望：退出码 `3`，`git status` 显示冲突文件，工作区保留冲突标记。

## 场景 4 无上限等待

1. 创建 PR 后启动 CI 等待后台任务，让某个检查长时间运行。

期望：等待任务持续运行，主会话可继续接受指令；检查结束后任务返回结果。

## 场景 5 等待同时命中合并与冲突

1. 等待期间让 `origin/main` 前进到与 PR 冲突。

期望：等待任务返回 `CONFLICTING`，会话收到通知，Agent 同步基线后重推，然后重新启动 CI 等待。

## 场景 6 合并后清理

1. 由他人合并 PR。

期望：等待任务在下一轮轮询内返回 `MERGED`，Agent 立即清理 worktree、本地分支与远程分支。
