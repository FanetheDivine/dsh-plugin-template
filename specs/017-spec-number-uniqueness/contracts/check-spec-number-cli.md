# Contract: check-spec-number.sh

## Usage

```text
check-spec-number.sh [--json] [--branch NAME] [--base-ref REF]
```

在 worktree 内运行；`--branch` 用于指定待检查的分支名，默认取当前分支。

## 检查内容

| 来源 | 判定 |
| --- | --- |
| `git ls-remote --heads origin` | 存在同编号的其它分支时冲突 |
| base ref 的 `specs/` | 存在同编号的其它 spec 目录时冲突 |

先 `git fetch --quiet origin <base-ref 的分支>`，保证 base ref 最新。

## 输出

| 模式 | 内容 |
| --- | --- |
| `--json` | `{"BRANCH":"...","FEATURE_NUM":"017","UNIQUE":false,"CONFLICTS":"fix/017-other,specs/017-other"}` |
| 默认 | 每行一个 `KEY=VALUE`，键同上；冲突项逐行输出为 `CONFLICT=<值>` |

分支名不含编号时输出 `UNIQUE=true` 与 `SKIPPED=true`。

## 退出码

| 码 | 含义 |
| --- | --- |
| 0 | 编号唯一，或无编号可检查 |
| 4 | 存在同编号的其它分支或 spec 目录 |
| 1 | 参数错误、远程查询失败、fetch 失败 |
