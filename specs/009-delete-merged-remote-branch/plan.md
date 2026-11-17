# Implementation Plan: 合并后清理的交付流程

**Branch**: `feat/009-delete-merged-remote-branch` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-delete-merged-remote-branch/spec.md`

## Summary

交付流程从「创建 PR 后立即清理」改为「创建 PR → 等待 CI 全过与无冲突 → 处理评审意见 → 等待合并 → 删除远程分支、本地分支与 worktree」。`speckit-worktree-finish` skill 扩展为带等待与重推循环的交付流程；`finish-worktree.sh` 增加 `--merged` 路径，只在该路径删除远程分支，并在远程分支已自动删除时成功退出。

## Technical Context

**Language/Version**: Bash（Git for Windows 自带）、TypeScript 5.x、Node 24

**Primary Dependencies**: `gh` 2.97（CI、冲突、评论、合并状态）、git

**Storage**: N/A

**Testing**: `vitest`，`tests/worktree-extension.test.ts` 在临时仓库与 bare origin 中运行脚本

**Target Platform**: 仓库开发者的本地环境与 Agent 会话

**Project Type**: 插件模板仓库的流程与脚本

**Performance Goals**: 单次状态查询在数秒内返回；等待以后台任务实现，完成时唤醒会话

**Constraints**: 轮询不得阻塞会话无限期；合并由用户或上游维护者完成

**Scale/Scope**: 1 个脚本、1 个扩展命令源、1 个渲染产物、1 个测试文件、1 行文档、1 条 CHANGELOG

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不涉及插件导出 |
| II 依赖归属 | 通过 | 不新增依赖 |
| III 严格配置 | 通过 | 不涉及配置解析 |
| IV 测试同步 | 通过 | 脚本行为由 `tests/worktree-extension.test.ts` 覆盖 |
| V 文档结构 | 通过 | 流程细节只写在 skill 源与渲染产物；`docs/development.md` 只改产出描述；CHANGELOG 按 push 规则补 |
| VI 质量门禁 | 通过 | 实现后运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | 模板变更，`demo_echo`、README、测试保持可用 |
| VIII 公开引用 | 通过 | 只引用仓库内路径与公网工具名 |

## Project Structure

### Documentation (this feature)

```text
specs/009-delete-merged-remote-branch/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 生成
```

### Source Code (repository root)

```text
.specify/extensions/worktree/
├── commands/speckit.worktree.finish.md   # 扩展命令源
└── scripts/bash/finish-worktree.sh       # 清理脚本，新增 --merged
.dsh/skills/speckit-worktree-finish/SKILL.md  # 渲染产物，正文与命令源一致
.specify/extensions.yml                   # after_implement 钩子文案
docs/development.md                       # 流程表第 7 步产出
tests/worktree-extension.test.ts          # 脚本行为测试
CHANGELOG.md                              # push 时补条目
```

不需要接口契约目录：变更只涉及仓库内的流程脚本，无对外接口。

## Complexity Tracking

无偏离宪章的复杂度。

## Phase 0: Research

见 [research.md](./research.md)：`gh` 查询命令、`mergeable` 状态取值、轮询策略、`--merged` 前置条件。

## Phase 1: Design

- [data-model.md](./data-model.md)：交付状态机与脚本前置条件。
- [quickstart.md](./quickstart.md)：脚本级与 PR 级验证场景。