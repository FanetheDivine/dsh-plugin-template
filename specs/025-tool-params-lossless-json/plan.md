# Implementation Plan: 工具参数声明的无损 JSON 约定与 zod 示例

**Branch**: `docs/025-tool-params-lossless-json` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-tool-params-lossless-json/spec.md`

**Status**: Draft

## Open Decisions

None.

## Clarifications

### Session 2026-11-26

- [P-D-000] Exploration: `@deepseek-ai/dsh-util-values@0.2.2-rc.5` 的 `snapshotJsonValue` 是宿主判定的实现，`@deepseek-ai/dsh-tools` 未转发该函数。
- [P-D-000] Exploration: 仓库内实测 zod `4.6.6`，`z.toJSONSchema` 返回对象的不可枚举键为 `~standard`，展开复制后只剩四个可枚举键。
- [P-D-000] Exploration: `ToolsService.register` 不校验 `parameters`；`tests/helpers.ts` 的 `makeCtx` 已记录 `_registeredTools`。
- [P-D-000] Exploration: 10 个 `dsh-*` 包在 `0.2.2-rc.5` 均有发布；`@deepseek-ai/dsh@0.2.2-rc.5` 的 `cordis`、`cordis-plugin-loader`、`schemastery` 版本范围与模板现有声明一致。
- [P-D-001] Q: 测试侧的无损 JSON 校验怎么实现？ -> A: 在 `tests/support/lossless-json.ts` 自行实现，不新增依赖。
- [P-D-002] Q: `demo_echo` 的声明是否保留 `additionalProperties: false`？ -> A: 保留，只剔除 `$schema`，其余照搬 zod 输出。
- [P-D-003] Q: zod 转声明的辅助函数放哪里？ -> A: `src/demo-tool.ts` 内的 `parametersOf`。
- [P-D-004] Q: 升级后出现接口变化导致类型检查失败怎么处理？ -> A: 在本次范围内做小幅适配并记入 CHANGELOG；超出工具声明与测试面的改动先停下来报告。
- [P-D-000] Exploration: 仓库文档未记录宿主版本号，升级只影响 `package.json`、`pnpm-workspace.yaml` 与锁文件。

## Review Record

- Pending: 等待用户审查完整计划。

## Summary

模板把 `demo_echo` 的参数声明改为由 zod schema 生成：`z.toJSONSchema` 的输出经展开复制剔除 `$schema` 与不可枚举的 `~standard` 键，得到宿主可克隆的无损 JSON。测试侧按宿主规则校验全部已注册工具的声明。依赖升到 `0.2.2-rc.5`，与 lark-bridge 文档依据的宿主版本一致。文档说明该约定与写法。

## Technical Context

**Language/Version**: TypeScript 6.0（Node ESM，DSH 插件）

**Primary Dependencies**: `zod@4.6.6`；`@deepseek-ai/dsh-tools@0.2.2-rc.5`、`@deepseek-ai/dsh-llm@0.2.2-rc.5`（宿主提供）；无新增依赖

**Storage**: 不适用

**Testing**: vitest，`code` 项目（`pnpm test:code`）与 `dist` 项目（`pnpm test:dist`）

**Target Platform**: DSH 宿主 `0.2.2-rc.5`，Node 24.9 及以上

**Project Type**: DSH 插件模板

**Performance Goals**: 不适用；声明生成只在注册时执行一次

**Constraints**: 不改宿主代码；`demo_echo` 的用户可见行为与配置项保持不变；不引入新依赖

**Scale/Scope**: `src/demo-tool.ts`、`tests/plugin.test.ts`、新增 `tests/tool-schema.test.ts` 与 `tests/support/lossless-json.ts`、`docs/how-it-works.md`、`docs/development.md`、`package.json`、`pnpm-workspace.yaml`、锁文件、`CHANGELOG.md`

## Constitution Check

*GATE: 通过后才进入 Phase 0；Phase 1 完成后再次核对。*

| 原则 | 结论 | 依据 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 10 个 `dsh-*` 同升到 `0.2.2-rc.5`，并同步 `minimumReleaseAgeExclude`；`cordis` 等范围依赖与宿主声明一致，不改 |
| II 测试同步 | 通过 | 新增声明校验测试与支撑函数，更新现有断言；实机测试按规格 D-005 不做，风险记入规格 Review Record，实施结束时提醒用户按 `0.2.2-rc.5` 执行 |
| III 文档结构 | 通过 | 机制归属 `docs/how-it-works.md` 的「参数声明」；测试文件归属 `docs/development.md` 测试表；变更归属 `CHANGELOG.md`；`known-risks.md` 不改 |
| IV 质量门禁 | 通过 | 提交前运行 `pnpm format && pnpm full-check` |
| V 公开引用 | 通过 | 改动只涉及仓内相对路径与包名 |

## Project Structure

### Documentation (this feature)

```text
specs/025-tool-params-lossless-json/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── spec.md
└── tasks.md          # /speckit-tasks 生成
```

### Source Code (repository root)

```text
src/
└── demo-tool.ts                  # demo_echo：zod schema 同时驱动校验与声明

tests/
├── plugin.test.ts                # 声明形态断言与工具行为
├── tool-schema.test.ts           # 新增：全部已注册工具的声明校验
└── support/
    └── lossless-json.ts          # 新增：按宿主规则校验并返回深拷贝

docs/
├── how-it-works.md               # 参数声明小节（已在 4427571 增加）
└── development.md                # 测试表与文件地图

package.json
pnpm-workspace.yaml
pnpm-lock.yaml
CHANGELOG.md
```

**Structure Decision**: 沿用现有单插件布局。校验函数只在测试侧使用，不进入发布产物；`tests/support/` 已放纯工具函数（`primitives.ts`、`pack-report.ts`、`dist-freshness.ts`）。

## Implementation

1. `src/demo-tool.ts`：新增把 zod schema 转成声明的辅助函数，`parameters` 改用它；`parseEchoArgs` 继续用同一个 schema。
2. `tests/support/lossless-json.ts`：按宿主规则递归校验，通过时返回深拷贝，失败时抛出含路径的错误。
3. `tests/tool-schema.test.ts`：校验 `apply` 注册的全部工具声明；断言 `z.toJSONSchema` 原始输出不合规；覆盖各类非法值。
4. `tests/plugin.test.ts`：声明断言改为 JSON Schema 根对象。
5. 依赖：`package.json` 的 10 个 `dsh-*` 与 `pnpm-workspace.yaml` 的 10 条排除项升到 `0.2.2-rc.5`，运行 `pnpm install` 更新锁文件。
6. 文档：`docs/how-it-works.md` 的「参数声明」与示例代码对齐；`docs/development.md` 测试表补两个文件。
7. `CHANGELOG.md`：记录声明形态、示例、测试与依赖升级。

## Verification

1. `pnpm format` 不改写文件。
2. `pnpm install` 成功，锁文件更新。
3. `pnpm full-check` 通过。
4. 按 [quickstart.md](./quickstart.md) 的场景逐条核对。
5. 提醒用户按 `0.2.2-rc.5` 执行实机测试。

## Complexity Tracking

| 偏离 | 理由 | 影响 |
| --- | --- | --- |
| 不做实机测试（宪章 II 的 SHOULD） | 规格 D-005 | 宿主行为与校验规则的一致性未在真实宿主上验证，由用户在升级后执行实机测试覆盖 |
