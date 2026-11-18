# Feature Specification: 协作场景的 spec 编号唯一性

**Feature Branch**: `fix/017-spec-number-uniqueness`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "在多人协同开发的时候 本地起新的spec没推到远程 就会导致重复"

## Clarifications

### Session 2026-11-18

- Q: 创建 spec 时，编号应在哪个时刻推送到远程、成为别人可见的占号依据？ → A: 建 worktree 时立即推送分支。
- Q: 推送占号失败（离线、无权限、远程不可达）时，创建流程应该怎么处理？ → A: 中止并回滚分支与 worktree。
- Q: 编号唯一性的校验应该在哪些节点执行？ → A: 创建时与 PR 前各校验一次。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 创建 spec 时在远程占号 (Priority: P1)

开发者执行 `/speckit-specify` 创建新 spec 后，团队其他成员的下一次创建能看到该编号已被占用。

**Why this priority**: 编号只存在于本地时，其他开发者无从感知，这是重复的根因。

**Independent Test**: 在两个克隆里先后创建 spec，比较两次分配的编号。

**Acceptance Scenarios**:

1. **Given** 开发者 A 已创建 spec 017 且远程存在对应分支，**When** 开发者 B 创建新 spec，**Then** B 拿到 018 或更大的编号。
2. **Given** A 的 spec 尚未合并到 `main`，**When** B 完成创建流程，**Then** A 的分支参与 B 的编号计算。

---

### User Story 2 - 同时创建时编号自动收敛 (Priority: P2)

两名开发者几乎同时创建 spec 并拿到同一编号，后写入远程的一方自动改用下一个编号。

**Why this priority**: 占号与推送之间存在时间窗，需要自动修复，避免人工重命名分支与目录。

**Independent Test**: 构造两个使用同一编号的分支，执行一次创建流程，检查编号结果。

**Acceptance Scenarios**:

1. **Given** 两个分支都使用编号 018，**When** 创建流程结束，**Then** 远程只有一个 spec 使用 018，另一个使用 019。
2. **Given** 发生改号，**When** 改号结束，**Then** 分支名、worktree 目录与 spec 目录使用同一个新编号。

---

### User Story 3 - 编号依据包含远程最新状态 (Priority: P3)

开发者本机未执行 `fetch` 时，创建 spec 仍能看到别人已推送的编号。

**Why this priority**: 过期的远程引用等价于看不到，同样会产生重复。

**Independent Test**: 在一个克隆推送新分支，在未 `fetch` 的另一个克隆创建 spec，检查编号。

**Acceptance Scenarios**:

1. **Given** 远程存在 `fix/018-other` 且本机没有该引用，**When** 开发者创建 spec，**Then** 新编号为 019 或更大。

### Edge Cases

- 开发者离线或没有推送权限。
- 同号分支已合并进 `main`，对应 spec 目录已存在。
- 编号被已废弃的 spec 占用。
- 两个同号分支的 short name 不同。
- 主工作区存在未推送的 spec 目录。
- 远程不可达导致同步失败。
- 同号冲突的多个分支同时改号。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 创建流程 MUST 在创建 worktree 前把同名分支推送到远程占号，占号成功后创建 worktree。
- **FR-002**: 分配编号前 MUST 同步远程全部分支的引用。
- **FR-003**: 编号 MUST 取远程分支、远程 `main` 的 spec 目录、本地分支与主工作区 spec 目录中的最大值加一。
- **FR-004**: 检测到多个分支使用同一编号时 MUST 保留一个，其余自动改号；改号发生在创建 worktree 之前，后续分支名、worktree 目录名与 spec 目录名统一使用新编号。
- **FR-005**: 改号顺序 MUST 确定：同号分支按完整分支名排序，保留第一个，其余依次改用后续空闲编号。
- **FR-006**: 占号失败时 MUST 中止创建并回滚分支与 worktree，且不留下 spec 目录。
- **FR-007**: 已占用的编号 MUST 不复用，已废弃 spec 的编号继续占用。
- **FR-008**: spec 目录名、worktree 目录名与分支名 MUST 使用同一编号，供后续流程按编号定位。
- **FR-009**: 编号唯一性 MUST 在创建时与 PR 前各校验一次；PR 前发现重复时 MUST 停止交付并报告冲突分支。

### Key Entities

- **Spec 编号**：三位数字，标识一个 spec；出现在分支名、worktree 目录名与 spec 目录名中。
- **Spec 目录**：`specs/<NNN>-<short-name>/`，随分支合并进入 `main`。
- **占号分支**：`<type>/<NNN>-<short-name>`，创建后立即推送，作为编号存在的依据。
- **远程引用列表**：同步后的 `origin/*` 分支，编号计算的输入。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 两个克隆先后创建 spec 时，编号重复次数为 0。
- **SC-002**: 创建 spec 结束时，远程分支存在率为 100%。
- **SC-003**: 同时创建产生的编号冲突在创建流程内收敛，人工改号次数为 0。
- **SC-004**: 现有 16 个 spec 的目录名与分支名保持不变。
- **SC-005**: 正常网络下，占号给创建流程增加的耗时不超过 5 秒。
- **SC-006**: 同号 spec 合入 `main` 的次数为 0。

## Assumptions

- 仓库使用单一远程 `origin`。
- 开发者拥有向 `origin` 推送分支的权限。
- 编号保持三位数字，现有编号不回填。
- 主工作区位于 `main` 且干净，按仓库现有约束。
- 创建 spec 时占号的成本低于事后改号的成本。
