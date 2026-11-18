# Implementation Plan: 产物测试的构建新鲜度

**Branch**: `fix/012-bundle-artifact-freshness` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-bundle-artifact-freshness/spec.md`

## Summary

把产物测试从默认回归入口中拆出来：`test:code` 只跑源码测试，`test:dist` 只跑读取 `dist` 的测试，`build` 在生成产物与类型声明后运行 `test:dist`，`check` 只运行 `test:code`。

产物测试不再自行构建。两个读取 `dist` 的测试调用同一个新鲜度检查 `assertFreshDist()`：产物缺失或任一构建输入晚于产物时直接失败，错误信息要求运行 `pnpm build`。

## Technical Context

**Language/Version**: TypeScript 6.0，Node.js 24.9+

**Primary Dependencies**: vitest 4.1（projects 与 `--project`）、tsdown 0.22、tsc（类型声明）、pnpm 11

**Storage**: N/A

**Testing**: vitest，拆成 `code` 与 `dist` 两个 project

**Target Platform**: 开发机与 CI（Ubuntu、Node 24、Windows 开发机）

**Project Type**: 单包 DSH 插件模板，产物为 Node 入口 `dist/index.mjs` 与浏览器产物 `dist/client.js`

**Performance Goals**: 产物新鲜时 `test:dist` 不做额外构建；`pnpm build` 的额外 `test:dist` 不超过 5 秒

**Constraints**: `check` 不依赖 `dist`；产物测试不写 `dist`；构建职责只在 `build`

**Scale/Scope**: 2 个产物测试文件、6 个源码测试文件、1 个新增测试辅助模块

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I. 宿主契约 | PASS | 不改 `src/index.ts` 导出、`Config` 与依赖版本 |
| II. 依赖归属 | PASS | 不新增依赖；vitest、tsdown 保持 `devDependencies` |
| III. 严格配置 | PASS | 不改配置解析 |
| IV. 测试同步 | PASS | 两个产物测试改为共用新鲜度检查；源码测试与产物测试分别由 `test:code`、`test:dist` 覆盖；package-pack 回归保留 |
| V. 文档结构 | PASS | 命令与测试说明改在 `docs/development.md`；CHANGELOG 记录变更；README 面向用户，不涉及 |
| VI. 质量门禁 | PASS | 完成后运行 `pnpm format && pnpm check`，再运行 `pnpm build` |
| VII. 模板定位 | PASS | 变更类别为模板变更，示例与 README 可用性不变 |
| VIII. 公开引用 | PASS | 不新增本机绝对路径或外部 URL |

设计后复核：无新增依赖、无配置解析变化、无对外契约变化，八条原则全部保持 PASS。

## Project Structure

### Documentation (this feature)

```text
specs/012-bundle-artifact-freshness/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── spec.md
├── checklists/requirements.md
└── tasks.md            # 由 /speckit-tasks 生成
```

### Source Code (repository root)

```text
package.json                   # 新增 test:code、test:dist；调整 check、build
vitest.config.ts               # 拆成 code 与 dist 两个 project
tests/
├── client-bundle.test.ts      # 去掉条件构建，改用 assertFreshDist()
├── package-pack.test.ts       # 同上
└── support/
    └── dist-freshness.ts      # 新增：产物新鲜度检查与错误信息
docs/development.md            # 命令表、测试、CI 说明
CHANGELOG.md                   # Unreleased 条目
```

**Structure Decision**: 保持单包结构。测试辅助模块放在 `tests/support/`，与现有 `primitives.ts` 并列；判定逻辑只保留一份，两个产物测试都从它导入。

## Phase 0 研究结论

见 [research.md](./research.md)。关键决策：

1. 用 vitest `projects` 拆分，而不是两个配置文件或 CLI 文件清单。
2. 产物测试只检查新鲜度，不构建；构建由 `build` 触发。
3. 新鲜度用文件时间戳与存在性判断，不引入构建缓存或哈希戳。

## Phase 1 设计产物

- [data-model.md](./data-model.md)：构建输入、产物、新鲜度判定的字段与状态。
- [quickstart.md](./quickstart.md)：六条验证命令与预期结果。

## Complexity Tracking

无违反宪章的设计，无偏离项。