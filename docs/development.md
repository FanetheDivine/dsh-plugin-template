# 开发

## 本地加载

1. 运行 `pnpm dev`，tsdown 监听 `src/` 并重建 `dist/index.mjs`。
2. 在 profile 的 `cordis.patch.yml` 中加入：

```yaml
- insert:
    - id: dsh-plugin-template-dev
      name: file:///<repo>/dist/index.mjs
```

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

## Serena

Serena 符号查询需要 uv、Node.js 和 Python 3.11–3.14。安装依赖时自动准备 Serena，也可运行 `pnpm serena:setup` 手动准备。

- 查询复用当前项目的独立后台实例。Windows 启动不弹出控制台。
- 实例默认空闲 15 分钟退出。`SERENA_CLI_IDLE_TIMEOUT` 可设置空闲秒数。
- `references` 激活 TS 工程并补全松散 JS/MJS 引用。空结果直接返回，初始化失败或超时直接报错。
- 查询前同步外部文件改动。输出行号从 1 开始，路径使用 `/`。
- `--no-daemon` 或 `SERENA_CLI_DAEMON=0` 使用单进程。实例启动失败会提示并回退，已提交的查询不重复执行。
- `SERENA_CLI_START_TIMEOUT` 设置启动等待秒数，`SERENA_CLI_STATE_DIR` 隔离实例状态目录。
- 删除 worktree 前在目标目录执行 `pnpm serena stop`，确认停止后离开目录再删除。

## 命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 监听并构建 |
| `pnpm build` | 打包并生成类型声明 |
| `pnpm check` | 依次运行类型检查、lint 和测试 |
| `pnpm run full-check` | 运行 `check` 并构建 |
| `pnpm typecheck` | 类型检查 |
| `pnpm lint` | biome 检查 |
| `pnpm lint:fix` | biome 检查并自动修复 |
| `pnpm format` | biome 格式化 |
| `pnpm test` | 运行 vitest |
| `pnpm serena definition <name_path>` | 寻找符号定义 |
| `pnpm serena references <name_path>` | 寻找符号引用 |
| `pnpm serena doc <name_path>` | 查看符号签名和注释 |
| `pnpm serena status` | 查看当前项目实例状态 |
| `pnpm serena stop` | 停止当前项目实例 |
| `pnpm serena:setup` | 准备 Serena Python 依赖 |
| `pnpm run release` | 检查并发布新版本 |

## CI

`.github/workflows/ci.yml` 有两个 job：

| Job | 触发 | 内容 |
| --- | --- | --- |
| `check` | PR、打 tag | Node 24、Python 3.12 与 uv 环境运行 `pnpm run full-check` |
| `publish` | 默认禁用 | Node 24、Python 3.12 与 uv 环境构建并发布 npm，用 OIDC 换取发布令牌 |

- `publish` 由 `if: false` 禁用，原触发条件以注释保留；`pnpm run release` 推送的 tag 不会在 npm 产生新版本。
- 模板转化时解禁，步骤见[宪章](../.specify/memory/constitution.md)原则 VII。

## 测试

| 文件 | 覆盖内容 |
| --- | --- |
| `tests/plugin.test.ts` | 配置校验、demo 工具、`apply` 接线 |
| `tests/release-archive.test.mjs` | CHANGELOG 归档计划 |
| `tests/package-pack.test.ts` | npm 包只含发布所需文件 |
| `tests/worktree-extension.test.ts` | worktree 扩展的创建、复用与清理 |
| `tests/serena-cli.test.ts` | 真实符号查询、工程引用与外部文件同步 |
| `tests/serena-daemon.test.ts` | 项目实例复用、安全、并发与生命周期 |
| `tests/serena-projects.test.ts` | TypeScript 工程成员与配置依赖解析 |
| `tests/serena-runtime.test.py` | 查询错误边界、缓存与语言服务器进程探针 |
| `tests/serena-reference-lifecycle.test.py` | 临时 JS 缓冲区与工程锚点释放 |
| `tests/helpers.ts` | 模拟 `ctx`，记录工具注册、事件监听与日志 |

测试要求见[宪章](../.specify/memory/constitution.md)原则 IV。

- `pnpm test` 运行 TypeScript 测试，并间接调用两个 Python 探针。
- `uv run --script tests/serena-runtime.test.py` 单独运行 Python 单元测试。
- Serena 测试通过 `SERENA_CLI_STATE_DIR` 隔离实例状态，并在结束后清理实例与动态夹具。

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
└── utils.ts                # 零依赖工具函数
scripts/
├── release-archive.mjs       # 发布时归档 CHANGELOG
├── serena-cli.py             # Serena 只读查询与项目实例管理
└── serena-projects.cjs       # TypeScript 工程成员与配置依赖解析
tests/                      # vitest 单元测试与 Serena 集成测试
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
