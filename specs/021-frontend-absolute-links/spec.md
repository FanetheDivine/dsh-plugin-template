# Feature Specification: 前端 UI 链接使用完整 URL

**Feature Branch**: `021-frontend-absolute-links`

**Created**: 2026-11-20

**Status**: Approved

**Input**: User description: "开发docs的内容要改一下 前端a标签必须是完整的连接 不然desktop没法用" / "我说的是'插件的前端ui' 改development"

## Open Decisions

- 无未决项。

## Clarifications

### Session 2026-11-20

- [D-001] Q: 规则写进哪个文档？ -> A: `docs/development.md`（用户原文："改 development"）。
- [D-002] Q: 规则约束哪些链接？ -> A: 插件前端 UI 里的 `a` 标签（用户原文："插件的前端ui"）。

## Review Record

- 2026-11-20 | Decision: Approved | Scope: current full document | Open items: none | Risks: 详情文档不在本次范围；规则没有自动检查

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 模型按开发文档写出可用的前端链接 (Priority: P1)

模型开发插件的前端 UI 时，按 `docs/development.md` 的规则把 `a` 标签写成完整 URL，读者在 Desktop 中点击即可打开目标。

**Why this priority**: Desktop 以应用内地址加载前端页面，相对链接指向该应用地址，点击后打不开目标；插件交付后这些链接不可用。

**Independent Test**: 按 `docs/development.md` 在示例组件里加一个完整 URL 链接，构建后在 Desktop 中点击，确认打开目标页面。

**Acceptance Scenarios**:

1. **Given** 模型按 `docs/development.md` 编写前端 UI，**When** 添加指向外部页面的链接，**Then** `href` 是带协议与主机的完整 URL。
2. **Given** 前端 UI 含完整 URL 的链接，**When** 读者在 Desktop 中点击，**Then** 打开目标页面。

---

### User Story 2 - 维护者找到要求与原因 (Priority: P2)

维护者或模型查阅 `docs/development.md` 时，能在前端相关章节读到链接必须完整的要求和原因。

**Why this priority**: 要求与原因写在同一处，后续开发不必重新排查 Desktop 的链接问题。

**Independent Test**: 打开 `docs/development.md` 的前端章节，读到完整 URL 的要求和 Desktop 的链接行为说明。

**Acceptance Scenarios**:

1. **Given** 维护者查阅 `docs/development.md`，**When** 阅读前端章节，**Then** 看到 `a` 标签必须使用完整 URL 的要求与原因。

### Edge Cases

- 邮件等非 HTTP 链接：写完整协议，例如 `mailto:`。
- 行内代码与代码块中的路径示例：不按链接处理。
- 应用内跳转：由宿主提供的交互完成，不写相对 `href`。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `docs/development.md` MUST 在前端章节写明：前端 UI 里 `a` 标签的 `href` MUST 使用完整 URL。
- **FR-002**: 该规则 MUST 说明原因：Desktop 以应用内地址加载前端页面，相对链接打不开目标。
- **FR-003**: 该规则 MUST 给出完整 URL 的写法要求，即包含协议与主机。
- **FR-004**: 本次改动 MUST 只修改 `docs/development.md`，不改前端代码与现有链接。

### Key Entities

- **前端 UI**：插件在浏览器产物里渲染的界面，包括配置页与槽位组件。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 按 `docs/development.md` 写出的插件前端链接，在 Desktop 中 100% 可点击。
- **SC-002**: 维护者打开 `docs/development.md` 一次就能读到该要求与原因。
- **SC-003**: `pnpm check` 通过，仓库代码与产物没有变化。

## Assumptions

- 规则只约束插件前端 UI 里的 `a` 标签；`README.md` 与 `meta.detail` 详情文档不在本次范围。
- 现有文档与代码里的链接保持原样。
- 开发文档的读者包含开发插件的模型。
