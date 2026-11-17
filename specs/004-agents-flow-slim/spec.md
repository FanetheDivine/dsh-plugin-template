# Feature Specification: AGENTS.md 开发流程精简与文档归属调整

**Feature Branch**: `docs/004-agents-flow-slim`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "AGENTS.md 38 行之后的内容可以内化到各个 skill 里吗。已被 skill 覆盖的规则从 AGENTS.md 删除，『每阶段一个 commit』与『[P] 任务交给子代理』留在 AGENTS.md。主工作区把开发流程从宪章移到 AGENTS.md 的未提交改动一并提交。AGENTS.md 归属改为『通用的信息和指令』，宪章归属改为『变更过程中必须遵循的硬约束』。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-17

- Q: 未被 skill 覆盖的两条实施规则放在哪里？ → A: 留在 `AGENTS.md`。
- Q: 主工作区的未提交改动如何处理？ → A: 带进本 worktree，随本次变更提交。
- Q: 开发流程归属与原则 V 冲突如何处理？ → A: 流程放在 `AGENTS.md`。`AGENTS.md` 归属改为「通用的信息和指令」，宪章归属改为「变更过程中必须遵循的硬约束」。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent 读到无重复的开发流程 (Priority: P1)

Agent 读取 `AGENTS.md` 后得到 Spec Kit 步骤表与两条 skill 未覆盖的实施规则。分支、worktree、澄清与收尾规则由对应 skill 提供。

**Why this priority**: 同一规则写在 `AGENTS.md` 和 skill 两处，修改时容易不一致，也增加每个会话的上下文。

**Independent Test**: 逐条核对 `AGENTS.md` 开发流程节，每条规则都没有被 skill 或其调用的脚本覆盖。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 阅读开发流程节，**Then** 看到步骤表、「每个阶段一个 commit」与「`[P]` 任务可交给子代理并行」。
2. **Given** `AGENTS.md`，**When** 查找分支命名、worktree 位置、澄清时机、收尾步骤，**Then** 这些规则不在其中。
3. **Given** `speckit-worktree-create`、`speckit-plan`、`speckit-worktree-finish`，**When** 核对被删规则，**Then** 每条都能在其中找到。

---

### User Story 2 - 文档归属与实际内容一致 (Priority: P1)

维护者按宪章原则 V 判断一条信息该写在哪里，结论与仓库现状一致。

**Why this priority**: 开发流程已在 `AGENTS.md`，原则 V 仍把它归给宪章，两者冲突。

**Independent Test**: 阅读原则 V 的文档结构表，再看 `AGENTS.md` 与宪章的实际内容，两者一致。

**Acceptance Scenarios**:

1. **Given** 原则 V，**When** 查看 `AGENTS.md` 的归属，**Then** 为「通用的信息和指令」。
2. **Given** 原则 V，**When** 查看宪章的归属，**Then** 为「变更过程中必须遵循的硬约束」。
3. **Given** 宪章，**When** 查找开发流程节，**Then** 该节不存在。
4. **Given** 仓库内文档，**When** 点开指向开发流程的链接，**Then** 链接指向 `AGENTS.md` 的开发流程节。

### Edge Cases

- skill 由 spec-kit 或 worktree 扩展生成，本次保持 skill 内容不变。
- 历史 `specs/` 与 CHANGELOG 已发布条目描述当时状态，保持不变。

## Requirements *(mandatory)*

### Functional Requirements

**AGENTS.md**

- **FR-001**: `AGENTS.md` 开发流程节 MUST 保留 Spec Kit 步骤表。
- **FR-002**: `AGENTS.md` MUST 保留两条实施规则：每个阶段对应一个 commit；阶段内 `[P]` 任务可交给子代理并行。
- **FR-003**: `AGENTS.md` MUST 删除已被 skill 覆盖的分支与 worktree、澄清、收尾规则。

**宪章**

- **FR-004**: 宪章 MUST 删除开发流程节。
- **FR-005**: 原则 V 中 `AGENTS.md` 的归属 MUST 为「通用的信息和指令」。
- **FR-006**: 原则 V 中宪章的归属 MUST 为「变更过程中必须遵循的硬约束」。
- **FR-007**: 宪章修订 MUST 经 `/speckit-constitution` 进行，按语义化规则递增版本号并更新 Sync Impact Report。

**引用**

- **FR-008**: 仓库内指向宪章开发流程节的链接 MUST 改为指向 `AGENTS.md` 的开发流程节。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `AGENTS.md` 开发流程节中被 skill 覆盖的规则数为 0。
- **SC-002**: 原则 V 文档结构表与 `AGENTS.md`、宪章的实际内容逐行一致。
- **SC-003**: 仓库内指向宪章 `#开发流程` 的链接数为 0。
- **SC-004**: `pnpm format && pnpm check` 通过。

## Assumptions

- 「被 skill 覆盖」包括 skill 调用的脚本中实现的规则，例如 `create-worktree.sh` 的分支命名校验。
- CHANGELOG 按宪章原则 V 的分支规则在 push 时由 `/speckit-worktree-finish` 补充。
