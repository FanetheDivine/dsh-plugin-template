# Implementation Plan: 前端 UI 链接使用完整 URL

**Branch**: `docs/021-frontend-absolute-links` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/021-frontend-absolute-links/spec.md`

**Status**: Approved

## Open Decisions

- 无未决项。

## Clarifications

### Session 2026-11-20

| 编号 | 已确认决定 | 依据 |
| --- | --- | --- |
| Q1 | 规则写在 `docs/development.md`，放在「前端构建」之后的新小节 | 用户指定 development；前端内容集中在该节 |
| Q2 | 新小节含 MUST 要求、Desktop 链接行为的原因与完整 URL 示例 | 规格 FR-001 至 FR-003 |
| Q3 | 不改前端代码、`README.md` 与详情文档 | 规格 FR-004 与假设 |
| Q4 | 只运行文档检查与质量门禁，不新增测试 | 宪章原则 II 只约束代码变更 |
| Q5 | CHANGELOG 按分支规则在交付时补条目 | 宪章原则 III |

## Review Record

- 2026-11-20 | Decision: Approved | Scope: current full document | Open items: none | Risks: 规则没有自动检查

## Summary

在 `docs/development.md` 增加「前端 UI 链接」小节：要求前端 UI 的 `a` 标签使用完整 URL，并说明 Desktop 下的链接行为。改动只涉及一个文档。

## Technical Context

**Language/Version**: Markdown，中文

**Primary Dependencies**: 无

**Storage**: N/A

**Testing**: `pnpm format`、`pnpm check`；文档改动不新增测试

**Target Platform**: DSH 插件模板的开发文档，读者是开发者与开发插件的模型

**Project Type**: 插件模板文档

**Constraints**: 宪章原则 III 文档结构与原则 V 公开引用；不改前端代码与产物

**Scale/Scope**: 1 个文件，1 个新小节

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I. 宿主依赖版本 | PASS | 不改依赖 |
| II. 测试同步 | PASS | 无代码变更；质量门禁照常运行 |
| III. 文档结构 | PASS | 规则归属 `docs/`，其他文档不复述 |
| IV. 质量门禁 | PASS | 实现后运行 `pnpm format && pnpm check` |
| V. 公开引用 | PASS | 示例用公网 URL；仓库内引用保持相对路径 |

Phase 1 设计后复核：结论相同。

## Project Structure

### Documentation (this feature)

```text
specs/021-frontend-absolute-links/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md        # /speckit-tasks 生成
```

### Source Code

```text
docs/development.md   # 新增「前端 UI 链接」小节
```

**Structure Decision**: 只改现有文档，不新增文件。

## Complexity Tracking

无。
