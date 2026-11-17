# Implementation Plan: 模板宿主依赖对齐 DSH 0.2.2-rc.3

**Branch**: `chore/005-upgrade-dsh-deps` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-upgrade-dsh-deps/spec.md`

## Summary

- 宿主依赖升到 `0.2.2-rc.3`：`@deepseek-ai/dsh-agent`、`@deepseek-ai/dsh-tools` 精确版本，`@deepseek-ai/cordis` 取宿主声明的 `~4.1.0`。
- `zod` 跟宿主实例升到 `4.6.6`，`@types/node` 跟 Node 要求升到 24.x。
- `engines.node` 改为 `>=24.9.0`。
- `src/events.ts` 删除 `agent/session-start` 监听，来源改由 `agent/created` 记录。
- `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 与锁文件同步，CHANGELOG 与 `docs/development.md` 记录变化。
- 宪章升到 `1.7.0`：原则 I 新增模板定位与宿主依赖版本规则，把本次的版本依据固化为约束。

## Technical Context

**Language/Version**: TypeScript（`tsc` 6.0.3），Node `>=24.9.0`

**Primary Dependencies**: `@deepseek-ai/cordis` `~4.1.0`、`@deepseek-ai/dsh-agent` `0.2.2-rc.3`、`@deepseek-ai/dsh-tools` `0.2.2-rc.3`、`zod` `4.6.6`，全部由宿主提供，保持 external

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`；实机测试见验收提醒

**Target Platform**: DSH 0.2.2-rc.3

**Project Type**: DSH 插件模板仓库

**Performance Goals**: N/A

**Constraints**:

- 宿主提供的依赖留在 `devDependencies`，`tsdown.config.ts` 的 `neverBundle` 不变。
- 示例、README 与测试保持可用。
- 版本依据见 [research.md](./research.md)。

**Scale/Scope**: `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`src/events.ts`、`tests/plugin.test.ts`、`.specify/memory/constitution.md`、`CHANGELOG.md`、`docs/development.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 条款 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 仍只导出 `name`、`inject`、`apply`，`name` 与 `cordis.patch.yml` 的 `id` 不变 |
| II 依赖归属 | 通过 | 三个宿主依赖仍在 `devDependencies`，`neverBundle` 保持 external；不新增依赖；`minimumReleaseAgeExclude` 同步新版本 |
| III 严格配置 | 通过 | 配置解析不改 |
| IV 测试同步 | 通过 | `tests/plugin.test.ts` 覆盖新事件集合与来源日志；收尾提醒实机测试并给出 0.2.2-rc.3 |
| V 文档结构 | 通过 | CHANGELOG 记录版本变化，`docs/development.md` 写明 Node 要求；README 无用户可见行为变化；版本依据只在宪章原则 I 维护 |
| VI 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | spec 声明为模板变更；`demo_echo`、README 与测试保持可用 |
| VIII 公开引用 | 通过 | 不新增本机路径或仓库外引用 |
| Governance：修订经 `/speckit-constitution` | 通过 | 宪章修订在该 skill 中完成，版本由 1.6.0 升到 1.7.0 |

Phase 1 设计后复查：结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/005-upgrade-dsh-deps/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 生成
```

本需求没有对外接口与数据实体，不生成 `contracts/` 与 `data-model.md`。

### Source Code (repository root)

```text
package.json              # 宿主依赖、zod、@types/node、engines.node
pnpm-workspace.yaml       # minimumReleaseAgeExclude
pnpm-lock.yaml            # 依赖解析结果
src/events.ts             # 删除 agent/session-start，记录 source
tests/plugin.test.ts      # 事件集合与来源日志断言
`.specify/memory/constitution.md`  # 原则 I 新增宿主依赖版本规则，版本升到 1.7.0
CHANGELOG.md              # 版本变化记录
docs/development.md       # Node 24.9 运行要求
```

**Structure Decision**: 只改上述 8 个文件，`src/` 其他文件与 `cordis.patch.yml` 不动。

## Complexity Tracking

无偏离。