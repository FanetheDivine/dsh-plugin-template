# 功能规格：放弃模式关闭 PR 并删除远程分支

**功能分支**：`feat/023-abandon-remote-cleanup`

**创建日期**：2026-11-23

**状态**：Waived

**输入**：用户描述：「abandon 时若该分支有关联 PR 就关闭它；abandon 时删除远程分支。其余保持原样。」

**变更类别**：模板变更

## 待确认决策

无。

## 澄清记录

### 2026-11-23 会话

- [D-001] 问：是否需要保留远程的开关？ → 答：不需要。
- [D-002] 问：删除远程分支后是否额外保持编号占用？ → 答：不需要，编号脚本保持原样。
- [D-003] 问：PR 或远程步骤失败时怎么办？ → 答：本地清理不回滚；退出码与 JSON 如实反映失败。

## 审查记录

- 2026-11-23：用户在任务指令中给出完整需求并要求自行 PR 与合并。 | Decision: Waived | Scope: current full document | Open items: none | Risks: 放弃后远程分支删除，被放弃的编号可能被后续 spec 复用

## 用户场景与测试

### 用户故事 1 - 放弃后不留远程残留 (Priority: P1)

用户放弃需求后，脚本删除 worktree 与本地分支，关闭该分支的 open PR，再删除远程分支。

**验收场景**：

1. **Given** 分支有 open PR，**When** 运行 `--abandon`，**Then** PR 被关闭，`PR_CLOSED` 列出编号。
2. **Given** 分支没有 PR 或 gh 不可用，**When** 运行 `--abandon`，**Then** 跳过关闭并输出提示，脚本以 0 退出。
3. **Given** 远程分支存在，**When** 运行 `--abandon`，**Then** 远程分支被删除，`REMOTE_DELETED` 为 `true`。
4. **Given** 远程分支不存在，**When** 运行 `--abandon`，**Then** 跳过删除，`REMOTE_DELETED` 为 `false`。
5. **Given** 关闭 PR 或远程操作失败，**When** 运行 `--abandon`，**Then** 本地清理已完成，后续步骤继续，`WARNINGS` 记录失败，脚本以 5 退出。

## 需求

- **FR-001**: `--abandon` MUST 在删除 worktree 与本地分支后关闭该分支的 open PR。
- **FR-002**: `--abandon` MUST 随后删除远程分支，远程分支不存在时跳过。
- **FR-003**: gh 不可用或没有 open PR 时 MUST 输出提示并继续。
- **FR-004**: PR 查询、关闭或远程操作失败 MUST 记入 `WARNINGS`，脚本以 5 退出，本地清理不回滚。
- **FR-005**: JSON MUST 输出 `REMOTE_DELETED`、`PR_CLOSED` 与 `WARNINGS`。
- **FR-006**: gh 命令 MUST 可由环境变量 `WORKTREE_GH` 覆盖，供测试替换。
- **FR-007**: finish 命令文档、skill 与 `docs/development.md` MUST 写明放弃时关闭 PR 并删除远程分支。

## 成功标准

- **SC-001**: 放弃后该分支的 open PR 数为 0，远程分支不存在。
- **SC-002**: gh 或远程失败时 worktree 与本地分支仍被删除。
