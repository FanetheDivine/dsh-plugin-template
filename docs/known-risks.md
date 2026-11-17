# 已知风险

## 宿主版本

- `@deepseek-ai/dsh-*` 处于 rc 阶段，接口可能在版本间变化。
- 插件依赖的 `dsh-*` 版本应与运行它的 DSH 版本一致。
- 实机测试按 `@deepseek-ai/dsh-agent` 的版本选择宿主，版本不一致时安装到 `~/.dsh-local/dsh-<版本>`，全局安装保持不变。

## 安装 rc 依赖

pnpm 的 minimum release age 策略会拒绝发布时间过短的包。

- `@deepseek-ai/dsh-*` 依赖未列入 `minimumReleaseAgeExclude` 时，`pnpm install` 失败。
- 列入规则见[宪章](../.specify/memory/constitution.md)原则 II。

## 共享宿主实例

插件运行时使用宿主提供的 cordis、dsh-tools 与 zod。

- 这些包被打进 bundle 时会产生第二份实例，类型判断和服务注入随之失效。
- 保持 external 的规则见[宪章](../.specify/memory/constitution.md)原则 II。

## 前端产物

前端产物使用宿主约定的闭包工厂格式。

- 格式变化时插件加载失败，表现为示例行不出现。
- `PLATFORM_MODULES` 是宿主冻结模块表的副本；宿主升级后需要核对，缺失的模块在运行时请求失败。
- 客户端依赖版本与宿主不一致时，槽位或 locale 服务可能不可用。
- 前端没有独立页面入口，直接执行 `dist/client.js` 不会渲染。
- 示例行依赖 `conversation.composer.dock` 槽位；宿主调整 UI 后槽位名或位置可能变化。

## 严格配置

配置中出现未知键或非法值时，插件加载失败。

- 用户在 `cordis.patch.yml` 写错键名会导致插件停用。
- 用 `dsh --profile <profile> --dump-config` 检查最终配置。

## Windows 长路径

`node_modules` 嵌套很深，路径可能超过 Windows 的 260 字符上限。

- `git worktree remove` 此时报错 `Filename too long`。
- `finish-worktree.sh` 遇到该错误时用 Node.js `rmSync` 删除目录，再运行 `git worktree prune`。
