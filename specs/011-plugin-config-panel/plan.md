# Implementation Plan: 插件面板配置项

**Branch**: `feat/011-plugin-config-panel` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-plugin-config-panel/spec.md`

**变更类别**: 模板变更

## Summary

模板增加“插件”面板的配置页，演示配置插槽与配置热重载：

- 宿主机侧导出 `Config` schema，`prefix` 与 `demoEnabled` 声明为 `.volatile()`；`apply` 读取实时值，并在 `loader/volatile-update` 时重新注册工具。
- 浏览器侧向 `plugins.row.config` 注册配置页，用官方 `SettingsForm`、`SettingsValueField`、`Switch` 渲染，保存走宿主的配置表单服务。
- 文档说明三个配置插槽的用法；单元测试与实机测试覆盖面板保存与热重载。

## Technical Context

**Language/Version**: TypeScript 6；浏览器侧 React 18

**Primary Dependencies**: 宿主提供 `@deepseek-ai/schemastery`、`@deepseek-ai/dsh-client-ui-primitives`（运行时，external）；类型来自 `dsh-client-ui-plugin-manager`、`dsh-client-ui-settings`、`cordis-plugin-loader`。全部放 `devDependencies`

**Storage**: 插件行 `config`，由宿主的配置编辑服务写入 profile 的 `cordis.patch.yml`

**Testing**: vitest（node）；`playwright` 驱动无头 Chrome；mock provider 驱动对话

**Target Platform**: DSH 0.2.2-rc.3 宿主，Web GUI

**Project Type**: DSH 插件 npm 包模板

**Performance Goals**: 保存后下一次工具调用使用新配置，不重启宿主

**Constraints**: 配置页只使用官方控件与 `--dsw-*` 令牌；宿主 `Config` 的校验在持久化前完成；未知键仍须使加载失败

**Scale/Scope**: 宿主机侧 3 个文件改动，前端新增 2 个文件，字典与文档更新，新增 1 个测试文件，实机脚本增加 2 个用例

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 偏离，已记录 | `Config` 也是宿主 loader 识别的导出。原则 I 限定 `src/index.ts` 只导出 `name`、`inject`、`apply`，须修订为含 `Config`，见 Complexity Tracking |
| II 依赖归属 | 通过 | 新增依赖全部由宿主提供，放 `devDependencies`；`@deepseek-ai/dsh-*` 同步加入 `minimumReleaseAgeExclude`；不新增 `alwaysBundle` 条目 |
| III 严格配置 | 通过 | `Config` schema 只做类型与热重载声明；`resolveConfig` 仍在 `apply` 第一步校验实时值，未知键与非法值抛错 |
| IV 测试同步 | 通过 | 新增配置表单与热重载测试，更新 `apply`、事件与前端注册测试；实机用例覆盖面板保存与热重载 |
| V 文档结构 | 通过 | 机制写 `docs/how-it-works.md`，开发与验证写 `docs/development.md`，用户可见行为写 `README.md` |
| VI 质量门禁 | 通过 | 提交前运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | 模板变更；保留 `demo_echo`、README 与测试可用 |
| VIII 公开引用 | 通过 | 文档与 spec 只引用仓库内路径与公网地址 |

## Project Structure

### Documentation (this feature)

```text
specs/011-plugin-config-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/config-slot.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts                  # 导出 name、inject、apply、Config；apply 订阅热重载
├── config.ts                 # Config schema、PluginConfig、resolveConfig、readConfig
├── events.ts                 # 前缀改为读取器
├── types.ts                  # 再导出 Volatile
└── client/
    ├── index.ts              # 注册行配置页
    ├── config-form.ts        # 表单模型：prefix、demoEnabled 的草稿与保存
    ├── config-page.tsx       # 配置页组件：summary 与 page 两种视图
    └── locales.ts            # 新增 config.* 键
tests/
├── plugin.test.ts            # 热重载分支
├── config-form.test.ts       # 表单草稿、解析与保存
├── client.test.ts            # 行配置页注册
└── helpers.ts                # 支持 volatile 引用与事件触发
docs/how-it-works.md          # 配置插槽与热重载说明
```

**Structure Decision**: 沿用单项目布局，前端新增文件放在 `src/client/`。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| 原则 I：导出 `Config` | 宿主只在入口导出 `Config` 时才解析 `.volatile()` 字段，面板表单与热重载都依赖它 | 不导出 `Config` 时宿主传入普通对象，既没有热重载，也没有面板表单 |

处理：实施阶段 1 用 `/speckit-constitution` 把原则 I 修订为 `name`、`inject`、`apply`、`Config`，版本 1.7.0 → 1.8.0。
