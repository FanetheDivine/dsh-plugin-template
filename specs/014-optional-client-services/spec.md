# Feature Specification: 前端服务可选

**Feature Branch**: `feat/014-optional-client-services`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "需要调整模板 让前端服务可选。"

**变更类别**: 模板变更（宪章原则 VII）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 缺少部分前端服务时插件仍能启用 (Priority: P1)

用户在只提供部分前端服务的宿主中启用模板插件。插件启用成功，依赖已就绪服务的功能照常工作，依赖缺失服务的功能被跳过。

**Why this priority**: 模板当前把 `slots`、`locale`、`configForms` 全部声明为必需，任一服务缺失，整个前端入口都不启动。

**Independent Test**: 在模拟 `ctx` 中分别移除一个服务，调用前端 `apply`，核对启用结果与已注册的内容。

**Acceptance Scenarios**:

1. **Given** 宿主缺少 `configForms`，**When** 前端插件启用，**Then** 示例行与字典照常注册，配置页不注册，不抛错。
2. **Given** 宿主缺少 `locale`，**When** 前端插件启用，**Then** 配置页与示例行照常注册，字典不注册，不抛错。
3. **Given** 宿主缺少 `slots`，**When** 前端插件启用，**Then** 插件启用成功，不注册任何槽位内容，不抛错。
4. **Given** 三个服务都就绪，**When** 前端插件启用，**Then** 行为与现状一致。

---

### User Story 2 - 服务晚于插件就绪时功能自动补齐 (Priority: P2)

宿主先启动插件、后提供某个前端服务时，依赖该服务的功能在服务就绪后自动出现，服务消失后自动清理。

**Why this priority**: 可选服务的价值在于缺失不阻塞，也要在到达后生效。

**Independent Test**: 先在无 `configForms` 的上下文启用插件，再提供 `configForms`，核对配置页出现；撤掉服务后核对配置页被清理。

**Acceptance Scenarios**:

1. **Given** 插件已启用且 `configForms` 缺失，**When** `configForms` 变为可用，**Then** 配置页注册。
2. **Given** 配置页已注册，**When** `configForms` 被撤掉，**Then** 配置页及其表单资源被清理。

---

### User Story 3 - 作者能查到可选服务的写法 (Priority: P2)

插件作者在文档中查到前端服务可选的写法与取舍，并按同样方式声明自己的可选服务。

**Why this priority**: 模板的价值是给作者可照抄的写法。

**Independent Test**: 只读文档与前端入口，能把另一个前端服务改为可选。

**Acceptance Scenarios**:

1. **Given** 作者阅读 `docs/how-it-works.md` 的前端入口一节，**When** 查找服务缺失时的行为，**Then** 得到明确说明：哪些服务可选、缺失时跳过哪些功能。
2. **Given** 作者阅读 `docs/known-risks.md`，**When** 查找前端服务相关限制，**Then** 找到可选服务的约束。

---

### Edge Cases

- 服务在 `apply` 期间重复出现与消失时，注册内容不泄漏，不重复注册。
- 前端入口的 `inject` 不再列出可选服务，宿主据此不阻塞入口加载。
- 后端入口 `src/index.ts` 的 `inject` 保持现状。
- 三个服务都缺失时，插件启用且无可见效果，日志不报错。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 前端入口 MUST 允许 `slots`、`locale`、`configForms` 任一缺失时启用成功。
- **FR-002**: 每项前端功能 MUST 仅依赖自己用到的服务，缺失时只跳过该功能。
- **FR-003**: 服务在插件启用之后就绪时，对应功能 MUST 自动注册。
- **FR-004**: 服务被撤掉时，对应功能注册的资源 MUST 被清理，重新就绪后 MUST 重新注册，无重复注册。
- **FR-005**: 三个服务都就绪时，前端行为 MUST 与现状一致。
- **FR-006**: 测试 MUST 覆盖单个服务缺失、全部缺失、晚就绪与撤掉四类情形。
- **FR-007**: `docs/how-it-works.md` MUST 说明前端服务可选的写法与缺失时的行为。
- **FR-008**: `docs/known-risks.md` MUST 记录宿主对可选服务的限制，若存在。
- **FR-009**: 变更 MUST 通过 `pnpm format && pnpm check`，并补充 CHANGELOG 条目。

### Key Entities

- **前端服务**：宿主向前端入口提供的 `slots`、`locale`、`configForms`。
- **前端功能**：字典注册、输入区示例行、插件面板配置页，各自依赖一部分前端服务。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 三个服务各有或无的 8 种组合下，前端 `apply` 全部启用成功，已注册内容与服务可用性一一对应。
- **SC-002**: 服务缺失导致的启用失败次数为 0。
- **SC-003**: 服务撤掉后，对应功能的注册残留数为 0。
- **SC-004**: 作者只读一节文档，能在 10 分钟内把另一个前端服务改为可选。
- **SC-005**: `pnpm check` 全部通过。

## Assumptions

- 范围限于前端入口 `src/client/index.ts`；后端入口的 `inject` 保持现状。
- 三个前端服务全部改为可选，各功能按依赖降级。
- 当前依赖的 Cordis 把 `inject` 声明的服务视为必需，没有内置的可选声明。可选服务从前端入口的 `inject` 移除，改用就绪后回调获取。具体写法留到 plan 阶段确认。
- `slots` 缺失时无可注册的位置，该情形按“启用成功但无可见效果”处理。
- 宿主版本沿用当前依赖，不做升级。
