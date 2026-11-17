---
description: "Serena 符号查询实施任务"
---

# Tasks: Serena 符号查询

**Input**: Design documents from `specs/006-serena-symbol-cli/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/cli.md、quickstart.md

**Tests**: 规格与宪章要求真实行为测试。共享参考实现先移植，再按用户故事适配模板符号并完成独立验证。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 不同文件且无未完成依赖，可并行。
- **[Story]**: US1 符号查询、US2 工程结果、US3 实例管理。

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 接入开发命令、依赖准备和 CI 环境。

- [X] T001 在 `package.json` 增加 `serena`、`serena:setup` 与 `prepare` 脚本，保持现有依赖和发布文件白名单不变
- [X] T002 [P] 在 `.gitignore` 忽略 `.serena/`，并在 `.github/workflows/ci.yml` 的 check 与 publish job 安装 uv 和 Python 3.12

**Checkpoint**: 提交 Phase 1；`pnpm serena --version` 能准备并显示固定 Serena 版本。

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 整体移植相互依赖的查询、工程成员和实例实现。

**⚠️ CRITICAL**: 两个脚本必须作为同一版本移植，避免查询与工程补全协议不一致。

- [X] T003 将参考实现完整移植到 `scripts/serena-cli.py` 与 `scripts/serena-projects.cjs`，固定 Serena 2.1.0，保留只读查询、项目锁、认证实例和受信任编译器边界
- [X] T004 [P] 新增 `tests/fixtures/serena-multi.ts`，提供同一声明行的 `serenaFirst` 与 `serenaSecond` 歧义符号

**Checkpoint**: 提交 Phase 2；脚本语法与帮助命令可用，三个用户故事均可开始适配测试。

---

## Phase 3: User Story 1 - 查询代码符号 (Priority: P1) 🎯 MVP

**Goal**: 按名称或文件位置查询定义、引用和文档，并获得消歧及标准化输出。

**Independent Test**: 对 `src/demo-tool.ts` 的 `parseEchoArgs` 执行三类查询，验证定义、签名、中文注释、候选、错误和 1 起始行号。

### Tests for User Story 1

- [X] T005 [US1] 在 `tests/serena-cli.test.ts` 适配参数互斥、名称与声明行定义、文件候选、引用、文档、长度限制、无匹配和歧义测试，使用模板真实路径与语义断言
- [X] T006 [US1] 运行 `tests/serena-cli.test.ts` 中 US1 用例并修复 `scripts/serena-cli.py` 或测试中的模板集成问题，确认 UTF-8 和位置格式

**Checkpoint**: 提交 Phase 3；US1 独立通过，三类只读查询可演示。

---

## Phase 4: User Story 2 - 获得一致且完整的工程结果 (Priority: P2)

**Goal**: 完整识别 TypeScript 工程与松散 JavaScript 引用，并同步外部修改。

**Independent Test**: 使用 `planArchive`、`isRecord` 和动态 `serena-live-*` 夹具验证跨文件引用、空结果、文件增删改与配置依赖失效。

### Tests for User Story 2

- [X] T007 [P] [US2] 在 `tests/serena-projects.test.ts` 移植工程成员、JSONC、extends、工程引用、缓存依赖和禁止执行项目代码测试
- [X] T008 [P] [US2] 在 `tests/serena-reference-lifecycle.test.py` 移植真实语言服务器临时 JS 缓冲区与工程锚点释放测试
- [X] T009 [US2] 扩展 `tests/serena-cli.test.ts` 的外部文件增删改、跨工程、松散 MJS、空引用和单语言服务器测试，并运行 US2 验证

**Checkpoint**: 提交 Phase 4；US2 独立通过，引用完整性和文件同步可重复验证。

---

## Phase 5: User Story 3 - 管理项目查询实例 (Priority: P3)

**Goal**: 复用项目实例并保证并发、认证、停止、空闲退出和单进程回退安全。

**Independent Test**: 使用隔离状态目录启动真实实例，验证 PID 复用、项目隔离、请求安全、并发停止、目录删除与回退不重放。

### Tests for User Story 3

- [X] T010 [P] [US3] 在 `tests/serena-daemon.test.ts` 适配实例复用、认证、Host/Origin、防护请求上限、并发启动、项目隔离、停止、空闲和目录删除测试
- [X] T011 [P] [US3] 在 `tests/serena-runtime.test.py` 移植启动失败回退、提交后不重放、初始化屏障、崩溃、超时、缓存失效、路径行号和进程探针测试
- [X] T012 [US3] 运行 `tests/serena-daemon.test.ts` 与 `tests/serena-runtime.test.py`，修复 `scripts/serena-cli.py` 的 Windows 或模板集成问题并确认实例清理

**Checkpoint**: 提交 Phase 5；US3 独立通过，测试后无残留实例。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完整文档、风险说明和全量质量门禁。

- [X] T013 [P] 在 `AGENTS.md` 增加优先使用 Serena 定义、引用和文档查询的指引，以及 1 起始行号和 worktree 停止规则
- [X] T014 [P] 在 `docs/development.md` 增加 Serena 前置要求、实例行为、命令表、测试说明和文件地图
- [X] T015 [P] 在 `docs/known-risks.md` 记录 uv/Python 准备要求、Serena 私有 API 版本耦合、查询耗时和 worktree 实例清理风险
- [X] T016 按 `specs/006-serena-symbol-cli/quickstart.md` 运行手工 CLI 验证，并执行 `pnpm format && pnpm check` 与现有 `tests/package-pack.test.ts` 发布边界回归
- [X] T017 检查 `git diff`、所有任务完成状态和实例状态，提交 Phase 6，保留 worktree 供用户验收

**Checkpoint**: 全部测试通过，开发脚本未进入发布包，现有 `demo_echo` 行为无回归。

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational → US1/US2/US3 → Polish。
- 每个阶段完成验证后提交一个 commit。
- US2 和 US3 的独立测试文件可并行适配；共享 `tests/serena-cli.test.ts` 由 US1 先建立，US2 后扩展。

### User Story Dependencies

- **US1**: 依赖 Phase 2，可最早交付 MVP。
- **US2**: 依赖 Phase 2 的工程成员实现；测试扩展依赖 US1 建立的 CLI 测试结构。
- **US3**: 依赖 Phase 2 的实例实现，独立测试文件可与 US1/US2 并行适配。

### Parallel Opportunities

- T002 与 T001 操作不同文件。
- T007、T008、T010、T011 操作不同测试文件，可并行。
- T013、T014、T015 操作不同文档，可并行。

---

## Parallel Example: User Story 2

```text
Task T007: 适配 tests/serena-projects.test.ts
Task T008: 移植 tests/serena-reference-lifecycle.test.py
```

## Parallel Example: User Story 3

```text
Task T010: 适配 tests/serena-daemon.test.ts
Task T011: 移植 tests/serena-runtime.test.py
```

---

## Implementation Strategy

### MVP First

1. 完成 Setup 与 Foundational。
2. 完成 US1 并独立验证三类查询。
3. 若需最小交付，可在 Phase 3 停止并演示。

### Incremental Delivery

1. US1 提供查询入口。
2. US2 增加完整工程引用与实时文件同步验证。
3. US3 增加实例复用、安全和生命周期验证。
4. Polish 完成文档、全量回归与发布边界检查。

## Notes

- 直接移植的脚本包含共享实现，故事阶段重点验证并修正模板集成。
- 所有路径均为仓库相对路径；实例绝对路径只存在于运行时。
- 删除 worktree 前执行 `pnpm serena stop`。
