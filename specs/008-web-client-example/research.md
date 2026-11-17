# Research: 前端示例

## 宿主前端加载约定

- **Decision**: 用闭包工厂产物，由 `window.__ModuleLoader__.load({ id: '<包名>', factory })` 注册；`factory(require)` 返回模块导出。
- **Rationale**: DSH 客户端模块表按包名懒加载插件，`require` 从宿主冻结模块表解析平台种子，其余代码内联随包分发。`dsh-client-modules/src/client/manifest.ts` 定义了该契约，`dsh-doc` 的 UI 插件模板同款。
- **Alternatives considered**: 手写 `client.js` 模板（放弃）：模板是 TypeScript 工程，需要与源码同步的构建。运行独立页面（放弃）：文档明确禁止替换根节点或另起应用。

## 构建方式

- **Decision**: 在 `tsdown.config.ts` 增加第二组构建：`format: 'cjs'`、`platform: 'browser'`、`entry: { client: 'src/client/index.ts' }`，用 `outputOptions.banner/footer/intro` 包出闭包工厂；`clean: false` 并排在 node 构建之后。
- **Rationale**: 与 dsh-plugin-om 的成熟配置一致；tsdown 已由模板使用，不引入新工具链。
- **Alternatives considered**: 单独的 vite 工程（放弃）：多一套配置与依赖；纯 TSC 输出（放弃）：无法产出单文件浏览器产物。

## 外部依赖边界

- **Decision**: 平台种子（`react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-web-react`、`@deepseek-ai/dsh-client-ui-primitives`、`@deepseek-ai/dsh-client-ui-attachment`、`@deepseek-ai/dsh-client-schema-form`）保持 external，其余内联。
- **Rationale**: 宿主冻结模块表只提供这些实例；实例重复会导致 React 或服务上下文错乱。
- **Alternatives considered**: 按需只外置 react（放弃）：用户后续引用 primitives 时会打进第二份实例。

## 展示位置

- **Decision**: 注册到 `conversation.composer.dock`，类型为 `list`、作用域 `session`，无 owner props；条目 id `demo`，order `5`。
- **Rationale**: 该槽位在输入卡下方已有空间，宿主在会话内渲染；同槽位已有 `activity`、`usage` 两个条目，排序语义明确。不依赖会话数据，组件无需 props 注入。
- **Alternatives considered**: `conversation.input.dock`（需要 `InputZone` owner props，视觉更重）；`conversation.view`（新增页签，超出示例范围）；`shell.overlay`（覆盖层，侵入性强）。

## 文案与语言

- **Decision**: 独立命名空间 `dsh-plugin-template`，用 `ctx.locale.register(NS, { zh, en })` 注册；注册槽位时传 `locale: NS`，组件通过 `t` 座取文案。
- **Rationale**: 宿主在语言切换时重建 `t` 座，界面即时跟随；文档要求可见文案走 locale 服务。
- **Alternatives considered**: 组件内写死中英双语文案（放弃）：不随语言切换，也不示范宿主约定。

## 样式

- **Decision**: 行内样式引用 `--dsw-*` 主题令牌（背景、边框、文字色、圆角、字号），不注入全局样式表。
- **Rationale**: 跟随明暗主题；无额外清理逻辑；示例代码集中在一个组件里。
- **Alternatives considered**: CSS Modules（放弃）：需要额外构建与样式注入；`ctx.effect` 注入 `<style>`（放弃）：示例复杂度上升。

## 依赖与清单

- **Decision**: `package.json` 增加 `./client` 导出与 `dsh.client`（`platform: 'web'`，`inject` 为 locale、conversation、renderer 三个宿主客户端包）；新增开发依赖 `react`、`react-dom`、`@types/react`、`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-conversation`、`@deepseek-ai/dsh-client-ui-renderer`、`@deepseek-ai/dsh-client-ui-slots`。
- **Rationale**: `inject` 同时用于工厂到达与 Cordis 组合；开发依赖只提供类型与打包输入，运行时由宿主提供。
- **Alternatives considered**: 把客户端宿主包放进 `dependencies`（放弃）：用户环境会重复安装宿主已有的包，违反宪章原则 II。

## 类型

- **Decision**: 组件 props 用 `TranslateNS<'dsh-plugin-template'>`；`locales.ts` 用 `declare module '@deepseek-ai/dsh-client-ui-slots'` 合并 `LocaleNamespaceMap`，键集取自中文字典。
- **Rationale**: 与宿主插件一致，文案键在编译期受检；中文字典作为键集事实源。
- **Alternatives considered**: 字符串键的宽松函数类型（放弃）：失去键校验。

## 测试与验证

- **Decision**: 三层验证。
  1. `tests/client.test.ts` 用 `tests/helpers.ts` 的模拟 ctx 断言字典注册、槽位注册参数、组件导出，并用 `react-dom/server` 渲染中英文两版。
  2. `tests/client-bundle.test.ts` 在 `vm` 中用桩 `window` 执行 `dist/client.js`，断言注册 id 为包名、工厂导出 `inject` 与 `apply`。
  3. 实机浏览器用例检查示例行出现、点击计数递增。
- **Rationale**: 单元测试覆盖接线，产物测试覆盖构建契约，实机覆盖宿主加载与真实渲染。
- **Alternatives considered**: 只跑构建（放弃）：构建通过不代表宿主能加载。