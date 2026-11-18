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

### Added

- `docs/template-conversion.md`：变更类别、模板变更要求与模板转化步骤
- `tests/dependency-versions.test.ts`：回归 `dsh-*` 依赖版本一致与 `minimumReleaseAgeExclude` 条目
