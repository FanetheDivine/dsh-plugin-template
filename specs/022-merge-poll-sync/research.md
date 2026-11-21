# Research: 合并等待的轮询节奏与合并后 main 同步

**Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## R1 主工作区整理的实现位置

- **Decision**: 给 `.specify/extensions/worktree/scripts/bash/sync-main.sh` 增加 `--prepare`。默认模式保持现有严格行为。
- **Rationale**: 整理步骤涉及 stash、切分支、reset 与临时分支，脚本化后可测试、退出码稳定；skill 只调用一行。
- **Alternatives considered**:
  - 只把命令写进 skill：无自动测试，Agent 每次执行都可能出现顺序差异。
  - 新建 `prepare-main.sh`：与 `sync-main.sh` 的检查重复，多一个调用点。

## R2 临时分支命名

- **Decision**: `wip/<branch>-<timestamp>`，时间戳用 `date +%Y%m%dT%H%M%S`。detached HEAD 使用 `wip/detached-<timestamp>`。
- **Rationale**: 本地分支，前缀表明用途，时间戳避免同名冲突。
- **Alternatives considered**: `rescue/<timestamp>` 丢失原分支信息；`backup/...` 与既有命名习惯无关。

## R3 合并等待的 gh 调用

- **Decision**: 每轮一次 `gh pr view "<PR>" --json state,mergedAt,mergeable,reviewDecision,reviews,comments`，用 `jq` 取字段与评论计数。
- **Rationale**: 10 秒节奏下把每轮 4 次调用降为 1 次，判断顺序不变。
- **Alternatives considered**: 保留原多次调用；缓存字段会引入过期状态。

## R4 轮询节奏

- **Decision**: 循环启动时记录 `start=$(date +%s)`，每轮结束比较已等待秒数与 300：小于 300 则 `sleep 10`，否则 `sleep 30`。启动后立即检查一次。
- **Rationale**: 与「前 5 分钟 10 秒，之后 30 秒」一致；不使用 `SECONDS`，避免与 `sh` 兼容性问题。
- **Alternatives considered**: 两个独立循环；计数器按次数换算会累积检查耗时误差。

## R5 渲染后的 skill 同步

- **Decision**: 手工把命令正文同步到 `.dsh/skills/speckit-worktree-finish/SKILL.md`，保留 front matter。验收为去掉 front matter 后两文件正文 diff 为空。
- **Rationale**: 本机没有 `specify` CLI；仓库既有做法见 [016 plan](../016-main-checkout-sync/plan.md)。
- **Alternatives considered**: 运行 `specify extension add --dev`；无法在当前环境执行。

## R6 测试

- **Decision**: 扩展 `tests/sync-main.test.ts`，在临时仓库与 bare origin 中覆盖：
  - 主工作区位于其他分支且干净：切回 `main` 后快进。
  - 主工作区有其他分支的未提交变更：stash 后切回 `main`，变更可从 stash 恢复。
  - 主工作区有其他分支的未推送提交：切回 `main` 后提交仍在该分支。
  - 主工作区 `main` 领先 `origin/main`：创建 `wip/main-<timestamp>`，`main` 等于 `origin/main`。
  - detached HEAD 并领先：创建 `wip/detached-<timestamp>`。
  - 默认模式在同样状态下仍退出 2 且保持原样。
  - 输出包含 `STASHED` 与 `TEMP_BRANCH`。
- **Rationale**: 宪章原则 II 要求脚本变更同步测试；临时仓库隔离真实主工作区。
- **Alternatives considered**: 只做手工验证；无法回归。

## R7 `AGENTS.md` 措辞

- **Decision**:
  - 目标状态与恢复方式写在同一条：主工作区 MUST 位于 `main` 且干净；不满足时先用可恢复的操作恢复。
  - 允许的操作单独一条，定义可恢复为不丢失已提交内容与未提交变更，并列出 `git fetch`、`git pull`、`git stash`、`git switch`、`git branch`、`git reset --hard`、`git worktree remove`、`git branch -D`。
  - `git reset --hard` 注明只在目标提交已保存到临时分支时使用。
- **Rationale**: 规则自洽，后续 Agent 有确定依据。
- **Alternatives considered**: 只写概括表述；无法判断具体命令是否允许。

## R8 文档同步位置

- **Decision**:
  - `AGENTS.md`：主工作区规则。
  - `.specify/extensions/worktree/commands/speckit.worktree.finish.md`：流程步骤。
  - `docs/development.md`：流程表第 7 步产出与 `tests/sync-main.test.ts` 的覆盖说明。
- **Rationale**: 宪章原则 III 要求单一归属；README 无用户可见插件行为变化。
- **Alternatives considered**: 把流程写进 `docs/development.md`；与扩展命令复述冲突。