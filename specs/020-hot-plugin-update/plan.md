# 实现计划：实机测试热更新

**分支**：`020-hot-plugin-update` | **日期**：2026-11-20 | **规格**：[spec.md](./spec.md)

**输入**：`specs/020-hot-plugin-update/spec.md`

**状态**：Approved

## 待确认决策

无。

## 澄清记录

### 2026-11-20 会话

- [D-101] 问：已存在的实机 profile 如何迁移？ → 答：每轮实机结束后删除 profile；旧 profile 忽略，不考虑兼容。
- [D-102] 问：`cordis.patch.yml` 的 HMR 配置怎么写入？ → 答：新建时整块写入；复用已有 profile 时补齐缺失的 `hmr` 块。
- [D-103] 问：HMR 监听范围？ → 答：仓库 `dist`。
- [D-104] 问：装载用例发现非链接安装时怎么处理？ → 答：忽略，假设不存在旧实例。
- [D-105] 问：迭代说明与排错内容怎么分布？ → 答：`SKILL.md` 主流程、`pitfalls.md` 排错、`cases.md` 验证步骤与报告结构。

## 审查记录

- 2026-11-20 | 决策：批准 | 范围：当前完整计划 | 未决项：无 | 风险：无

## 摘要

实机测试改为「链接安装 + HMR」：profile 以 `link:` 依赖指向当前检出，宿主从仓库 `dist` 加载插件；profile 补丁把 `hmr` 的监听根设为 `<repo>/dist`。之后 `pnpm build` 或 `pnpm dev` 重建即让运行中的实例替换插件，前端由宿主的 `client-hmr` 自动更新。启动脚本保持现状；每轮结束删除 profile。改动集中在搭建脚本、`run-test.mjs` 的 A1（不新增分支，仅同步说明）与 skill 文档。

## 技术背景

**语言与版本**：插件为 TypeScript；skill 脚本为 Bash 与 Node ESM；skill 文档为 Markdown。

**主要依赖**：宿主 `@deepseek-ai/dsh@0.2.2-rc.3`，其中 `dsh-hmr` 提供模块替换，`dsh-client-hmr` 提供前端更新；仓库已有 `pnpm`、`playwright`。

**存储**：实机 profile 的 `package.json`（链接依赖与 bundles）、`cordis.patch.yml`（HMR 与隔离配置）、`node_modules` 符号链接、会话与截图目录。

**测试**：仓库门禁 `pnpm format && pnpm check`；实机按 skill 的「构建 → 观察 → 重跑用例」验证。

**目标平台**：Windows + Git Bash；DSH web profile。现有脚本依赖 `cygpath`、`netstat`、`taskkill`。

**项目类型**：DSH 插件模板，含实机测试 skill 与脚本。

**性能目标**：构建完成后的插件替换在数秒内完成，宿主进程不重启。

**约束**：启动脚本 `gui-up.sh` 行为不变；取消打包安装的实机校验；插件源码与发布内容不变；每轮结束删除 profile。

**规模**：一个搭建脚本、一个装载用例、三份 skill 文档。

## 宪法检查

*门禁：研究前通过；设计完成后再次核对。*

| 原则 | 结论 | 依据 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不新增或升级 `@deepseek-ai/*` 依赖 |
| II 测试同步 | 通过 | 插件源码与发布内容不变；变更属于测试基建与 skill；装载用例的断言语义不变，实机验证覆盖脚本行为 |
| III 文档结构 | 通过 | 实机流程由 skill 归属；`docs/development.md` 保持本地开发流程的归属，不复制内容 |
| IV 质量门禁 | 通过 | 提交前运行 `pnpm format && pnpm check` |
| V 公开引用 | 通过 | skill 文档使用 `<repo>` 占位符；生成的 profile 文件不被跟踪 |

结论：逐条通过，无复杂度追踪项。

## 实现方案

### 1. 搭建脚本

`.dsh/skills/real-device-test/scripts/setup-env.sh`：

1. 第 4 步改为 `dsh plugin --profile "$PROFILE" add "$REPO"`，删除 `pnpm pack` 与 tgz 处理。
2. 第 5 步写补丁时加入 `- id: hmr` 与 `config.root: ["$REPO/dist"]`；复用已有 profile 且缺该块时补齐，并移除孤立的 `[]` 占位行。
3. 脚本末尾提示补上「构建后自动生效」与「结束删除 profile」。
4. 第 2 步的 `dist/index.mjs` 检查保留。

### 2. 装载用例

`.dsh/skills/real-device-test/scripts/run-test.mjs`：A1 断言不放宽也不新增分支；仅把用例标题与提示文案改为指向链接安装与仓库 `dist`。

### 3. skill 文档

1. `SKILL.md`：
   - 阶段 0 增加「先构建」。
   - 阶段 1 说明链接安装与 HMR 补丁。
   - 新增迭代小节：改代码 → `pnpm build` → 同一实例自动生效（前后端）→ 重跑用例。
   - 阶段 5 改为删除 profile，报告先于删除。
2. `references/pitfalls.md`：新增「热更新」条目：构建后无变化、点目录被忽略、加载了旧产物、前端未更新。
3. `references/cases.md`：新增热更新验证步骤，报告结构增加「热更新验证」一节。

### 4. 变更记录

`CHANGELOG.md` 在推送前补一条。

## 验证

1. `pnpm format && pnpm check`。
2. 用临时 profile 跑 `setup-env.sh`，确认 `link:` 依赖、`hmr` 配置与后端用例。
3. 按 quickstart 做一次 GUI 手工验证：记录进程号、改工具说明、`pnpm build`、确认界面与工具说明更新且进程号不变。
4. 按 skill 收尾删除 profile。

## 项目结构

### 文档（本功能）

```text
specs/020-hot-plugin-update/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### 仓库文件

```text
.dsh/skills/real-device-test/
├── SKILL.md
├── references/
│   ├── cases.md
│   └── pitfalls.md
└── scripts/
    ├── setup-env.sh
    └── run-test.mjs
CHANGELOG.md
```

**结构决策**：沿用现有 skill 目录；`gui-up.sh`、`browser-test.mjs`、`mock-provider.mjs` 不改。

## 复杂度追踪

无宪法偏离。
