# Feature Specification: CI 统一 Node 24 与发布开关

**Feature Branch**: `main`（本次直接在 main 提交，不使用 worktree）

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "项目统一改为24（本机不用动）；publish暂时禁用；宪章里写明如果要把模板转化为具体插件，要把package.json的版本设置为空且把publish解禁，注意提醒用户设置npm trusted publishing"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - CI 只在 Node 24 上校验 (Priority: P1)

维护者提交 PR 或打 tag 时，CI 的 `check` job 在 Node 24 上运行类型检查、lint、测试与构建。

**Why this priority**: 两个 job 版本不一致时，Node 24 那条支持线从未被验证，测试结果无法代表实际运行环境。

**Independent Test**: 推送一个 PR，确认 `check` job 的 `setup-node` 输出为 Node 24，且 `pnpm run full-check` 通过。

**Acceptance Scenarios**:

1. **Given** 仓库的 `ci.yml`，**When** 打开 `check` job，**Then** `node-version` 为 `24`。
2. **Given** 一次 PR 推送，**When** CI 运行，**Then** `check` job 使用 Node 24 并执行 `pnpm run full-check`。

---

### User Story 2 - 模板阶段不会误发布 (Priority: P1)

模板仓库打 tag 时，npm 发布 job 被跳过，仓库只做校验。

**Why this priority**: 模板本身不是可用插件，误发布会把示例实现推到 npm。

**Independent Test**: 用一个 tag 触发工作流，确认 `publish` job 状态为 skipped，npm 上无新版本。

**Acceptance Scenarios**:

1. **Given** 默认配置，**When** 推送 tag，**Then** `publish` job 被跳过。
2. **Given** 默认配置，**When** 查看 `ci.yml`，**Then** `publish` job 定义仍完整保留，仅被一个条件禁用。

---

### User Story 3 - 模板转化时有固定的发布步骤 (Priority: P2)

把模板改造成具体插件的人，在宪章里查到发布相关的完整步骤。

**Why this priority**: 这些步骤删掉了就没人记得，漏掉版本号或 Trusted Publisher 会让首次发布失败。

**Independent Test**: 打开宪章原则 VII，按条目逐项核对：清空版本号、解禁 `publish`、提醒用户配置 npm Trusted Publisher。

**Acceptance Scenarios**:

1. **Given** 宪章原则 VII，**When** 阅读模板转化要求，**Then** 看到清空 `package.json` 版本号、解禁 `publish`、提醒用户设置 npm Trusted Publisher 三条。
2. **Given** `ci.yml` 的 `publish` job，**When** 读注释，**Then** 能定位到解禁方式与宪章对应条目。

### Edge Cases

- 本地 Node 仍为 22：`engines` 保持 `^22.19.0 || >=24.0.0`，本地安装与构建不受影响。
- 解禁 `publish` 后版本号仍为空：`npm publish` 会失败，宪章要求先填入具体插件的版本号。
- 历史 tag 再次触发：`publish` 依旧跳过，`check` 正常运行。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `.github/workflows/ci.yml` 的 `check` job MUST 使用 Node 24。
- **FR-002**: `publish` job MUST 保留完整定义，并被 `if: false` 默认禁用。
- **FR-003**: 原触发条件 `if: startsWith(github.ref, 'refs/tags/')` MUST 以注释形式保留，注释同时说明解禁方式。
- **FR-004**: 宪章原则 VII MUST 写明模板转化的发布步骤：
  - 清空 `package.json` 的 `version`。
  - 解禁 `publish` job。
  - 提醒用户把 npm Trusted Publisher 绑定到新仓库与工作流。
- **FR-005**: `docs/development.md` MUST 同步 CI 的 Node 版本与发布开关，文件地图的描述一并更新。
- **FR-006**: `CHANGELOG.md` MUST 记录本次变更。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `pnpm run full-check` 在 Node 24 环境通过。
- **SC-002**: 打 tag 的工作流里 `publish` 为 skipped，`check` 为 success。
- **SC-003**: 宪章中能一处查全模板转化的三条发布步骤。

## Assumptions

- 本机 Node 版本不升级，`engines` 与 `pnpm install` 的行为保持现状。
- `publish` job 中的 Node 24、`registry-url` 与 `npm install -g npm@latest` 步骤保留，解禁即可用。