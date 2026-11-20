# 快速验证：实机测试热更新

**日期**：2026-11-20 | **规格**：[spec.md](./spec.md) | **计划**：[plan.md](./plan.md)

## 前置

1. 仓库已安装依赖并构建：`pnpm i && pnpm check`。
2. 宿主版本与 `package.json` 的 `@deepseek-ai/dsh-agent` 一致，或允许脚本安装到 `~/.dsh-local`。
3. 本机 Chrome 可用，`playwright` 已安装。

## 搭建与启动

```sh
bash .dsh/skills/real-device-test/scripts/setup-env.sh <repo> rdt-hot
export RDT_PROFILE=rdt-hot RDT_PROFILE_DIR=<profile目录> RDT_REPO=<repo>
cd <profile目录> && node run-test.mjs
eval $(bash <repo>/.dsh/skills/real-device-test/scripts/gui-up.sh rdt-hot)
cd <repo> && node .dsh/skills/real-device-test/scripts/browser-test.mjs
```

预期：

- `node_modules/dsh-plugin-template` 是指向仓库的符号链接。
- `cordis.patch.yml` 含 `- id: hmr` 与 `config.root: ["<repo>/dist"]`。
- 后端六条用例与浏览器流程全部通过。

## 热更新验证

1. 记录 GUI 进程号：`netstat -ano | grep ":3210 " | grep LISTENING`。
2. 修改 `src/demo-tool.ts` 的工具说明文本。
3. 构建：`pnpm build`。
4. 在同一 GUI 中发送 `ECHO_CASE:hot`，展开本轮工具卡片。
5. 预期：
   - 工具说明为新文本。
   - 页面无需刷新即显示新前端。
   - GUI 进程号不变，会话可继续。

## 清理

1. 按 [cases.md](../../.dsh/skills/real-device-test/references/cases.md) 写报告并保留截图。
2. 结束 GUI：`taskkill //F //T //PID <pid>`。
3. 删除 profile：`rm -rf ~/.dsh/profiles/rdt-hot`。

## 失败排查

- 构建后行为不变：确认插件是链接安装、`hmr` 条目存在、`dist/index.mjs` 已更新。
- GUI 日志无内容：宿主把日志写到标准输出，`gui-run.log` 只保留启动行。
- 仓库路径含点目录：见 [pitfalls.md](../../.dsh/skills/real-device-test/references/pitfalls.md)。
