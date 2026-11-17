# Tasks: 模板转化确认 dsh 升级与提交内容公开引用

**Input**: Design documents from `specs/003-constitution-upgrade-and-public-refs/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[quickstart.md](./quickstart.md)

**Tests**: spec 未要求新增测试；每阶段运行 `pnpm format && pnpm check`，验证按 [quickstart.md](./quickstart.md)。

**Commit**: 每个阶段一个 commit。CHANGELOG 在 push 时由 `/speckit-worktree-finish` 补充。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: 宪章 1.5.0 (US1、US2)

**Goal**: 宪章承载升级确认与公开引用两条规则。

**Independent Test**: quickstart 场景 2。

- [X] T001 [US1] 经 `/speckit-constitution` 在 `.specify/memory/constitution.md` 原则 VII 增加条目：模板转化 MUST 在发布设置之前向用户确认是否把全部 `@deepseek-ai/dsh-*` 依赖升级到最新版本；确认升级后同步 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 版本号，并按原则 IV 提醒实机测试；拒绝时版本不变。见 research R1、R2
- [X] T002 [US2] 在同一次修订中新增原则 VIII「公开引用」：提交到 git 的全部跟踪文件只能引用公网 URL 或仓库内路径；禁止本机绝对路径、指向仓库外的相对路径、`package.json` 中指向仓库外的 `file:` 与 `link:` 依赖、其他用户无权访问的 URL；允许占位符路径与本地回环地址的运行时说明
- [X] T003 在同一次修订中把版本升到 1.5.0，更新 Sync Impact Report 与 Last Amended
- [X] T004 运行 `pnpm format && pnpm check`，提交宪章与 `specs/003-constitution-upgrade-and-public-refs/`

**Checkpoint**: quickstart 场景 2 通过。

---

## Phase 2: 清理违例与 AGENTS.md (US2、US3)

**Goal**: 跟踪文件中没有本机引用；`AGENTS.md` 写明全部变更走 Spec Kit。

**Independent Test**: quickstart 场景 3、4。

- [ ] T005 [P] [US2] 把 `.dsh/skills/real-device-test/scripts/run-test.mjs` 第 16 行报错示例中的本机仓库路径改为 `<drive>:/path/to/<repo>` 占位符
- [ ] T006 [P] [US3] 确认 `AGENTS.md` 开发流程节为「仓库内的任何变更都按照 [Spec Kit](https://github.com/github/spec-kit) 流程进行开发，从 skill `speckit-specify` 开始。」
- [ ] T007 运行 `pnpm format && pnpm check` 与 quickstart 场景 3，提交

**Checkpoint**: quickstart 场景 1–4 全部通过。

---

## Dependencies & Execution Order

- Phase 1 → Phase 2。
- T005 与 T006 文件不同，可并行。

## Implementation Strategy

1. 完成 Phase 1，宪章生效。
2. 完成 Phase 2，仓库符合新原则 VIII。
3. 请用户验收后运行 `/speckit-worktree-finish`。
