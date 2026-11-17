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

## 严格配置

配置中出现未知键或非法值时，插件加载失败。

- 用户在 `cordis.patch.yml` 写错键名会导致插件停用。
- 用 `dsh --profile <profile> --dump-config` 检查最终配置。

## Serena 开发环境

- `pnpm install` 的 `prepare` 需要 uv、Python 3.11–3.14，首次准备需要获取 Python 依赖。环境未满足时安装失败，可按[开发说明](./development.md#serena)手动准备。
- CLI 使用 Serena 和 SolidLSP 的私有接口。固定版本为 Serena 2.1.0，升级时必须运行全部 Serena 测试。
- 冷启动和工程索引可能耗时数分钟。测试需要创建子进程、临时目录和回环端口。
- 每个 worktree 使用独立后台实例。删除前执行 `pnpm serena stop`，避免进程继续持有已删除目录。

## Windows 长路径

`node_modules` 嵌套很深，路径可能超过 Windows 的 260 字符上限。

- `git worktree remove` 此时报错 `Filename too long`。
- `finish-worktree.sh` 遇到该错误时用 Node.js `rmSync` 删除目录，再运行 `git worktree prune`。
