# Contract: create-worktree.sh

## Usage

```text
create-worktree.sh [--json] [--dry-run] [--no-fetch] [--base-ref REF]
                   [--type TYPE] --short-name NAME
```

## Arguments

| 参数 | 行为 |
| --- | --- |
| `--json` | 输出单行 JSON |
| `--dry-run` | 只算号与算路径，不推送、不建分支、不建 worktree |
| `--no-fetch` | 跳过同步远程分支，仍占号并校验 |
| `--base-ref REF` | 覆盖 `worktree-config.yml` 的 `base_ref` |
| `--type TYPE` | 分支类型，默认 `feat` |
| `--short-name NAME` | 必填，转为 kebab-case slug |

## JSON 输出

| 字段 | 示例 | 说明 |
| --- | --- | --- |
| `BRANCH_NAME` | `fix/017-spec-number-uniqueness` | 本地与远程分支名 |
| `FEATURE_NUM` | `017` | 三位编号 |
| `FEATURE_NAME` | `017-spec-number-uniqueness` | worktree 目录名与 spec 目录名 |
| `FEATURE_DIRECTORY` | `specs/017-spec-number-uniqueness` | spec 目录相对路径 |
| `WORKTREE_PATH` | `<repo>/worktrees/017-spec-number-uniqueness` | worktree 绝对路径 |
| `MAIN_WORKTREE` | `<repo>` | 主工作区绝对路径 |
| `BASE_REF` | `origin/main` | 分支起点 |
| `CREATED` | `true` | 本次是否创建 worktree |
| `IN_WORKTREE` | `false` | 是否复用了当前 worktree |
| `CLAIMED` | `true` | 远程是否已存在本次占号分支；dry-run 与复用为 `false` |

## 退出码

| 码 | 含义 |
| --- | --- |
| 0 | 成功，worktree 已创建或已复用 |
| 1 | 参数错误、同步失败、占号失败、worktree 创建失败 |

## 执行顺序

1. 解析参数与 slug。
2. 同步 base ref 与远程全部分支（`--no-fetch` 跳过）。
3. 校验 base ref 含 `.specify/`。
4. 从 base ref 的 `specs/`、主工作区 `specs/`、本地分支、远程分支计算最大编号。
5. 创建本地分支并推送占号。
6. 用 `git ls-remote --heads origin` 校验同号分支；本分支不是字典序最小者时改号重试。
7. 创建 worktree，检出第 6 步保留的分支。
8. 输出结果。

## 失败回滚

| 失败点 | 处理 |
| --- | --- |
| 同步 | 中止，无本地改动 |
| 占号推送 | 删除本地分支，中止 |
| 唯一性校验查询 | 删除占号分支与本地分支，中止 |
| worktree 创建 | 删除占号分支与本地分支，中止 |

占号成功的分支保留到 worktree 创建成功，创建失败时一并删除。
