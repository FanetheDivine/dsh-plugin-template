# Contract: sync-main.sh

**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

## Usage

```text
sync-main.sh [--json] [--prepare]
```

- 无 `--prepare`：保持现有严格模式，主工作区不在 `main`、不干净或本地 `main` 领先 `origin/main` 时退出 2，不修改主工作区。
- `--prepare`：先整理主工作区到可快进状态，再执行同步。允许 `git stash`、`git switch`、`git branch`、`git reset --hard`。
- `--json`：输出单行 JSON。`-h`/`--help` 打印用法。

## Prepare 行为

按顺序执行：

1. 定位主工作区（`git worktree list` 第一项）。
2. 当前不是 `main` 时：
   - 有未提交变更（含未跟踪文件）：`git stash push --include-untracked -m "worktree-finish: save primary checkout changes"`。
   - detached HEAD：先在 HEAD 创建 `wip/detached-<timestamp>`。
   - `git switch main`。
3. 在 `main` 上有未提交变更：同样 stash。
4. `git fetch origin main`。
5. `main` 不是 `origin/main` 的祖先时：在 HEAD 创建 `wip/main-<timestamp>`，`git reset --hard origin/main`。
6. 仍落后时：`git pull --ff-only origin main`。

时间戳格式 `%Y%m%dT%H%M%S`。stash 与临时分支都留在本地。

## Output

JSON 字段：

| 字段 | 含义 |
| --- | --- |
| `MAIN_WORKTREE` | 主工作区路径 |
| `BEFORE_COMMIT` | 整理前 `main` 的提交 |
| `MAIN_COMMIT` | 同步后 `main` 的提交 |
| `UPDATED` | `main` 是否发生变化 |
| `STASHED` | 是否创建 stash；strict 模式恒为 `false` |
| `TEMP_BRANCH` | 临时分支名；未创建时为空串 |

## Exit codes

| Code | 含义 |
| --- | --- |
| 0 | `main` 等于 `origin/main` |
| 2 | 未满足约束（strict）或整理步骤失败（prepare）；主工作区保持可恢复状态 |
| 1 | 其他失败，例如 fetch 失败、`origin/main` 无法解析 |

## Constraints

- 不写合并提交，`main` 的最终提交等于 `origin/main`。
- `git reset --hard` 只在临时分支已保存目标提交后执行。
- 非 0 退出时不删除 stash 或临时分支。
- 默认模式的输出与退出码保持现有测试的断言。