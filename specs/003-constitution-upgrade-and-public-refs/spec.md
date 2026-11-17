# Feature Specification: 模板转化确认 dsh 升级与提交内容公开引用

**Feature Branch**: `docs/003-constitution-upgrade-and-public-refs`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "constitution.md 改两点：1. 模板->插件转化时向用户确认要不要把 dsh 依赖升级到最新；2. 向 git 远程提交的内容必须引用公网 url 或者项目内的引用，不能把本机的相对引用提交到远程，资源必须对其他用户开放。主工作区 AGENTS 的变更也作为本次的一个变更。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-17

- Q: 公开引用规则覆盖哪些内容？ → A: 全部跟踪文件，包括代码、配置、文档、skill 与 `specs/`。`package.json` 禁止 `file:`、`link:` 指向仓库外。
- Q: `run-test.mjs` 报错信息中的本机路径示例如何处理？ → A: 本次改成占位符。
- Q: 模板转化时确认升级哪些 dsh 依赖？ → A: 全部 `@deepseek-ai/dsh-*` 依赖。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 模板转化时决定是否升级 dsh (Priority: P1)

开发者把模板转化为实际插件时，Agent 先询问是否把全部 `@deepseek-ai/dsh-*` 依赖升级到最新版本，再按回答执行。

**Why this priority**: 模板锁定的 dsh 版本可能落后。新插件从旧版本起步，会在首次发布前就面临升级成本。

**Independent Test**: 阅读宪章原则 VII，模板转化的步骤中包含「向用户确认是否升级 dsh 依赖」以及确认升级后的同步动作。

**Acceptance Scenarios**:

1. **Given** 一次模板转化，**When** Agent 执行发布设置之前，**Then** 先询问用户是否把全部 `@deepseek-ai/dsh-*` 依赖升级到最新版本。
2. **Given** 用户确认升级，**When** Agent 完成升级，**Then** `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 同步为新版本，并按原则 IV 提醒用户实机测试及新版本号。
3. **Given** 用户拒绝升级，**When** Agent 继续转化，**Then** dsh 依赖版本保持不变。

---

### User Story 2 - 推送到远程的内容对其他用户可用 (Priority: P1)

其他用户克隆仓库后，提交内容中的每个链接、路径与依赖都能解析：要么是公网 URL，要么是仓库内路径。

**Why this priority**: 指向作者本机的路径在其他用户的环境中不存在，文档链接失效，依赖无法安装。

**Independent Test**: 在宪章中查到公开引用原则；扫描全部跟踪文件，找不到指向仓库外本机资源的引用。

**Acceptance Scenarios**:

1. **Given** 宪章，**When** 查找引用规则，**Then** 看到提交内容只能引用公网 URL 或仓库内路径。
2. **Given** `package.json`，**When** 检查依赖，**Then** 没有 `file:`、`link:` 指向仓库外的依赖。
3. **Given** `.dsh/skills/real-device-test/scripts/run-test.mjs`，**When** 阅读 `RDT_REPO` 缺失时的报错，**Then** 示例路径为占位符。

---

### User Story 3 - 所有仓库变更都走 Spec Kit (Priority: P2)

Agent 读取 `AGENTS.md` 后知道仓库内的任何变更都按 Spec Kit 流程进行。

**Why this priority**: 主工作区已有该措辞改动，需要随本次变更提交。

**Independent Test**: `AGENTS.md` 的开发流程节写明「仓库内的任何变更都按照 Spec Kit 流程进行开发」。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 阅读开发流程节，**Then** 看到该措辞。

### Edge Cases

- 占位符路径，例如 `<repo>`、`file:///<repo>/dist/index.mjs`：属于格式说明，允许提交。
- 运行时生成、被 `.gitignore` 忽略的文件：不提交到远程，规则不约束。
- 本地回环地址，例如 `http://127.0.0.1:<port>`：属于运行时地址说明，允许提交。
- 用户要求升级但 npm 上没有更新版本：告知用户已是最新，版本保持不变。
- 私有或需要登录的 URL：其他用户无法访问，视为违反规则。

## Requirements *(mandatory)*

### Functional Requirements

**模板转化**

- **FR-001**: 宪章原则 VII 的模板转化步骤 MUST 包含：向用户确认是否把全部 `@deepseek-ai/dsh-*` 依赖升级到最新版本。
- **FR-002**: 用户确认升级时，宪章 MUST 要求：
  - 同步 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。
  - 按原则 IV 提醒用户实机测试，并说明新版本号。

**公开引用**

- **FR-003**: 宪章 MUST 新增原则：提交到 git 的内容只能引用公网 URL 或仓库内路径。
- **FR-004**: 该原则 MUST 覆盖全部跟踪文件，包括代码、配置、文档、skill 与 `specs/`。
- **FR-005**: 该原则 MUST 列出以下情况：
  - 禁止：本机绝对路径、指向仓库外的相对路径、`package.json` 中指向仓库外的 `file:` 或 `link:` 依赖、其他用户无权访问的 URL。
  - 允许：占位符路径、本地回环地址的运行时说明。
- **FR-006**: `.dsh/skills/real-device-test/scripts/run-test.mjs` 报错信息中的本机路径示例 MUST 改为占位符。

**其他**

- **FR-007**: `AGENTS.md` 开发流程节 MUST 写明仓库内的任何变更都按 Spec Kit 流程开发。
- **FR-008**: 宪章修订 MUST 经 `/speckit-constitution` 进行，按语义化规则递增版本号并更新 Sync Impact Report。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 宪章原则 VII 中能查到 dsh 升级确认步骤及确认后的同步动作。
- **SC-002**: 宪章中能一处查到公开引用规则及其允许与禁止的情况。
- **SC-003**: 扫描全部跟踪文件，指向仓库外本机资源的引用数为 0。
- **SC-004**: `pnpm format && pnpm check` 通过。

## Assumptions

- 「最新版本」指 npm 上已发布的最高版本，包含预发布版本。宿主目前只发布预发布版本。
- 升级确认放在模板转化的发布设置之前。
- CHANGELOG 按宪章原则 V 的分支规则在 push 时由 `/speckit-worktree-finish` 补充。
- 本次不新增自动化扫描测试，规则由 plan 的 Constitution Check 与 analyze 人工核对。
