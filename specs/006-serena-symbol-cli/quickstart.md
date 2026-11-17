# Quickstart: Serena 符号查询

## 准备

1. 安装 uv、Node.js 和 Python 3.11–3.14。
2. 运行 `pnpm install`。
3. 运行 `pnpm serena --version`，预期输出 `serena-agent 2.1.0`。

命令与参数见 [CLI 契约](./contracts/cli.md)，实例字段见 [数据模型](./data-model.md)。

## 手工验证

1. 执行 `pnpm serena definition parseEchoArgs`，预期返回 `src/demo-tool.ts` 中的函数定义和 1 起始位置。
2. 执行 `pnpm serena references parseEchoArgs`，预期返回定义与测试引用。
3. 执行 `pnpm serena doc parseEchoArgs`，预期返回签名及中文注释。
4. 执行 `pnpm serena definition --at src/demo-tool.ts`，预期只返回文件符号候选。
5. 连续执行两次 `pnpm serena status`，首次查询后预期为 `running`，并复用相同 PID。
6. 执行 `pnpm serena stop`，预期输出 `stopped`；再次执行仍成功。
7. 执行 `pnpm serena --no-daemon definition parseEchoArgs`，预期单进程返回同一定义。

## 自动验证

```sh
pnpm format
pnpm check
```

重点用例：

```sh
pnpm vitest run tests/serena-projects.test.ts tests/serena-cli.test.ts tests/serena-daemon.test.ts
uv run --script tests/serena-runtime.test.py
uv run --script tests/serena-reference-lifecycle.test.py
```

预期覆盖：

- 三类查询、互斥参数、歧义候选、长度限制与标准位置格式。
- TypeScript 工程引用、松散 JavaScript 引用和外部文件修改。
- 实例复用、并发启动、项目隔离、认证、请求限制、停止与空闲退出。
- 单进程回退且不重复提交查询。
- 现有模板测试和 package-pack 全部通过。

删除 worktree 前，在目标目录运行 `pnpm serena stop` 并确认 `status` 为 `stopped`。
