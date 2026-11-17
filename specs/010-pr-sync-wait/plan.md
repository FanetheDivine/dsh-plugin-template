# Implementation Plan: 交付流程的基线同步与无上限等待

**Branch**: `feat/010-pr-sync-wait` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-pr-sync-wait/spec.md`

## Summary

`speckit-worktree-finish` 的交付流程改为：本地验证 → 合入最新 `origin/main` 并更新锁文件 → 推送并创建 PR → 后台无上限等待 CI → 后台无上限同时等待评论、冲突与合并 → 合并后清理。新增 `sync-baseline.sh` 承担基线的拉取、合并与锁文件更新；skill 正文把三个有截止时间的等待换成无上限的后台任务，冲突在「评论与合并」等待中复查。

## Technical Context

**Language/Version**: Bash（Git for Windows 自带）、TypeScript 5.x、Node 24

**Primary Dependencies**: `gh` 2.97（CI、冲突、评论、合并状态）、git、pnpm

**Storage**: N/A

**Testing**: `vitest`，`tests/worktree-extension.test.ts` 在临时仓库与 bare origin 中运行脚本

**Target Platform**: 仓库开发者的本地环境与 Agent 会话

**Project Type**: 插件模板仓库的流程与脚本

**Performance Goals**: 基线合并在秒级完成；等待作为后台任务，不阻塞主会话

**Constraints**: 等待无时间上限；合并由用户或上游维护者执行；流程只处理评论缺陷、CI 报错与冲突

**Scale/Scope**: 1 个新脚本、1 个扩展命令源、1 个渲染产物、1 个测试文件、1 行文档、1 条 CHANGELOG

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不涉及插件导出 |
| II 依赖归属 | 通过 | 不新增依赖 |
| III 严格配置 | 通过 | 不涉及配置解析 |
| IV 测试同步 | 通过 | `sync-baseline.sh` 的行为由 `tests/worktree-extension.test.ts` 新增用例覆盖；skill 正文无自动化测试，按 quickstart 人工核对 |
| V 文档结构 | 通过 | 流程细节写在 skill 源与渲染产物；`docs/development.md` 只改产出描述；CHANGELOG 在 push 时补 |
| VI 质量门禁 | 通过 | 实现后运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | 模板变更，`demo_echo`、README 与测试保持可用 |
| VIII 公开引用 | 通过 | 只引用仓库内路径与公网工具名 |

## Project Structure

### Documentation (this feature)

```text
specs/010-pr-sync-wait/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
├── spec.md
└── tasks.md             # /speckit-tasks 生成
```

### Source Code (repository root)

```text
.specify/extensions/worktree/
├── commands/speckit.worktree.finish.md          # 扩展命令源：基线同步与无上限等待
└── scripts/bash/sync-baseline.sh                # 新增：拉取并合入基线、更新锁文件
.specify/extensions/worktree/extension.yml       # provides.commands 说明是否需要改
.dsh/skills/speckit-worktree-finish/SKILL.md     # 渲染产物，正文与命令源一致
tests/worktree-extension.test.ts                 # sync-baseline.sh 行为测试
docs/development.md                              # 流程表第 7 步产出描述
CHANGELOG.md                                     # push 时补条目
```

不需要接口契约目录：变更只涉及仓库内的流程脚本与 skill 文本，无对外接口。

## Complexity Tracking

无偏离宪章的复杂度。

## Phase 0: Research

见 [research.md](./research.md)：基线同步的脚本边界、冲突回退、锁文件判定、无上限等待的终止条件、单个合并等待的状态集合。

## Phase 1: Design

- [data-model.md](./data-model.md)：基线同步结果与交付等待的状态机。
- [quickstart.md](./quickstart.md)：脚本级与 PR 级验证场景。
