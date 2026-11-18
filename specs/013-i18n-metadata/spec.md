# Feature Specification: 插件元数据国际化与规范

**Feature Branch**: `feat/013-i18n-metadata`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "为当前模板增加元数据的json；将国际化的规范写入文档和 .specify/memory/constitution.md"

**变更类别**: 模板变更（宪章原则 VII）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 插件面板显示本地化的标题与描述 (Priority: P1)

用户安装模板插件后，在“插件”页看到随宿主语言变化的插件标题与描述，不出现模板英文占位文案。

**Why this priority**: 插件行和详情页是用户看到的第一处界面；模板目前只有前端字典，元数据落到 `package.json` 的 `name` 与 `description`，切换语言后不变化。

**Independent Test**: 在真实宿主分别以中文和英文打开插件页，核对模板插件的标题、描述与详情页正文；停用插件时同样可见。

**Acceptance Scenarios**:

1. **Given** 宿主语言为中文，**When** 用户打开“插件”页，**Then** 模板插件的标题与描述为中文，内容说明示例工具、事件日志、配置页与前端示例行。
2. **Given** 宿主语言为英文，**When** 用户打开“插件”页，**Then** 标题与描述为英文，文案与中文含义一致。
3. **Given** 用户把宿主语言从中文切到英文，**When** 返回“插件”页，**Then** 标题与描述随语言切换，无需重载页面。
4. **Given** 宿主语言为未提供元数据的语言，**When** 用户打开“插件”页，**Then** 回落英文文案，不出现键名或空白。
5. **Given** 插件处于停用状态，**When** 用户查看其详情，**Then** 本地化的标题与描述照常显示。

---

### User Story 2 - 作者在一处查到国际化规范 (Priority: P2)

插件作者从模板继承骨架后，在一份文档里查到文案与元数据的写法、基线与回退规则、打包声明，并据此新增语言。

**Why this priority**: 宿主文档把这套事实分散在多个包中；模板的价值是把它们收拢成可直接照抄的规范。

**Independent Test**: 只读该文档，能给模板新增一种语言的元数据与前端字典，并让打包结果包含新增文件。

**Acceptance Scenarios**:

1. **Given** 作者阅读模板文档索引，**When** 查找国际化，**Then** 能在 `docs/` 下定位到唯一一份国际化说明。
2. **Given** 作者阅读该说明，**When** 按步骤新增一种语言，**Then** 得到元数据文件与字典注册两处改动点，以及打包声明。
3. **Given** 作者阅读该说明，**When** 查找基线语言、回退顺序与占位符规则，**Then** 三条都有明确结论，无需再查宿主文档。

---

### User Story 3 - 宪章约束国际化改动 (Priority: P2)

执行 Spec Kit 流程的 Agent 在 plan 与 analyze 阶段逐条核对国际化约束，遗漏基线语言或打包声明时被拦下。

**Why this priority**: 用户明确要求把规范写入宪章；宪章是 plan 的 Constitution Check 与 analyze 的核对依据。

**Independent Test**: 新增一条缺少英文字典或缺少 `files` 声明的改动，plan 或 analyze 能指出违反对应条款。

**Acceptance Scenarios**:

1. **Given** 作者只添中文字典，**When** 执行 plan 的 Constitution Check，**Then** 指出缺少英文基线字典。
2. **Given** 作者新增元数据文件但未更新打包声明，**When** 执行 check，**Then** 打包回归测试失败并指出缺失文件。
3. **Given** 宪章新增原则，**When** 查看宪章版本，**Then** 版本按语义化规则递增并记录修订说明。

---

### Edge Cases

- 元数据文件缺少 `meta.title` 或 `meta.description` 时，取 `package.json` 的 `name` 与 `description`，不显示空白。
- 中文与英文字典键集不一致时，编译期或测试报错，不静默回落。
- 文案含 `{name}` 占位符时，译文保留同名占位符。
- 新增语言只提供元数据、未提供前端字典时，界面文案回落英文，元数据使用该语言。
- 元数据 JSON 含非法 JSON 或多余的顶层键时，校验失败。
- 语言 id 不在宿主内置集合内时，文档说明其影响；模板基线语言固定为 `zh` 与 `en`。
- 元数据文案含本机路径或仓库外链接时，违反宪章原则 VIII。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 模板 MUST 提供 `zh` 与 `en` 两份插件元数据资源文件，各含 `meta.title` 与 `meta.description`。
- **FR-002**: 元数据文案 MUST 描述插件真实能力：`demo_echo` 工具、agent 事件日志、插件面板配置页、Web GUI 示例行。
- **FR-003**: 插件 MUST 导出元数据资源供宿主在不激活插件时读取。
- **FR-004**: 打包声明 MUST 包含元数据资源文件，发布内容 MUST 由打包回归测试覆盖。
- **FR-005**: 测试 MUST 校验元数据文件的 JSON 结构与必填字段，以及各语言键集一致。
- **FR-006**: 文档 MUST 在 `docs/` 下提供唯一一份国际化说明，覆盖元数据资源、前端字典、基线语言、回退顺序、占位符与打包声明。
- **FR-007**: `AGENTS.md` 的文档索引 MUST 增加该说明的条目。
- **FR-008**: 宪章 MUST 新增国际化原则，覆盖基线语言、文案来源、元数据归属与验证方式。
- **FR-009**: 宪章版本 MUST 按语义化规则递增，并在同步影响报告中记录改动。
- **FR-010**: `README.md` MUST 说明插件标题与描述随宿主语言切换。
- **FR-011**: 变更 MUST 通过 `pnpm format && pnpm check`。

### Key Entities

- **元数据资源文件**：`locale/<语言 id>.json`，含 `meta.title`、`meta.description`，可按需含 `meta.detail`。
- **前端字典**：按命名空间组织的键值表，中文与英文为基线，通过 locale 服务注册。
- **语言偏好**：用户在设置里选择的语言 id，决定元数据与界面文案的取值。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 中文与英文宿主下，插件标题与描述各自完整显示对应语言，无英文占位或键名。
- **SC-002**: 切换语言后，插件页文案在 1 秒内切换，无需刷新页面。
- **SC-003**: 发布 tarball 含全部元数据资源文件，缺一份即测试失败。
- **SC-004**: 作者只读一份文档，能在 10 分钟内为模板新增一种语言的元数据与字典。
- **SC-005**: 宪章新增条款可在 plan 的 Constitution Check 中逐条勾选，无条款歧义。
- **SC-006**: `pnpm check` 与实机核对全部通过。

## Assumptions

- 宿主版本沿用当前依赖 `0.2.2-rc.3`，其 locale 服务与插件元数据读取行为按安装版的包文档。
- 模板基线语言固定为 `zh` 与 `en`；其余内置语言按需补充，不默认提供。
- 元数据不声明 `meta.detail`，详情页回落到 `README.md`。
- 国际化说明归属 `docs/`，与宪章原则 V 的文档分工一致。
- 宪章修订按治理条款通过版本递增完成，不另开修订流程。
