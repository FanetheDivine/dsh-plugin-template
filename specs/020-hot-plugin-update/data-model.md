# 数据模型：实机测试热更新

**日期**：2026-11-20 | **规格**：[spec.md](./spec.md)

## 实体

### 实机 profile

搭建脚本生成的隔离目录，位于 `~/.dsh/profiles/<profile>`。每轮实机测试创建，轮次结束删除。

| 文件 | 内容 | 约束 |
| --- | --- | --- |
| `package.json` | `dependencies[<插件>]` 为 `link:<仓库路径>`；`dsh.profile.bundles` 含插件包名 | 依赖由 `dsh plugin add <仓库>` 写入，不手工编辑 |
| `cordis.patch.yml` | 插件配置、`hmr` 监听根、模型与存储隔离、mock provider 插入 | 顶层为 YAML 数组；不含孤立的 `[]` 占位行 |
| `node_modules/<插件>` | 指向仓库的符号链接 | 链接目标等于当前检出的仓库路径 |
| `test-sessions/`、`test-storage/` | 会话与存储落盘 | 轮次结束随 profile 删除 |
| `shots/`、`results.json`、`browser-results.json` | 证据与结果 | 删除前写入报告 |

### HMR 条目

profile 补丁中的一条配置，字段来自 `@deepseek-ai/dsh-hmr` 的 `Config`。

| 字段 | 值 | 来源 |
| --- | --- | --- |
| `id` | `hmr` | `@deepseek-ai/dsh-base` 的条目 id |
| `config.root` | `["<仓库>/dist"]` | 搭建脚本用 `cygpath -m` 生成 |
| `config.base` | 不设置 | 缺省为 profile 目录，绝对监听路径不受影响 |

### 插件加载源

宿主实际导入的产物位置。

| 面 | 路径 | 更新方式 |
| --- | --- | --- |
| 后端 | `<仓库>/dist/index.mjs` | 构建触发 HMR 替换 |
| 前端 | `<仓库>/dist/client.js` | 宿主轮询并推送重建帧 |

状态：

1. 未构建：`dist` 缺失，搭建脚本在检查阶段失败。
2. 已构建未加载：profile 启动时导入。
3. 已加载：插件激活，`fiber.state` 为 `2`。
4. 替换成功：插件按新代码重新挂载，宿主进程不变。
5. 替换失败：插件不可用，构建修正后再次替换。

## 关系

- 一个 profile 含一个被测插件链接与一份 `cordis.patch.yml`。
- 一个 `hmr` 条目对应一组监听根；本轮只监听当前检出的 `dist`。
- 插件加载源指向仓库；profile 删除不影响仓库产物。

## 生命周期

```text
创建 profile → 链接安装 → 启动 GUI → （改代码 → 构建 → 自动替换）* → 跑用例 → 报告 → 删除 profile
```
