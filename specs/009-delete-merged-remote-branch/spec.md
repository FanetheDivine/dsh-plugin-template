# Feature Specification: 合并后清理的交付流程

**Feature Branch**: `009-delete-merged-remote-branch`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "改spec流程 要求pr合并之后删除远程分支"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 交付后守护 PR 直到可合并 (Priority: P1)

用户验收实现后，Agent 完成本地验证、推送分支并创建 PR，然后持续确认 PR 的 CI 全部通过、与基线没有冲突，并按要求处理评审意见。

**Why this priority**: PR 进入可合并状态是后续清理的前提；CI 失败或冲突存在时合并会破坏 `main`。

**Independent Test**: 在一个存在 CI 与评审的 PR 上运行交付流程，人为制造一次 CI 失败与一次冲突，观察 Agent 修复并重推直到检查全绿且 `mergeable` 为真。

**Acceptance Scenarios**:

1. **Given** 本地验证通过且分支已推送，**When** 创建 PR，**Then** Agent 等待 CI 全部结束并确认全部通过。
2. **Given** PR 的 CI 有失败项，**When** 检查结果，**Then** Agent 修复、提交并重推，然后重新等待 CI。
3. **Given** PR 与基线冲突，**When** 检查 `mergeable`，**Then** Agent 合入基线、解决冲突并重推，然后重新等待 CI。
4. **Given** PR 收到评审意见，**When** 意见要求修改，**Then** Agent 按要求修改、重推并重新等待 CI 与冲突检查。

---

### User Story 2 - 合并后删除远程与本地分支及 worktree (Priority: P1)

PR 合并后，Agent 删除远程分支、本地分支和 worktree，仓库与磁盘不留下该特性的残留。

**Why this priority**: 这是本次变更的目标；远程分支长期残留会堆积陈旧分支。

**Independent Test**: 合并一个由该流程创建的 PR，然后运行清理，检查远程分支、本地分支与 worktree 目录都不存在。

**Acceptance Scenarios**:

1. **Given** PR 已合并，**When** 运行清理，**Then** 远程分支、本地分支与 worktree 都被删除。
2. **Given** PR 合并后平台已自动删除远程分支，**When** 运行清理，**Then** 清理成功且不因远程分支缺失报错。
3. **Given** PR 尚未合并，**When** 交付流程仍在等待，**Then** 分支与 worktree 保持存在。

---

### User Story 3 - 放弃特性 (Priority: P3)

用户放弃特性时，Agent 丢弃未提交与未推送的内容，删除 worktree 与本地分支。

**Why this priority**: 现有放弃路径继续可用，行为保持不变。

**Independent Test**: 在含未提交改动的 worktree 中运行放弃，检查 worktree 与本地分支被删除。

**Acceptance Scenarios**:

1. **Given** worktree 有未提交改动，**When** 用户确认放弃，**Then** worktree 与本地分支被删除。
2. **Given** 分支已推送过，**When** 放弃，**Then** 远程分支保留，并告知用户。

---

### Edge Cases

- CI 检查长时间未结束：Agent 报告当前状态并继续等待，不提前合并或清理。
- PR 被关闭且未合并：停止等待，保留本地分支与 worktree，报告状态。
- 合并期间收到新评审意见：先处理意见，重新确认 CI 与冲突后再等待合并。
- 合并由上游仓库的维护者完成：Agent 只等待与轮询，不执行合并。
- 远程分支已被平台自动删除：清理脚本不失败。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 交付流程 MUST 在本地验证通过后推送分支并创建 PR。
- **FR-002**: 交付流程 MUST 等待 PR 的全部 CI 检查结束，并确认全部通过；存在失败时 MUST 修复、重推后重新检查。
- **FR-003**: 交付流程 MUST 确认 PR 与基线没有冲突；存在冲突时 MUST 合入基线、解决冲突并重推，然后重新检查 CI。
- **FR-004**: 交付流程 MUST 等待评审意见，按要求修改、重推，并在每次重推后重新执行 FR-002 与 FR-003。
- **FR-005**: 交付流程 MUST 等待 PR 合并；PR 未合并时 MUST 保留远程分支、本地分支与 worktree。
- **FR-006**: PR 合并后，清理 MUST 删除远程分支、本地分支与 worktree。
- **FR-007**: 清理 MUST 在远程分支已不存在时成功完成。
- **FR-008**: 放弃模式 MUST 保持现有行为。
- **FR-009**: 交付流程 MUST NOT 自行合并 PR。

### Key Entities

- **PR 状态**: `mergeable`、CI 检查结果、评审意见、合并状态。
- **清理结果**: 远程分支、本地分支与 worktree 的删除情况。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 交付流程结束时，远程分支、本地分支与 worktree 的残留数量为 0。
- **SC-002**: 交付流程在 CI 失败或存在冲突时，不会进入等待合并阶段。
- **SC-003**: 合并前运行交付流程，远程分支、本地分支与 worktree 的保留数量为 3。
- **SC-004**: 放弃模式下，远程分支保留，worktree 与本地分支残留数量为 0。

## Assumptions

- 等待 CI、评审与合并作为后台任务运行，完成时唤醒会话；每次等待都有截止时间。
- 合并由用户或上游维护者执行；本流程不发起合并。
- 评审意见没有固定等待上限，会话存续期间持续处理。
- 上游仓库可能要求其他人合并 PR，因此流程不能假设 Agent 能自行完成合并。