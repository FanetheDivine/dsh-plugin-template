# Tasks: npm 12 下包内容测试兼容

**Input**: `specs/018-npm12-pack-json/` 下的 [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[quickstart.md](./quickstart.md)

**Tests**: 宪章原则 II 测试同步要求；Phase 2 包含解析函数的单元测试。

**Organization**: 每个阶段对应一个 commit。

## Phase 1: Setup

- [X] T001 在 worktree 根目录运行 `pnpm install --frozen-lockfile` 与 `pnpm check`，确认改动前通过；提交 `specs/018-npm12-pack-json/`

---

## Phase 2: User Story 1 - 包内容测试在 npm 11 与 npm 12 下都通过 (Priority: P1) 🎯 MVP

**Goal**: 解析函数接受数组与对象两种打包报告，`tests/package-pack.test.ts` 改用它。

**Independent Test**: `pnpm vitest run --project code tests/pack-report.test.ts` 通过；`pnpm build` 通过。

- [X] T002 [P] [US1] 新增 `tests/support/pack-report.ts`：
  - 导出 `packedFilePaths(report: unknown): string[]`。
  - 数组形状按元素取包报告；对象形状按 `Object.values` 取包报告。
  - 每个包的 `files[].path` 汇总为路径列表，缺 `files` 或 `files` 非数组时该包贡献空列表。
  - 数组与对象之外抛 `TypeError`，消息含 `JSON.stringify(report)` 的前 200 个字符，`undefined` 时用 `String(report)` 兜底。
  - 文件头注释说明两种形状的来源与 npm 版本。
- [X] T003 [P] [US1] 新增 `tests/pack-report.test.ts`，覆盖 [data-model.md](./data-model.md) 的四类输入：
  - npm 11 的数组形状，断言路径列表含两份文件。
  - npm 12 的对象形状，断言与数组形状得到相同路径。
  - 包报告缺 `files`，断言该包不贡献路径。
  - 非法形状（`null`、`"[]"`），断言抛 `TypeError` 且消息含输出片段。
- [X] T004 [US1] 修改 `tests/package-pack.test.ts` 的 `packedPaths()`：改用 `packedFilePaths(JSON.parse(...))`，删除内联的 `flatMap` 与数组类型断言；断言项保持不变，文件头注释说明兼容 npm 11 与 npm 12。
- [X] T005 [US1] 运行 `pnpm format && pnpm check && pnpm build`，提交

**Checkpoint**: 两种 npm 输出形状都能解析，tarball 断言结果不变。

---

## Phase 3: User Story 2 - 发布 job 的 npm 版本由 Node 提供 (Priority: P1)

**Goal**: publish job 不再安装或升级 npm。

**Independent Test**: 阅读 `.github/workflows/ci.yml`，publish job 中没有 npm 安装步骤。

- [X] T006 [US2] 修改 `.github/workflows/ci.yml`：
  - 删除 publish job 的 `Update npm (>= 11.5.1 required for OIDC)` 步骤。
  - 在 `setup-node` 之后加一行注释：Trusted Publishing 要求 npm ≥ 11.5.1，Node 24 自带版本已满足，工作流不单独安装 npm。
- [X] T007 [US2] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: CI 不再有漂移的 npm 版本输入。

---

## Phase 4: User Story 3 - 文档写明 npm 版本来源 (Priority: P2)

**Goal**: `docs/development.md` 写明 CI 中 npm 的来源与 OIDC 下限。

**Independent Test**: 只读 `docs/development.md` 的 CI 节，能回答 npm 从哪来、下限是多少。

- [ ] T008 [US3] 修改 `docs/development.md`：
  - CI 节的 `publish` 行补充 npm 由 Node 24 自带、OIDC 下限 11.5.1。
  - 测试表加入 `tests/pack-report.test.ts` 一行，说明覆盖打包报告的两种形状。
- [ ] T009 [US3] 运行 `pnpm format && pnpm check`，提交

**Checkpoint**: 文档能独立回答 npm 版本来源。

---

## Phase 5: Polish

- [ ] T010 在 `CHANGELOG.md` 的 Unreleased 下增加修复条目：包内容测试兼容 npm 12 的 `npm pack --json` 对象输出；publish job 改用 Node 自带的 npm
- [ ] T011 按 [quickstart.md](./quickstart.md) 全部步骤验证：npm 11 与 npm 12 各跑一次 `pnpm test:dist`，勾选本文件任务并提交

---

## Dependencies

- Phase 1 → Phase 2。
- Phase 3、Phase 4 只依赖 Phase 1，可与 Phase 2 并行。
- T010 依赖 Phase 3 与 Phase 4 的结论。
- T011 依赖全部阶段。

## Implementation Strategy

- MVP 为 Phase 2：解析函数上线后，下游仓库同步 `tests/support/pack-report.ts` 与 `tests/package-pack.test.ts` 即可发布。
- Phase 3 去掉漂移来源，避免同类失败再次出现。
- Phase 4 让维护者不必回看本次排障过程。
