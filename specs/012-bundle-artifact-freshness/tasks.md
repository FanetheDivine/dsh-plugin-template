# Tasks: 产物测试的构建新鲜度

**Input**: Design documents from `/specs/012-bundle-artifact-freshness/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、quickstart.md

**Tests**: 宪法原则 IV 要求代码变更同步测试。本特性先写新鲜度检查的测试，再实现检查；两个产物测试改为真实调用。

**Organization**: 每个阶段对应一个 commit。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（不同文件，无未完成依赖）
- **[Story]**: 所属用户故事（US1、US2）

## Path Conventions

单包布局：`src/`、`tests/`、`docs/` 位于仓库根目录。

---

## Phase 1: Setup（共享新鲜度检查）

**Purpose**: 两个产物测试共用的判定模块；后续阶段都依赖它。

- [X] T001 [P] 新建 `tests/dist-freshness.test.ts`，在系统临时目录构造输入与产物，覆盖新鲜、过期、缺失三种状态，断言错误信息包含 `pnpm build` 与过期文件
- [X] T002 新建 `tests/support/dist-freshness.ts`，定义构建输入清单（`src/` 全部文件、`tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`）、产物清单（`dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts`）与 `assertFreshDist(root)`，导出判定与错误信息
- [X] T003 运行 `pnpm exec vitest run tests/dist-freshness.test.ts`，确认 T001 由失败转为通过

**Checkpoint**: 判定模块可用，两个产物测试可以接入

---

## Phase 2: User Story 1 - 源码测试与产物测试分开运行 (Priority: P1) 🎯 MVP

**Goal**: `test:code` 不读 `dist`，`test:dist` 在产物过期时明确失败，`build` 末尾运行 `test:dist`，`check` 只跑源码测试。

**Independent Test**: 无 `dist` 时 `pnpm test:code` 通过、`pnpm test:dist` 给出构建提示；`pnpm build` 重建产物并运行产物测试；`touch src/client/index.ts` 后 `pnpm test:dist` 报告过期。

### Tests for User Story 1

- [X] T004 [P] [US1] 在 `tests/client-bundle.test.ts` 删除 `ensureBuild()` 与缺失判断，改为读取产物前调用 `assertFreshDist()`，保留现有断言

### Implementation for User Story 1

- [X] T005 [P] [US1] 在 `vitest.config.ts` 用 `test.projects` 声明 `code`（排除两个产物测试）与 `dist`（只含 `tests/client-bundle.test.ts` 与 `tests/package-pack.test.ts`）两个 project，均 `extends: true`
- [X] T006 [US1] 在 `package.json` 增加 `test:code`（`vitest run --project code`）、`test:dist`（`vitest run --project dist`），`test` 保持 `vitest run`，`check` 末项改为 `test:code`，`build` 末尾追加 `&& pnpm run test:dist`
- [X] T007 [US1] 运行验证：删除 `dist` 后 `pnpm test:code` 通过、`pnpm test:dist` 失败并含 `pnpm build`；`pnpm build` 一次通过；`touch src/client/index.ts` 后 `pnpm test:dist` 报告过期；恢复后 `pnpm check` 在无 `dist` 时通过

**Checkpoint**: US1 完成，`build` 与 `check` 各自可独立验证

---

## Phase 3: User Story 2 - 打包测试共用同一新鲜度规则 (Priority: P2)

**Goal**: `tests/package-pack.test.ts` 使用同一份新鲜度检查与同一条修复提示。

**Independent Test**: 产物过期时单独运行打包测试，得到与前端产物测试相同的过期提示；产物新鲜时打包断言通过。

### Implementation for User Story 2

- [X] T008 [P] [US2] 在 `tests/package-pack.test.ts` 删除条件构建，`packedPaths()` 前调用 `assertFreshDist()`，保留 tarball 断言
- [X] T009 [US2] 运行验证：过期产物下 `pnpm test:dist` 的两个文件都给出一致提示；`pnpm build` 后两个文件通过

**Checkpoint**: 两个产物测试共用判定，US1 行为不变

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 文档、CI 描述与 CHANGELOG 对齐新脚本。

- [ ] T010 [P] 更新 `docs/development.md`：命令表增加 `test:code`、`test:dist`，修正 `check` 与 `build` 说明；测试节说明两个 project 与产物测试的新鲜度要求；CI 节说明 `full-check` 中 `test:dist` 随 `build` 执行
- [ ] T011 [P] 更新 `.github/workflows/ci.yml` 的 `check` job 名称，体现 `test:code` 与产物测试随构建执行
- [ ] T012 更新 `CHANGELOG.md` 的 Unreleased 节，记录脚本拆分与产物过期行为
- [ ] T013 运行 `pnpm format && pnpm check && pnpm build`，再按 `quickstart.md` 逐条验证
- [ ] T014 按宪法原则 VIII 检查新增与修改的跟踪文件只引用仓库内路径与公网 URL

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 无依赖，先完成
- **Phase 2 (US1)**: 依赖 Phase 1 的 `assertFreshDist`
- **Phase 3 (US2)**: 依赖 Phase 1；与 Phase 2 无代码冲突，但为保持提交顺序在 US1 后执行
- **Phase 4**: 依赖 US1 与 US2 的脚本最终形态

### Within Each User Story

- 测试先写并确认失败
- `vitest.config.ts` 的 project 名与 `package.json` 脚本名一致
- 产物测试只调用检查，不构建
- 验证命令全部通过后提交该阶段

### Parallel Opportunities

- T001 与 T002 分属测试与实现，按 TDD 顺序串行
- T004 与 T005 可并行（不同文件）
- T010 与 T011 可并行

---

## Parallel Example: User Story 1

```bash
# 两个文件互不依赖，可同时修改
Task: "在 tests/client-bundle.test.ts 接入 assertFreshDist"
Task: "在 vitest.config.ts 拆分 code 与 dist 两个 project"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1：判定模块与测试
2. 完成 Phase 2：脚本拆分、client-bundle 接入、验证
3. 停止并独立验证：干净检出 `pnpm check`、`pnpm build`、过期场景提示

### Incremental Delivery

1. Phase 1 提交后判定模块可复用
2. Phase 2 提交后默认回归入口不再依赖产物
3. Phase 3 提交后打包测试同样受保护
4. Phase 4 提交后文档与 CI 描述一致

---

## Notes

- 每个阶段对应一个 commit
- 产物过期是显式失败，测试不写 `dist`
- `build` 是产物测试的唯一构建入口
- 提交前运行 `pnpm format && pnpm check`