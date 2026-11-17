# Feature Specification: AGENTS.md 立即触发 speckit-specify

**Feature Branch**: `docs/007-specify-trigger`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "1. ask_user_question 的那句删除。2. 表格的 skill 去除斜杠。3. 『before_specify 钩子先运行 xxx』删除。4. 『仓库内的任何变更 xxx』改为『在用户给出需求、缺陷或其他变更要求时，**立刻**获取 skill `speckit-specify` 的内容，并按流程推进』。"

**变更类别**: 模板变更

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent 收到变更要求后立刻进入 Spec Kit 流程 (Priority: P1)

用户在会话中给出需求、缺陷或其他变更要求。Agent 的第一个动作是获取 skill `speckit-specify` 的内容，并按流程推进，期间不询问是否走流程。

**Why this priority**: Agent 当前会先询问是否走 Spec Kit 流程，延迟进入 `speckit-specify`。

**Independent Test**: 在新会话中提出一个变更要求，观察 Agent 的第一个工具调用是否为获取 skill `speckit-specify`。

**Acceptance Scenarios**:

1. **Given** 新会话，**When** 用户给出一个需求，**Then** Agent 第一个动作是获取 skill `speckit-specify` 的内容。
2. **Given** 新会话，**When** 用户报告一个缺陷，**Then** Agent 第一个动作是获取 skill `speckit-specify` 的内容。
3. **Given** `AGENTS.md`，**When** 阅读开发流程节，**Then** 看到「在用户给出需求、缺陷或其他变更要求时，**立刻**获取 skill `speckit-specify` 的内容，并按流程推进」。

---

### User Story 2 - AGENTS.md 去除诱发确认与重复的内容 (Priority: P2)

Agent 读取 `AGENTS.md` 时，看不到鼓励先提问的指令、斜杠命令写法和钩子细节。

**Why this priority**: 这三处内容会让 Agent 把 skill 当作用户命令、预期重副作用并先征求确认。钩子细节已由 `speckit-specify` 与 `.specify/extensions.yml` 提供。

**Independent Test**: 在 `AGENTS.md` 中搜索 `ask_user_question`、`/speckit-` 与 `before_specify`，结果为空。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 搜索 `ask_user_question`，**Then** 无匹配。
2. **Given** `AGENTS.md` 步骤表，**When** 查看 skill 列，**Then** 每个 skill 名都不带前导斜杠。
3. **Given** `AGENTS.md` 步骤表第 1 步，**When** 查看执行条件与要求，**Then** 只写「必做」。

### Edge Cases

- skill 文件、`.specify/extensions.yml` 与宪章保持不变。
- 历史 `specs/` 与 CHANGELOG 已发布条目描述当时状态，保持不变。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `AGENTS.md` MUST 删除「优先通过ask_user_question和用户交互。」一句。
- **FR-002**: `AGENTS.md` 步骤表中的 skill 名 MUST 去除前导斜杠。
- **FR-003**: `AGENTS.md` 步骤表第 1 步 MUST 删除「`before_specify` 钩子先运行 `/speckit-worktree-create` 创建分支与 worktree」，只保留「必做」。
- **FR-004**: `AGENTS.md` 开发流程节的首句 MUST 为「在用户给出需求、缺陷或其他变更要求时，**立刻**获取 skill `speckit-specify` 的内容，并按流程推进。」
- **FR-005**: `AGENTS.md` 其余内容 MUST 保持不变。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `AGENTS.md` 中 `ask_user_question`、`/speckit-`、`before_specify` 的匹配数均为 0。
- **SC-002**: 在新会话中提出变更要求，Agent 第一个动作为获取 skill `speckit-specify`，期间不询问是否走流程。
- **SC-003**: `pnpm format && pnpm check` 通过。

## Assumptions

- 「获取 skill 的内容」指通过宿主的 skill 工具加载 `speckit-specify`。
- CHANGELOG 按宪章原则 V 的分支规则在 push 时由 `speckit-worktree-finish` 补充。
- 仓库内其他文档没有复述被删除的内容，无需同步修改。
