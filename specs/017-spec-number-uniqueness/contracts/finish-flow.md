# Contract: finish 流程中的编号校验

`finish` 在推送分支与创建 PR 前运行编号校验。

## 步骤

| 顺序 | 动作 | 失败处理 |
| --- | --- | --- |
| 1 | 质量门禁 `pnpm format && pnpm check` | 修复后重跑 |
| 2 | 补 CHANGELOG | 补写后继续 |
| 3 | `sync-baseline.sh --json` | 退出 3 解决冲突后重跑；退出 1 停止 |
| 4 | 提交剩余改动 | 解决后继续 |
| 5 | `check-spec-number.sh --json` | 退出 4 停止并报告冲突引用；退出 1 停止 |
| 6 | `git push -u origin "<BRANCH_NAME>"` 与 `gh pr create --fill --base main` | 按 finish 命令说明处理 |
| 7 | 等待 CI、评审与合并 | 按 finish 命令说明处理 |
| 8 | 清理 worktree 与分支 | 按 finish 命令说明处理 |

## 冲突报告

退出码 4 时报告以下内容后停止：

- 当前分支名与编号。
- 同编号的远程分支列表。
- base ref 中同编号的 spec 目录列表。

处理方式由用户决定：改号或放弃当前 spec。
