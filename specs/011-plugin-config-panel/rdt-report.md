# 实机测试报告 0.0.2 cfa9d92

## 环境

- 宿主版本：`dsh 0.2.2-rc.3`，安装在 `~/.dsh-local/dsh-0.2.2-rc.3`
- profile：`rdt-011-config`
- 浏览器：本机 Chrome，Playwright `channel: 'chrome'`，无头
- 模型：mock provider，`model: mock-model`

## 后端用例

| 用例 | 结果 | 关键断言 |
| --- | --- | --- |
| A1 插件装载 | PASS | 插件已激活；已安装版本 `0.0.2` 与仓库一致；`dist/index.mjs` 哈希 `9a09564a8d7b` 一致 |
| B1 工具调用 | PASS | 首个请求携带 `demo_echo`；工具结果 `[rdt] (session rdt-echo) hello` |
| B2 热更新 | PASS | 改 `prefix: hot` 后 `fiber.uid` 不变，回显 `[hot] (session rdt-prefix) again` |
| B3 关闭工具 | PASS | `demoEnabled: false` 时请求不含 `demo_echo`，本轮无工具结果 |
| B4 配置错误 | PASS | 未知键使 `entry.update` 拒绝并报 `unknown config key`；恢复后重新激活 |
| B5 热重载不重启 | PASS | 改前缀、注销与重注册工具后 `fiber.uid` 均为 `165`；工具说明随 `live`、`back` 更新；回显 `[back] (session rdt-hot) hot` |

## 浏览器流程

| 流程 | 结果 | 截图 |
| --- | --- | --- |
| C1 对话冒烟 | PASS | `c1-reply.png`、`c1-toolcard.png` |
| C2 插件页 | PASS | `c2-plugins.png` |
| C3 前端示例行 | PASS | `c3-demo-dock.png` |
| C4 配置页保存与热重载 | PASS | `c4-config.png`、`c4-echo.png` |
| C5 空白前缀被拒绝 | PASS | `c5-invalid.png` |

C4 的操作路径：插件页 → `查看 dsh-plugin-template` → 行上的 `配置 dsh-plugin-template` → 改前缀保存。

- 保存后 `cordis.patch.yml` 的 `prefix` 写入新值，行详情页的 `data-plugin-row-detail` 为 `dsh-plugin-template#dsh-plugin-template`。
- 未重启 GUI 时新建会话发送 `ECHO_CASE:gui2`，回复为 `mock：工具返回 [gui2] (session <id>) gui2`。
- C5 输入空白前缀后输入框边框转红、显示“前缀需要至少一个非空白字符。”、保存按钮禁用，`cordis.patch.yml` 不变。

## 界面一致性

- 配置页与官方 forge 行配置页使用同一套控件与令牌：13px 标题、12px 说明、`--dsw-*` 颜色、字段间 0.5px `l2` 分隔线。
- `summary` 视图的一行文案作为行描述出现：`演示工具与事件日志的开关和回显前缀`。

## 发现的问题

未发现插件缺陷。两处驱动问题已修正：

1. C4 原先固定断言 `prefix: gui`，重复运行时表单值未变化会导致保存按钮禁用；改为读取当前值后取另一个前缀。
2. C5 原先用 `patch.includes('   ')` 判断空白写入，会被 YAML 缩进误判；改为比较 `prefix` 行的取值。

## 产物

- `C:/Users/admin/.dsh/profiles/rdt-011-config/results.json`
- `C:/Users/admin/.dsh/profiles/rdt-011-config/browser-results.json`
- `C:/Users/admin/.dsh/profiles/rdt-011-config/requests.jsonl`
- `C:/Users/admin/.dsh/profiles/rdt-011-config/test-sessions/`
- `C:/Users/admin/.dsh/profiles/rdt-011-config/shots/`