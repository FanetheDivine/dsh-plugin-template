# Implementation Plan: 合并等待的轮询节奏与合并后 main 同步

**Branch**: `docs/022-merge-poll-sync` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/022-merge-poll-sync/spec.md`

**Status**: Approved

**变更类别**: 模板变更

## Open Decisions

无。

## Clarifications

### 2026-11-21 会话

- 规格阶段的决策见 [spec.md](./spec.md#澄清记录)。
- [P-001] 问：主工作区的 stash、切换与临时分支保存放在哪里？ → 答：给 `sync-main.sh` 加 `--prepare`，默认模式不变。
- [P-002] 问：保存未推送提交的临时分支如何命名？ → 答：`wip/<branch>-<timestamp>`。
- [P-003] 问：合并等待每轮的 gh 调用怎么处理？ → 答：每轮一次 `gh pr view`，用 `jq` 取字段。

## Review Record

- 2026-11-21：用户批准当前完整计划。 | Decision: Approved | Scope: current full document | Open items: none | Risks: stash 与临时分支保留本地；合并等待片段无自动测试；同步失败时报告并继续清理

## Summary

- `speckit-worktree-finish` 的 CI 等待改为 15 秒。
- 合并等待从启动起前 5 分钟按 10 秒轮询，之后按 30 秒轮询。
- 检测到合并后先同步主工作区，再清理：
  - 会话工作目录切到主工作区。
  - 未提交变更存入 stash。
  - 其他分支切回 `main`。
  - 未推送的 `main` 提交保存在临时分支。
  - 运行 `sync-main.sh` 快进 `main`。
- 放弃模式同样先同步再清理；清理阶段不再同步。
- `AGENTS.md` 的主工作区节改为：
  - 目标状态：位于 `main` 且干净；不满足时先用可恢复的操作恢复。
  - 允许 `git fetch`、`git pull` 与可恢复的操作。
  - 可恢复定义为不丢失已提交内容与未提交变更，列出 `git stash`、`git switch`、`git branch`、`git reset --hard`、`git worktree remove`、`git branch -D`。
- `sync-main.sh` 新增 `--prepare` 模式，`tests/sync-main.test.ts` 覆盖整理与失败场景。

## Technical Context

**Language/Version**: Bash；TypeScript 测试，Node.js 24.9+

**Primary Dependencies**: git、GitHub CLI `gh`、jq（skill 片段使用）；无新增依赖

**Storage**: N/A

**Testing**: vitest `code` project，临时仓库与 bare origin 中运行 `sync-main.sh --prepare`

**Target Platform**: Spec Kit 流程，Git for Windows bash、Linux、macOS

**Project Type**: DSH 插件模板

**Performance Goals**: 合并检测前 5 分钟延迟 ≤ 10 秒，之后 ≤ 30 秒；CI 检测间隔 15 秒

**Constraints**:

- 主工作区整理只使用 `AGENTS.md` 允许的可恢复命令。
- `sync-main.sh` 默认模式保持现有严格行为，`--prepare` 才修改主工作区。
- 本机没有 `specify` CLI，渲染后的 skill 正文手工同步。

**Scale/Scope**: 1 个脚本、1 个测试文件、2 份扩展命令与对应 skill、`AGENTS.md`、`docs/development.md`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按宪章 2.0.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不改依赖 |
| II 测试同步 | 通过 | 更新 `tests/sync-main.test.ts` 覆盖 `--prepare`；不涉及宿主装载；无 `dsh` 版本变更 |
| III 文档结构 | 通过 | 主工作区规则归属 `AGENTS.md`；流程步骤归属 worktree 扩展命令；`docs/development.md` 只更新流程表；CHANGELOG 在 push 时补充 |
| IV 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| V 公开引用 | 通过 | 只引用仓库内路径 |
| Governance | 通过 | 宪章不变；`AGENTS.md` 规则按用户要求修订 |

Phase 1 设计后复核：`sync-main.sh --prepare` 的接口见 [contracts/sync-main.md](./contracts/sync-main.md)，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/022-merge-poll-sync/
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
AGENTS.md                                                    # 主工作区规则
docs/development.md                                          # 流程表第 7 步
.specify/extensions/worktree/
├── commands/speckit.worktree.finish.md                      # 轮询节奏、同步步骤与清理顺序
└── scripts/bash/sync-main.sh                                # 新增 --prepare
.dsh/skills/speckit-worktree-finish/SKILL.md                 # 与 finish 命令正文一致
tests/sync-main.test.ts                                      # --prepare 覆盖
```

**Structure Decision**: 主工作区整理放进 `sync-main.sh` 的新 `--prepare` 模式，交付与放弃流程都先调用它；`finish-worktree.sh` 保持不变。

## Complexity Tracking

无偏离。