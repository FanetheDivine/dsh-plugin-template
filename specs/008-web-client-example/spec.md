# Feature Specification: 前端示例

**Feature Branch**: `feat/008-web-client-example`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "参考 D:\Git\self\dsh-plugin-om。模板需要前端内容 不然示例不完整。不需要和这个插件完全相同 只需要在前端有内容就行。因为dsh在前端的展示有另一套逻辑。"

**变更类别**: 模板变更（宪章原则 VII）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 在 Web GUI 看到前端示例 (Priority: P1)

新用户安装模板插件后打开 DSH Web GUI，在会话输入区上方看到一行示例内容，能确认插件的前端部分已加载。

**Why this priority**: 模板当前只有宿主机侧示例，用户无法判断前端入口是否存在、是否生效。

**Independent Test**: 在本地 profile 中加载插件，刷新 Web GUI，检查输入区上方的示例行出现。

**Acceptance Scenarios**:

1. **Given** 插件已加载且 Web GUI 已打开，**When** 用户进入任一会话，**Then** 输入区上方显示一行带插件标识的示例内容。
2. **Given** 宿主语言为中文，**When** 示例行出现，**Then** 文案为中文；**When** 宿主语言切换为英文，**Then** 文案切换为英文。
3. **Given** 示例行已显示，**When** 用户点击行内按钮，**Then** 计数加一，再次点击继续递增。
4. **Given** 插件被禁用，**When** 页面重新加载，**Then** 示例行不再出现。

---

### User Story 2 - 从模板复制前端骨架 (Priority: P2)

插件作者阅读模板源码，能找到一个最小可用的前端入口：注册位置、组件、字典与清单声明。

**Why this priority**: 模板的价值在于可复制的骨架；只有前端示例而不给出清单与构建约定，用户仍要自行摸索。

**Independent Test**: 按文件地图找到前端入口、组件与字典，替换文案并重新构建，界面显示新文案。

**Acceptance Scenarios**:

1. **Given** 用户阅读 `docs/`，**When** 查找前端入口，**Then** 能找到入口文件、槽位名、清单声明与构建产物位置。
2. **Given** 用户只修改组件文案与字典，**When** 重新构建并刷新页面，**Then** 示例行显示修改后的文案。

---

### User Story 3 - 验证前端构建与分发 (Priority: P3)

维护者运行检查命令，能确认前端产物进入发布包，且打包格式符合宿主加载约定。

**Why this priority**: 前端产物格式错误只会在用户环境暴露，模板必须自带回归。

**Independent Test**: 运行构建与检查命令，检查发布包包含前端产物，测试覆盖注册接线与产物格式。

**Acceptance Scenarios**:

1. **Given** 依赖已安装，**When** 运行 `pnpm build`，**Then** 前端产物生成在发布目录。
2. **Given** 构建完成，**When** 查看 npm 包内容，**Then** 包含前端产物且不包含源码与测试。
3. **Given** 前端产物存在，**When** 按宿主加载约定执行，**Then** 以插件包名注册模块并导出 `inject` 与 `apply`。

### Edge Cases

- 槽位尚未就绪时，注册等待槽位可用，不抛错也不提前渲染。
- 宿主语言不在字典内时，回退英文。
- 插件热更新或重复加载时，示例行不重复出现。
- 前端产物在没有模块加载器的环境中执行时，不启动独立应用。
- 示例行的交互状态只存在于当前页面，刷新后归零。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 模板 MUST 提供浏览器端入口，插件加载后在 Web GUI 的会话输入区上方显示一行可见内容。
- **FR-002**: 示例行 MUST 显示中文与英文两套文案，跟随宿主语言切换。
- **FR-003**: 示例行 MUST 包含一个按钮，点击后计数递增。
- **FR-004**: 客户端入口 MUST 导出 `inject` 与 `apply`；全部注册在 `apply` 内完成，随插件卸载释放。
- **FR-005**: 示例行 MUST 使用宿主主题的容器与控件，不覆盖宿主根节点，不引入第二套样式系统。
- **FR-006**: 包清单 MUST 声明前端平台与前端入口导出，宿主据此加载前端产物。
- **FR-007**: 前端产物 MUST 进入发布包；模板 MUST NOT 新增宿主未提供的运行时依赖。
- **FR-008**: 宿主机侧示例 MUST 保持可用：`demo_echo` 工具与事件监听行为不变。
- **FR-009**: `docs/` MUST 说明前端示例的入口、槽位、清单声明、构建产物与本地验证步骤；用户可见行为变化同步更新 `README.md`。
- **FR-010**: 代码变更 MUST 同步测试，覆盖注册参数、两套字典与发布包中的前端产物。

### Key Entities

- **前端入口**: 浏览器端模块的入口，导出 `inject` 与 `apply`。
- **示例行**: 输入区上方列表槽位中的一条注册，包含文案与按钮。
- **字典**: 中文与英文文案，按命名空间注册到宿主语言服务。
- **前端产物**: 发布包中的浏览器模块，按宿主加载约定以包名注册。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 新用户按文档完成加载后，5 分钟内能在 Web GUI 看到示例行。
- **SC-002**: 中英文切换时示例行文案全部切换，无残留另一种语言。
- **SC-003**: `pnpm check` 与 `pnpm build` 通过，发布包包含前端产物且不含源码与测试。
- **SC-004**: 替换示例文案只需修改一个组件文件与一个字典文件。

## Assumptions

- 前端示例定位为装饰性状态行，不订阅会话或业务数据。
- 宿主提供 React、槽位与语言服务；模板不引入 UI 组件库。
- 前端示例不读取宿主机侧配置，与 `demoEnabled`、`prefix` 解耦。
- 只支持 web 平台。
- 计数只保存在页面内，不持久化。