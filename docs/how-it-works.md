# 工作机制

## 插件的组成

DSH 插件是一个 npm 包。宿主按约定的入口加载它。

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包元数据、发布内容 `files` 与脚本 |
| `cordis.patch.yml` | 插件行，`dsh plugin add` 时插入 profile |
| `src/index.ts` | 唯一打包入口 |
| `tsdown.config.ts` | 打包配置，宿主依赖保持 external |

## 入口契约

宿主 loader 只识别 `src/index.ts` 导出的四个符号。

| 导出 | 含义 |
| --- | --- |
| `name` | 插件标识，与 `cordis.patch.yml` 的 `id` 一致 |
| `inject` | 需要宿主注入的服务，例如 `tools`、`llm`、`sessions` |
| `apply(ctx, config)` | 插件启用时调用，`config` 来自插件行的 `config` 字段 |
| `Config` | 配置 schema，宿主据此校验配置并提供热重载与面板表单 |

```ts
export const name = 'dsh-plugin-template';
export const inject = ['tools', 'llm', 'tokenMeter', 'sessions'];
export function apply(ctx: Context, config?: unknown): void {
  // 解析配置、注册工具、监听事件
}
```

## 运行流程

`apply` 依次完成三件事：

1. `resolveConfig` 解析配置。
2. `demoEnabled` 为 `true` 时，用 `ctx.tools.register` 注册 `demo_echo` 工具。
3. `setupDemoListeners` 注册 agent 事件监听。

### 配置解析

`resolveConfig` 采用严格校验，规则见[宪章](../.specify/memory/constitution.md)原则 III。

### 工具注册

`ToolDefinition` 的主要字段：

| 字段 | 含义 |
| --- | --- |
| `name`、`description` | 模型看到的工具名与说明 |
| `parameters` | 参数声明 |
| `output` | 返回值的 JSON Schema 与渲染函数 |
| `execute(args, exec)` | 执行体，`exec` 提供 `agent` 与 `signal` |

`demo_echo` 的执行过程：

1. 用 zod 校验参数。参数非法时返回提示文本。
2. 返回 `[prefix] (session <id>) <text>`。

### 事件监听

`ctx.on(event, listener)` 注册的监听随插件卸载自动释放。事件分三类：

| 类别 | 行为 | 示例 |
| --- | --- | --- |
| emit | 同步通知 | `agent/created`、`agent/status` |
| waterfall | 中间件，调用 `next()` 继续链路 | `agent/pre-step` |
| serial | 按注册顺序依次 await | `agent/turn-stopping` |

事件载荷都带有 `agent`，可按 agent 过滤。

## 前端部分

同一个包可以同时带宿主机部分与浏览器部分。宿主按 `package.json` 的声明加载前端：

| 声明 | 作用 |
| --- | --- |
| `dsh.client.platform` | 只在该平台加载，当前为 `web` |
| `dsh.client.inject` | 先到达的客户端包，同时参与插件组合 |
| `exports["./client"]` | 浏览器产物路径 |

产物按闭包工厂格式注册：

```js
window.__ModuleLoader__.load({
  id: 'dsh-plugin-template',
  factory(require) {
    // 模块体
    return { inject: ['slots', 'locale'], apply(ctx) { /* ... */ } };
  },
});
```

| 阶段 | 行为 |
| --- | --- |
| 执行产物 | 只注册工厂，不渲染 |
| 首次加载插件 | 调用 `factory(require)`，`require` 从宿主冻结模块表解析平台种子 |
| 其余模块 | 内联进产物，用户环境不需要安装插件的开发依赖 |

### 前端入口

`src/client/index.ts` 导出 `inject` 与 `apply`。`apply` 完成两件事：

1. 用 `ctx.locale.register` 注册 `dsh-plugin-template` 命名空间的中英文字典。
2. 用 `ctx.slots.inject` 等待槽位就绪，再用 `ctx.slots.register` 注册示例行。

| 文件 | 职责 |
| --- | --- |
| `src/client/index.ts` | 注册字典与槽位 |
| `src/client/demo-dock.tsx` | 示例行组件与计数按钮 |
| `src/client/locales.ts` | 中英文字典与命名空间 |

### 槽位与文案

- `conversation.composer.dock` 是 `list` 槽位，作用域为 `session`，渲染在输入卡下方。
- 注册参数含 `id`、`order` 与 `locale`；`locale` 让宿主生成绑定命名空间的 `t` 座。
- 语言切换时宿主重建 `t` 座，界面文案随之更新。
- 文案键由 `LocaleNamespaceMap` 合并约束，中文字典是键集事实源。

### 样式

示例行使用 `--dsw-*` 主题令牌与行内样式。

- 跟随宿主明暗主题。
- 不注入全局样式表，不覆盖宿主根节点。

## 依赖复用

宿主自带 cordis、dsh-tools 与 zod。

- 插件运行时使用宿主的同一份实例。
- 依赖归属规则见[宪章](../.specify/memory/constitution.md)原则 II。

## 打包与发布

- `files` 决定 npm 包内容：`dist`、`cordis.patch.yml`、`README.md`。
- `pnpm run release` 的步骤：
  1. 运行 `pnpm check` 与 `pnpm format`。
  2. `npm version patch` 升级版本并打 tag。
  3. `scripts/release-archive.mjs` 把 CHANGELOG 归档到 `changelogs/`。
  4. push 分支与 tag。
- CI 收到 tag 后用 npm trusted publishing 发布。
