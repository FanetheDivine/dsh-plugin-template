# Research: 合并后清理的交付流程

## R1 CI 等待

- Decision: 用 `gh pr checks <PR> --watch --fail-fast --interval 30` 等待，退出码非 0 视为失败或未完成。
- Rationale: `--watch` 阻塞到检查结束，`--fail-fast` 在首个失败时返回，避免等完剩余检查。
- Alternatives: 自行轮询 `gh pr checks --json bucket`；多一层循环，且与 `gh` 的退出码语义重复。

## R2 冲突判断

- Decision: 用 `gh pr view <PR> --json mergeable,mergeStateStatus` 判断；`MERGEABLE` 即无冲突，`CONFLICTING` 需合入基线，`UNKNOWN` 先 `git fetch origin` 再重查。
- Rationale: `mergeable` 由平台计算，覆盖所有冲突来源；本地 `git merge-tree` 只反映已取回的分支状态。
- Alternatives: `gh pr merge --auto`；会改变合并行为，且流程不发起合并。

## R3 评审意见

- Decision: 轮询 `gh pr view <PR> --json reviews,comments,reviewDecision`，逐条核对并按要求修改；每次修改后重跑 R1 与 R2。
- Rationale: 评审与评论都能从该查询拿到，不依赖额外权限。
- Alternatives: GraphQL `reviewThreads` 查未解决讨论；字段更细，但技能需要固定查询语句，维护成本更高。

## R4 合并等待

- Decision: 轮询 `gh pr view <PR> --json state,mergedAt`，`MERGED` 后进入清理；`CLOSED` 且未合并时停止，保留分支与 worktree。
- Rationale: 合并由用户或上游维护者完成，Agent 只观察状态。
- Alternatives: `gh pr merge --auto`；Agent 会参与合并，与本仓库可能出现上游维护者的情况冲突。

## R5 清理脚本

- Decision: `finish-worktree.sh` 的交付路径要求 `--merged`；该路径删除远程分支，远程分支已不存在时成功退出；远程分支存在时用 `git push origin --delete` 删除，并用 `git ls-remote --heads origin` 复核。
- Rationale: 合并前删除远程分支会关闭 PR，`--merged` 把清理与合并绑定；平台自动删除分支时脚本不能报错。
- Alternatives: 新增独立脚本删除远程分支；多一次调用，且无法与 worktree、本地分支的删除共用前置检查。

## R6 渲染产物同步

- Decision: 仓库没有 `specify` CLI，手工把命令源正文同步到 `.dsh/skills/speckit-worktree-finish/SKILL.md`，以「去掉 frontmatter 后 diff 为空」验收。
- Rationale: 与 002 的处理一致，渲染产物与源保持同一份正文。
- Alternatives: 安装 `specify` 重新渲染；需要额外全局工具与网络，当前环境不可用。

## R7 等待边界

- Decision: 每次等待用有上限的轮询窗口（例如 10 次、间隔 60 秒），窗口结束报告当前状态并继续下一轮；会话存续期间持续处理。
- Rationale: 合并可能由上游维护者延迟完成，轮询不应无限阻塞单次工具调用。
- Alternatives: 无上限 `sleep` 循环；会阻塞会话且无法中途接收用户指令。