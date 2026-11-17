# Implementation Plan: 前端示例

**Branch**: `feat/008-web-client-example` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-web-client-example/spec.md`

**变更类别**: 模板变更

## Summary

给模板补一个可运行的前端示例：浏览器入口注册会话输入区上方的一条列表项，显示双语文案与计数按钮。宿主通过 `dsh.client` 声明发现并加载前端产物，产物按闭包工厂格式注册。模板新增客户端构建配置、两个测试与实机浏览器用例，文档同步说明机制、构建与验证。

## Technical Context

**Language/Version**: TypeScript 6；浏览器侧 React 18

**Primary Dependencies**: 宿主提供 `react`、`react/jsx-runtime`、`@deepseek-ai/cordis` 与客户端服务包；模板只把它们放进 `devDependencies`

**Storage**: 不涉及

**Testing**: vitest（node）；`playwright` 驱动无头 Chrome（既有实机脚本）

**Target Platform**: DSH 0.2.2-rc.3 宿主，Web GUI

**Project Type**: DSH 插件 npm 包模板

**Performance Goals**: 示例行不订阅会话数据，不产生额外网络请求

**Constraints**: 浏览器产物必须以 `window.__ModuleLoader__.load({ id, factory })` 注册；平台种子模块保持 external；不覆盖宿主根节点

**Scale/Scope**: 一个前端入口、一个组件、一份双语字典、一份构建配置、两个测试文件、一个浏览器用例

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 宿主机侧 `name`、`inject`、`apply` 不变；浏览器入口沿用客户端约定，`inject` 只列实际用到的 `slots` 与 `locale` |
| II 依赖归属 | 通过 | 新增依赖全部由宿主提供，放 `devDependencies`；新增 `@deepseek-ai/dsh-*` 同步加入 `minimumReleaseAgeExclude`；不新增 `alwaysBundle` 条目 |
| III 严格配置 | 通过 | 配置解析不变；前端示例不读取配置 |
| IV 测试同步 | 通过 | 新增注册接线测试、双语字典测试、前端产物契约测试；更新打包内容断言与实机浏览器用例 |
| V 文档结构 | 通过 | 机制写 `docs/how-it-works.md`，开发与验证写 `docs/development.md`，风险写 `docs/known-risks.md`，用户可见行为写 `README.md` |
| VI 质量门禁 | 通过 | 提交前运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | 模板变更；保留 `demo_echo` 与现有测试 |
| VIII 公开引用 | 通过 | 文档只引用仓库内路径与公网地址 |

## Project Structure

### Documentation (this feature)

```text
specs/008-web-client-example/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/client-module.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts                 # 宿主入口（不变）
├── client/
│   ├── index.ts             # 浏览器入口：注册字典与槽位
│   ├── demo-dock.tsx        # 示例行组件
│   └── locales.ts           # 中英文字典与命名空间
├── config.ts / demo-tool.ts / events.ts / types.ts / utils.ts   # 不变
tests/
├── client.test.ts           # 入口接线、字典键集、组件渲染
├── client-bundle.test.ts    # 构建产物注册契约
├── package-pack.test.ts     # 发布内容加入前端产物
└── ...                      # 既有测试
docs/
├── how-it-works.md
├── development.md
└── known-risks.md
.dsh/skills/real-device-test/scripts/browser-test.mjs   # 新增前端用例
```

**Structure Decision**: 复用单包模板结构，浏览器代码放在 `src/client/`，与宿主机代码同包分发。开发依赖只用于类型与构建，前端产物内联其余代码。

## Complexity Tracking

无偏离宪章的事项。