# Data Model: 合并后清理的交付流程

## 交付状态

| 状态 | 进入条件 | 后续动作 |
| --- | --- | --- |
| `PR_CREATED` | 推送分支并创建 PR | 等待 CI |
| `CI_FAILED` | 检查有失败项 | 修复、提交、推送，回到 `PR_CREATED` |
| `CONFLICTING` | `mergeable` 为 `CONFLICTING` | 合入 `origin/main`、解决冲突、推送，回到 `PR_CREATED` |
| `REVIEW_PENDING` | CI 通过且无冲突 | 等待评审意见；有意见则修改、推送，回到 `PR_CREATED` |
| `AWAITING_MERGE` | CI 通过、无冲突、意见已处理 | 等待合并 |
| `MERGED` | `state` 为 `MERGED` | 清理 |
| `CLOSED_UNMERGED` | `state` 为 `CLOSED` 且未合并 | 停止，保留分支与 worktree |

状态转移约束：

- 每次推送回到 `PR_CREATED`，必须重新确认 CI 与冲突。
- 只有 `MERGED` 允许进入清理。

## 清理前置条件

| 条件 | `--abandon` | `--merged` |
| --- | --- | --- |
| 工作区干净 | 不要求 | 要求 |
| 上游存在且无未推送提交 | 不要求 | 上游存在时要求 |
| 上游缺失 | 允许 | 允许，视为平台已删除分支 |
| 删除远程分支 | 不删除 | 删除，远程已缺失时跳过 |
| 删除本地分支 | 删除 | 删除 |
| 删除 worktree | 删除 | 删除 |

## 脚本输出

| 键 | 含义 |
| --- | --- |
| `BRANCH_NAME` | 被清理的分支 |
| `WORKTREE_PATH` | 被删除的 worktree |
| `MAIN_WORKTREE` | 主工作区 |
| `ABANDONED` | 是否放弃模式 |
| `REMOTE_DELETED` | 本次是否删除了远程分支 |