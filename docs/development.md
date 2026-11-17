# 开发

## 本地加载

1. 运行 `pnpm dev`，tsdown 监听 `src/` 并重建 `dist/index.mjs` 与 `dist/client.js`。
2. 在 profile 的 `cordis.patch.yml` 中加入：

```yaml
- insert:
    - id: dsh-plugin-template-dev
      name: file:///<repo>/dist/index.mjs
```

前端部分不需要额外的插件行。宿主读到包的 `dsh.client` 声明后加载 `dist/client.js`。改动前端代码后重建并刷新页面。

## 热更新

在同一文件启用 `hmr` 并监听 `dist`：

```yaml
- id: hmr
  disabled: false
  config:
    root: ["<repo>/dist"]
    ignored: ["**/node_modules"]
```

- 修改补丁后无需重启 DSH，运行中的 profile 会重新应用补丁。
- 插件行指向新路径时同时修改 `id`，确保宿主加载新路径的模块。
- 仓库路径含 `.dsh` 等点目录时，去掉默认的 `**/.*` 忽略规则。

## 前端构建

`tsdown.config.ts` 有两组构建：

| 构建组 | 入口 | 产物 |
| --- | --- | --- |
| 宿主 | `src/index.ts` | `dist/index.mjs` |
| 浏览器 | `src/client/index.ts` | `dist/client.js` |

- 浏览器组用 banner/footer/intro 包成 `window.__ModuleLoader__.load({ id, factory })` 闭包工厂。
- `PLATFORM_MODULES` 列出宿主冻结模块表提供的模块，构建时保持 external。
- 新增或升级宿主客户端依赖时，核对平台种子表与宿主版本。
- 类型声明由 `tsc -p tsconfig.build.json` 生成到 `dist/client/`。

## 环境要求

- Node.js 24.9 及以上，与 DSH 的运行要求一致；CI 使用 Node 24。
- pnpm 11。

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 监听并构建 |
| `pnpm build` | 打包并生成类型声明 |
| `pnpm check` | 依次运行类型检查、lint、测试和构建 |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` | biome 检查 |
| `pnpm lint:fix` | biome 检查并自动修复 |
| `pnpm format` | biome 格式化 |
| `pnpm test` | 运行 vitest |
| `pnpm run release` | 检查并发布新版本 |

## CI

`.github/workflows/ci.yml` 有两个 job：

| Job | 触发 | 内容 |
| --- | --- | --- |
| `check` | PR、打 tag | Node 24 上运行 `pnpm run full-check` |
| `publish` | 默认禁用 | 打 tag 时发布 npm，用 OIDC 换取发布令牌 |

- `publish` 由 `if: false` 禁用，原触发条件以注释保留；`pnpm run release` 推送的 tag 不会在 npm 产生新版本。
- 模板转化时解禁，步骤见[宪章](../.specify/memory/constitution.md)原则 VII。

## 测试

| 文件 | 覆盖内容 |
| --- | --- |
| `tests/plugin.test.ts` | 配置校验、demo 工具、`apply` 接线 |
| `tests/release-archive.test.mjs` | CHANGELOG 归档计划 |
| `tests/client.test.ts` | 前端服务声明、字典与槽位注册、双语渲染 |
| `tests/client-bundle.test.ts` | `dist/client.js` 的注册契约与导出 |
| `tests/package-pack.test.ts` | npm 包只含发布所需文件，含前端产物 |
| `tests/worktree-extension.test.ts` | worktree 扩展的创建、复用与清理 |
| `tests/helpers.ts` | 模拟宿主与客户端 `ctx`，记录注册、事件监听与日志 |

测试要求见[宪章](../.specify/memory/constitution.md)原则 IV。

浏览器用例由仓库内的 `playwright` 驱动无头 Chrome。

## Spec Kit 流程

DSH 从 `.dsh/skills/` 加载 `speckit-*` skill，在对话框输入 `/` 调用。

- 执行条件见 [AGENTS.md](../AGENTS.md#开发流程) 的开发流程节。
- 分支与 worktree 规则见 `/speckit-worktree-create`。

| 步骤 | 命令 | 产出 |
| --- | --- | --- |
| 1 | `/speckit-specify <需求描述>` | 分支、worktree 与 `spec.md` |
| 2 | `/speckit-clarify` | 写回 spec 的澄清结果 |
| 3 | `/speckit-plan` | `plan.md` 与设计产物 |
| 4 | `/speckit-tasks` | `tasks.md` |
| 5 | `/speckit-analyze` | 跨产物一致性报告 |
| 6 | `/speckit-implement` | 按阶段提交的实现 |
| 7 | `/speckit-worktree-finish` | PR 链接，或以 `abandon` 放弃 |

- `base_ref` 默认为 `origin/main`，必须已包含 `.specify/` 与 `.dsh/skills/`。
- `worktrees/` 已加入 `.gitignore`，biome 与 vitest 也会跳过它。

## 维护 worktree 扩展

扩展源码在 `.specify/extensions/worktree/`，`.dsh/skills/speckit-worktree-*` 由它渲染生成。

修改 `commands/` 或 `extension.yml` 后重新渲染：

1. 把扩展目录复制到仓库外的临时目录，删除其中的 `.specify-dev/`。
2. 运行 `specify extension add --dev <临时目录> --force`。

脚本行为由 `tests/worktree-extension.test.ts` 覆盖。

## 文件地图

```text
cordis.patch.yml            # 插件行，dsh plugin add 时插入 profile
src/
├── index.ts                # 打包入口，导出 name、inject、apply
├── config.ts               # 配置默认值与严格校验
├── constants.ts            # 共享常量
├── demo-tool.ts            # demo_echo 工具
├── events.ts               # agent 事件监听示例
├── types.ts                # 宿主类型再导出
├── utils.ts                # 零依赖工具函数
└── client/
    ├── index.ts            # 浏览器入口：注册字典与槽位
    ├── demo-dock.tsx       # 前端示例行组件
    └── locales.ts          # 中英文字典与命名空间
dist/
├── index.mjs               # 宿主产物
├── client.js               # 浏览器产物（闭包工厂）
├── index.d.ts              # 宿主类型声明
└── client/                 # 前端类型声明
scripts/release-archive.mjs # 发布时归档 CHANGELOG
tests/                      # vitest 单元测试
changelogs/                 # 各版本的 CHANGELOG 归档
docs/                       # 开发者文档
specs/<NNN>-<name>/         # 每个需求的 spec、plan、tasks
.dsh/skills/
└── speckit-*/              # Spec Kit 流程 skill
.specify/
├── memory/constitution.md  # 项目宪章
├── templates/              # Spec Kit 模板
├── scripts/bash/           # Spec Kit 脚本
├── extensions.yml          # 扩展钩子
└── extensions/worktree/    # 本地 worktree 扩展
.github/workflows/ci.yml    # CI：check（Node 24）与默认禁用的 publish
```
