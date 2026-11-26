# Implementation Plan: 工具参数声明的无损 JSON 约定与手写声明

**Branch**: `docs/025-tool-params-lossless-json` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-tool-params-lossless-json/spec.md`

**Status**: Approved

## Open Decisions

None.

## Clarifications

### Session 2026-11-26

- [P-D-000] Exploration: `@deepseek-ai/dsh-util-values@0.2.2-rc.5` 的 `snapshotJsonValue` 是宿主判定的实现，`@deepseek-ai/dsh-tools` 未转发该函数。
- [P-D-000] Exploration: 仓库内实测 zod `4.6.6`，`z.toJSONSchema` 返回对象的不可枚举键为 `~standard`，属性不可配置，`delete` 抛 `TypeError`；`tsc --strict` 实测 `satisfies` 加两条类型断言能拦住属性类型、属性键与必填键三类漂移。
- [P-D-000] Exploration: `ToolsService.register` 不校验 `parameters`；`tests/helpers.ts` 的 `makeCtx` 已记录 `_registeredTools`。
- [P-D-000] Exploration: 10 个 `dsh-*` 包在 `0.2.2-rc.5` 均有发布；`@deepseek-ai/dsh@0.2.2-rc.5` 的 `cordis`、`cordis-plugin-loader`、`schemastery` 版本范围与模板现有声明一致。
- [P-D-005] Q: 手写声明与 zod 类型怎么在类型层对齐？ -> A: `as const satisfies ParametersSchemaOf<EchoArgs>` 约束属性值与属性键，另加两条 `Assert<Equal<…>>` 覆盖必填键与属性键集合。
- [P-D-006] Q: 一致性测试放在哪里？ -> A: `tests/tool-schema.test.ts`，与全部工具声明校验同文件。
- [P-D-007] Q: 「依赖升级」小节写什么？ -> A: 核对宿主能否直接接受 zod 输出，以及能接受时删除手写声明与一致性测试的步骤。
- [P-D-001] Q: 测试侧的无损 JSON 校验怎么实现？ -> A: 在 `tests/support/lossless-json.ts` 自行实现，不新增依赖。
- [P-D-002] Q: `demo_echo` 的声明是否保留 `additionalProperties: false`？ -> A: 保留。手写声明保留该字段，与 zod 投影一致。
- [P-D-003] Q: zod 转声明的辅助函数放哪里？ -> A: 取消。改为手写声明，发布路径不再有转换函数。
- [P-D-004] Q: 升级后出现接口变化导致类型检查失败怎么处理？ -> A: 在本次范围内做小幅适配并记入 CHANGELOG；超出工具声明与测试面的改动先停下来报告。
- [P-D-000] Exploration: 仓库文档未记录宿主版本号，升级只影响 `package.json`、`pnpm-workspace.yaml` 与锁文件。

## Review Record

- 2026-11-26 | Decision: Approved | Scope: current full document | Open items: none | Risks: 不做实机测试（规格 D-005）；映射类型覆盖面有限，新增参数类型需扩展。

## Summary

模板把 `demo_echo` 的参数拆成两处，各自单一职责：

- zod schema 提供参数类型与运行时校验。
- `parameters` 是手写的普通 JSON Schema 常量，用 `as const satisfies` 钉到 `z.infer` 推出的参数类型上。
- 测试断言手写声明与 `z.toJSONSchema` 的投影（剔除 `$schema` 与 `~standard`）逐字段相等，并用宿主等价规则校验全部已注册工具的声明。

宿主升级后在 `docs/development.md` 的「依赖升级」核对项里检查能否直接接受 zod 输出；能接受就删除手写声明与一致性测试。依赖同时升到 `0.2.2-rc.5`。

## Technical Context

**Language/Version**: TypeScript 6.0（Node ESM，DSH 插件）

**Primary Dependencies**: `zod@4.6.6`；`@deepseek-ai/dsh-tools@0.2.2-rc.5`、`@deepseek-ai/dsh-llm@0.2.2-rc.5`（宿主提供）；无新增依赖

**Storage**: 不适用

**Testing**: vitest，`code` 项目（`pnpm test:code`）与 `dist` 项目（`pnpm test:dist`）

**Target Platform**: DSH 宿主 `0.2.2-rc.5`，Node 24.9 及以上

**Project Type**: DSH 插件模板

**Performance Goals**: 不适用；声明是模块级常量，注册时直接引用

**Constraints**: 不改宿主代码；`demo_echo` 的用户可见行为与配置项保持不变；不引入新依赖；发布路径不含 zod 转声明的运行时逻辑

**Scale/Scope**: `src/demo-tool.ts`、`tests/plugin.test.ts`、新增 `tests/tool-schema.test.ts` 与 `tests/support/lossless-json.ts`、`docs/how-it-works.md`、`docs/development.md`、`package.json`、`pnpm-workspace.yaml`、锁文件、`CHANGELOG.md`

## Constitution Check

*GATE: 通过后才进入 Phase 0；Phase 1 完成后再次核对。*

| 原则 | 结论 | 依据 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 10 个 `dsh-*` 同升到 `0.2.2-rc.5`，并同步 `minimumReleaseAgeExclude`；`cordis` 等范围依赖与宿主声明一致，不改 |
| II 测试同步 | 通过 | 新增声明校验测试、一致性测试与支撑函数，更新现有断言；实机测试按规格 D-005 不做，风险记入规格 Review Record，实施结束时提醒用户按 `0.2.2-rc.5` 执行 |
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
└── demo-tool.ts                  # demo_echo：zod schema 驱动校验，手写声明受 satisfies 约束

tests/
├── plugin.test.ts                # 声明形态断言与工具行为
├── tool-schema.test.ts           # 新增：全部工具声明校验与手写声明一致性
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

1. `src/demo-tool.ts`：
   - 保留 `echoArgsSchema`，新增 `type EchoArgs = z.infer<typeof echoArgsSchema>`。
   - 新增映射类型 `JsonSchemaOf<T>`、`ParametersSchemaOf<T>`、`RequiredKeys<T>`、`Assert<T>`、`Equal<A, B>`。
   - 新增 `export const ECHO_PARAMETERS = { … } as const satisfies ParametersSchemaOf<EchoArgs>`，含 `type`、`properties.text`、`required`、`additionalProperties: false`。
   - 加类型断言 `Assert<Equal<(typeof ECHO_PARAMETERS)['required'][number], RequiredKeys<EchoArgs>>>` 与 `Assert<Equal<keyof (typeof ECHO_PARAMETERS)['properties'], keyof EchoArgs>>`。
   - `buildDemoTool` 的 `parameters` 改用 `ECHO_PARAMETERS`。
2. `tests/support/lossless-json.ts`：按宿主规则递归校验，通过时返回深拷贝，失败时抛出含路径的错误。
3. `tests/tool-schema.test.ts`：
   - 经 `apply` 的真实注册入口校验全部工具声明。
   - 断言 `ECHO_PARAMETERS` 等于 `z.toJSONSchema(echoArgsSchema)` 剔除 `$schema` 与 `~standard` 的结果。
   - 断言 `z.toJSONSchema` 的原始输出未通过无损 JSON 校验。
   - 覆盖各类非法值。
4. `tests/plugin.test.ts`：声明断言改为 JSON Schema 根对象。
5. 依赖：`package.json` 的 10 个 `dsh-*` 与 `pnpm-workspace.yaml` 的 10 条排除项升到 `0.2.2-rc.5`，运行 `pnpm install` 更新锁文件。
6. 文档：
   - `docs/how-it-works.md` 的「参数声明」改写为当前写法：手写声明加类型约束、一致性测试、升级后简化条件。
   - `docs/development.md` 新增「依赖升级」小节与测试表两行。
7. `CHANGELOG.md`：记录声明写法、测试与依赖升级。

## Verification

1. `pnpm format` 不改写文件。
2. `pnpm install` 成功，锁文件更新。
3. `pnpm typecheck` 通过；手动改一处 `ECHO_PARAMETERS` 的字面量确认类型检查失败，再改回。
4. `pnpm full-check` 通过。
5. 按 [quickstart.md](./quickstart.md) 的场景逐条核对。
6. 提醒用户按 `0.2.2-rc.5` 执行实机测试。

## Complexity Tracking

| 偏离 | 理由 | 影响 |
| --- | --- | --- |
| 不做实机测试（宪章 II 的 SHOULD） | 规格 D-005 | 宿主行为与校验规则的一致性未在真实宿主上验证，由用户在升级后执行实机测试覆盖 |
