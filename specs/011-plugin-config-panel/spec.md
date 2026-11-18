# Feature Specification: 插件面板配置项

**Feature Branch**: `feat/011-plugin-config-panel`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "需要为模板增加“插件”面板的可配置项。目的：1. 说明配置插槽的用法；2. 增加配置热重载功能。注意 UI 风格和官方保持一致。完成后必须实机测试。"

**变更类别**: 模板变更（宪章原则 VII）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 在插件面板编辑配置 (Priority: P1)

用户在 DSH 的“插件”面板打开模板插件，在其组件行的配置页里看到 `prefix` 与 `demoEnabled` 两项，修改后保存。

**Why this priority**: 模板目前只能手改 `cordis.patch.yml` 来配置，用户看不到官方的配置入口应如何接入。

**Independent Test**: 在真实宿主打开插件面板，进入模板插件的配置页，修改并保存，核对配置文件与界面回显。

**Acceptance Scenarios**:

1. **Given** 模板插件已启用，**When** 用户在插件面板打开该插件的详情页，**Then** 组件行出现“配置”入口。
2. **Given** 用户打开配置页，**When** 页面渲染，**Then** 显示两个配置项的当前值，控件、保存区与间距和官方插件配置页一致。
3. **Given** 用户修改 `prefix` 并保存，**When** 保存成功，**Then** 页面回显新值，配置文件写入新值。
4. **Given** 用户输入非法值（空前缀），**When** 保存，**Then** 页面显示错误且配置文件与运行状态都不变。
5. **Given** 宿主语言为中文或英文，**When** 配置页渲染，**Then** 标题、说明与按钮使用对应语言。

---

### User Story 2 - 配置热重载 (Priority: P1)

用户保存配置后，运行中的插件立即按新配置工作，无需重启 DSH，也无需重新加载整个插件。

**Why this priority**: 热重载是本次需求的第二个目的，需要在模板中给出可复制的写法。

**Independent Test**: 保存 `prefix` 后立即调用 `demo_echo`，回显使用新前缀；保存 `demoEnabled` 后，新请求的工具列表随之增减。

**Acceptance Scenarios**:

1. **Given** 插件运行中，**When** 用户把 `prefix` 改为新值并保存，**Then** 此后 `demo_echo` 的回显与事件日志使用新前缀。
2. **Given** `demoEnabled` 为 `true`，**When** 用户改为 `false` 并保存，**Then** 此后的请求不再携带 `demo_echo`。
3. **Given** `demoEnabled` 为 `false`，**When** 用户改为 `true` 并保存，**Then** 此后的请求携带 `demo_echo`。
4. **Given** 直接修改 `cordis.patch.yml` 中的这两项，**When** 宿主重新应用补丁，**Then** 效果与面板保存相同。
5. **Given** 配置含未知键，**When** 插件加载，**Then** 加载失败并给出明确错误。

---

### User Story 3 - 学习配置插槽的用法 (Priority: P2)

插件作者阅读模板文档与源码，能弄清配置插槽的三个入口、键的拼法、热重载字段的声明方式，并复制到自己的插件。

**Why this priority**: 模板的价值是可复制的骨架，文档需要把宿主文档分散的事实收拢成一份可执行的说明。

**Independent Test**: 按文档找到配置页的注册位置、插槽键与热重载字段的声明，替换字段名后能得到新的配置页。

**Acceptance Scenarios**:

1. **Given** 用户阅读 `docs/`，**When** 查找配置插槽，**Then** 能找到三个插槽的用途、键格式、`view` 的两种取值与热重载字段的声明。
2. **Given** 用户阅读源码，**When** 查看配置页组件，**Then** 注释说明各部分对应的插槽约定。

---

### Edge Cases

- 宿主没有提供配置编辑服务时，配置页显示只读状态，不能保存。
- 更高层的配置覆盖了该行配置时，保存被拒绝并显示原因。
- 插件被禁用时，配置入口随前端一起消失。
- `prefix` 保存后，前端示例行与已有会话不受影响。
- 面板保存的值与 `cordis.patch.yml` 手改的值，经同一套校验。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 插件 MUST 向宿主声明配置 schema，包含 `prefix`、`demoEnabled`，默认值与现状一致。
- **FR-002**: 两个字段 MUST 声明为热重载字段，修改后运行中的插件实例保持不变。
- **FR-003**: `prefix` 变化后，`demo_echo` 回显与事件日志 MUST 使用新值。
- **FR-004**: `demoEnabled` 变化后，`demo_echo` MUST 在下一次请求前注册或注销。
- **FR-005**: 未知配置键与非法值 MUST 使加载失败，保持宪章原则 III。
- **FR-006**: 前端 MUST 向“插件”面板的行配置插槽注册配置页，并提供 `summary` 与 `page` 两种视图。
- **FR-007**: 配置页 MUST 使用官方控件与官方保存区，沿用 `--dsw-*` 主题令牌，随明暗主题与语言切换。
- **FR-008**: 配置页 MUST 支持保存、放弃、重置，保存失败时显示错误。
- **FR-009**: 文档 MUST 说明三个配置插槽的用途、键格式与热重载字段声明，并给出模板对应的实现位置。
- **FR-010**: README MUST 更新配置节，说明可在插件面板编辑与热重载行为。
- **FR-011**: 单元测试 MUST 覆盖配置解析、热重载分支与前端注册接线。
- **FR-012**: 实机测试 MUST 覆盖插件面板的配置页渲染、保存与热重载生效。

### Key Entities

- **插件配置**：`prefix`（非空字符串）与 `demoEnabled`（布尔），存放在插件行的 `config`。
- **配置页**：插件面板里该插件组件行的二级页面，承载上述配置的表单。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户从打开插件面板到保存一项配置，操作不超过 4 步，且无需编辑文件。
- **SC-002**: 保存配置后，下一次工具调用在 2 秒内使用新配置，无需重启宿主。
- **SC-003**: 配置页与官方配置页的控件、保存区与间距一致，截图对比无可见差异。
- **SC-004**: 插件作者按文档能在 10 分钟内定位并改写配置页。
- **SC-005**: 实机测试用例全部通过，包含面板保存与热重载。

## Assumptions

- 宿主版本沿用当前依赖 `0.2.2-rc.3`，其插件面板已提供行配置插槽与配置表单服务。
- 配置页挂在行配置插槽上，键为 `<包名>#<行 id>`，行 id 取 `cordis.patch.yml` 中的 `id`。
- 只有热重载字段出现在表单中，现有两个字段全部声明为热重载字段。
- 前端依赖的宿主客户端包按宪章原则 II 作为 `devDependencies`，打包时保持 external。
- 宪章原则 I 限定入口导出，需随本需求纳入宿主约定的 `Config` 导出。
