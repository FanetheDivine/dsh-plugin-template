# dsh-plugin-template

DSH 插件模板，含宿主机侧工具示例与 Web GUI 前端示例。

## 功能

- `demo_echo`：把文本加上前缀后回显。
- agent 事件日志：输出 agent 创建、销毁、状态与 turn 结束。
- Web GUI 示例行：位于会话输入区上方，显示双语文案，按钮点击后计数递增。

## 安装

```sh
dsh plugin add <包名或本地目录>
```

## 配置

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `demoEnabled` | `true` | 是否注册 `demo_echo` |
| `prefix` | `demo` | 回显前缀与日志前缀 |

## 工具

| 工具 | 参数 | 返回 |
| --- | --- | --- |
| `demo_echo` | `text` | `[prefix] (session <id>) <text>` |

前端产物随包分发，宿主按 `package.json` 的 `dsh.client` 声明加载。