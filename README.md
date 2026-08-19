# dsh-plugin-template

dsh 插件最小模板（demo）：注册一个 demo 工具（`demo_echo`）并监听 agent 生命周期事件，
展示一个 dsh 插件从「目录骨架 → 入口契约 → 配置解析 → 工具注册 → 事件监听 → 打包分发 → 发布」的完整构造过程。
除 demo 具体实现外，工程能力与 [dsh-plugin-om](https://github.com/ant-design/x) 同级：脚本、测试、CI、发布工具链一应俱全。

## 安装与启用

### 说明

- `$DSH_HOME` 缺省为 `~/.dsh`
- *profile* 描述了 dsh 进程的启动模式，官方的启动命令就是名为 `web` 的 profile

### 生产使用（安装发布版）

安装插件

```sh
dsh plugin --profile <profile> add dsh-plugin-template
```

安装完成后，需要重启 dsh。

可以通过 `dsh --profile <profile> --dump-config` 审查配置是否正确。

如果需要覆盖默认配置，打开 `$DSH_HOME/profiles/<profile>/cordis.patch.yml` 删除里面的空数组，加入

```yaml
- id: dsh-plugin-template
  config:
    prefix: my-plugin
    # 其他配置参考「插件配置项」
```

不需要重启，配置热更新即时生效。

### 开发插件（本仓库）

运行 `pnpm dev`，等待 `dist/index.mjs` 构筑完毕（watch 模式，src 改动自动重打包）。

在 `cordis.patch.yml` 里加入

```yaml
- insert:
    - id: dsh-plugin-template-dev
      name: file:///<repo>/dist/index.mjs
```

可以热重载。

## 生产与开发环境注解

| 环境 | 代码来源 | 构建 | 配置注入 | 生效方式 |
| ---- | -------- | ---- | -------- | -------- |
| 生产 | npm 发布的 dist 产物（`files`：dist + cordis.patch.yml + README.md） | `pnpm build` 产出 dist/index.mjs | `dsh plugin add` 通过 cordis.patch.yml 的组合层插入 preset 行 | 重启 dsh 后常驻 |
| 开发 | src/ 源码（tsdown watch） | `pnpm dev` 自动重打包 dist/index.mjs | 在 cordis.patch.yml 手动 `insert` 一条 `file:///` 路径 | 热重载 |
| 测试 | src/ 纯函数 + apply 接线（mock ctx） | vitest 直接运行 | 测试内构造 config 入参 | 不依赖真实宿主 |

核心差异：

- **生产走 npm 包**：tarball 只含 dist / cordis.patch.yml / README.md（`files` 字段限定，`pnpm test` 里的 package-pack 用例回归保障），src / tests / scripts 不进包
- **开发走本地挂载**：同一份 dist/index.mjs 被宿主直接加载，改 src 触发重打包即可热重载
- **依赖策略**：cordis / dsh-tools / zod 等 dsh 宿主自带依赖直接复用（放 devDependencies、打包时保持 external），插件不重复安装运行时依赖，避免与宿主实例分叉

## 一个插件是如何构造的

dsh 插件是一个 npm 包，宿主（dsh 进程）通过约定的入口把它加载进运行时。构造一个插件共 6 步：

### 1. 目录骨架

```
package.json            # 包元数据 + files（发布内容）+ scripts
cordis.patch.yml        # 插件预设行（id = 插件名），dsh plugin add 时作为组合层插入
src/index.ts            # 唯一打包入口（tsdown entry）
tsdown.config.ts        # 打包配置：neverBundle（宿主依赖保持 external）
tsconfig*.json          # 类型检查与声明生成
```

### 2. 入口契约：name / inject / apply

宿主 loader 只认这三个约定符号（src/index.ts）：

- `name`：插件稳定标识，必须与 cordis.patch.yml 的 id 一致，宿主据此识别与去重
- `inject`：声明插件需要的服务依赖（tools / llm / tokenMeter / sessions 等），宿主按序注入到 ctx
- `apply(ctx, config)`：激活入口，宿主在插件被启用时调用；config 来自 preset 行的 config 字段

```ts
export const name = 'dsh-plugin-template';
export const inject = ['tools', 'llm', 'tokenMeter', 'sessions'];
export function apply(ctx: Context, config?: unknown): void {
  // 解析配置 → 注册工具 → 监听事件
}
```

### 3. 配置解析（config.ts）

apply 的第一件事是解析配置：默认值合并 + 校验。模板采用「严格模式」：
缺省（undefined / null）键回退默认值；未知键、非法值直接抛错（插件加载即失败，避免拼写错误静默失效）。
返回 `Object.freeze` 的完整配置，防止后续误改。

### 4. 工具注册（demo-tool.ts）

`ctx.tools.register(ToolDefinition)` 把工具暴露给模型。ToolDefinition 的核心字段：

- `name` / `description`：对模型可见的工具名与说明
- `parameters`：参数 schema（对象形式，字段为 string/number/boolean 等 spec）
- `output`：返回值声明——schema 为 JSON Schema，render 把返回值投影为内容块
- `execute(args, exec)`：执行体；args 为模型传入（已冻结）的参数，exec 携带 agent / signal

参数校验用 zod（宿主自带）：面向模型的 parameters 用 JSON 形式，execute 入口再用 zod safeParse 做运行时校验——
非法参数返回提示而非抛出；`parseEchoArgs` 是纯函数，execute 与单元测试共用。

### 5. 事件监听（events.ts）

`ctx.on(event, listener)` 注册监听，随插件卸载自动释放。dsh 事件分三类：

- **emit**（同步通知，返回 void）：agent/created、agent/disposed、agent/status、agent/session-start 等
- **waterfall**（中间件，最后参数是 next，不调用 next() 即否决链路）：agent/pre-step、agent/request 等
- **serial**（按注册顺序依次 await）：agent/turn-stopping（turn 关闭前触发，可在监听器里追加工作）

事件 payload 均携带 agent（Scoped<Agent>），可按 agent 过滤监听。

### 6. 打包与发布

- `pnpm dev`：tsdown watch，改动自动重打包 dist/index.mjs
- `pnpm build`：tsdown 打包 + tsc 生成 .d.ts；npm imports 保持 external（neverBundle），运行时的宿主提供同一份 cordis / dsh-tools / zod 实例
- `files` 字段决定 npm 包内容：dist + cordis.patch.yml + README.md
- `pnpm run release`：check（typecheck+lint+test+build）→ format → `npm version patch`（版本号 + 自动打 tag）→ CHANGELOG 归档（scripts/release-archive.mjs）→ push + push --tags

## 工作原理（demo 流程）

1. apply 时 resolveConfig 解析插件配置（严格校验，未知键 / 非法值直接报错）
2. demoEnabled 开启时 `ctx.tools.register(buildDemoTool(prefix))`：模型调用 `demo_echo` 时原样回显文本
3. setupDemoListeners 监听 agent 生命周期事件（created / disposed / status / session-start）、pre-step 中间件与 turn-stopping
4. 工具执行：zod 校验参数（非法参数返回提示而非抛出），回显 `[prefix] (session <id>) <text>`

## 插件配置项

| 键            | 默认     | 含义                                           |
| ------------- | -------- | ---------------------------------------------- |
| `demoEnabled` | `true`   | 是否注册 demo 工具（`false` 时不注册）          |
| `prefix`      | `demo`   | demo 工具回显与事件日志使用的前缀               |

校验规则（严格模式，教学示范）：

- 缺省（undefined / null）：该键回退默认值
- 未知键：插件加载时报错（`unknown config key`），避免拼写错误静默失效
- 非法值（如 `demoEnabled: 'yes'`、`prefix: ''`）：插件加载时报错

## npm 命令

| 命令                      | 作用                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `pnpm dev`              | tsdown watch：改动自动重打包 dist/index.mjs（开发热重载）                                                     |
| `pnpm build`            | tsdown 打包 + tsc 生成类型声明（dist/index.mjs + index.d.ts）                                                  |
| `pnpm check`            | typecheck + lint + test + build（发布前全量校验）                                                              |
| `pnpm typecheck`        | TypeScript 类型检查                                                                                          |
| `pnpm lint` / `pnpm lint:fix` | biome 代码检查 / 自动修复                                                                              |
| `pnpm format`           | biome 格式化                                                                                                 |
| `pnpm test`             | vitest 单元测试（18 例：配置校验 / demo 工具 / apply 接线 / 归档计划 / 打包回归）                              |
| `pnpm run build:types`  | 仅生成类型声明（tsc -p tsconfig.build.json）                                                                  |
| `pnpm run release`      | 发布：check → format → `npm version patch`（版本号 + tag）→ CHANGELOG 归档 → push + push --tags             |

## 调用链和文件地图

```
cordis.patch.yml              # bundle patch：dsh plugin add 后作为组合层插入插件行（id = 插件名）
src/
├── index.ts                  # 打包入口（tsdown entry），导出 name / inject / apply
│   apply(ctx, config) 三条主线（标注对应实现文件）：
│   ├─ ① resolveConfig(config) ──▶ config.ts     # 配置默认值 + 严格校验（未知键/非法值报错、缺省回退、冻结返回）
│   ├─ ② demoEnabled 时 ctx.tools.register(buildDemoTool(prefix))
│   │      └─▶ demo-tool.ts                      # demo_echo 工具：zod 校验参数 + 回显（name 来自 constants.ts）
│   └─ ③ setupDemoListeners(ctx, prefix) ──▶ events.ts  # 事件监听：agent/created 等 emit + pre-step 中间件 + turn-stopping
├── constants.ts              # 共享常量（PLUGIN_LABEL / DEMO_TOOL_NAME / DEFAULT_PREFIX）
├── types.ts                  # type-only：宿主类型再导出（Context / Events / Agent / ToolDefinition / ToolRunContext）
├── config.ts                 # 配置默认值 / 严格合并（未知键与非法值报错、缺省回退默认值、冻结返回）
├── utils.ts                  # 零依赖工具函数（isRecord）
├── demo-tool.ts              # demo 工具构造（ToolDefinition + zod 参数校验）
└── events.ts                 # demo 事件监听（emit / waterfall / serial 三类）
scripts/
└── release-archive.mjs       # CHANGELOG 归档（纯函数 planArchive 供测试复用）
tests/                        # vitest 单元测试（18 例）
changelogs/                   # 发布归档的 CHANGELOG 片段（CHANGE.<version>.md）
.dsh/skills/                  # 项目级 skill（dsh-plugin-coding：需求/缺陷/发布工作流）
.github/workflows/ci.yml      # CI：typecheck + lint + test + build
AGENTS.md                     # 仓库开发约定（格式化/依赖同步/CHANGELOG/测试同步）
```

## 测试

- `tests/plugin.test.ts` — 配置校验（严格模式）/ demo 工具（zod）/ apply 接线（mock ctx，不依赖真实宿主）
- `tests/release-archive.test.mjs` — release-archive 归档计划（纯函数 planArchive：条目提取 / 归档内容 / 提交计划不变式）
- `tests/package-pack.test.ts` — npm pack --dry-run 打包回归（`files` 字段：dist / cordis.patch.yml / README.md 进包，src / tests / scripts 不进）
- `tests/helpers.ts` — 可编程 ctx 模拟（记录 tools.register / ctx.on / logger 调用）
