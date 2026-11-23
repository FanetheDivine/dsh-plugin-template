# Changelog

## Unreleased

### Changed

- `/speckit-worktree-finish` 放弃模式关闭分支的 open PR 并删除远程分支；gh 不可用或无 PR 时跳过，PR 或远程步骤失败时保留本地清理结果并以 5 退出
- Spec Kit 主流程在探索后按依赖分批访谈，规格与计划经用户批准或豁免后推进，任务与实现复核未决项
- 实机测试驱动按插件页的 `data-plugin-package` 与元数据标题定位插件，配置保存改为轮询补丁文件
- 实机测试改为链接安装并启用 HMR：构建后同一 GUI 实例自动替换插件，前后端都无需刷新或重启，每轮结束删除 profile
- 前端入口不再声明必需服务，`locale`、`slots`、`configForms` 按功能用 `ctx.inject` 分组加载，缺失时跳过对应功能
- `pnpm check` 的 lint 只报告 error 级诊断，`test:code` 换用 `minimal` reporter 并隐藏通过用例的日志
- `pnpm build` 的 `test:dist` 换用 `minimal` reporter 并隐藏通过用例的日志
- 宪章升到 v2.0.0，只保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则：
  - 原则 I 宿主依赖版本：全部 `@deepseek-ai/*` 依赖以同版本 `@deepseek-ai/dsh` 为准，`dsh-*` 锁定同一确切版本并列入 `minimumReleaseAgeExclude`
  - 宿主契约、依赖归属、严格配置移入 `docs/how-it-works.md`，国际化约束移入 `docs/i18n.md`
- `AGENTS.md` 新增模板说明节，链接模板转化文档
- `AGENTS.md` 主工作区节：主工作区位于 `main` 且干净，允许 `git fetch`、`git pull` 与可恢复的操作，任何变更在 worktree 中进行
- `/speckit-worktree-create` 在创建 worktree 前、`/speckit-worktree-finish` 在交付或放弃的清理前，把主工作区 `main` 快进到 `origin/main`
- `/speckit-worktree-create` 创建 spec 时同步远程全部分支并推送占号分支，同号时按分支名自动改号；`/speckit-worktree-finish` 在推送与 PR 前校验编号唯一
- `publish` job 改用 Node 24 自带的 npm，删除 `npm install -g npm@latest` 步骤
- `docs/development.md` 增加前端 UI 链接规则：`a` 标签的 `href` 使用完整 URL，相对链接在 Desktop 中打不开目标
- `/speckit-worktree-finish` 的 CI 等待改为 15 秒一次；合并等待前 5 分钟每 10 秒轮询，之后每 30 秒
- `/speckit-worktree-finish` 检测到合并后先切主工作区、运行 `sync-main.sh --prepare` 同步 `main`，再删除 worktree 与分支；放弃模式同样先同步
- `sync-main.sh --prepare` 先 stash 未提交变更、切回 `main`、把未推送提交保存在 `wip/...` 分支，再快进 `main`

### Fixed

- 包内容测试解析 `npm pack --json` 的两种形状：npm 11 的数组与 npm 12 的以包名为键的对象

### Added

- `docs/template-conversion.md`：变更类别、模板变更要求与模板转化步骤
- `tests/dependency-versions.test.ts`：回归 `dsh-*` 依赖版本一致与 `minimumReleaseAgeExclude` 条目
- `.specify/extensions/worktree/scripts/bash/sync-main.sh`：检查主工作区并快进 `main` 到 `origin/main`
- `tests/sync-main.test.ts`：覆盖 `sync-main.sh` 的同步与拒绝场景
- `sync-main.sh --prepare`：交付与放弃前整理主工作区，`tests/sync-main.test.ts` 覆盖分支切换、stash、临时分支与 detached HEAD
- `.specify/extensions/worktree/scripts/bash/spec-number-lib.sh`：spec 编号解析与同号分支匹配
- `.specify/extensions/worktree/scripts/bash/check-spec-number.sh`：交付前的编号唯一性校验
- `tests/worktree-extension.test.ts`：占号、自动改号、远程分支同步与交付前校验用例
- `tests/support/pack-report.ts`：把 `npm pack --json` 的报告归一为文件路径列表
- `tests/pack-report.test.ts`：覆盖打包报告的数组与对象形状、缺 `files` 与非法形状
