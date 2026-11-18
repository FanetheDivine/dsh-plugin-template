# Feature Specification: 宪章精简

**Feature Branch**: `docs/015-constitution-slim`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "宪章只保留 IV 测试同步、V 文档结构、VI 质量门禁、VIII 公开引用四项。宿主契约与依赖归属里的一条约定保留：一切 cordis 与 dsh 子包以同版本 `@deepseek-ai/dsh` 为准，dsh 依赖版本完全相同且加入 `minimumReleaseAgeExclude`。删除『以 `@deepseek-ai/dsh` 最新发布为准』。模板转化步骤写进新文档，并在 `AGENTS.md` 特别说明。原则重新编号。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-18

- Q: 宿主依赖版本以什么为准？ → A: 一切 cordis 与 dsh 子包以同版本 `@deepseek-ai/dsh` 为准。
- Q: 「以 `@deepseek-ai/dsh` 最新发布为准」如何处理？ → A: 删除。准确意思是以同版本的 `@deepseek-ai/dsh` 为准。
- Q: 模板转化步骤放在哪里？ → A: 写入新文档，并在 `AGENTS.md` 中特别说明。
- Q: 原则是否重新编号？ → A: 重新编号，并同步现行文档中的编号引用。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Constitution Check 只核对硬约束 (Priority: P1)

执行 `/speckit-plan` 的 Agent 逐条核对宪章，每条原则都是跨需求长期不变、可以检验的约束。

**Why this priority**: 宪章混入了实现细节与操作步骤，每次需求都要逐条核对无关条目，宪章也因细节变化频繁修订。

**Independent Test**: 阅读宪章，原则只有五条：宿主依赖版本、测试同步、文档结构、质量门禁、公开引用。

**Acceptance Scenarios**:

1. **Given** 宪章，**When** 列出原则，**Then** 依次为宿主依赖版本、测试同步、文档结构、质量门禁、公开引用。
2. **Given** 宪章，**When** 查找宿主契约、依赖归属、严格配置、模板定位、国际化，**Then** 找不到这些原则。
3. **Given** 宪章版本行，**When** 查看版本，**Then** 为 `2.0.0`。

---

### User Story 2 - 宿主依赖版本有唯一依据 (Priority: P1)

维护者升级或新增宿主依赖时，按宪章确定每个 `@deepseek-ai/*` 依赖的版本，并同步 `minimumReleaseAgeExclude`。

**Why this priority**: 版本错位会让插件与宿主加载两份实例，漏列 `minimumReleaseAgeExclude` 会让 `pnpm install` 失败。

**Independent Test**: 读宪章的宿主依赖版本原则，对照 `package.json` 与 `pnpm-workspace.yaml`，能判定当前依赖是否合规。

**Acceptance Scenarios**:

1. **Given** 宪章，**When** 查找版本依据，**Then** 看到全部 cordis 与 dsh 子包以同版本 `@deepseek-ai/dsh` 为准。
2. **Given** 全部 `@deepseek-ai/dsh-*` 依赖，**When** 比较版本，**Then** 版本号完全相同。
3. **Given** 任一 `@deepseek-ai/dsh-*` 依赖，**When** 查看 `minimumReleaseAgeExclude`，**Then** 能找到同包名同版本的条目。
4. **Given** 某个 dsh 依赖版本不一致或漏列，**When** 运行测试，**Then** 测试失败。

---

### User Story 3 - 移出的规则仍能在归属文档中查到 (Priority: P2)

开发者在 `docs/` 中查到原宪章中宿主契约、依赖归属、严格配置与国际化的规则，现行文档的引用都能落到实处。

**Why this priority**: 规则移出宪章后若无去处，后续变更会丢失约束。

**Independent Test**: 逐条列出被移出原则的规则，每条都能在一个归属文档中找到；现行文档中不存在指向已删除原则的引用。

**Acceptance Scenarios**:

1. **Given** 原宿主契约与严格配置的规则，**When** 查阅 `docs/how-it-works.md`，**Then** 每条都能找到。
2. **Given** 原依赖归属的规则，**When** 查阅 `docs/`，**Then** 每条都能在一个文档中找到。
3. **Given** 原国际化原则，**When** 查阅 `docs/i18n.md`，**Then** 每条约束都能找到，且该文档不再链接宪章原则 IX。
4. **Given** 现行文档与 skill，**When** 查找宪章原则编号的引用，**Then** 每处编号都指向重新编号后的正确原则。

---

### User Story 4 - 模板转化有独立的操作文档 (Priority: P2)

开发者要把模板改造成实际插件时，从 `AGENTS.md` 的特别说明找到模板转化文档，按顺序完成全部步骤。

**Why this priority**: 模板转化是一次性流程，按步骤执行，与 Constitution Check 无关。

