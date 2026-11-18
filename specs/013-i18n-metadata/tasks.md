# Tasks: 插件元数据国际化与规范

**Input**: `specs/013-i18n-metadata/` 下的 spec、plan、research、data-model、contracts、quickstart

**Tests**: 宪章原则 IV 要求同步更新 `tests/`，每个阶段包含对应测试。

**Commit**: 每个阶段一个 commit。

## Phase 1: 元数据资源与打包（US1，P1）

**Goal**: 宿主在插件页显示中英文标题与描述，文案随语言切换，发布包含资源文件。

**Independent Test**: `pnpm vitest run tests/metadata.test.ts` 通过；`npm pack --dry-run --json` 含两份元数据；实机切语言核对标题与描述。

- [x] T001 [US1] 新增 `locale/zh.json`：`meta.title` 为“插件模板”，`meta.description` 说明 `demo_echo` 工具、agent 事件日志、“插件”页配置页与输入区上方示例行；不声明 `meta.detail`
- [x] T002 [P] [US1] 新增 `locale/en.json`：键集与中文一致，`meta.title` 为 `Plugin template`（sentence case），`meta.description` 与中文含义一致
- [x] T003 [US1] 更新 `package.json`：`exports` 增加 `"./locale/*.json": "./locale/*.json"`，`files` 增加 `"locale/*.json"`，保留既有导出与 `README.md`
- [x] T004 [US1] 新增 `tests/metadata.test.ts`：断言两份文件可解析、`meta` 键集一致、`meta.title` 与 `meta.description` 为非空字符串、顶层只含 `meta`、不含 U+200B 与 U+FEFF、`package.json` 已声明导出与打包项
- [x] T005 [US1] 更新 `tests/package-pack.test.ts`：tarball 含 `locale/en.json` 与 `locale/zh.json`
- [x] T006 [US1] 运行 `pnpm format && pnpm check`，提交阶段 1

## Phase 2: US2 国际化文档（P2）

**Goal**: 作者只读一份文档就能新增语言并声明打包。

**Independent Test**: 按 `docs/i18n.md` 新增一种语言的元数据与字典，`pnpm check` 通过。

- [x] T007 [US2] 新增 `docs/i18n.md`：元数据资源（文件位置、`meta` 字段、回退链、`meta.detail` 规则）、前端字典（命名空间注册、槽位 `locale` 选项、`t` 座）、新增语言的步骤、打包声明、校验命令；约束条目指向宪章原则 IX
- [x] T008 [P] [US2] 更新 `AGENTS.md` 文档索引，增加 `docs/i18n.md` 一行
- [x] T009 [P] [US2] 更新 `README.md`：说明插件标题与描述随宿主语言切换，中英文各一份
- [x] T010 [US2] 检查 `docs/how-it-works.md` 与 `docs/development.md`，只补指向 `docs/i18n.md` 的链接，不复制规则；运行 `pnpm format && pnpm check`，提交阶段 2

## Phase 3: US3 宪章原则（P2）

**Goal**: plan 与 analyze 能逐条核对国际化约束。

**Independent Test**: 只添中文字典或漏打包声明的改动会被对应条款拦下。

- [x] T011 [US3] 用 `/speckit-constitution` 在 `.specify/memory/constitution.md` 新增原则 IX「国际化」：文案经字典或元数据提供、基线 `zh` 与 `en` 键集一致、元数据放 `locale/<语言 id>.json` 并在 `exports` 与 `files` 声明、译文保留占位符、资源不含 U+200B 与 U+FEFF、变更由测试覆盖、规范归属 `docs/i18n.md`
- [x] T012 [US3] 更新同步影响报告与版本：1.8.0 → 1.9.0，记录新增原则与模板核对结论；运行 `pnpm format && pnpm check`，提交阶段 3

## Phase 4: 实机核对与收尾

**Goal**: 真实宿主中确认文案显示与切换。

- [x] T013 按 `quickstart.md` 搭建隔离 profile，在插件页核对中文与英文标题、描述，切语言不刷新即生效，未提供元数据的语言回落英文
- [x] T014 修复实机发现的问题；在 `CHANGELOG.md` 的 Unreleased 增加条目；运行 `pnpm format && pnpm check`，提交阶段 4

## Dependencies

- Phase 1 → Phase 2 → Phase 3 → Phase 4。
- Phase 2 的文档以 Phase 1 的文件布局为事实来源。
- Phase 3 的原则引用 `docs/i18n.md`，需在 Phase 2 之后。
- 阶段内 `[P]` 任务操作不同文件，可并行。

## Implementation Strategy

- MVP：Phase 1，插件页出现本地化标题与描述。
- Phase 2 与 Phase 3 依次落地文档与宪章，使规范可被后续 spec 引用。
- Phase 4 的实机结果回写交付说明；无浏览器控制时核对已安装资源并声明渲染未验证。
