# Changelog

## Unreleased

### Changed

- 实机测试驱动按插件页的 `data-plugin-package` 与元数据标题定位插件，配置保存改为轮询补丁文件
- 前端入口不再声明必需服务，`locale`、`slots`、`configForms` 按功能用 `ctx.inject` 分组加载，缺失时跳过对应功能
- `pnpm check` 的 lint 只报告 error 级诊断，`test:code` 换用 `minimal` reporter 并隐藏通过用例的日志
- `pnpm build` 的 `test:dist` 换用 `minimal` reporter 并隐藏通过用例的日志
