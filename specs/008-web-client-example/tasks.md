# Tasks: 前端示例

**Input**: Design documents from `specs/008-web-client-example/`

**Prerequisites**: plan.md、spec.md、research.md、data-model.md、contracts/client-module.md、quickstart.md

**Tests**: spec 的 FR-010 要求同步测试，因此包含测试任务。

**Organization**: 按用户故事分阶段；每个阶段对应一个 commit。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行（文件不同，无未完成依赖）
- **[Story]**: 所属用户故事

## Phase 1: Setup（依赖与类型）

**Purpose**: 让模板具备浏览器侧类型检查与构建输入，提交时 `pnpm check` 保持通过。

- [ ] T001 在 `package.json` 增加开发依赖：`react`、`react-dom`、`@types/react`、`@types/react-dom`、`@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-client-ui-conversation`、`@deepseek-ai/dsh-client-ui-renderer`、`@deepseek-ai/dsh-client-ui-slots`，版本与宿主发布 `0.2.2-rc.3` 一致
- [ ] T002 在 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 加入 T001 新增的 `@deepseek-ai/dsh-*` 版本
- [ ] T003 在 `tsconfig.json` 开启 `jsx: "react-jsx"`，`lib` 加入 `dom` 与 `dom.iterable`

**Checkpoint**: `pnpm check` 通过，源码尚未引用前端文件。

---

## Phase 2: User Story 1 - 在 Web GUI 看到前端示例 (P1) 🎯 MVP

**Goal**: 会话输入区上方出现双语示例行与计数按钮。

**Independent Test**: 加载插件后进入会话，示例行出现；点击按钮计数递增；切换语言文案切换。

- [ ] T004 [US1] 在 `tsdown.config.ts` 增加浏览器构建组：入口 `src/client/index.ts`，`format: 'cjs'`、`platform: 'browser'`、`clean: false`，平台种子保持 external，用 banner/footer/intro 包成闭包工厂，产物 `dist/client.js`
- [ ] T005 [US1] 在 `package.json` 增加 `./client` 导出与 `dsh.client`（`platform: "web"`，`inject` 为 locale、conversation、renderer）
- [ ] T006 [US1] 编写 `src/client/locales.ts`：命名空间 `dsh-plugin-template`，中文字典为键集事实源，英文字典同键集，并用 `declare module '@deepseek-ai/dsh-client-ui-slots'` 合并 `LocaleNamespaceMap`；键与文案见 data-model.md
- [ ] T007 [P] [US1] 编写 `src/client/demo-dock.tsx`：函数组件，props 为 `{ t: TranslateNS<'dsh-plugin-template'> }`，渲染 `data-dsh-template-demo` 行、`dock.label` 文案、`dock.action` 按钮与 `dock.counter` 计数；样式只用 `--dsw-*` 令牌与行内样式
- [ ] T008 [US1] 编写 `src/client/index.ts`：导出 `inject = ['slots', 'locale']` 与 `apply`，`ctx.effect` 注册字典，`ctx.slots.inject('conversation.composer.dock', …)` 注册 `{ name, id: 'demo', order: 5, locale: NS }` 与 `DemoDock`
- [ ] T009 [US1] 运行 `pnpm build`，确认 `dist/client.js` 以 `window.__ModuleLoader__.load` 注册、`dist/index.mjs` 仍正常产出

**Checkpoint**: 示例功能可本地加载并展示。

---

## Phase 3: User Story 2 - 从模板复制前端骨架 (P2)

**Goal**: 文档能让读者定位入口、槽位、清单与构建产物。

**Independent Test**: 按文件地图找到前端文件，改文案后重建，页面显示新文案。

- [ ] T010 [P] [US2] 在 `docs/how-it-works.md` 增加前端部分：清单发现、闭包工厂产物、槽位注册、字典座位、主题令牌
- [ ] T011 [P] [US2] 在 `docs/development.md` 增加前端构建与验证步骤，更新文件地图与测试表
- [ ] T012 [P] [US2] 在 `docs/known-risks.md` 增加前端风险：产物格式随宿主约定、平台种子变化、无独立页面
- [ ] T013 [US2] 在 `README.md` 说明示例行出现的位置与交互

**Checkpoint**: 文档与实现一致，读者可按图索骥。

---

## Phase 4: User Story 3 - 验证前端构建与分发 (P3)

**Goal**: 构建、注册与分发都有回归，实机可验证。

**Independent Test**: `pnpm check` 通过；发布包含 `dist/client.js`；实机浏览器用例通过。

- [ ] T014 [P] [US3] 在 `tests/helpers.ts` 增加客户端 ctx 模拟：记录 `locale.register`、`slots.inject`、`slots.register` 与 `effect`
- [ ] T015 [P] [US3] 新建 `tests/client.test.ts`：断言 `inject` 列表、字典注册参数、槽位注册参数、中英字典键集一致，并用 `react-dom/server` 渲染中英文两版
- [ ] T016 [US3] 新建 `tests/client-bundle.test.ts`：构建缺失时先 `pnpm build`；用 `vm` 与桩 `window.__ModuleLoader__.load` 执行 `dist/client.js`，断言注册 id、导出 `inject`/`apply`、`apply` 调用注册槽位
- [ ] T017 [P] [US3] 在 `tests/package-pack.test.ts` 断言 `dist/client.js` 进包且产物格式标记存在
- [ ] T018 [US3] 在 `.dsh/skills/real-device-test/scripts/browser-test.mjs` 增加 C3：示例行出现、点击计数递增并截图
- [ ] T019 [US3] 运行实机回归：`setup-env.sh`、`run-test.mjs`、`gui-up.sh` 与 `browser-test.mjs`，记录结果

**Checkpoint**: 自动化与实机证据齐全。

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T020 在 `CHANGELOG.md` 增加本分支条目
- [ ] T021 运行 `pnpm format && pnpm check`，修复发现的问题
- [ ] T022 核对 spec 的 FR 与 SC，记录未覆盖项与实机结论

---

## Dependencies

- Phase 1 完成后才能构建前端产物。
- US1（T004–T009）依赖 Phase 1。
- US2（T010–T013）依赖 US1；T010、T011、T012 可并行，T013 独立。
- US3（T014–T019）依赖 US1；T014、T015、T017 可并行，T016 依赖 T009，T018、T019 依赖 T009。
- Phase 5 依赖全部实现与测试。

## Parallel Execution Examples

- Phase 1：T002 与 T003 可并行。
- US2：`docs/how-it-works.md`、`docs/development.md`、`docs/known-risks.md` 可三路并行。
- US3：`tests/helpers.ts`、`tests/client.test.ts`、`tests/package-pack.test.ts` 可三路并行；产物契约测试最后写。

## Implementation Strategy

- MVP 是 US1：Phase 1 + Phase 2 完成后即可在 GUI 看到示例行。
- 每个 phase 一个 commit，遵循宪章原则 VI 的质量门禁。
- 实机用例失败时先区分插件缺陷与驱动假设过时，修复后重跑。
