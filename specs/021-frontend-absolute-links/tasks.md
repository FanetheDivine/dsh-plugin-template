# Tasks: 前端 UI 链接使用完整 URL

**Input**: Design documents from `specs/021-frontend-absolute-links/`

**Prerequisites**: plan.md、spec.md、research.md、quickstart.md

**Tests**: 纯文档变更，不新增测试。

## Phase 1: 文档规则与交付

**Goal**: `docs/development.md` 写清前端 UI 链接必须使用完整 URL 的要求与原因，并完成质量门禁与归档。

**Independent Test**: 打开 `docs/development.md` 的前端章节读到规则；按规则写出的 `a` 标签在 Desktop 中可打开。

- [x] T001 [US1] 在 `docs/development.md` 的「前端构建」之后新增「前端 UI 链接」小节，写明 `a` 标签的 `href` MUST 使用完整 URL，并给出含协议与主机的示例
- [x] T002 [US2] 在同一小节写明原因：Desktop 用应用内地址加载前端页面，相对路径的 `href` 打不开目标
- [x] T003 运行 `pnpm format` 与 `pnpm check`
- [x] T004 按宪章原则 III 在 `CHANGELOG.md` 的 Unreleased 补充条目
- [x] T005 核对 `git diff` 只含 `docs/development.md`、`CHANGELOG.md` 与本次 spec 产物，然后提交

**Checkpoint**: 文档小节完成，质量门禁通过，改动已提交。

## Dependencies & Execution Order

- T001 与 T002 修改同一小节，按顺序执行。
- T003 依赖 T001、T002。
- T004 依赖 T003。
- T005 依赖 T004。

## Implementation Strategy

一次完成 Phase 1，提交一个 commit。
