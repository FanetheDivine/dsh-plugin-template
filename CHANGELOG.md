# Changelog

## Unreleased

### Added

- “插件”面板新增模板插件的配置页：开关 demo 工具、编辑回显前缀，保存后写入 profile 组合层
- 保存 volatile 配置后插件不重启：工具按新值重新注册，`demo_echo` 与事件日志使用新前缀

### Changed

- 测试脚本拆分为 `test:code` 与 `test:dist`；`pnpm check` 只运行源码测试
- `pnpm build` 在生成产物与类型声明后运行 `test:dist`
- 产物缺失或过期时产物测试失败，提示运行 `pnpm build`
- `src/config.ts` 导出 `Config` schema，`demoEnabled` 与 `prefix` 标记 `.volatile()`
- 实机测试增加 B5、C4、C5 用例，覆盖热重载不重启、配置页保存与非法前缀