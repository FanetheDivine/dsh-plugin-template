# Feature Specification: README 面向用户与宪章文档结构调整

**Feature Branch**: `docs/024-readme-user-facing`

**Created**: 2026-11-24

**Status**: Approved

**Input**: User description: "调整readme和相关宪章 1. readme面向用户 只需要简介即可 配合npm徽标 用户自己会在dsh安装 以及一些常见问题 开发者的提示等 2. readme不算技术文档 不被“内容唯一”计算在内"

**变更类别**: 模板变更

## Open Decisions

无。

## Clarifications

### Session 2026-11-24

- [D-001] Q: 变更类别？ -> A: 模板变更。
- [D-002] Q: README 保留哪些章节？ -> A: 标题与徽标、简介、功能列表、使用建议；删除安装、配置、工具三节。
- [D-003] Q: npm 徽标放哪些？ -> A: 只放版本徽标，图片用 shields.io，链接到 npmjs.com 的包页。
- [D-004] Q: 常见问题包含哪些条目？ -> A: 常见问题与开发者提示合并为「使用建议」，面向插件用户，只写与插件具体功能相关、容易混淆的点，例如易混淆的配置。通用问题不写。默认不需要，视插件情况补充；本模板不写该节。
- [D-005] Q: 开发者提示写哪些内容？ -> A: 并入 D-004 的「使用建议」，README 不含面向开发者的内容。
- [D-006] Q: README 中指向仓库文件的链接用什么形式？ -> A: GitHub 绝对 URL。
- [D-007] Q: README 用什么语言？ -> A: 只写中文。
- [D-008] Q: 宪章原则 III 如何修订？ -> A: 按新的 README 规范修订：README 行改为插件用户与「简介、功能、使用建议」；写明 README 不属于技术文档，不计入单一归属；同步要求随之调整。
- [D-009] Q: 宪章版本号如何递增？ -> A: MINOR，2.0.0 → 2.1.0。
- [D-010] Q: 引用 README 的其他文档是否同步？ -> A: 同步 `AGENTS.md` 索引条目与 `docs/template-conversion.md` 中「新用户能按 README 跑通」的表述。
- [D-011] Q: 模板转化的发布设置是否要求修改 `package.json` 的 `repository`？ -> A: 要求。转化步骤写明设置 `repository` 为新插件的仓库 URL；模板的 `package.json` 保持无该字段。

## Review Record

- 2026-11-24 | Decision: Approved | Scope: current full document | Open items: none | Risks: 包未发布时 npm 徽标显示 not found
- 2026-11-24 | Decision: Approved | Scope: current full document，含 D-011 与 FR-012 | Open items: none | Risks: 包未发布时 npm 徽标显示 not found

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 插件用户快速了解插件 (Priority: P1)

插件用户在 DSH 详情页或 npm 包页打开 README，读完简介与功能列表即可判断插件用途，通过 npm 徽标看到当前版本。

**Why this priority**: README 的读者是插件用户，简介是其核心内容。

**Independent Test**: 阅读 README，确认开头为徽标与简介，正文无安装命令、配置表、工具表与开发者内容。

**Acceptance Scenarios**:

1. **Given** 用户打开 README，**When** 阅读开头，**Then** 看到插件名、npm 版本徽标与一段简介。
2. **Given** 用户在 DSH 内安装插件，**When** 查阅 README，**Then** README 不要求用户执行安装命令。

---

### User Story 2 - 维护者按需补充使用建议 (Priority: P2)

具体插件存在易混淆的配置或功能时，维护者在 README 增加「使用建议」一节，只写与该插件功能相关的指导。

**Why this priority**: 使用建议按插件情况取舍，模板只需在规则中说明。

**Independent Test**: 阅读宪章原则 III，能判断「使用建议」何时增加、写什么。

**Acceptance Scenarios**:

1. **Given** 插件有两个容易混淆的配置项，**When** 维护者按宪章更新 README，**Then** 在「使用建议」中说明两者区别。
2. **Given** 本模板，**When** 阅读 README，**Then** 不含「使用建议」一节。

---

### User Story 3 - 维护者按新规则核对文档 (Priority: P2)

维护者与 Agent 依据宪章判断 README 的内容范围，并知道 README 不属于技术文档，可以复述其他文档。

**Why this priority**: 宪章决定后续每个 spec 如何维护 README。

**Independent Test**: 阅读宪章原则 III，能回答 README 的读者、内容范围与是否受单一归属约束。

**Acceptance Scenarios**:

1. **Given** README 的使用建议复述了 `docs/known-risks.md`，**When** 按宪章核对，**Then** 判定为合规。
2. **Given** 两份 `docs/` 文档相互复述，**When** 按宪章核对，**Then** 仍判定为违规。

### Edge Cases

- 包尚未发布到 npm 时，徽标显示 not found，README 其余内容不受影响。
- README 随 npm 包分发并作为 DSH 详情页，相对链接在两处无法解析，因此链接用 GitHub 绝对 URL。
- 模板转化后包名与仓库地址变化，徽标与链接随之更新。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: README MUST 以插件用户为读者，只写中文。
- **FR-002**: README MUST 依次包含插件名、npm 版本徽标、简介与功能列表。
- **FR-003**: npm 徽标 MUST 使用 shields.io 版本徽标，链接到 npmjs.com 上 `package.json` `name` 对应的包页。
- **FR-004**: README MUST 省略安装命令、配置表、工具表、实现细节与面向开发者的内容。
- **FR-005**: 「使用建议」一节 MUST 只在插件存在易混淆的功能或配置时出现，内容限于该插件的具体功能；本模板不含该节。
- **FR-006**: README 中指向仓库文件的链接 MUST 使用 GitHub 绝对 URL。
- **FR-007**: 宪章原则 III MUST 写明 README 不属于技术文档，不计入单一归属，可以复述其他文档。
- **FR-008**: 宪章原则 III MUST 把 README 的读者与归属内容改为插件用户与「简介、功能、使用建议」，并据此调整同步要求。
- **FR-009**: 宪章修订 MUST 把版本号递增到 2.1.0 并更新 Sync Impact Report。
- **FR-010**: `AGENTS.md` 索引条目与 `docs/template-conversion.md` MUST 与新的 README 范围一致。
- **FR-011**: README MUST 继续进入 npm 包，package-pack 测试保持通过。
- **FR-012**: `docs/template-conversion.md` 的发布设置 MUST 包含一步：在 `package.json` 设置 `repository` 为新插件的仓库 URL。

### Key Entities

- **README.md**：面向插件用户的介绍文档，随 npm 包分发，DSH 未声明 `meta.detail` 时作为详情页。
- **宪章原则 III**：文档结构与单一归属规则。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: README 不含安装命令、配置表、工具表与开发者内容。
- **SC-002**: README 含 npm 版本徽标、简介与功能列表。
- **SC-003**: 宪章原则 III 中能找到 README 不计入单一归属的明确条文，版本为 2.1.0。
- **SC-004**: `AGENTS.md` 与 `docs/template-conversion.md` 对 README 的描述与宪章一致。
- **SC-005**: `pnpm format && pnpm check` 通过。

## Assumptions

- 用户通过 DSH 的插件管理安装插件，README 不承担安装说明。
- 包名沿用 `package.json` 的 `name`，模板转化时随包名一起更新。
- `AGENTS.md`、宪章、`docs/` 与代码注释之间的单一归属规则不变。
- 配置项的说明由插件页配置表单展示，README 不重复列出。
