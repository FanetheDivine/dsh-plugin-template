# Implementation Plan: AGENTS.md 开发流程精简与文档归属调整

**Branch**: `docs/004-agents-flow-slim` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-agents-flow-slim/spec.md`

## Summary

- `AGENTS.md` 开发流程节只保留步骤表与两条实施规则。
- 宪章 1.5.0 → 1.6.0：
  - 删除开发流程节。
  - 原则 V 调整 `AGENTS.md` 与宪章的归属内容。
- `docs/development.md` 的开发流程链接改指 `AGENTS.md`。

## Technical Context

**Language/Version**: Markdown 文档

**Primary Dependencies**: Spec Kit `1.4.2.dev0` 的 skill 与 worktree 扩展

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`；文档验证见 [quickstart.md](./quickstart.md)

**Target Platform**: DSH 会话中的 Agent 与仓库维护者

**Project Type**: DSH 插件模板仓库

**Performance Goals**: N/A

**Constraints**:

- 遵守 `AGENTS.md` 写作规范。
- 宪章修订经 `/speckit-constitution`。
- `.dsh/skills/speckit-*` 保持不变。

**Scale/Scope**: 3 个文件：`AGENTS.md`、宪章、`docs/development.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 条款 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不改 `src/` |
| II 依赖归属 | 通过 | 不新增依赖 |
| III 严格配置 | 通过 | 不改配置解析 |
| IV 测试同步 | 通过 | 只改文档，`tests/` 不覆盖文档内容 |
| V 文档结构 | 通过 | 修订后归属表与实际内容一致；无用户可见行为变化，README 不变；CHANGELOG 在 push 时由 worktree-finish 补充 |
| VI 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | spec 声明为模板变更；`demo_echo`、README 与测试不受影响 |
| VIII 公开引用 | 通过 | 新链接指向仓库内路径 |
| Governance：修订经 `/speckit-constitution` | 通过 | 宪章修改在实施阶段通过该 skill 进行 |

Phase 1 设计后复查：结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/004-agents-flow-slim/
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
AGENTS.md                        # 开发流程节精简
.specify/memory/constitution.md  # 删除开发流程节，原则 V 调整归属
docs/development.md              # 开发流程链接改指 AGENTS.md
```

**Structure Decision**: 只改上述 3 个文件。

## Complexity Tracking

无偏离。
