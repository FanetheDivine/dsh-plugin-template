# Implementation Plan: 协作场景的 spec 编号唯一性

**Branch**: `fix/017-spec-number-uniqueness` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-spec-number-uniqueness/spec.md`

## Summary

创建 spec 时在远程占号：算号前同步远程全部分支，建 worktree 前推送同名分支，推送后按分支名排序消解同号；交付前再校验一次编号唯一性。

## Technical Context

**Language/Version**: Bash 5（Git Bash、Linux、macOS），TypeScript 5（测试）

**Primary Dependencies**: git、pnpm、vitest、Spec Kit 脚本

**Storage**: git 远程分支与 `specs/` 目录

**Testing**: vitest，`tests/worktree-extension.test.ts` 在临时仓库与 bare origin 上执行扩展脚本

**Target Platform**: Git Bash（Windows）、Linux、macOS

**Project Type**: 仓库工具（Spec Kit worktree 扩展脚本）

**Performance Goals**: 占号给创建流程增加的耗时不超过 5 秒（SC-005）

**Constraints**: 不依赖 jq；兼容 MSYS 参数转换；离线时中止创建

**Scale/Scope**: 单仓库多人协作；现有 16 个 spec 的目录与分支保持不变

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 依据 |
| --- | --- | --- |
| I. 宿主依赖版本 | PASS | 不修改依赖版本 |
| II. 测试同步 | PASS | 新增占号、改号、失败回滚与交付前校验用例 |
| III. 文档结构 | PASS | 机制写入 `docs/development.md`，命令说明留在扩展 `commands/`，CHANGELOG 记录 |
| IV. 质量门禁 | PASS | 交付前运行 `pnpm format && pnpm check` |
| V. 公开引用 | PASS | 只引用仓库内路径与公网 URL |

Phase 1 复查：设计与研究没有引入新违例，Complexity Tracking 为空。

## Project Structure

### Documentation (this feature)

```text
specs/017-spec-number-uniqueness/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── create-worktree-cli.md
│   ├── check-spec-number-cli.md
│   └── finish-flow.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
.specify/extensions/worktree/
├── commands/
│   ├── speckit.worktree.create.md
│   └── speckit.worktree.finish.md
└── scripts/bash/
    ├── create-worktree.sh
    ├── check-spec-number.sh      # 新增
    ├── spec-number-lib.sh        # 新增
    ├── finish-worktree.sh
    ├── sync-baseline.sh
    └── sync-main.sh

.dsh/skills/
├── speckit-worktree-create/SKILL.md
└── speckit-worktree-finish/SKILL.md

tests/worktree-extension.test.ts
docs/development.md
CHANGELOG.md
```

**Structure Decision**: 沿用 worktree 扩展的现有目录，脚本、命令说明与测试同处一个扩展演进。

## Phase 0 研究

结论见 [research.md](./research.md)。

## Phase 1 设计

- 实体与规则见 [data-model.md](./data-model.md)。
- 脚本接口见 [contracts/create-worktree-cli.md](./contracts/create-worktree-cli.md) 与 [contracts/check-spec-number-cli.md](./contracts/check-spec-number-cli.md)。
- 交付流程约定见 [contracts/finish-flow.md](./contracts/finish-flow.md)。
- 验证步骤见 [quickstart.md](./quickstart.md)。

## Complexity Tracking

无。
