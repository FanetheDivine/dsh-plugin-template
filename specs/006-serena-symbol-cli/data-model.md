# Data Model: Serena 符号查询

## SymbolQuery

| 字段 | 类型 | 校验 |
| --- | --- | --- |
| `command` | `definition \| references \| doc` | 必填 |
| `name_path` | `string \| null` | 与 `relative_path` 定位二选一 |
| `relative_path` | `string \| null` | 仓库内已存在文件，输出使用 `/` |
| `line` | `number \| null` | 1 起始正整数；仅位置模式使用 |
| `max_chars` | `number` | 正整数，默认 20000 |

状态流：参数校验 → 目标解析 → 语言服务器同步 → 查询 → 路径与行号标准化 → 输出。

## ProjectInstance

| 字段 | 类型 | 校验 |
| --- | --- | --- |
| `root` | `string` | 规范化项目绝对路径，仅运行时保存 |
| `pid` | `number` | 当前实例进程 |
| `port` | `number` | 仅回环连接 |
| `token` | `string` | 随机凭据，不出现在 `status` 输出 |
| `build` | `string` | CLI 版本与两个脚本内容摘要 |

状态流：

- `stopped` → 查询加锁并启动 → `running`。
- `running` → 后续查询心跳与复用 → `running`。
- `running` → 停止请求、项目目录消失或空闲到期 → `stopped`。
- `running` → 构建摘要不一致 → 替换实例 → `running`。
- 损坏状态或失效心跳 → 清理并重建 → `running` 或单进程回退。

状态与锁按规范化项目路径摘要命名。状态文件原子替换，停止时按 PID 防止删除新实例状态。

## ProjectMembership

| 字段 | 类型 | 校验 |
| --- | --- | --- |
| `config` | `string` | 仓库内相对配置路径 |
| `files` | `string[]` | 仅输入集合内、仓库内的源文件，排序输出 |
| `dependencies` | `string[]` | 配置、继承、包元数据与缺失路径探测结果 |

任一损坏配置只影响自身。配置或依赖变化后重新解析成员。
