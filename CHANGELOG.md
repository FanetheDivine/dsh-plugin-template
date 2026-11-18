# Changelog

## Unreleased

### Changed

- 实机测试驱动按插件页的 `data-plugin-package` 与元数据标题定位插件，配置保存改为轮询补丁文件
- 前端入口不再声明必需服务，`locale`、`slots`、`configForms` 按功能用 `ctx.inject` 分组加载，缺失时跳过对应功能
- `pnpm check` 的 lint 只报告 error 级诊断，`test:code` 换用 `minimal` reporter 并隐藏通过用例的日志
- `pnpm build` 的 `test:dist` 换用 `minimal` reporter 并隐藏通过用例的日志
- 宪章升到 v2.0.0，只保留宿主依赖版本、测试同步、文档结构、质量门禁、公开引用五条原则：
  - 原则 I 宿主依赖版本：全部 `@deepseek-ai/*` 依赖以同版本 `@deepseek-ai/dsh` 为准，`dsh-*` 锁定同一确切版本并列入 `minimumReleaseAgeExclude`
  - 宿主契约、依赖归属、严格配置移入 `docs/how-it-works.md`，国际化约束移入 `docs/i18n.md`
- `AGENTS.md` 新增模板说明节，链接模板转化文档
- `AGENTS.md` 新增主工作区节：主工作区位于 `main` 且干净，只运行 `git fetch` 与 `git pull`，任何变更在 worktree 中进行
- `/speckit-worktree-create` 在创建 worktree 前、`/speckit-worktree-finish` 在清理后，把主工作区 `main` 快进到 `origin/main`
- `main` 启用合并门禁：PR 需通过 `check` job 且分支包含最新 `main`，管理员同样受限，强推与删除被拒

### Added

- `docs/template-conversion.md`：变更类别、模板变更要求与模板转化步骤
- `tests/dependency-versions.test.ts`：回归 `dsh-*` 依赖版本一致与 `minimumReleaseAgeExclude` 条目
- `.specify/extensions/worktree/scripts/bash/sync-main.sh`：检查主工作区并快进 `main` 到 `origin/main`
- `tests/sync-main.test.ts`：覆盖 `sync-main.sh` 的同步与拒绝场景
