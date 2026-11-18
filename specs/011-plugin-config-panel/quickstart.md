# Quickstart: 插件面板配置项

## 单元与构建

```sh
pnpm i
pnpm format && pnpm check && pnpm build
```

期望：类型检查、lint、测试通过，`dist/client.js` 与 `dist/index.mjs` 生成。

## 实机测试

按 `.dsh/skills/real-device-test` 的流程：

1. `bash .dsh/skills/real-device-test/scripts/setup-env.sh <仓库路径>` 搭建 profile。
2. `node run-test.mjs`：A1 与 B1–B5 全部通过。
3. `eval $(bash .dsh/skills/real-device-test/scripts/gui-up.sh <profile>)` 启动 GUI。
4. `node .dsh/skills/real-device-test/scripts/browser-test.mjs`：C1–C5 全部通过。

## 手动验证

1. 打开 GUI 的“插件”页，进入模板插件，点击组件行的“配置”。
2. 把前缀改为 `hot` 并保存；`cordis.patch.yml` 的 `config.prefix` 为 `hot`。
3. 发送 `ECHO_CASE:x`，回复含 `[hot]`。
4. 关闭“启用 demo 工具”并保存，再发送一条消息，请求不含 `demo_echo`。
5. 清空前缀，输入框标红并提示非法，保存按钮禁用，配置不变。
