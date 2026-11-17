# Tasks: 开发流程与文档结构集中到宪章

**Input**: Design documents from `specs/002-dev-flow-in-constitution/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: spec 未要求新增测试；每阶段运行 `pnpm format && pnpm check`，文档验证按 [quickstart.md](./quickstart.md)。

**Commit**: 每个阶段一个 commit，提交到 `main`；每个 commit 在 `CHANGELOG.md` 的 `## Unreleased` 下增加条目。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行，文件不同且无依赖。
- **[Story]**: 对应 spec 的用户故事。

---

## Phase 1: Foundational — 宪章 1.4.0

**Purpose**: 宪章是其他文档的链接目标，必须先完成。

- [X] T001 [US1] 经 `/speckit-constitution` 重写 `.specify/memory/constitution.md`「开发流程」节，承载 FR-001 全部规则：步骤与执行条件、clarify 在存在不确定项时执行、分支名 `<type>/<NNN>-<short-name>` 与 `<type>` 取值 `feat`/`fix`/`refactor`/`docs`/`test`/`chore`、`--no-track`、worktree 位于 `worktrees/<NNN>-<short-name>`、基线取 `worktree-config.yml` 的 `base_ref`、Constitution Check 逐条通过、每阶段一个 commit、`[P]` 可交给子代理并行、自测与验收、`/speckit-worktree-finish` 的 deliver 与 `abandon` 两种结局及清理
- [X] T002 [US3] 在同一次修订中把 `.specify/memory/constitution.md` 原则 V 改为「文档结构」：按 [data-model.md](./data-model.md)「文档」表写明五类文档的读者、归属内容、引用关系，并规定禁止相互复述、引用只放链接、「复述」的判定见 research R6
- [X] T003 [US4] 在同一次修订中改写 `.specify/memory/constitution.md` Governance：优先级为用户的明确要求 > 宪章 > `AGENTS.md` 与其他文档；冲突时 Agent 先指出条款及影响再执行；Spec Kit 流程中的偏离记入 plan 的 Complexity Tracking 并注明用户要求；删除「`AGENTS.md` 是执行细则」一句，关系改由原则 V 描述
- [X] T004 [US3] 在同一次修订中删除 `.specify/memory/constitution.md` 原则 VI 对 `pnpm check` 步骤的复述，并把版本号升到 1.4.0、更新 Sync Impact Report 与 Last Amended
- [X] T005 在 `CHANGELOG.md` 记录宪章 1.4.0 的变更
- [X] T006 运行 `pnpm format && pnpm check`，提交宪章、`CHANGELOG.md` 与 `specs/002-dev-flow-in-constitution/`

**Checkpoint**: quickstart 场景 2、3、4 通过。

---

## Phase 2: User Story 1、2、3 — `AGENTS.md` 只留入口与索引 (Priority: P1)

**Goal**: 会话中的 Agent 从 `AGENTS.md` 获得流程入口，规则只在宪章中出现。

**Independent Test**: quickstart 场景 1。

- [X] T007 [US2] 把 `AGENTS.md`「Spec Kit 开发流程」节改为入口：需求与缺陷一律走 Spec Kit，从 `/speckit-specify <需求描述>` 开始，完整流程见宪章「开发流程」节的链接；流程相关内容不超过 3 行
- [X] T008 [US1] 删除 `AGENTS.md`「补充说明」中的自测命令、`<type>` 取值、基线说明；worktree 扩展维护方式的链接并入文档索引
- [X] T009 [US3] 把 `AGENTS.md` 第 5 行分工说明改为一句指向宪章原则 V 的链接，删除「文档」节的分级表，保留 `docs/` 索引列表
- [X] T010 在 `CHANGELOG.md` 记录 `AGENTS.md` 的调整
- [X] T011 运行 `pnpm format && pnpm check` 并提交

**Checkpoint**: quickstart 场景 1 通过。

---

## Phase 3: User Story 5 — `docs/development.md` 只留命令一览 (Priority: P2)

**Goal**: 开发者在 docs 中查到命令与产物，规则链接宪章。

**Independent Test**: quickstart 场景 5 中 `docs/development.md` 相关两项。

- [X] T012 [US5] 在 `docs/development.md`「Spec Kit 流程」节保留命令与产物表；把分支名与 worktree 位置规则改为指向宪章「开发流程」节的链接；保留 `base_ref` 须包含 `.specify/` 与 `.dsh/skills/`、`worktrees/` 已被忽略这两条工具事实
- [X] T013 [US5] 把 `docs/development.md`「测试」节中「单元测试使用模拟 `ctx`，宿主装载等做端到端验证」改为指向宪章原则 IV 的链接
- [X] T014 在 `CHANGELOG.md` 记录 `docs/development.md` 的调整
- [X] T015 运行 `pnpm format && pnpm check` 并提交

**Checkpoint**: `docs/development.md` 中找不到 MUST 类约束。

---

## Phase 4: User Story 6 — worktree-finish 引用宪章 (Priority: P3)

**Goal**: CHANGELOG 规则来源指向宪章原则 V。

**Independent Test**: quickstart 场景 6。

- [X] T016 [P] [US6] 把 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 中「per `AGENTS.md`」改为引用宪章原则 V
- [X] T017 [P] [US6] 对 `.dsh/skills/speckit-worktree-finish/SKILL.md` 做同样修改，按 research R5 手工同步
- [X] T018 [US6] 运行 quickstart 场景 6 的对比命令，确认输出 `BODY_SAME`
- [X] T019 在 `CHANGELOG.md` 记录 worktree-finish 的调整
- [X] T020 运行 `pnpm format && pnpm check` 并提交

**Checkpoint**: quickstart 场景 6 通过。

---

## Phase 5: Polish — 全量复述审查

- [X] T021 按宪章原则 V 逐文件审查 `README.md`、`AGENTS.md`、`.specify/memory/constitution.md`、`docs/*.md`、`src/*.ts` 文件头注释，清理 data-model「待清理副本」之外新发现的复述
- [X] T022 按 [quickstart.md](./quickstart.md) 逐项验证场景 1–7
- [X] T023 若 T021 有改动，在 `CHANGELOG.md` 记录，运行 `pnpm format && pnpm check` 并提交

---

## Dependencies & Execution Order

- Phase 1 先完成，其余阶段都链接宪章的新章节。
- Phase 2、3、4 修改不同文件，彼此独立，按顺序逐个提交。
- Phase 5 依赖前四个阶段。

## Parallel Opportunities

- T016 与 T017 修改不同文件，可并行。
- Phase 2、3、4 可由不同子代理并行编辑，提交仍按阶段顺序进行。

## Implementation Strategy

- MVP：Phase 1 + Phase 2。完成后流程规则已只有宪章一处来源，入口仍在 `AGENTS.md`。
- 随后完成 Phase 3、4，最后做全量审查。
