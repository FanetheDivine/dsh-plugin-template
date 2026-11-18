# Implementation Plan: 前端服务可选

**Branch**: `feat/014-optional-client-services` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-optional-client-services/spec.md`

## Summary

前端入口 `src/client/index.ts` 不再声明必需的 `inject`，改为按功能分组，用 `ctx.inject([依赖], 回调)` 逐组等待服务。每组只列自己用到的服务，服务缺失时该组不加载，就绪后加载、撤掉后卸载。三组：字典（`locale`）、输入区示例行（`slots` + `locale`）、面板配置页（`slots` + `locale` + `configForms`）。

## Technical Context

**Language/Version**: TypeScript，Node.js >= 24.9.0（宿主侧）；浏览器产物 `dist/client.js`

**Primary Dependencies**: `@deepseek-ai/cordis`（`ctx.inject`）、`@deepseek-ai/dsh-client-ui-renderer`（`ctx.slots`）、`@deepseek-ai/dsh-client-locale`（`ctx.locale`）、`@deepseek-ai/dsh-client-ui-settings` / `dsh-client-ui-plugin-manager`（`ctx.configForms`、`plugins.row.config`）

**Storage**: N/A

**Testing**: vitest，`tests/client.test.ts` 用 `tests/helpers.ts` 的 `makeClientCtx`

**Target Platform**: DSH Web GUI

**Project Type**: DSH 插件模板（单包，宿主入口 + 浏览器入口）

**Performance Goals**: 服务就绪后在同一 tick 完成注册

**Constraints**: 宿主 `inject` 无法表达可选服务；前端入口改为不导出 `inject`，依赖移到 `ctx.inject`

**Scale/Scope**: 1 个入口文件、1 个测试文件、1 个测试辅助文件、3 份文档

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 |
| --- | --- |
| I. 宿主契约 | 通过。`src/index.ts` 的导出不变。前端入口导出 `apply`，去掉 `inject`；宿主契约未要求前端入口导出 `inject`，`cordis.patch.yml` 与 `dsh.client` 声明不受影响。 |
| II. 依赖归属 | 通过。不新增依赖。 |
| III. 严格配置 | 通过。配置解析仍在宿主入口 `apply` 首步。 |
| IV. 测试同步 | 通过。`tests/client.test.ts` 增加服务组合、晚就绪与撤掉三类用例；`makeClientCtx` 增加 `ctx.inject` 模拟。 |
| V. 文档结构 | 通过。`docs/how-it-works.md` 前端入口一节说明可选服务写法；`docs/known-risks.md` 记录约束；`README.md` 用户可见行为不变，不改。CHANGELOG 增加条目。 |
| VI. 质量门禁 | 通过。收尾运行 `pnpm format && pnpm check`。 |
| VII. 模板定位 | 通过。变更类别为模板变更；示例行、README 与测试保持可用。 |
| VIII. 公开引用 | 通过。只引用仓库内路径。 |
| IX. 国际化 | 通过。字典仍经 `ctx.locale` 注册，文案键集不变。 |

无违反项，Complexity Tracking 留空。

## Project Structure

### Documentation (this feature)

```text
specs/014-optional-client-services/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── client-entry.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── client/
│   ├── index.ts          # 前端入口：按功能分组用 ctx.inject 等待服务
│   ├── config-form.ts
│   ├── config-page.tsx
│   ├── demo-dock.tsx
│   └── locales.ts
├── index.ts              # 宿主入口，不变
└── types.ts

tests/
├── helpers.ts            # makeClientCtx 增加 ctx.inject 模拟
└── client.test.ts        # 增加可选服务用例

docs/
├── how-it-works.md
└── known-risks.md
```

**Structure Decision**: 沿用现有单包结构，只改 `src/client/index.ts` 与对应测试。

## Phase 0 结论

见 [research.md](./research.md)。

## Phase 1 结论

- 实体与状态见 [data-model.md](./data-model.md)。
- 前端入口契约见 [contracts/client-entry.md](./contracts/client-entry.md)。
- 验证步骤见 [quickstart.md](./quickstart.md)。

## Complexity Tracking

无。
