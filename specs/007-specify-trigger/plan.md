# Implementation Plan: AGENTS.md 立即触发 speckit-specify

**Branch**: `docs/007-specify-trigger` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-specify-trigger/spec.md`

## Summary

`AGENTS.md` 改动四处：

1. 删除 `ask_user_question` 一句。
2. 开发流程首句改为立刻获取 skill `speckit-specify` 并按流程推进。
3. 步骤表 skill 名去除前导斜杠。
4. 步骤表第 1 步只保留「必做」。

## Technical Context

**Language/Version**: Markdown 文档

**Primary Dependencies**: Spec Kit `1.4.2.dev0` 的 skill 与 worktree 扩展

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`；文档验证见 [quickstart.md](./quickstart.md)

**Target Platform**: DSH 会话中的 Agent

**Project Type**: DSH 插件模板仓库

**Performance Goals**: N/A

**Constraints**:

- 遵守 `AGENTS.md` 写作规范。
- `.dsh/skills/`、`.specify/` 与宪章保持不变。

**Scale/Scope**: 1 个文件：`AGENTS.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 条款 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不改 `src/` |
| II 依赖归属 | 通过 | 不新增依赖 |
| III 严格配置 | 通过 | 不改配置解析 |
| IV 测试同步 | 通过 | 只改文档，`tests/` 不覆盖文档内容 |
| V 文档结构 | 通过 | 删除钩子细节后消除与 `speckit-specify` 的复述；无用户可见行为变化，README 不变；CHANGELOG 在 push 时由 `speckit-worktree-finish` 补充 |
| VI 质量门禁 | 通过 | 实施后运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | spec 声明为模板变更；`demo_echo`、README 与测试不受影响 |
| VIII 公开引用 | 通过 | 不新增链接 |

Phase 1 设计后复查：结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/007-specify-trigger/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # speckit-tasks 生成
```

本需求没有对外接口与数据实体，不生成 `contracts/` 与 `data-model.md`。

### Source Code (repository root)

```text
AGENTS.md    # 删除交互指令一句，开发流程首句与步骤表调整
```

**Structure Decision**: 只改 `AGENTS.md`。

## Complexity Tracking

无偏离。
