# Feature Specification: 模板宿主依赖对齐 DSH 0.2.2-rc.3

**Feature Branch**: `chore/005-upgrade-dsh-deps`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "升级当前模板的 dsh 依赖到最新。所有『最新』以 `@deepseek-ai/dsh` 为准，如果有的包没到最新就扔掉。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-17

- Q: 「最新」取 `@deepseek-ai/dsh` 的哪个版本？ → A: 取最新发布的 `0.2.2-rc.3`，与运行中的宿主一致；`latest` 标签停在更旧的版本，不作为依据。
- Q: 与宿主版本不对齐的依赖如何处理？ → A: 从模板移除；本次三个宿主依赖都有对应版本，实际不触发移除。
- Q: `engines.node` 是否跟随 DSH 的 Node 24 要求？ → A: 跟随，改为 `>=24.9.0`。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 模板在 0.2.2-rc.3 宿主上可用 (Priority: P1)

插件作者克隆模板后运行 `pnpm check` 与实机测试，插件在 DSH 0.2.2-rc.3 上装载并工作。

**Why this priority**: 模板的依赖停留在 0.1.0-rc.8，与当前宿主相差多个版本，示例代码已引用了该版本不存在的事件。

**Independent Test**: 在 `0.2.2-rc.3` 宿主依赖下运行 `pnpm typecheck` 与 `pnpm test`，全部通过；实机测试装载插件并通过对话用例。

**Acceptance Scenarios**:

1. **Given** 模板的 `package.json`，**When** 查看 `@deepseek-ai/dsh-agent`、`@deepseek-ai/dsh-tools`，**Then** 版本为 `0.2.2-rc.3`。
2. **Given** 升级后的模板，**When** 运行 `pnpm typecheck`，**Then** 无类型错误。
3. **Given** 升级后的模板，**When** 在 0.2.2-rc.3 宿主上装载，**Then** 插件启用、日志出现 `apply` 记录、`demo_echo` 工具可调用。

---

### User Story 2 - 依赖版本以 `@deepseek-ai/dsh` 为准 (Priority: P1)

维护者升级模板时，以 `@deepseek-ai/dsh` 的发布版本决定每个宿主依赖的版本，不再依据各子包自己的 `latest` 标签。

**Why this priority**: 子包的 `latest` 标签落后于发布线，按标签升级会装回旧版本或误以为无法升级。

**Independent Test**: 逐项比对 `package.json` 的宿主依赖与 0.2.2-rc.3 宿主声明的版本，全部一致。

**Acceptance Scenarios**:

1. **Given** 0.2.2-rc.3 的 `@deepseek-ai/dsh`，**When** 查看其 cordis 声明，**Then** 模板使用同一范围 `~4.1.0`。
2. **Given** 模板的 `zod`，**When** 对比宿主实例，**Then** 两者版本都是 `4.6.6`。
3. **Given** 某个宿主依赖在目标版本没有发布，**When** 升级模板，**Then** 该依赖从 `package.json` 移除。

---

### User Story 3 - 示例事件与宿主事件表一致 (Priority: P2)

插件作者阅读 `src/events.ts` 时，看到的事件都在目标宿主的 `Events` 接口中，示例可以直接复制。

**Why this priority**: 示例引用不存在的 `agent/session-start`，新用户照抄后监听静默失效。

**Independent Test**: 对照 0.2.2-rc.3 的 `Events` 接口逐条核对监听列表。

**Acceptance Scenarios**:

1. **Given** `src/events.ts`，**When** 查找监听的事件名，**Then** 每个都在 `Events` 接口中定义。
2. **Given** 新建 agent，**When** 触发 `agent/created`，**Then** 日志同时记录 agent id 与来源。

### Edge Cases

- 本地开发机的 Node 为 22.x，`engines.node` 改为 `>=24.9.0` 后 `pnpm install` 只告警，不影响本次校验。
- `changelogs/` 中的历史归档描述当时版本，保持不变。
- 已发布的 `specs/001`–`004` 描述当时状态，保持不变。

## Requirements *(mandatory)*

### Functional Requirements

**依赖版本**

- **FR-001**: `@deepseek-ai/dsh-agent` 与 `@deepseek-ai/dsh-tools` MUST 为 `0.2.2-rc.3`。
- **FR-002**: `@deepseek-ai/cordis` MUST 使用宿主声明的范围 `~4.1.0`。
- **FR-003**: `zod` MUST 与宿主实例一致，为 `4.6.6`。
- **FR-004**: `@types/node` MUST 与新的 Node 要求匹配，使用 24.x。
- **FR-005**: 目标版本没有发布的 `@deepseek-ai/*` 依赖 MUST 从 `package.json` 移除。
- **FR-006**: `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` MUST 列出新的 `@deepseek-ai/dsh-*` 版本。
- **FR-007**: `pnpm-lock.yaml` MUST 重新解析到上述版本。

**Node 要求**

- **FR-008**: `engines.node` MUST 为 `>=24.9.0`，与 DSH 的运行要求一致。

**示例代码与测试**

- **FR-009**: `src/events.ts` MUST 只监听目标宿主 `Events` 接口中存在的事件，`agent/session-start` 不再出现。
- **FR-010**: `agent/created` 的日志 MUST 包含 agent id 与创建来源。
- **FR-011**: `tests/plugin.test.ts` MUST 断言事件集合与来源日志，覆盖 FR-009、FR-010。

**文档与记录**

- **FR-012**: CHANGELOG MUST 记录本次版本变化。
- **FR-013**: `docs/development.md` MUST 写明 Node 24.9 及以上的运行要求。
- **FR-014**: 收尾时 MUST 提醒用户按宪章原则 IV 执行实机测试，并说明新版本号。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `package.json` 中与 `@deepseek-ai/dsh` 0.2.2-rc.3 不一致的宿主依赖数为 0。
- **SC-002**: `pnpm typecheck` 的类型错误数为 0，`src/` 中引用不存在事件的次数为 0。
- **SC-003**: `pnpm format && pnpm check` 通过。
- **SC-004**: CHANGELOG 的 Unreleased 节包含本次升级条目。

## Assumptions

- 目标版本为 `0.2.2-rc.3`，即 `@deepseek-ai/dsh` 最新发布且与运行中的宿主一致。
- 宿主提供的依赖保持 external，`tsdown.config.ts` 的 `neverBundle` 不需要改动。
- 实机测试由用户在验收时执行，本次只提醒。