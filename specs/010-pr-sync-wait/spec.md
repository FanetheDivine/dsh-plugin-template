# Feature Specification: 交付流程的基线同步与无上限等待

**Feature Branch**: `010-pr-sync-wait`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "1. 关于可合并性 '等待评论'和'等待合并'应当是一起等待的 没有时间上限 但只要pr被合并 就立刻停止等待开始清理 2. 提pr前 拉最新的origin main合并至新分支 解决冲突（走spec流程） pnpm i升级lock。都commit之后push+pr 3. 在被评论且确定有bug后 按2解决 同样同步origin main"

**变更类别**: 模板变更（宪章原则 VII）。修改 `speckit-worktree-finish` 的交付流程。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 提 PR 前与基线同步 (Priority: P1)

Agent 完成本地验证后，先拉取最新的 `origin/main` 合入特性分支，解决冲突并重装依赖，把合入结果与原改动一起提交，然后才推送分支并创建 PR。

**Why this priority**: 提前合并基线把冲突暴露在本地，PR 创建后即与基线一致，减少后续因 `main` 前进导致的重跑与返工。

**Independent Test**: 让 `main` 在特性分支创建后前进并改动同一文件的相邻行，运行交付流程，观察分支在推送前已包含 `origin/main` 的提交且锁文件已更新。

**Acceptance Scenarios**:

1. **Given** 特性分支落后于 `origin/main`，**When** 进入交付流程，**Then** Agent 把 `origin/main` 合入分支后才推送。
2. **Given** 合入产生冲突，**When** 解决冲突，**Then** 冲突处理按 Spec Kit 流程推进并在分支上留下独立提交。
3. **Given** 合入引入了依赖或锁文件变化，**When** 合入完成，**Then** Agent 重装依赖更新锁文件并重新运行质量门禁。
4. **Given** 合入与质量门禁全部通过，**When** 提交完成，**Then** Agent 推送分支并创建 PR。

---

### User Story 2 - 评论复核后重新同步基线 (Priority: P1)

PR 收到评审意见且确认存在缺陷时，Agent 按与提 PR 前相同的方式重新同步 `origin/main`，连同修复一起提交后重推。

**Why this priority**: 评审期间的修改同样可能与前进后的 `main` 冲突，只改缺陷不同步基线会把冲突推迟到合并前。

**Independent Test**: 在一个已收到评论的 PR 上让 `main` 前进，修复缺陷后重推，观察新提交包含 `origin/main` 的合入。

**Acceptance Scenarios**:

1. **Given** PR 收到评论并确认有缺陷，**When** 处理评论，**Then** Agent 在修复前把最新的 `origin/main` 合入分支。
2. **Given** 同步与修复完成，**When** 推送，**Then** Agent 重新运行质量门禁并重新进入 CI 等待。

---

### User Story 3 - 评论与合并合并成一个无上限等待 (Priority: P1)

PR 创建后，Agent 用一个等待同时处理评审意见与合并状态，不设时间上限；PR 一旦合并立即停止等待并开始清理。

**Why this priority**: 评论可能随时到来，合并由他人执行。分成两个有截止时间的等待会在评论迟迟不来时反复到期重启，也可能在合并后继续空等。

**Independent Test**: 让 PR 在创建后长时间无人评论，随后由他人合并，观察 Agent 全程只维持一个等待任务、期间不阻塞主会话，并在合并后立即清理。

**Acceptance Scenarios**:

1. **Given** PR 已可合并且无评论，**When** 等待进行，**Then** 等待持续运行且不因时间到达而结束。
2. **Given** 等待期间 PR 被合并，**When** 下一轮轮询，**Then** 等待立即结束并开始清理。
3. **Given** 等待期间收到评审意见，**When** 等待检测到新反馈，**Then** 等待结束、Agent 处理反馈后重新进入等待。
4. **Given** PR 被关闭且未合并，**When** 等待检测到关闭，**Then** 等待结束且不执行清理。
5. **Given** 等待期间 `main` 前进导致 PR 出现冲突，**When** 等待检测到冲突，**Then** 等待结束，Agent 同步基线后重推，然后依次重新等待 CI 与评论及合并。
6. **Given** 等待任务在后台运行，**When** 用户在主会话继续其他工作，**Then** 等待不阻塞主会话，结束后通知主会话。

