# Implementation Plan: 开发流程与文档结构集中到宪章

**Branch**: `main` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-dev-flow-in-constitution/spec.md`

## Summary

把开发流程、文档结构、优先级规则集中到宪章，其他文档只保留归属于自己的内容并链接宪章。

- 宪章 1.3.0 → 1.4.0：
  - 原则 V 扩展为「文档结构」。
  - 「开发流程」节吸收 `AGENTS.md` 的流程细则。
  - Governance 新增优先级与冲突提示。
- `AGENTS.md` 只留交互指令、写作规范、流程入口与文档索引。
- `docs/development.md` 保留命令与产物表，规则改为链接。
- worktree-finish 的 CHANGELOG 规则来源改为宪章。

## Technical Context

**Language/Version**: Markdown 文档；无代码变更

**Primary Dependencies**: Spec Kit `1.4.2.dev0` 的 skill 与模板

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`；文档验证见 [quickstart.md](./quickstart.md)

**Target Platform**: DSH 会话中的 Agent 与仓库维护者

**Project Type**: DSH 插件模板仓库

**Performance Goals**: N/A

**Constraints**:

- 遵守 `AGENTS.md` 写作规范。
- 宪章修订经 `/speckit-constitution`。
- 本机无 `specify` CLI，skill 手工同步，见 [research.md](./research.md) R5。

**Scale/Scope**: 5 个文件：宪章、`AGENTS.md`、`docs/development.md`、worktree-finish 源与渲染产物，另加 `CHANGELOG.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 条款 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不改 `src/` |
| II 依赖归属 | 通过 | 不新增依赖 |
| III 严格配置 | 通过 | 不改配置解析 |
| IV 测试同步 | 通过 | 无代码变更；`tests/` 不依赖被改文档的内容 |
| V 文档分级 | 通过 | 本需求即调整文档；无用户可见行为变化，README 不变；`docs/development.md` 同步；main 上每个 commit 增加 CHANGELOG 条目 |
| VI 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | spec 声明为模板变更；`demo_echo`、README 与测试不受影响 |
| 技术约束 | 通过 | 不涉及 |
| 开发流程：创建 worktree | 偏离 | 用户要求在 main 上进行，见 Complexity Tracking |
| 开发流程：每阶段一个 commit | 通过 | `tasks.md` 按阶段提交 |
| Governance：修订经 `/speckit-constitution` | 通过 | 宪章修改在实施阶段通过该 skill 进行 |

Phase 1 设计后复查：结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/002-dev-flow-in-constitution/
├── spec.md
├── plan.md
├── research.md
├── data-model.md        # 文档归属表与待清理副本
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 生成
```

本需求没有对外接口，不生成 `contracts/`。

### Source Code (repository root)

```text
AGENTS.md
CHANGELOG.md
docs/development.md
.specify/memory/constitution.md
.specify/extensions/worktree/commands/speckit.worktree.finish.md
.dsh/skills/speckit-worktree-finish/SKILL.md
```

**Structure Decision**: 只修改上列文档，各文件的目标归属见 [data-model.md](./data-model.md)。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| 开发流程第 2 条：未创建分支与 worktree，直接在 `main` 上进行 | 用户要求 | 用户明确选择在 main 上进行；按本需求新增的优先级规则，用户要求优先，冲突已在对话中提示 |
