# 常见问题

按「现象、原因、处理」排列。写断言或排查前先看一遍。

## 环境

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 本地宿主启动报 `user patch-layer watching requires the Cordis HMR service` | 旧版宿主的依赖按 caret 范围解析到之后发布的不兼容版本 | `setup-env.sh` 用 `npm i --before=<宿主发布时间>` 安装。手动安装时同样加这个参数 |
| 驱动报 `readEnv`、`reading 'session'` 等 TypeError | 加载了全局宿主而非本地宿主 | 先执行 `setup-env.sh` 打印的 `export PATH=... RDT_DSH_PKG=...` |
| 启动报 `.credentials.yaml must be a string` | 旧版宿主读取了新版宿主写的凭据文件 | 隔离配置把 `credentials.path` 指向 profile 目录 |
| 旧版宿主报 `profile does not exist` | 旧版没有 `--from-default-profile` | `setup-env.sh` 按 web 模板写 profile 的 `package.json` |
| mock provider 加载失败 | 旧版 loader 不接受裸路径 | 插件行的 `name` 用 `file:///` 开头的 URL |
| GUI 启动报 `EADDRINUSE`，多个插件未激活 | GUI 端口被残留进程占用 | `gui-up.sh` 启动前会结束占用端口的进程 |
| 安装过程很慢 | 宿主依赖数百个包 | 首次安装需要数十分钟，之后复用 `~/.dsh-local` |

## 宿主契约

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| mock 识别不到用户消息里的标记 | 宿主在用户消息后追加一条运行时上下文消息 | 读取最后一条 assistant 之后的全部用户消息 |
| mock 识别不到工具结果 | 旧版宿主把工具结果放进 `user` 消息的 `tool-result` 块 | 按消息内的 `tool-result` 块判断，忽略角色 |
| `agent.session.snapshotEvents is not a function` | 旧版宿主只有 `session.events` 属性 | 驱动同时兼容 `snapshotEvents()` 与 `events` |
| mock 把工具结果当普通消息，回复「mock：已收到」 | 宿主把工具结果放进 `role: 'tool'` 的消息，内容仍是 text 块 | 判断 `last.role === 'tool'`，再回退到 `tool-result` 块 |
| 修改 mock 后 GUI 行为不变 | GUI 进程持有已加载的模块 | 重新运行 `gui-up.sh` 再刷新页面 |
| `fiber.assertActive()` 在 `apply` 抛错时仍通过 | 它只检查插件是否已卸载 | 用 `entry.fiber.state` 判断：`2` 已激活，`3` 加载失败 |
| 工作区报 `missing or foreign unit header`，会话控制器等服务一直等待 | `workspace.json` 的 `version` 写在了顶层 | 写成 `unit: { name: 'workspace', version: 2 }` |
| GUI 停在「正在加载工作区」 | `workspace.json` 的路径或时间戳格式错误 | `path` 用反斜杠 Windows 路径，时间戳用 ISO 字符串 |
| 多次运行报 `SessionAlreadyExistsError` | 固定 sessionId 与上轮落盘会话冲突 | `run-test.mjs` 启动时清理 `test-sessions` |
| 驱动找不到 `lib/profile-boot.js` | 旧版宿主只提供带 hash 的文件名 | `run-test.mjs` 按导出的 `runProfile` 查找 |

## 浏览器

`browser-test.mjs` 用 Playwright 驱动无头 Chrome。界面标签随宿主语言变化，脚本按中英文两套标签依次尝试。定位依据：

| 元素 | 定位方式 |
| --- | --- |
| 输入框 | `textarea` 或 `[contenteditable="true"]` 的第一个 |
| 发送按钮 | `getByRole('button', { name: '发送消息' })` |
| 本轮折叠行 | 文本匹配 `已完成` |
| 工具分组 | `getByRole('button', { name: '已调用工具' })` |
| 插件启用开关 | `getByRole('switch', { name: '启用 <插件名>' })`，状态读 `aria-checked` |

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 打开 GUI 先出现「预览版说明」或「内测声明」弹窗 | 欢迎弹窗只在配置的版本号与宿主常量完全一致时隐藏 | `setup-env.sh` 从宿主读取该常量写入配置；`browser-test.mjs` 会自动点「继续」 |
| 工具卡片看不到 `demo_echo` | 工具调用折叠在「已完成，用时 N」与「已调用工具」两层展开项里 | 脚本先展开这两层再断言 |
| 插件页没有插件详情入口 | 部分宿主版本只提供行内启用开关与提示气泡 | 断言「已安装插件」列出插件、开关为开 |
| 旧版宿主没有插件页 | 插件管理在「设置」中 | 跳过 C2 用例 |
| GUI 每次启动 token 不同 | token 每次轮换 | 用 `gui-up.sh` 导出的 `RDT_GUI_URL` |
| 旧版宿主日志里没有 token | 旧版默认不启用访问令牌 | `gui-up.sh` 直接使用日志中的地址 |
| 打开页面返回 401 | 未带 token 访问 | 使用 `RDT_GUI_URL` 的完整地址 |
| 冷启动超过 30 秒 | 首次启动加载较多插件 | 调大 `RDT_GUI_WAIT` |
| 启动报 `URL.canParse is not a function` | Playwright 在旧版 Node 下的内部调用 | 使用 Node 22.19 及以上 |