### Edge Cases

- 等待任务被宿主中断：按当前 PR 状态重新启动一个等待，不复用已退出的任务。
- CI 单个检查长时间不结束：等待持续运行，不因时间到达而结束。
- PR 连续多轮收到反馈：每轮处理完回到同一个等待，同一时刻只保留一个等待任务。
- 反馈到达的同时 PR 被合并：以合并为先，先清理再报告遗留反馈。
- 合入 `origin/main` 没有新提交：跳过重装依赖与提交，直接推送。
- 冲突、CI 报错与评论缺陷同时出现：先同步基线，再修 CI 报错与缺陷，然后依次重新等待 CI 与评论及合并。
- 冲突涉及 spec、plan 与 tasks：按 Spec Kit 流程重新推进受影响的阶段，改动落在独立提交里。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 交付流程 MUST 在推送分支前把最新的 `origin/main` 合入特性分支。
- **FR-002**: 合入产生冲突时，冲突处理 MUST 按 Spec Kit 流程推进，结果 MUST 落在独立提交里。
- **FR-003**: 合入改变了依赖或锁文件时，交付流程 MUST 重装依赖并更新锁文件。
- **FR-004**: 合入完成后，交付流程 MUST 重新运行质量门禁，全部通过后才推送。
- **FR-005**: 合入结果、锁文件更新与原改动 MUST 提交完成后才推送分支并创建 PR。
- **FR-006**: 收到评审意见并确认存在缺陷时，交付流程 MUST 在修复前重复 FR-001 到 FR-005 的同步步骤。
- **FR-007**: 交付流程 MUST 用一个等待同时处理评审意见、冲突状态与合并状态。
- **FR-008**: 全部等待 MUST NOT 设置时间上限。
- **FR-009**: PR 合并时，等待 MUST 立即结束并进入清理。
- **FR-010**: PR 被关闭且未合并时，等待 MUST 结束且 MUST NOT 执行清理。
- **FR-011**: 同一时刻 MUST 只保留一个等待任务。
- **FR-012**: 等待结束后重新进入时 MUST 新建等待任务。
- **FR-013**: 交付流程 MUST NOT 自行合并 PR。
- **FR-014**: 交付流程 MUST 只处理评审意见带来的缺陷、CI 报错与冲突；MUST NOT 关注合并操作本身是否带来问题。
- **FR-015**: 等待期间 MUST 复查 PR 与基线的冲突状态；出现冲突时 MUST 结束等待，同步基线后重推，再依次重新等待 CI 与评论及合并。
- **FR-016**: 每个等待 MUST 作为后台任务运行，MUST NOT 阻塞主会话，结束或产出结果时 MUST 通知主会话。

*FR-014 说明：点击合并由合并者执行，合并后的问题由合并者负责，本地流程以 PR 合并为终点。*

### Key Entities

- **基线同步**: `origin/main` 的合入结果、冲突解决提交、锁文件更新。
- **交付等待**: 后台轮询评审反馈、冲突状态与 PR 状态，无时间上限，终止条件为合并、关闭或出现冲突。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 交付流程创建的 PR，其分支包含创建时刻最新的 `origin/main` 提交。
- **SC-002**: 交付流程期间同时运行的等待任务数量不超过 1。
- **SC-003**: PR 合并后，Agent 在下一轮轮询内结束等待并开始清理。
- **SC-004**: 等待不因时间到达而结束，长时间无人评论或单个 CI 检查卡住的 PR 不会触发反复重启。
- **SC-005**: 因评论而重推的提交流程中，分支包含当次同步的 `origin/main`。
- **SC-006**: 等待运行期间主会话可继续处理其他指令。

## Assumptions

- 全部等待都无时间上限，作为后台任务运行，不阻塞主会话。
- 合并由用户或上游维护者执行，本流程只轮询。
- 依赖安装使用仓库现有的安装命令，执行后锁文件处于一致状态。
- 等待任务的轮询间隔与后台机制沿用现有实现，本次只改变终止条件。
- 无时间上限的等待在宿主会话存续期间运行。
