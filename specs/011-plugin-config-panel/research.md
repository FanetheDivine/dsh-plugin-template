# Research: 插件面板配置项

## R1 配置页挂在哪个插槽

- Decision: `plugins.row.config`，键为 `<包名>#<行 id>`，即 `dsh-plugin-template#dsh-plugin-template`。
- Rationale: 模板是单行 bundle。行配置在该行上出现“配置”入口，页头自带标题、图标与描述；`plugins.bundle.config` 只渲染 `page`，且没有独立页面。
- Alternatives: `plugins.bundle.config` 把表单放在 bundle 详情页，适合 bundle 级配置，文档中作为对照说明；`plugins.item` 属于官方内置插件，已被占用。

## R2 表单数据从哪来

- Decision: 前端 `inject` 加入 `configForms`，用 `ctx.configForms.get('dsh-plugin-template')` 取得该行的表单，交给官方 `SettingsFormModel` 管理草稿、校验与保存。
- Rationale: 宿主把 profile 条目 id 当作配置命名空间；服务负责修订号校验、写入与回读。官方 forge 插件用同一方式。
- Alternatives: 直接使用页面传入的 `form` 属性，是一份静态快照，无订阅，草稿状态要自己管理。

## R3 哪些字段出现在表单

- Decision: `prefix` 与 `demoEnabled` 都声明 `.volatile()`。
- Rationale: 宿主设置服务只暴露 volatile 字段；volatile 字段变更不重挂载插件，直接发出 `loader/volatile-update`，这正是热重载。
- Alternatives: 普通字段会让插件重启，仍可保存，但不出现在表单里，也不演示热重载。

## R4 热重载如何落到行为

- Decision: `apply` 保存 `config` 引用，读取时用 `.get()`；监听 `loader/volatile-update`，重新读取并重注册 `demo_echo`；事件日志每次读取实时前缀。
- Rationale: 工具描述含前缀，重注册可让模型看到新描述；`demoEnabled` 变化只需注册或注销。
- Alternatives: 只在执行时读 `.get()` 实现前缀热更新，`demoEnabled` 仍需重启，覆盖不全。

## R5 严格校验如何保留

- Decision: `Config` 使用 schemastery，`prefix` 带非空白校验；`apply` 把引用展开成普通对象，交给原有 `resolveConfig`，其中的未知键与类型校验保持不变。
- Rationale: 实测 `Schema.object` 对未知键放行，原则 III 要求抛错；展开后未知键原样传入 `resolveConfig`。
- Alternatives: 删除 `resolveConfig` 会丢失未知键错误。

## R6 依赖与打包

- Decision: `@deepseek-ai/schemastery` 作为 `devDependencies`，宿主机侧产物保持 external；前端 `dsh-client-ui-primitives` 已在平台种子表内。
- Rationale: 宪章原则 II；宿主安装自带 schemastery。实机测试验证 profile 内的解析结果。
- Alternatives: 若实机发现无法解析，改为 `dependencies` 并加入 `alwaysBundle`，在 plan 中补记。

## R7 实机用例

- Decision: 后端用例增加“热重载不重启”断言，浏览器用例增加“打开配置页、改前缀、保存、发消息回显新前缀”。
- Rationale: 覆盖 FR-012 与 SC-002。
