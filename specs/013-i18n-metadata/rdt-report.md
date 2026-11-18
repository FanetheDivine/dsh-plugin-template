# 实机核对：插件元数据

## 环境

- 宿主：`~/.dsh-local/dsh-0.2.2-rc.3`，与 `package.json` 的 `@deepseek-ai/dsh-agent` 版本一致。
- profile：`rdt-013-i18n`，用 `pnpm pack` 的 tarball 安装插件，核对后删除。
- 浏览器：Playwright 驱动本机 Chrome，每轮新建上下文，分别指定 `en-US`、`zh-CN`、`ja-JP`。

## 结果

| 用例 | 语言 | 插件行标题与描述 | 结论 |
| --- | --- | --- | --- |
| M1 | `en-US` | `Plugin template` + `Demonstrates DSH plugin host tools …` | 通过 |
| M2 | `zh-CN` | `插件模板` + `演示 DSH 插件的宿主工具与前端接入：…` | 通过 |
| M3 | `ja-JP` | 回落英文标题与描述 | 通过 |

- 三轮都未出现另一种语言的标题，说明按语言取文件生效。
- 插件停用状态未单独核对；宿主读取元数据发生在激活之前，与启用状态无关。

## 未覆盖

- 设置页切换语言后的即时刷新：三份结果分别来自三个新上下文，未在同一页面切换。
- 详情页正文：未声明 `meta.detail`，详情页使用 `README.md`，本次未打开核对。
