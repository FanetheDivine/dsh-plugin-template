# Feature Specification: npm 12 下包内容测试兼容

**Feature Branch**: `fix/018-npm12-pack-json`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "发布 job 失败的原因找到了：npm install -g npm@latest 把 npm 升到 12.2.3，而 npm 12 的 npm pack --json 返回以包名为键的对象，tests/package-pack.test.ts 只处理数组。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-18

- Q: 修复落在哪里？ → A: 只修模板。下游 `dsh-plugin-lark-bridge` 与 `dsh-plugin-meta-tools` 的发布失败由各自仓库同步该测试文件解决。
- Q: publish job 的 `npm install -g npm@latest` 怎么处理？ → A: 删掉升级步骤，使用 Node 24 自带的 npm（11.19.1，满足 OIDC 要求的 11.5.1）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 包内容测试在 npm 11 与 npm 12 下都通过 (Priority: P1)

开发者在装了 npm 11 或 npm 12 的机器上运行 `pnpm test:dist`。测试读到 `npm pack --dry-run --json` 的输出后照常解析文件列表，断言 tarball 内容，不因 npm 主版本不同而失败。

**Why this priority**: 这是发布 job 失败的直接原因。模板产出的插件在打 tag 时，publish job 的 `Build` 步骤执行 `test:dist`，解析报 `report.flatMap is not a function`，构建中断，发布不执行。

**Independent Test**: 用 npm 12.2.3 与 npm 11.19.1 各跑一次 `pnpm test:dist`，两次都通过且断言项相同。

**Acceptance Scenarios**:

1. **Given** npm 11 输出数组 `[{ files: [...] }]`，**When** 解析打包报告，**Then** 得到所有包的文件路径集合。
2. **Given** npm 12 输出以包名为键的对象 `{ "pkg": { files: [...] } }`，**When** 解析打包报告，**Then** 得到同样的文件路径集合。
3. **Given** 报告中的包缺少 `files` 字段，**When** 解析打包报告，**Then** 跳过该包，不抛错。
4. **Given** 报告既不是数组也不是对象，**When** 解析打包报告，**Then** 抛错并带出实际输出的前若干字符。

---

### User Story 2 - 发布 job 的 npm 版本由 Node 提供 (Priority: P1)

维护者在启用模板的 publish job 后打 tag 发布。工作流不再自行升级 npm，使用 `actions/setup-node` 安装的 Node 24 自带 npm。

**Why this priority**: `npm@latest` 是随时间漂移的输入。npm 12 发布当天，未改动的仓库只要打 tag 就会失败。

**Independent Test**: 阅读 `.github/workflows/ci.yml`，publish job 中没有安装或升级 npm 的步骤；日志中的 npm 版本等于 Node 24 自带版本。

**Acceptance Scenarios**:

1. **Given** `.github/workflows/ci.yml`，**When** 查看 publish job 的步骤，**Then** 不存在 `npm install -g npm@latest`。
2. **Given** `.github/workflows/ci.yml`，**When** 查看 publish job 的注释，**Then** 写明 OIDC 要求的 npm 下限由 Node 24 自带版本满足。
3. **Given** publish job 运行 `npm publish`，**When** 查看 npm 版本，**Then** 版本来自 Node 24 的安装包，与 Node 版本绑定。

---

### User Story 3 - 文档写明 npm 版本来源 (Priority: P2)

维护者阅读 `docs/development.md` 的 CI 节，知道 CI 的 npm 来自 Node，不来自工作流。

**Why this priority**: 模板转化与排障都依赖这条信息。文档缺失时，下次失败仍要重新定位。

**Independent Test**: 只读 `docs/development.md` 的 CI 节，能回答 CI 里 npm 的版本来源与 OIDC 的版本下限。

**Acceptance Scenarios**:

1. **Given** `docs/development.md`，**When** 查看 CI 节的 `publish` 行，**Then** 写明 npm 由 Node 24 自带、下限 11.5.1 来自 OIDC。

---

### Edge Cases

- 报告是空对象 `{}` 或空数组：解析得到空集合，文件断言失败，报错指向缺失文件。
- 报告含多个包：合并全部包的文件路径。
- `npm pack` 非零退出：沿用现有错误信息，包含 stderr。
- 输出含 npm 的告警行：JSON 解析失败时沿用现有错误，解析函数只处理已解析对象。
- 同一进程内多次调用：沿用现有缓存，只执行一次 `npm pack`。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 打包报告的解析 MUST 接受数组形状，元素为单个包的报告。
- **FR-002**: 打包报告的解析 MUST 接受以包名为键的对象形状，值为单个包的报告。
- **FR-003**: 解析 MUST 汇总所有包的 `files[].path`；缺少 `files` 的包直接跳过。
- **FR-004**: 解析遇到数组与对象之外的形状 MUST 抛错，错误信息包含实际输出片段，便于定位 npm 的输出变化。
- **FR-005**: 解析逻辑 MUST 独立成可单元测试的函数，`tests/package-pack.test.ts` 调用它。
- **FR-006**: 单元测试 MUST 覆盖数组形状、对象形状、缺 `files`、非法形状四类输入。
- **FR-007**: `.github/workflows/ci.yml` 的 publish job MUST NOT 安装或升级 npm。
- **FR-008**: publish job 的注释 MUST 说明 OIDC 的 npm 下限与 Node 24 自带版本的对应关系。
- **FR-009**: `docs/development.md` 的 CI 节 MUST 写明 CI 中 npm 的版本来源。
- **FR-010**: `tests/package-pack.test.ts` 的断言项 MUST 保持不变，仍校验进包与不进包的文件。

### Key Entities

- **打包报告**：`npm pack --json` 的解析结果。npm 11 是数组，npm 12 是以包名为键的对象。每个包含 `files[].path`。
- **文件路径集合**：测试断言使用的 tarball 内容，由打包报告汇总得到。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: npm 11.19.1 与 npm 12.2.3 下 `pnpm test:dist` 各运行一次，两次全部通过。
- **SC-002**: 解析函数的单元测试覆盖四类输入，全部通过。
- **SC-003**: `pnpm full-check` 通过，包含类型检查、lint、`test:code` 与 `build`。
- **SC-004**: publish job 的步骤数与 `npm install -g npm@latest` 步骤被移除前的基线相比减少 1。
- **SC-005**: 模板转化后的插件打 tag 时，publish job 的 `Build` 步骤不再出现 `report.flatMap is not a function`。

## Assumptions

- Node 24 自带 npm 11.19.1，满足 Trusted Publishing 的 npm ≥ 11.5.1 要求。
- npm 12 的对象键是包名，值与原数组元素结构相同，都含 `files[].path`。
- npm 12 的 `npm publish` 仍支持 OIDC，发布行为不属于本次范围。
- 修复只落在模板仓库；下游插件仓库按需同步 `tests/package-pack.test.ts`。
- `tests/package-pack.test.ts` 之外的测试不读取 `npm pack` 输出。
