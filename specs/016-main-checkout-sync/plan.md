# Implementation Plan: 主工作区约束与 main 同步

**Branch**: `docs/016-main-checkout-sync` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-main-checkout-sync/spec.md`

**变更类别**: 模板变更

## Summary

- `AGENTS.md` 新增「主工作区」一节，写明主工作区的四条约束。
- worktree 扩展新增脚本 `sync-main.sh`：
  - 检查主工作区位于 `main` 且干净。
  - 检查本地 `main` 是 `origin/main` 的祖先。
  - 用 `git pull --ff-only` 把主工作区快进到 `origin/main`。
- `/speckit-worktree-create` 在创建 worktree 前运行 `sync-main.sh`，失败时停止。
- `/speckit-worktree-finish` 在清理 worktree 后运行 `sync-main.sh`，失败时报告原因并保留主工作区现状。
- 新增 `tests/sync-main.test.ts` 覆盖同步脚本。

## Technical Context

**Language/Version**: Bash 脚本；TypeScript 测试，Node.js 24.9+

**Primary Dependencies**: git；vitest；无新增依赖

**Storage**: N/A

**Testing**: vitest `code` project，在临时仓库与 bare origin 中运行脚本

**Target Platform**: Spec Kit 流程，Git for Windows bash、Linux、macOS

**Project Type**: DSH 插件模板

**Performance Goals**: N/A

**Constraints**:

- 同步只做 fast-forward，不改写本地提交。
- 主工作区只运行 `git fetch` 与 `git pull`。
- 本机没有 `specify` CLI，渲染 skill 按 [research.md](./research.md#r4-skill-渲染) 手工同步。

**Scale/Scope**: 1 个新脚本、2 份扩展命令与对应 skill、`AGENTS.md`、`docs/development.md`、1 个新测试

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按宪章 2.0.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不改依赖 |
| II 测试同步 | 通过 | 新增 `tests/sync-main.test.ts`；不涉及宿主装载；无 `dsh` 版本变更 |
| III 文档结构 | 通过 | 主工作区约束只归属 `AGENTS.md`；执行步骤归属扩展命令；`docs/development.md` 只更新流程表产出；CHANGELOG 在 push 时补充 |
| IV 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| V 公开引用 | 通过 | 只引用仓库内路径 |
| Governance | 通过 | 宪章不变，无需修订 |

Phase 1 设计后复核：脚本接口见 [contracts/sync-main.md](./contracts/sync-main.md)，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/016-main-checkout-sync/
├── plan.md
├── research.md
├── quickstart.md
├── contracts/
│   └── sync-main.md
└── tasks.md
```

无持久化数据，不生成 `data-model.md`。

### Source Code (repository root)

```text
AGENTS.md                                         # 新增「主工作区」一节
docs/development.md                               # 流程表第 1、7 步产出
.specify/extensions/worktree/
├── commands/speckit.worktree.create.md           # 创建前同步主工作区
├── commands/speckit.worktree.finish.md           # 清理后同步主工作区
└── scripts/bash/sync-main.sh                     # 新增
.dsh/skills/speckit-worktree-create/SKILL.md      # 与 create 命令正文一致
.dsh/skills/speckit-worktree-finish/SKILL.md      # 与 finish 命令正文一致
tests/sync-main.test.ts                           # 新增
```

**Structure Decision**: 同步逻辑放进独立脚本，由两份扩展命令在各自步骤中调用。`create-worktree.sh` 与 `finish-worktree.sh` 保持不变。

## Complexity Tracking

无偏离。
