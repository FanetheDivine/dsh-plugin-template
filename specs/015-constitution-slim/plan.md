# Implementation Plan: 宪章精简

**Branch**: `docs/015-constitution-slim` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-constitution-slim/spec.md`

**变更类别**: 模板变更

## Summary

宪章只保留跨需求长期不变的硬约束：

- 宪章 1.9.0 → 2.0.0，原则重排为 I 宿主依赖版本、II 测试同步、III 文档结构、IV 质量门禁、V 公开引用。
- 原则 I 规定全部 `@deepseek-ai/*` 依赖以同版本 `@deepseek-ai/dsh` 为准，`dsh-*` 版本相同并列入 `minimumReleaseAgeExclude`。
- 宿主契约、依赖归属、严格配置迁入 `docs/how-it-works.md`，国际化约束迁入 `docs/i18n.md`。
- 模板定位迁入新文档 `docs/template-conversion.md`，`AGENTS.md` 增加模板说明。
- 新增测试回归 dsh 依赖版本与 `minimumReleaseAgeExclude`。

## Technical Context

**Language/Version**: TypeScript，Node.js 24.9+

**Primary Dependencies**: vitest；无新增依赖

**Storage**: N/A

**Testing**: vitest `code` project

**Target Platform**: 仓库文档与 Spec Kit 流程

**Project Type**: DSH 插件模板

**Performance Goals**: N/A

**Constraints**: 宪章修订经 `/speckit-constitution`；历史 `specs/` 与 changelog 不改

**Scale/Scope**: 宪章、`AGENTS.md`、4 份 `docs/`、1 份新文档、`ci.yml` 注释、worktree 扩展源与渲染 skill、1 个新测试

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按现行宪章 1.9.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不改入口导出与依赖版本，规则迁入 how-it-works |
| II 依赖归属 | 通过 | 无新增依赖 |
| III 严格配置 | 通过 | 不改配置代码 |
| IV 测试同步 | 通过 | 新增 `tests/dependency-versions.test.ts`；无 `dsh` 版本变更，无需实机提醒 |
| V 文档结构 | 通过 | 每条迁出规则只有一个归属文档，其他位置只放链接；新文档归 `docs/`；CHANGELOG 在 push 时补充 |
| VI 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | 模板变更，`demo_echo`、README 与测试不变 |
| VIII 公开引用 | 通过 | 只引用仓库内路径 |
| IX 国际化 | 通过 | 不改文案与元数据，约束迁入 i18n.md |
| Governance：修订经 `/speckit-constitution` | 通过 | 删除并重排原则，按 MAJOR 升到 2.0.0 |

Phase 1 设计后复核：迁移表见 [data-model.md](./data-model.md)，每条规则有唯一归属，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/015-constitution-slim/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
.specify/memory/constitution.md                          # 2.0.0
.specify/extensions/worktree/commands/speckit.worktree.finish.md  # principle III
.dsh/skills/speckit-worktree-finish/SKILL.md             # 同上
.github/workflows/ci.yml                                 # 注释链接 template-conversion.md
AGENTS.md                                                # 模板说明节与索引
docs/template-conversion.md                              # 新增
docs/how-it-works.md                                     # 入口契约、配置解析、依赖复用
docs/i18n.md                                             # 约束节
docs/known-risks.md                                      # 链接更新
docs/development.md                                      # 链接更新与文件地图
tests/dependency-versions.test.ts                        # 新增
```

**Structure Decision**: 规则迁移按 [research.md](./research.md) R2，编号引用按 R4。

## Complexity Tracking

无偏离。
