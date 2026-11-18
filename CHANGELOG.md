# Changelog

## Unreleased

### Added

- “插件”面板新增模板插件的配置页：开关 demo 工具、编辑回显前缀，保存后写入 profile 组合层
- 保存 volatile 配置后插件不重启：工具按新值重新注册，`demo_echo` 与事件日志使用新前缀
- 新增 `locale/zh.json` 与 `locale/en.json`：插件页的标题与描述随宿主语言切换
- 新增 `docs/i18n.md`，宪章新增原则 IX「国际化」，版本 1.9.0

### Changed

- `src/config.ts` 导出 `Config` schema，`demoEnabled` 与 `prefix` 标记 `.volatile()`
- 实机测试增加 B5、C4、C5 用例，覆盖热重载不重启、配置页保存与非法前缀
- 发布内容增加 `locale/*.json`，`package.json` 导出该路径