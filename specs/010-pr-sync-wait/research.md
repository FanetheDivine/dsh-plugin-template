# Research: 交付流程的基线同步与无上限等待

## R1 基线同步放在脚本里还是写在 skill 正文

- **Decision**: 新增 `.specify/extensions/worktree/scripts/bash/sync-baseline.sh`，skill 正文只调用脚本并按其退出码分支。
- **Rationale**: 同步包含「拉取、判断是否落后、合入、检测冲突、重装依赖、输出结果」六步，出错点集中在 git 状态判断。脚本能被 `tests/worktree-extension.test.ts` 在临时仓库里回归；写在 markdown 里只能人工核对。
- **Alternatives considered**: 全部写进 skill 正文。放弃原因：合入与锁文件判定无法测试，与宪章原则 IV 冲突。

## R2 冲突时脚本的退出方式

- **Decision**: 合入留下冲突时脚本以退出码 `3` 结束并保留冲突现场，不自动解决、不回滚。
- **Rationale**: 冲突解决要读代码与 spec，属于流程决策，交给 Agent 按 Quickstart 与宪章流程处理。回滚合入会丢掉已合入的无关改动。
- **Alternatives considered**: `git merge --abort` 后报错退出。放弃原因：Agent 处理冲突前还得重跑一次合入。

## R3 锁文件何时更新

- **Decision**: 合入成功后无条件运行依赖安装（`pnpm install`），`--no-install` 可跳过。
- **Rationale**: 合入后判定「锁文件是否真的变化」需要比较两个树，判错会导致后续 `pnpm check` 与 CI 结果不一致。安装是幂等的，浪费时间换正确性。
- **Alternatives considered**: 只在 `pnpm-lock.yaml` 或 `package.json` 有差异时安装。放弃原因：依赖树可能通过 workspace 配置变化，差异判定容易漏。

## R4 无上限等待的终止条件

- **Decision**: CI 等待终止于「全部检查结束」；评论与合并等待终止于四个状态之一：`MERGED`、`CLOSED`、`CONFLICTING`、有新反馈。两个等待都以会话后台任务运行，完成时通知主会话。
- **Rationale**: spec FR-008 要求等待无时间上限，FR-009 要求合并即结束。等待必须有确定性出口，否则后台任务永不返回。
- **Alternatives considered**: 保留截止时间并到期重启。放弃原因：用户明确要求去掉时间上限。

## R5 合并等待在一个轮询里查什么

- **Decision**: 单次轮询依次查询 PR 状态（`state`、`mergedAt`）、可合并性（`mergeable`）、反馈计数与 `reviewDecision`；命中任一终止条件立即退出。
- **Rationale**: 三个信号合并到一次循环，满足 FR-007「一个等待同时处理」与 FR-011「同一时刻只保留一个等待任务」。
- **Alternatives considered**: 评论与合并两个独立等待并行。放弃原因：合并后评论等待还会继续空转，违背 FR-009。

## R6 等待结束后如何重新进入

- **Decision**: 每次等待结束都结束该后台任务；处理后重新进入时启动新任务。冲突先同步基线、修 CI 报错与缺陷，再依次重新等待 CI 与评论及合并。
- **Rationale**: 复用已退出的任务拿不到新结果；顺序固定后流程可复现。
- **Alternatives considered**: 单一常驻循环同时处理 CI 与合并。放弃原因：CI 期间的重推会让同一循环的状态难以判断，且 `gh pr checks --watch` 只对某一时刻的检查集有效。

## R7 skill 渲染产物的同步方式

- **Decision**: 手工把 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 的正文同步到 `.dsh/skills/speckit-worktree-finish/SKILL.md`，只额外保留 frontmatter 与 `name`、`metadata` 字段。
- **Rationale**: 仓库当前没有渲染脚本，`009` 采用同一做法，两处文本漂移会导致 Agent 读到旧流程。
- **Alternatives considered**: 增加渲染脚本。超出本次范围，留作后续变更。
