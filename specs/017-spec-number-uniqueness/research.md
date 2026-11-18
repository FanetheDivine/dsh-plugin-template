# Research: 协作场景的 spec 编号唯一性

## R1 占号时机与顺序

- **Decision**: 创建流程先建本地分支、推送占号、校验唯一性，全部通过后创建 worktree。
- **Rationale**: 占号失败时没有 worktree 需要移动；改号只涉及分支名与远程引用。
- **Alternatives considered**:
  - 建 worktree 后推送：改号要移动 worktree 目录并重命名分支，步骤多、失败面大。
  - 随首个 spec 提交推送：占号滞后到写完 spec，时间窗更长。

## R2 编号前同步远程全部分支

- **Decision**: 算号前执行 `git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*'`。
- **Rationale**: 现有实现只拉 base ref，其他远程分支引用过期；过期引用等于看不到别人的编号。
- **Alternatives considered**:
  - 只拉 base ref：现状，遗漏别人已推送的 spec。
  - 只用 `git ls-remote`：能算号，但不更新远程引用，后续步骤仍读到旧状态。

## R3 占号后的唯一性校验

- **Decision**: 推送后执行 `git ls-remote --heads origin`，按编号分组；同号时保留完整分支名字典序最小者，其余改号。
- **Rationale**: `ls-remote` 直接读远程，绕过本地引用缓存；排序规则确定，双方独立执行得到同一结论。
- **Alternatives considered**:
  - 读 fetch 后的本地引用：刚推送的另一方可能尚未进入本地引用。
  - 先到先得：双方都可能认为自己是先到者。

## R4 冲突改号

- **Decision**: 输家删除自己的远程占号分支与本地分支，取当前已知最大编号加一重试，最多 10 次。
- **Rationale**: 每次重试基于刚读取的远程状态，编号单调递增。
- **Alternatives considered**: 中止并要求人工改号，增加人工步骤，无法满足 SC-003。

## R5 占号失败

- **Decision**: fetch 失败在占号前中止；push 失败删除本地分支并以非零退出。
- **Rationale**: 编号未占用时继续创建会回到重复问题；无 worktree 时回滚只需删分支。
- **Alternatives considered**: 继续创建并警告，重复风险保留。

## R6 交付前校验

- **Decision**: 新增 `check-spec-number.sh`，`finish` 在 push 与 PR 前运行；冲突时退出码 4 并报告冲突引用。
- **Rationale**: 创建时校验存在并发时间窗，交付前是合入 `main` 的最后闸门。
- **Alternatives considered**:
  - 只在创建时校验：时间窗残留。
  - 在 CI 校验：同号已经合入 `main`。

## R7 核心 `create-new-feature.sh` 保持不变

- **Decision**: 保持上游脚本原样，创建路径统一走 worktree 扩展。
- **Rationale**: 本仓库的 spec 目录由 `before_specify` hook 显式指定，核心脚本不参与编号；改上游脚本会增加升级冲突。
- **Alternatives considered**: 让核心脚本也做远程占号，与上游分叉，维护成本高。

## R8 已废弃编号保持占用

- **Decision**: `abandon` 保留远程分支，编号继续计入后续算号。
- **Rationale**: 编号不复用，历史引用保持唯一。
- **Alternatives considered**: 删除远程分支后释放编号，历史引用出现歧义。

## R9 移除命令文档的 native worktree tool 分支

- **Decision**: 创建统一执行 `create-worktree.sh`。
- **Rationale**: 占号与建分支必须是同一个动作。
- **Alternatives considered**: 先用原生工具建 worktree 再补推送，两步之间失败会留下未占号的 worktree。

## R10 Git Bash 参数安全

- **Decision**: 先建本地分支，再用 `git push origin <branch>` 推送，避开 `src:dst` refspec。
- **Rationale**: MSYS 会改写带冒号的参数。
- **Alternatives considered**: `git push origin HEAD:refs/heads/<branch>`，在 Windows 上可能被改写。

## R11 `--no-fetch` 与 `--dry-run` 语义

- **Decision**: 两个参数保留；`--dry-run` 不推送、不建 worktree，`--no-fetch` 跳过同步但仍占号并校验。
- **Rationale**: 测试需要模拟过期引用；dry-run 必须无副作用。
- **Alternatives considered**: 移除 dry-run，命令文档与测试都要改。