**Independent Test**: 只读 `AGENTS.md` 与模板转化文档，能列出原原则 VII 的全部转化步骤。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 查找模板转化，**Then** 看到特别说明与指向模板转化文档的链接。
2. **Given** 模板转化文档，**When** 对照原原则 VII，**Then** 修订宪章与 `AGENTS.md`、确认依赖升级、发布设置、清空过往 spec 与 changelog 等步骤全部出现，顺序一致。
3. **Given** `docs/development.md` 的 `publish` 解禁说明，**When** 查找步骤，**Then** 链接指向模板转化文档。

---

### Edge Cases

- 历史 `specs/` 与已发布的 CHANGELOG 条目中的旧原则编号保持原样。
- `@deepseek-ai/dsh` 发布中声明为版本范围的 cordis 子包，模板沿用同一范围。
- `@deepseek-ai/dsh` 发布中未直接声明的 `@deepseek-ai/dsh-*` 子包，版本与 `@deepseek-ai/dsh` 相同。
- 模板转化后，具体插件按模板转化文档修订宪章，宪章的宿主依赖版本原则继续适用。

## Requirements *(mandatory)*

### Functional Requirements

**宪章**

- **FR-001**: 宪章原则 MUST 依次为：I 宿主依赖版本、II 测试同步、III 文档结构、IV 质量门禁、V 公开引用。
- **FR-002**: 原则 II–V 的条款 MUST 与原原则 IV、V、VI、VIII 一致，仅更新其中的原则编号引用。
- **FR-003**: 原则 I MUST 写明：
  - 全部 cordis 与 dsh 子包以同版本 `@deepseek-ai/dsh` 为准。
  - 全部 `@deepseek-ai/dsh-*` 依赖的版本完全相同。
  - 每个 `@deepseek-ai/dsh-*` 依赖以同版本列入 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。
- **FR-004**: 宪章 MUST 删除原原则 I、II、III、VII、IX，以及「以 `@deepseek-ai/dsh` 最新发布为准」的规则。
- **FR-005**: 宪章修订 MUST 经 `/speckit-constitution` 进行，版本按 MAJOR 升到 `2.0.0`。

**规则迁移**

- **FR-006**: 原宿主契约与严格配置的规则 MUST 在 `docs/how-it-works.md` 中有完整表述。
- **FR-007**: 原依赖归属的规则 MUST 在 `docs/` 中的一个文档有完整表述。
- **FR-008**: 原国际化原则的约束 MUST 在 `docs/i18n.md` 中有完整表述。
- **FR-009**: 现行文档、skill 与扩展命令中的宪章原则编号引用 MUST 指向重新编号后的原则；指向已删除原则的引用 MUST 改为链接归属文档。

**模板转化**

- **FR-010**: 新增模板转化文档 MUST 承载原原则 VII 的模板转化步骤，顺序不变。
- **FR-011**: `AGENTS.md` MUST 增加特别说明：模板转化前先阅读模板转化文档。
- **FR-012**: `AGENTS.md` 文档索引 MUST 列出模板转化文档。

**回归**

- **FR-013**: 测试 MUST 校验全部 `@deepseek-ai/dsh-*` 依赖版本相同，且每个都以同版本列入 `minimumReleaseAgeExclude`。
- **FR-014**: 变更 MUST 通过 `pnpm format && pnpm check`。

### Key Entities

- **宪章原则**：Constitution Check 与 analyze 逐条核对的硬约束。
- **归属文档**：按宪章文档结构原则承载某条规则的唯一文档。
- **宿主依赖**：`package.json` 中的 `@deepseek-ai/*` 依赖，分为 dsh 子包与 cordis 子包。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 宪章原则数为 5，版本为 `2.0.0`。
- **SC-002**: 被移出原则的规则 100% 能在一个归属文档中找到。
- **SC-003**: 现行文档与 skill 中指向错误或已删除原则编号的引用数为 0。
- **SC-004**: 任一 dsh 依赖版本不一致或漏列 `minimumReleaseAgeExclude` 时，测试 100% 失败。
- **SC-005**: 只读 `AGENTS.md` 与模板转化文档，能列全原原则 VII 的转化步骤。
- **SC-006**: `pnpm check` 全部通过。

## Assumptions

- 「`@deepseek-ai/*` 依赖在该发布中没有对应版本时移除」随「最新发布」规则一并删除。
- 「每个需求在 spec 中声明变更类别」与「模板变更保持 `demo_echo` 可用」随原则 VII 移出宪章，写入模板转化文档。`demo_echo` 的可用性由现有测试保证。
- cordis 子包与 `@deepseek-ai/dsh` 声明的一致性在升级时人工核对，测试不联网。
- 宪章顶部的 Sync Impact Report 沿用仓库现有做法。
- 历史 `specs/` 与已发布的 CHANGELOG 不改。
- 依赖版本本身不升级。
