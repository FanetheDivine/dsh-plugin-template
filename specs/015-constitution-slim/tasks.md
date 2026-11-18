# Tasks: 宪章精简

**Input**: `specs/015-constitution-slim/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: 宪章原则 IV 测试同步要求；US2 包含依赖回归测试。

**Organization**: 按用户故事分组；每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 在 worktree 根目录运行 `pnpm install`，确认 `pnpm check` 在改动前通过；提交 `specs/015-constitution-slim/`

---

## Phase 2: User Story 1 - Constitution Check 只核对硬约束 (Priority: P1) 🎯 MVP

**Goal**: 宪章 2.0.0 只含五条原则。

**Independent Test**: 按 [quickstart.md](./quickstart.md) 第 1 步核对原则列表与版本。

- [X] T002 [US1] 经 `/speckit-constitution` 重写 `.specify/memory/constitution.md`：
  - 原则依次为 I 宿主依赖版本、II 测试同步（不可协商）、III 文档结构、IV 质量门禁、V 公开引用。
  - 原则 II–V 的条款与原原则 IV、V、VI、VIII 一致。
  - 原则 I 写明 [research.md](./research.md) R1 的三条规则与理由，不含「最新发布」与「无对应版本时移除」。
  - Governance 保持现状。
  - 版本 `2.0.0`，Ratified `2026-11-17`，Last Amended `2026-11-18`，更新 Sync Impact Report。
- [X] T003 [US1] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 宪章 2.0.0 生效；其他文档中的编号引用在 Phase 4 同步。

---

## Phase 3: User Story 2 - 宿主依赖版本有唯一依据 (Priority: P1)

**Goal**: dsh 依赖版本不一致或漏列 `minimumReleaseAgeExclude` 时测试失败。

**Independent Test**: `pnpm vitest run tests/dependency-versions.test.ts` 通过；改动任一 `dsh-*` 版本后失败。

- [X] T004 [US2] 新增 `tests/dependency-versions.test.ts`，按 research R5 校验：
  - `package.json` 全部 `@deepseek-ai/dsh-*` 依赖为同一确切版本，不含范围符号。
  - 每个 `dsh-*` 依赖在 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 中有 `<包名>@<版本>` 条目。
  - `minimumReleaseAgeExclude` 中的 `@deepseek-ai/dsh-*` 条目都对应一个依赖。
  - 文件顶部用一两句话说明职责。
- [X] T005 [US2] 临时修改一个 `dsh-*` 版本，确认测试失败后恢复
- [X] T006 [US2] 在 `docs/development.md` 测试表加入 `tests/dependency-versions.test.ts`
- [X] T007 [US2] 运行 `pnpm format && pnpm check`，提交

---

## Phase 4: User Story 3 - 移出的规则仍能在归属文档中查到 (Priority: P2)

**Goal**: 迁出规则各有唯一归属，编号引用指向正确原则。

**Independent Test**: 按 [data-model.md](./data-model.md) 迁移表逐行核对；运行 [quickstart.md](./quickstart.md) 第 2 步。

- [ ] T008 [P] [US3] 修改 `docs/how-it-works.md`：
  - 「入口契约」补充：`inject` 列出 `apply` 用到的全部宿主服务；需要热重载的 `Config` 字段用 `.volatile()` 标记；宿主类型经 `src/types.ts` 以 type-only 方式导入。
  - 「配置解析」写入四条规则：解析是 `apply` 的第一步；缺省或 `null` 的键用默认值；未知键与非法值抛错使插件加载失败；解析结果冻结后返回。删除宪章链接。
  - 「依赖复用」写入依赖归属：新增依赖在 plan 中声明归属；宿主自带的放 `devDependencies` 并由 `tsdown.config.ts` 的 `neverBundle` 保持 external；宿主未提供的放 `dependencies`、列入 `alwaysBundle`、由 `tests/package-pack.test.ts` 回归。版本规则链接宪章原则 I。
- [ ] T009 [P] [US3] 修改 `docs/i18n.md`：删除首行指向宪章原则 IX 的句子；新增「约束」节，写入原原则 IX 的全部条目，`国际化规范归属本文` 一条省略
- [ ] T010 [P] [US3] 修改 `docs/known-risks.md`：「安装 rc 依赖」链接改为宪章原则 I；「共享宿主实例」链接改为 `docs/how-it-works.md` 的「依赖复用」节
- [ ] T011 [P] [US3] 修改 `docs/development.md` 测试节：宪章原则 IV 改为原则 II
- [ ] T012 [P] [US3] 在 `.specify/extensions/worktree/commands/speckit.worktree.finish.md` 与 `.dsh/skills/speckit-worktree-finish/SKILL.md` 中把 `principle V` 改为 `principle III`，核对两者正文一致
- [ ] T013 [US3] 运行 `pnpm format && pnpm check`，提交

---

## Phase 5: User Story 4 - 模板转化有独立的操作文档 (Priority: P2)

**Goal**: 从 `AGENTS.md` 找到模板转化文档并列全步骤。

**Independent Test**: 只读 `AGENTS.md` 与 `docs/template-conversion.md`，对照原原则 VII 的步骤与顺序。

- [ ] T014 [US4] 新增 `docs/template-conversion.md`，承载原原则 VII，顺序不变：
  - 变更类别：每个 spec 声明模板变更或模板转化，无法归类时在 clarify 阶段向用户确认。
  - 模板变更：保持 `demo_echo` 示例、README 与测试可用，新用户能按 README 跑通。
  - 模板转化：重新修订宪章与 `AGENTS.md`，更新项目名、包名、README 与 `cordis.patch.yml`，宪章版本按语义化规则递增并记录理由。
  - 发布设置之前向用户确认是否把依赖升级到 npm 上最新的 `@deepseek-ai/dsh` 版本；确认后按宪章原则 I 同步全部依赖与 `minimumReleaseAgeExclude`，按原则 II 提醒实机测试；拒绝时版本不变。
  - 发布设置：清空 `package.json` 的 `version`；恢复 `.github/workflows/ci.yml` 中 `publish` 的 `if` 并删除 `if: false`；提醒用户绑定 npm Trusted Publisher；清空过往 spec 与 changelog。
- [ ] T015 [US4] 修改 `AGENTS.md`：新增「模板说明」节，写明本仓库是 DSH 插件模板、spec 声明变更类别、模板转化前先读 `docs/template-conversion.md`；文档索引加入该文档
- [ ] T016 [P] [US4] 修改 `docs/development.md` CI 节：模板转化链接改为 `docs/template-conversion.md`
- [ ] T017 [P] [US4] 修改 `.github/workflows/ci.yml` 注释：步骤来源改为 `docs/template-conversion.md`
- [ ] T018 [US4] 运行 `pnpm format && pnpm check`，提交

---

## Phase 6: Polish

- [ ] T019 按 [quickstart.md](./quickstart.md) 全部步骤核对
- [ ] T020 按宪章原则 III 审查改动文件：每条规则只在归属文档完整出现；按原则 V 检查只引用仓库内路径
- [ ] T021 有修正时运行 `pnpm format && pnpm check` 并提交

---

## Dependencies

- Phase 1 → Phase 2 → 其余阶段。
- Phase 3、4、5 都引用 2.0.0 的编号，依赖 Phase 2；三者之间相互独立。
- Phase 4 的 T008–T012 改不同文件，可并行。
- T011 与 T016 改同一文件的不同节，分属两个阶段顺序执行。

## Implementation Strategy

- MVP：Phase 1 + Phase 2，宪章 2.0.0 生效。
- 按 Phase 3 → 4 → 5 递增交付，每个阶段一个 commit。
- CHANGELOG 在 push 时由 `/speckit-worktree-finish` 按宪章原则 III 补充。
