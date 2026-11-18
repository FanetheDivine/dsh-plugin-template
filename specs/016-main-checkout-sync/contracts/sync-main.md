# Contract: sync-main.sh

路径：`.specify/extensions/worktree/scripts/bash/sync-main.sh`

## 用法

```text
sync-main.sh [--json]
```

可在主工作区或任一 worktree 内运行，操作对象始终是主工作区。

## 行为

1. 定位主工作区：`git worktree list --porcelain` 的第一项。
2. 检查主工作区当前分支为 `main`。
3. 检查主工作区 `git status --porcelain` 输出为空。
4. 在主工作区运行 `git fetch origin main`。
5. 检查本地 `main` 是 `origin/main` 的祖先。
6. 本地 `main` 落后时，在主工作区运行 `git pull --ff-only origin main`。

## 输出

成功时输出一行。`--json` 输出 JSON，否则输出 `KEY=VALUE` 行。

| 字段 | 含义 |
| --- | --- |
| `MAIN_WORKTREE` | 主工作区路径 |
| `BEFORE_COMMIT` | 同步前本地 `main` 的提交 |
| `MAIN_COMMIT` | 同步后本地 `main` 的提交，等于 `origin/main` |
| `UPDATED` | 本次是否前进了本地 `main` |

失败时 stdout 为空，stderr 输出 `ERROR: <原因>`。

## 退出码

| 退出码 | 含义 | stderr 原因 |
| --- | --- | --- |
| 0 | 已同步 | 无 |
| 2 | 主工作区不满足约束 | `not on main`、`has uncommitted changes`、`has commits not on origin/main` |
| 1 | 其他错误 | 例如 `failed to fetch 'origin'` |

退出码非 0 时主工作区保持原样。
