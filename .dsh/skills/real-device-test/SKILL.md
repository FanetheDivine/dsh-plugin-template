---
name: real-device-test
description: 在真实 DSH 宿主上端到端测试本插件，验证插件在 DSH 中的实际表现时使用。
---

# real-device-test

单元测试使用模拟的 `ctx`。本 skill 在真实宿主中验证四类问题：

| 类别 | 验证内容 |
| --- | --- |
| A 宿主装载 | profile 创建、插件安装、插件激活、已安装 dist 与仓库一致 |
| B 后端链路 | mock 模型驱动真实对话，工具调用、配置热更新、配置错误 |
| C 前端展示 | 在 GUI 中发消息、查看工具卡片、插件详情页 |
| D 宿主漂移 | 宿主接口或行为与插件假设不一致 |

用例随功能变化。每轮按 [cases.md](references/cases.md) 的方法推导，`scripts/` 是可直接运行的参考实现，按需扩展。

全程只读插件代码。发现缺陷写入报告，另开分支修复。

## 阶段 0：准备

1. 在仓库运行 `pnpm i && pnpm check`，确保 `dist/` 对应当前代码。
2. 确认 `playwright` 已安装。脚本用 `channel: 'chrome'` 启动本机 Chrome，无需下载浏览器。

## 阶段 1：搭建环境（A）

```sh
bash .dsh/skills/real-device-test/scripts/setup-env.sh <仓库绝对路径> [profile名]
```

脚本依次完成：

1. 对齐宿主版本：
   - 期望版本取 `package.json` 中 `@deepseek-ai/dsh-agent` 的版本，`RDT_DSH_VERSION` 可覆盖。
   - 全局 `dsh` 版本一致时直接使用。
   - 版本不一致时安装到 `~/.dsh-local/dsh-<版本>`，全局安装保持不变。
2. 创建 profile，默认名为 `rdt-<日期>`。
3. 用 `pnpm pack` 打包插件，`dsh plugin add` 安装。
4. 写隔离配置 `cordis.patch.yml`：
   - 停用真实模型，加载 mock provider。
   - 会话、存储、凭据写入 profile 目录。
   - 跳过宿主的欢迎弹窗。
5. 复制 `mock-provider.mjs` 与 `run-test.mjs` 到 profile 目录。
6. 注册测试工作区。

脚本结尾打印后续命令。使用本地宿主时，先执行其中的 `export PATH=... RDT_DSH_PKG=...`。

## 阶段 2：后端用例（A、B）

```sh
cd <profile目录>
node run-test.mjs
```

- 驱动用宿主的 `runProfile` 启动 profile，以会话落盘事件作为断言依据。
- 结果写入 `results.json`。全部通过时退出码为 0。
- 首个用例检查装载。装载失败时中止后续用例。

当前用例：

| 用例 | 断言 |
| --- | --- |
| A1 装载 | 插件已激活，已安装版本和 dist 哈希与仓库一致 |
| B1 工具调用 | 请求携带 `demo_echo`，工具结果为 `[rdt] (session <id>) hello` |
| B2 热更新 | 修改 `prefix` 后回显使用新前缀，插件实例不变 |
| B3 关闭工具 | `demoEnabled: false` 时请求不含 `demo_echo` |
| B4 配置错误 | 未知配置键使插件加载失败，恢复后重新激活 |
| B5 热重载不重启 | 改 `prefix`、关开 `demoEnabled` 后 `fiber.uid` 不变，工具说明随新前缀重新注册 |

mock provider 的约定：

- 用户消息含 `ECHO_CASE:<文本>` 时，模型调用 `demo_echo`，再把工具结果作为回复。
- 其他消息回复「mock：已收到」。
- 每个请求追加到 `requests.jsonl`，用于核对请求内容。

## 阶段 3：浏览器用例（C）

1. 启动 GUI：

   ```sh
   eval $(bash .dsh/skills/real-device-test/scripts/gui-up.sh <profile名>)
   ```

2. 在仓库内运行浏览器驱动，它用无头 Chrome 打开 `$RDT_GUI_URL`：

   ```sh
   node .dsh/skills/real-device-test/scripts/browser-test.mjs
   ```

   - 结果写入 `<profile目录>/browser-results.json`，全部通过时退出码为 0。
   - 截图写入 `<profile目录>/shots/`。
   - `RDT_HEADLESS=0` 时显示浏览器，便于观察失败现场。

3. 当前用例：

| 用例 | 操作 | 断言 |
| --- | --- | --- |
| C1 对话冒烟 | 在工作区输入 `ECHO_CASE:gui` 并发送 | 回复含 `mock：工具返回 [`，展开本轮后出现 `demo_echo` 工具卡片 |
| C2 插件页 | 打开插件页 | 已安装插件列出被测插件，启用开关为开 |
| C3 前端示例 | 在已打开的会话中查看输入区上方 | 示例行可见，点击按钮后计数递增 |
| C4 配置页保存 | 插件页 → 包详情 → 行“配置”，改前缀并保存，再新建会话发送 `ECHO_CASE:<新前缀>` | `cordis.patch.yml` 写入新前缀，回显使用新前缀，GUI 不重启 |
| C5 非法前缀 | 在配置页输入空白前缀 | 输入框标红并提示，保存按钮禁用，配置不变 |

新增流程时在 `browser-test.mjs` 中加一个 `check('<编号> <名称>', fn)`。界面标签的定位依据见 [pitfalls.md](references/pitfalls.md)。

4. 每个流程后脚本自动截图到 `shots/`。

## 阶段 4：宿主漂移（D）

- 写断言前先读宿主源码确认事实：`<宿主目录>/node_modules/@deepseek-ai/*/lib/`。
- 断言失败时先区分两种原因：
  - 插件缺陷。
  - 驱动的假设已过时。查看会话 jsonl 与 `requests.jsonl` 的真实内容。
- 宿主升级后先跑 A1，再跑其余用例。
- 已知漂移点见 [pitfalls.md](references/pitfalls.md)。

## 阶段 5：报告与清理

1. 按 [cases.md](references/cases.md) 末尾的结构写报告。
2. 结束 GUI 进程：用 `netstat -ano` 找到 GUI 端口的 PID，再 `taskkill //F //T //PID <pid>`。
3. 浏览器驱动会自行关闭浏览器，无需清理页面。
4. 保留 profile、日志与截图供复查。

## 环境变量

所有变量都可省略。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `RDT_REPO` | 无，`run-test.mjs` 与 `browser-test.mjs` 必填 | 插件仓库绝对路径 |
| `RDT_PROFILE_DIR` | 脚本所在目录 | profile 目录 |
| `RDT_PROFILE` | profile 目录名 | profile 名 |
| `RDT_DSH_PKG` | 全局宿主 | 宿主 `package.json` 路径 |
| `RDT_DSH_VERSION` | `dsh-agent` 的版本 | 指定宿主版本 |
| `RDT_GUI_PORT` | `3210` | GUI 端口 |
| `RDT_GUI_WAIT` | `90` | 等待 GUI 启动的秒数 |
| `RDT_GUI_URL` | 无，`browser-test.mjs` 必填 | `gui-up.sh` 导出的带 token 地址 |
| `RDT_SHOTS` | `<profile目录>/shots` | 截图目录 |
| `RDT_HEADLESS` | 无头 | 设为 `0` 时显示浏览器 |
| `RDT_KEEPALIVE` | 无 | 设为 `1` 时驱动结束后保留运行时 |
