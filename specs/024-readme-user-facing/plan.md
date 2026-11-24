# Implementation Plan: README 面向用户与宪章文档结构调整

**Branch**: `docs/024-readme-user-facing` | **Date**: 2026-11-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-readme-user-facing/spec.md`

**Status**: Approved

**变更类别**: 模板变更

## Open Decisions

无。

## Clarifications

### Session 2026-11-24

- 规格阶段的决策见 [spec.md](./spec.md#clarifications)。
- [P-001] Q: README 正文采用 research.md R1 的草稿？ -> A: 采用。
- [P-002] Q: 宪章原则 III 采用 research.md R2 的草稿？ -> A: 采用。
- [P-003] Q: 是否新增 README 内容的自动测试？ -> A: 不新增。
- [D-011] 实施中用户追加：发布设置增加设置 `package.json` `repository` 一步；`ci.yml` `publish` job 的注释同步该步骤。

## Review Record

- 2026-11-24 | Decision: Approved | Scope: current full document | Open items: none | Risks: 包未发布时 npm 徽标显示 not found；README 无自动内容测试
- 2026-11-24 | Decision: Approved | Scope: current full document，含 D-011 | Open items: none | Risks: 包未发布时 npm 徽标显示 not found；README 无自动内容测试

## Summary

- `README.md` 改为插件名、npm 版本徽标、简介与功能列表，删除安装、配置、工具三节。
- 宪章原则 III 把文档分为用户文档与技术文档：
  - `README.md` 是用户文档，不计入单一归属，可以复述技术文档。
  - README 的内容规则写在原则 III。
- 宪章版本 2.0.0 → 2.1.0，更新 Sync Impact Report。
- `AGENTS.md` 索引与 `docs/template-conversion.md` 同步 README 的新范围。
- `docs/template-conversion.md` 发布设置增加：在 `package.json` 设置 `repository` 为新插件的仓库 URL；`.github/workflows/ci.yml` 的注释同步。

## Technical Context

**Language/Version**: Markdown

**Primary Dependencies**: 无

**Storage**: N/A

**Testing**: `pnpm format && pnpm check`；package-pack 测试确认 README 进包

**Target Platform**: GitHub、npm 包页与 DSH 插件详情页

**Project Type**: DSH 插件模板

**Performance Goals**: N/A

**Constraints**:

- 徽标与链接只用公网 URL，满足宪章原则 V。
- README 作为 DSH 详情页时相对链接无法解析，链接用 GitHub 绝对 URL。

**Scale/Scope**: 4 份文档与 `.github/workflows/ci.yml` 的注释

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按宪章 2.0.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不改依赖 |
| II 测试同步 | 通过 | 无代码变更；README 仍进包，package-pack 测试不变；无 `dsh` 版本变更 |
| III 文档结构 | 通过 | 本需求修订原则 III；修订后 README 的规则只写在宪章；`AGENTS.md` 与 `docs/template-conversion.md` 只放链接或一句说明；CHANGELOG 在 push 时补充 |
| IV 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| V 公开引用 | 通过 | 徽标指向 shields.io 与 npmjs.com，均为公网 URL |
| Governance | 通过 | 修订按 `/speckit-constitution` 的规则递增 MINOR 版本 |

Phase 1 设计后复核：草稿见 [research.md](./research.md)，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/024-readme-user-facing/
├── plan.md
├── research.md
├── quickstart.md
└── tasks.md
```

无数据与外部接口，不生成 `data-model.md` 与 `contracts/`。

### Source Code (repository root)

```text
README.md                          # 徽标、简介与功能列表
.specify/memory/constitution.md    # 原则 III 与版本号
AGENTS.md                          # 文档索引中的 README 条目
docs/template-conversion.md        # README 要求与发布设置中的 repository 步骤
.github/workflows/ci.yml           # publish job 注释中的转化步骤
```

**Structure Decision**: 只改上述文档与 CI 注释，代码、测试与构建行为不变。

## Complexity Tracking

无偏离。
