# 功能规格：放弃模式关闭 PR 并清理远程分支

**功能分支**：`feat/023-abandon-remote-cleanup`

**创建日期**：2026-11-23

**状态**：Waived

**输入**：用户描述：「abandon 模式关闭 PR + 清理远程分支。`finish-worktree.sh --abandon` 删除 worktree 与本地分支后关闭关联 PR、删除远程分支，失败可容忍；默认执行，另加 `--keep-remote` 保留；确认编号唯一性不受影响。」

**变更类别**：模板变更

## 待确认决策

无。

## 澄清记录

### 2026-11-23 会话

- [D-001] 问：开关用一个还是两个？ → 答：一个 `--keep-remote`，同时保留远程分支与 PR。
- [D-002] 问：删除远程分支后编号如何保持占用？ → 答：删除分支的同一次 atomic push 在远程创建墓碑 tag `abandoned/<分支名>`，算号与编号校验把墓碑计为已占用。
- [D-003] 问：gh 不可用、查询或关闭 PR 失败时怎么办？ → 答：记录警告并继续删除远程分支，脚本以 0 退出。

## 审查记录

- 2026-11-23：用户在任务指令中给出完整需求并要求自行 PR 与合并。 | Decision: Waived | Scope: current full document | Open items: none | Risks: 默认行为变化，放弃后远程分支消失，复盘改用墓碑 tag

## 用户场景与测试

### 用户故事 1 - 放弃后不留远程残留 (Priority: P1)

用户放弃需求后，Agent 删除 worktree 与本地分支，关闭关联的 open PR，删除远程分支，并在远程留下墓碑 tag。

**独立测试**：在有远程分支与 open PR 的特性上运行放弃，检查 PR 已关闭、远程分支已删除、墓碑 tag 指向原分支头。

**验收场景**：

1. **Given** 分支有 open PR，**When** 运行 `--abandon`，**Then** PR 被关闭，JSON 的 `PR_CLOSED` 列出其编号。
2. **Given** 分支没有 PR，**When** 运行 `--abandon`，**Then** 跳过关闭并输出提示，脚本成功。
3. **Given** 远程分支存在，**When** 运行 `--abandon`，**Then** 远程分支被删除，`REMOTE_DELETED` 为 `true`，`TOMBSTONE` 为 `abandoned/<分支名>`。
4. **Given** 远程分支不存在，**When** 运行 `--abandon`，**Then** 跳过删除，`REMOTE_DELETED` 为 `false`。
5. **Given** gh 缺失或失败，**When** 运行 `--abandon`，**Then** 警告写入 `WARNINGS`，远程分支照常删除，脚本成功。

### 用户故事 2 - 保留远程用于复盘 (Priority: P2)

用户需要复盘时传 `--keep-remote`，远程分支与 PR 原样保留。

**验收场景**：

1. **Given** 传入 `--keep-remote`，**When** 运行 `--abandon`，**Then** 不调用 gh，远程分支保留，`KEPT_REMOTE` 为 `true`。
2. **Given** 传入 `--keep-remote --merged`，**When** 运行，**Then** 脚本拒绝。

### 用户故事 3 - 编号不被复用 (Priority: P1)

放弃的编号继续占用，后续 spec 不会拿到同一编号。

**验收场景**：

1. **Given** 最大编号的特性已放弃且远程分支已删除，**When** 创建新 spec，**Then** 新编号大于被放弃的编号。
2. **Given** 本地未同步墓碑 tag，**When** 用 `--no-fetch` 创建，**Then** 占号后的远程校验仍避开墓碑编号。
3. **Given** 远程有同号墓碑，**When** 运行 `check-spec-number.sh`，**Then** 退出 4 并列出墓碑。

### 边界情况

- 同一分支名再次放弃，墓碑 tag 被覆盖。
- 远程拒绝 atomic push，分支与墓碑都不变，记录警告。
- 本地缺少远程分支头的对象，先 fetch 再推送墓碑。

## 需求

### 功能需求

- **FR-001**: `--abandon` 默认 MUST 在删除 worktree 与本地分支后关闭该分支的 open PR，再删除远程分支。
- **FR-002**: 删除远程分支 MUST 与创建墓碑 tag `abandoned/<分支名>` 在同一次 atomic push 中完成。
- **FR-003**: gh 缺失、PR 查询失败、关闭失败、远程查询或推送失败 MUST 记为警告，脚本以 0 退出。
- **FR-004**: JSON MUST 输出 `REMOTE_DELETED`、`TOMBSTONE`、`PR_CLOSED`、`KEPT_REMOTE`、`WARNINGS`。
- **FR-005**: `--keep-remote` MUST 跳过 PR 关闭与远程删除，只能与 `--abandon` 合用。
- **FR-006**: `create-worktree.sh` 算号与占号校验 MUST 把本地与远程的 `abandoned/*` 墓碑计为已占用。
- **FR-007**: `check-spec-number.sh` MUST 把同号墓碑列为冲突，同名分支的墓碑除外。
- **FR-008**: gh 命令 MUST 可由环境变量 `WORKTREE_GH` 覆盖，供测试替换。
- **FR-009**: finish 命令文档、skill 与 `docs/development.md` MUST 写明放弃步骤、默认行为与开关。

## 成功标准

- **SC-001**: 默认放弃后远程分支数为 0、open PR 数为 0、墓碑 tag 存在。
- **SC-002**: 放弃后创建的 spec 编号不等于任何被放弃的编号。
- **SC-003**: gh 失败时放弃流程仍成功。

## 假设

- 远程为 GitHub 或支持 atomic push 的 git 服务。
- 墓碑 tag 为轻量 tag，位于 `refs/tags/abandoned/`。
