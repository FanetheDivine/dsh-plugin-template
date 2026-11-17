# Implementation Plan: 模板转化确认 dsh 升级与提交内容公开引用

**Branch**: `docs/003-constitution-upgrade-and-public-refs` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-constitution-upgrade-and-public-refs/spec.md`

## Summary

- 宪章 1.4.0 → 1.5.0：
  - 原则 VII 的模板转化步骤增加 dsh 依赖升级确认。
  - 新增原则 VIII「公开引用」。
- `run-test.mjs` 报错示例改为占位符。
- `AGENTS.md` 开发流程节写明仓库内的任何变更都走 Spec Kit。

## Technical Context

**Language/Version**: Markdown 文档；一处 JavaScript 字符串

**Primary Dependencies**: Spec Kit `1.4.2.dev0` 的 skill 与模板

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`；文档验证见 [quickstart.md](./quickstart.md)

**Target Platform**: DSH 会话中的 Agent 与仓库维护者

**Project Type**: DSH 插件模板仓库

**Performance Goals**: N/A

**Constraints**:

- 遵守 `AGENTS.md` 写作规范。
- 宪章修订经 `/speckit-constitution`。

**Scale/Scope**: 3 个文件：宪章、`AGENTS.md`、`.dsh/skills/real-device-test/scripts/run-test.mjs`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 条款 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 不改 `src/` |
| II 依赖归属 | 通过 | 不新增依赖 |
| III 严格配置 | 通过 | 不改配置解析 |
| IV 测试同步 | 通过 | `run-test.mjs` 只改报错文案，`tests/` 不覆盖实机测试脚本 |
| V 文档结构 | 通过 | 新规则只写在宪章；无用户可见行为变化，README 不变；CHANGELOG 在 push 时由 worktree-finish 补充 |
| VI 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | spec 声明为模板变更；`demo_echo`、README 与测试不受影响 |
| VIII 公开引用（新增） | 通过 | 本次修复唯一违例 `run-test.mjs`，见 [research.md](./research.md) R3 |
| 开发流程 | 通过 | 在 worktree 内进行，分支 `docs/003-constitution-upgrade-and-public-refs` |
| Governance：修订经 `/speckit-constitution` | 通过 | 宪章修改在实施阶段通过该 skill 进行 |

Phase 1 设计后复查：结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/003-constitution-upgrade-and-public-refs/
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
.specify/memory/constitution.md                    # 原则 VII 增加升级确认，新增原则 VIII
AGENTS.md                                          # 开发流程节措辞
.dsh/skills/real-device-test/scripts/run-test.mjs  # 报错示例改为占位符
```

**Structure Decision**: 只改上述 3 个文件。

## Complexity Tracking

无偏离。
