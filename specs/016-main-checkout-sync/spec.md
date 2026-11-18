# Feature Specification: 主工作区约束与 main 同步

**Feature Branch**: `docs/016-main-checkout-sync`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "1. `AGENTS.md`、`.specify/memory/constitution.md` 增加说明：主工作区必须 main 分支，主工作区必须干净，在主工作区只允许 pull、fetch，任何变更无论性质都在 worktree 进行。2. 调整流程：开始前、结束后都要将主工作区的 main 和 origin 同步。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-18

- Q: 主工作区约束写在哪里？ → A: 只写在 `AGENTS.md`。该约束适用于每个会话，与变更过程无关，宪章不增加条目。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 主工作区只用于同步 (Priority: P1)

Agent 在任何会话中收到变更要求时，从文档得知主工作区的约束，把全部改动放进 worktree，主工作区保持在 `main` 且干净。

**Why this priority**: 主工作区是所有 worktree 的创建起点与清理落点。主工作区出现分支切换或未提交改动时，后续需求的基线与清理都会出错。

**Independent Test**: 只读 `AGENTS.md`，能列出主工作区的约束与唯一允许的两种 git 操作。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 查找主工作区约束，**Then** 看到主工作区 MUST 位于 `main` 分支。
2. **Given** `AGENTS.md`，**When** 查找主工作区约束，**Then** 看到主工作区 MUST 干净，即 `git status` 无已跟踪或未跟踪的改动。
3. **Given** `AGENTS.md`，**When** 查找主工作区允许的操作，**Then** 只有 `git fetch` 与 `git pull`。
4. **Given** `AGENTS.md`，**When** 查找变更位置，**Then** 看到任何变更 MUST 在 worktree 中进行，文档、配置、spec 与代码一视同仁。
5. **Given** 宪章，**When** 查找主工作区约束，**Then** 找不到相关条目，宪章版本保持 `2.0.0`。

---

### User Story 2 - 开始前主工作区 main 与 origin 一致 (Priority: P1)

Agent 开始新需求时，流程先把主工作区的 `main` 同步到 `origin/main`，再创建 worktree。

**Why this priority**: 本地 `main` 落后时，主工作区内的文件与 skill 是旧版本，Agent 会按过期流程执行。

**Independent Test**: 让主工作区 `main` 落后 `origin/main` 若干提交，执行开始流程，结束后两者指向同一提交。

**Acceptance Scenarios**:

1. **Given** 主工作区 `main` 落后 `origin/main`，**When** 开始新需求，**Then** 创建 worktree 前主工作区 `main` 与 `origin/main` 指向同一提交。
2. **Given** 主工作区位于其他分支，**When** 开始新需求，**Then** 流程停止并报告分支不符，不创建 worktree。
3. **Given** 主工作区有未提交改动，**When** 开始新需求，**Then** 流程停止并列出改动，不创建 worktree。
4. **Given** 主工作区 `main` 含有 `origin/main` 之外的本地提交，**When** 开始新需求，**Then** 流程停止并报告分叉，不改写本地提交。

---

### User Story 3 - 结束后主工作区 main 与 origin 一致 (Priority: P1)

需求交付合并或放弃后，流程在清理 worktree 时把主工作区的 `main` 同步到 `origin/main`。

**Why this priority**: 交付合并后 `origin/main` 已前进，主工作区不同步会让下一次会话读到旧文件。

**Independent Test**: 完成一次交付或放弃，清理结束后主工作区 `main` 与 `origin/main` 指向同一提交，且主工作区干净。

**Acceptance Scenarios**:

1. **Given** PR 已合并，**When** 结束流程完成清理，**Then** 主工作区 `main` 与 `origin/main` 指向同一提交，且包含刚合并的提交。
2. **Given** 用户放弃需求，**When** 结束流程完成清理，**Then** 主工作区 `main` 与 `origin/main` 指向同一提交。
3. **Given** 结束时主工作区不在 `main` 或不干净，**When** 执行同步，**Then** 流程报告原因并保留主工作区现状。

---

### Edge Cases

- 主工作区 `main` 已与 `origin/main` 一致：同步不产生提交，流程继续。
- 无法连接 `origin`：流程停止并报告网络错误，开始流程不创建 worktree。
- 会话已在 feature worktree 内：开始流程复用该 worktree，仍检查并同步主工作区。
- 被 `.gitignore` 忽略的文件：不计入「不干净」，例如 `worktrees/`、`node_modules/`、`dist/`。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `AGENTS.md` MUST 规定主工作区位于 `main` 分支。
- **FR-002**: `AGENTS.md` MUST 规定主工作区干净，判定依据为 `git status --porcelain` 输出为空。
- **FR-003**: `AGENTS.md` MUST 规定主工作区只允许 `git fetch` 与 `git pull`。
- **FR-004**: `AGENTS.md` MUST 规定任何变更都在 worktree 中进行，不区分变更性质。
- **FR-005**: 主工作区约束 MUST 只写在 `AGENTS.md`，宪章保持不变。
- **FR-006**: 开始流程 MUST 在创建 worktree 前检查主工作区满足 FR-001 与 FR-002，不满足时停止并报告。
- **FR-007**: 开始流程 MUST 以 fast-forward 方式把主工作区 `main` 同步到 `origin/main`，无法 fast-forward 时停止并报告。
- **FR-008**: 结束流程 MUST 在交付与放弃两种模式的清理阶段，以 fast-forward 方式把主工作区 `main` 同步到 `origin/main`。
- **FR-009**: 结束流程在主工作区不满足 FR-001 或 FR-002 时 MUST 报告原因并跳过同步，保留主工作区现状。
- **FR-010**: 同步结果 MUST 出现在流程输出中，包括是否更新与同步后的提交。
- **FR-011**: 开始与结束流程的检查与同步行为 MUST 由测试覆盖。
- **FR-012**: `docs/development.md` 中的流程说明 MUST 与新流程一致。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 执行开始流程后，主工作区 `main` 与 `origin/main` 的提交一致率为 100%。
- **SC-002**: 执行结束流程后，主工作区 `main` 与 `origin/main` 的提交一致率为 100%，且主工作区干净。
- **SC-003**: 主工作区不在 `main`、不干净或已分叉的 3 种情形，开始流程全部停止且不创建 worktree。
- **SC-004**: Agent 只读 `AGENTS.md`，能在 1 分钟内回答「主工作区允许哪些操作」。

## Assumptions

- 主工作区指 `git worktree list` 的第一项，即仓库根目录的检出。
- 「开始前」对应 `/speckit-worktree-create`，「结束后」对应 `/speckit-worktree-finish` 的清理阶段。
- 同步只做 fast-forward，不 rebase、不重置本地提交，避免丢失数据。
- 主工作区规则约束 Agent 行为。git 本身不拦截违规操作，流程脚本只在开始与结束时检查。
