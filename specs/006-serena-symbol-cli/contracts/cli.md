# CLI Contract: `pnpm serena`

## 前置条件

- uv
- Node.js
- Python 3.11–3.14
- 首次准备时可获取固定依赖

`pnpm install` 自动执行准备。手动执行 `pnpm serena:setup`；`pnpm serena --version` 输出 `serena-agent 2.1.0`。

## 查询命令

```text
pnpm serena [--no-daemon] definition <name_path> [--max-chars <positive-int>]
pnpm serena [--no-daemon] references <name_path> [--max-chars <positive-int>]
pnpm serena [--no-daemon] doc <name_path> [--max-chars <positive-int>]

pnpm serena [--no-daemon] definition --at <file_path>[:<line>] [--max-chars <positive-int>]
pnpm serena [--no-daemon] references --at <file_path>[:<line>] [--max-chars <positive-int>]
pnpm serena [--no-daemon] doc --at <file_path>[:<line>] [--max-chars <positive-int>]
```

- `name_path` 与 `--at` 必须二选一。
- `file_path` 是当前项目内相对路径；`line` 是 1 起始正整数。
- 省略 `line` 时只返回文件符号候选及声明行。
- 默认 `max_chars` 为 20000。
- 无匹配、多个匹配、无效声明行和越界文件均返回可读错误。
- 成功输出为 Serena JSON，可带长度截断说明；路径使用 `/`，行号从 1 开始。
- `--no-daemon` 对查询使用单进程。

## 实例命令

```text
pnpm serena status
pnpm serena stop
```

- `status` 输出 `stopped`，或包含 `status`、`root`、`pid`、`build`、`uptime` 的运行状态；停止中可输出 `stopping`。
- `status` 不输出 token 或端口。
- `stop` 幂等，只停止当前项目实例，成功输出 `{"status":"stopped"}`。

## 环境变量

| 变量 | 契约 |
| --- | --- |
| `SERENA_CLI_IDLE_TIMEOUT` | 正数空闲秒数，默认 900 |
| `SERENA_CLI_START_TIMEOUT` | 正数启动等待秒数，默认 120 |
| `SERENA_CLI_DAEMON=0` | 查询使用单进程 |
| `SERENA_CLI_STATE_DIR` | 覆盖实例状态目录，供隔离与测试使用 |

非法数值产生命令错误。

## 退出码

- `0`：查询或实例命令成功。
- `1`：查询、初始化、连接、环境或运行时错误。
- `2`：命令参数错误。

后台启动失败且查询尚未提交时输出回退诊断并使用单进程。查询提交后连接失败直接报错，不重放查询。
