# Tasks: 插件面板配置项

**Input**: `specs/011-plugin-config-panel/` 下的 spec、plan、research、data-model、contracts

**Tests**: 宪章原则 IV 要求同步更新 `tests/`，每个阶段包含对应测试。

**Commit**: 每个阶段一个 commit。

## Phase 1: Setup（宪章与依赖）

- [x] T001 用 `/speckit-constitution` 把 `.specify/memory/constitution.md` 原则 I 修订为入口导出 `name`、`inject`、`apply`、`Config`，版本 1.7.0 → 1.8.0，同步更新 `docs/how-it-works.md` 中“入口契约”表的引用
- [x] T002 把 `@deepseek-ai/dsh-client-ui-plugin-manager@0.2.2-rc.3`、`@deepseek-ai/dsh-client-ui-settings@0.2.2-rc.3`、`@deepseek-ai/dsh-client-ui-primitives@0.2.2-rc.3` 加入 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`，确认 `package.json` 的 `devDependencies` 已含 `@deepseek-ai/schemastery`、`@deepseek-ai/cordis-plugin-loader`

## Phase 2: US2 配置热重载（宿主机侧，P1）

**Goal**: 保存配置后，运行中的插件按新值工作，不重启。

**Independent Test**: 单元测试触发 `loader/volatile-update`，工具与日志使用新值；实机后端用例通过。

- [ ] T003 [US2] 在 `src/config.ts` 新增 `Config` 接口与 schemastery schema：`demoEnabled` 为 `boolean` 默认 `true`，`prefix` 为 `string` 默认 `demo` 且含非空白字符，两者 `.volatile()`；新增 `readConfig(config)`：把 `Volatile` 引用展开为普通值后交给 `resolveConfig`，未知键与非法值抛错
- [ ] T004 [P] [US2] 在 `src/types.ts` 以 type-only 方式再导出 `Volatile`，并引入 `@deepseek-ai/cordis-plugin-loader` 的事件类型
- [ ] T005 [P] [US2] 把 `src/events.ts` 的 `setupDemoListeners(ctx, prefix)` 改为接收 `getPrefix: () => string`，日志每次读取实时前缀
- [ ] T006 [US2] 改造 `src/index.ts`：导出 `Config`；`apply` 第一步 `readConfig`；工具按 `demoEnabled` 注册，监听 `loader/volatile-update` 后重新读取并注销或重注册 `demo_echo`；读取失败记录警告并保持当前状态；`ctx.effect` 在卸载时注销工具
- [ ] T007 [US2] 扩展 `tests/helpers.ts`：`makeCtx` 支持 `Volatile` 引用工厂、`tools.register` 返回可观测的注销函数、按事件名触发监听
- [ ] T008 [US2] 更新 `tests/plugin.test.ts`：`readConfig` 的默认值、未知键、非法类型、空白前缀；`apply` 在 `prefix` 与 `demoEnabled` 变化后的工具重注册、注销与日志前缀；读取失败时保持原状
- [ ] T009 [US2] 更新 `tests/package-pack.test.ts` 与 `tests/client-bundle.test.ts` 如受影响，运行 `pnpm format && pnpm check`

## Phase 3: US1 在插件面板编辑配置（浏览器侧，P1）

**Goal**: 面板里出现配置页，可编辑并保存两个字段。

**Independent Test**: 单元测试覆盖草稿、解析与保存；实机浏览器用例打开配置页并保存。

- [ ] T010 [US1] 在 `src/client/locales.ts` 增加 `config.*` 键（标题、两个字段的标签与说明、非法提示、保存相关文案、重置、已覆盖标记），中文是键集事实源，英文键集一致
- [ ] T011 [US1] 新增 `src/client/config-form.ts`：`PluginConfigForm` 用 `SettingsFormModel` 管理 `prefix`（非空白文本，空白为非法，不用 `settingsTextField` 的清除语义）与 `demoEnabled`（草稿 `true` 或 `false`）；导出行键常量 `ROW_KEY = 'dsh-plugin-template#dsh-plugin-template'` 与命名空间常量
- [ ] T012 [US1] 新增 `src/client/config-page.tsx`：`ConfigPage` 返回 `summary` 的一行描述，或用 `SettingsForm`、`SettingsValueField`、`Switch` 渲染 `page`；开关行样式与官方 forge 配置页一致（13px 标题、12px 说明、`--dsw-*` 令牌、字段间 0.5px l2 分隔线）
- [ ] T013 [US1] 改造 `src/client/index.ts`：`inject` 增加 `configForms`；创建 `PluginConfigForm`，用 `ctx.effect` 在卸载时 `dispose`；向 `plugins.row.config` 注册配置页；增加对 `dsh-client-ui-plugin-manager/client` 与 `dsh-client-ui-settings/client` 的 type-only 导入
- [ ] T014 [P] [US1] 新增 `tests/config-form.test.ts`：用假 `SettingsFormScope` 验证草稿、`prefix` 空白被拒、保存的 `set` 操作、放弃与重置
- [ ] T015 [US1] 更新 `tests/client.test.ts` 与 `tests/helpers.ts`：`makeClientCtx` 增加 `configForms.get`；断言 `inject` 含 `configForms`、行配置页键正确、中英文字典键集一致、`summary` 与 `page` 两种视图渲染
- [ ] T016 [US1] 运行 `pnpm format && pnpm check && pnpm build`，确认 `dist/client.js` 无多余内联的宿主模块

## Phase 4: US3 文档（P2）

**Goal**: 作者能从文档学会配置插槽与热重载。

- [ ] T017 [US3] 更新 `docs/how-it-works.md`：入口契约表加入 `Config`；新增“配置与热重载”节（volatile 字段、`loader/volatile-update`、`readConfig`）与“配置插槽”节（三个插槽的用途与键格式、`view` 取值、表单服务、模板实现位置）
- [ ] T018 [P] [US3] 更新 `docs/development.md`：测试表、文件地图、实机测试用例表的新条目
- [ ] T019 [P] [US3] 更新 `README.md`：功能与配置节说明可在插件面板编辑与热重载；`docs/known-risks.md` 补充宿主侧限制（仅 volatile 字段出现在面板、配置被更高层覆盖时拒绝保存）
- [ ] T020 [US3] 运行 `pnpm format && pnpm check`

## Phase 5: 实机测试与收尾

- [ ] T021 扩展 `.dsh/skills/real-device-test/scripts/run-test.mjs`：增加 B5 热重载不重启（保存 `prefix` 后插件实例不变，回显用新前缀），并确认 B2–B4 仍成立
- [ ] T022 扩展 `.dsh/skills/real-device-test/scripts/browser-test.mjs`：C4 在插件页打开模板插件配置页，断言控件、改前缀、保存、`cordis.patch.yml` 写入新值，再发 `ECHO_CASE` 回显新前缀；C5 空前缀被拒；截图写入 `shots/`
- [ ] T023 搭建 profile 并运行 `/real-device-test` 全流程，检查截图与官方配置页的风格一致，写报告
- [ ] T024 修复实机发现的问题，补充 `CHANGELOG.md` 条目，运行 `pnpm format && pnpm check`

## Dependencies

- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5。
- Phase 3 依赖 Phase 2 的 `Config`，宿主才会为该行提供表单命名空间。
- 阶段内 `[P]` 任务操作不同文件，可并行。

## Implementation Strategy

- MVP：Phase 2 与 Phase 3，面板可保存且热重载生效。
- 实机测试发现的差异（如 schemastery 解析、命名空间 id）在 Phase 5 修复，并回写 plan 的 research。
