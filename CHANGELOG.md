# Changelog

## Unreleased

### Changed

- 升级宿主依赖 `@deepseek-ai/dsh-agent` / `@deepseek-ai/dsh-tools` 至 `0.1.0-rc.8`

### Added

- 完整插件工程骨架（对齐 dsh-plugin-om，具体实现为 demo）：
  - 测试骨架：vitest 配置与 4 个测试文件（配置校验 / demo 工具 / apply 接线 / release-archive 归档计划 / npm pack 打包回归，共 18 例）
  - 发布工具链：`scripts/release-archive.mjs` CHANGELOG 归档脚本 + `changelogs/` 归档目录 + `pnpm run release` 脚本
  - 工程配置：`src/constants.ts` 共享常量、`demoEnabled`/严格校验配置（未知键/非法值报错）、CI 增加 test 步骤、AGENTS.md 测试同步约定
  - README 全面重写：安装与启用（生产/开发注解）、插件构造六步讲解、配置项表、npm 命令表、调用链与文件地图

