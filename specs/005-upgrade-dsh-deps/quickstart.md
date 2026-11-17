# Quickstart: 验证模板对齐 DSH 0.2.2-rc.3

**Feature**: 005-upgrade-dsh-deps

在仓库根目录执行，命令按顺序运行。

## 1. 依赖版本

```sh
node -p "const p=require('./package.json').devDependencies; [p['@deepseek-ai/dsh-agent'], p['@deepseek-ai/dsh-tools'], p['@deepseek-ai/cordis'], p.zod, p['@types/node']].join(' | ')"
```

期望：`0.2.2-rc.3 | 0.2.2-rc.3 | ~4.1.0 | 4.6.6 | ^24.<版本>`。

```sh
node -p "require('./package.json').engines.node"
```

期望：`>=24.9.0`。

## 2. 排除项与锁文件

```sh
grep 'deepseek-ai' pnpm-workspace.yaml
```

期望：`@deepseek-ai/dsh-agent@0.2.2-rc.3`、`@deepseek-ai/dsh-tools@0.2.2-rc.3`。

```sh
grep -c "0.2.2-rc.3" pnpm-lock.yaml
```

期望：大于 0。

## 3. 事件示例

```sh
grep -rn "agent/session-start" src tests
```

期望：无输出。

```sh
pnpm test
```

期望：`tests/plugin.test.ts` 断言 `agent/created`、`agent/disposed`、`agent/status`、`agent/pre-step`、`agent/turn-stopping` 五个监听，并校验来源日志。

## 4. 质量门禁

```sh
pnpm format && pnpm check
```

期望：类型检查、lint、测试、构建全部通过。

## 5. 实机验收（用户执行）

按 `.dsh/skills/real-device-test/SKILL.md` 运行：

1. `bash .dsh/skills/real-device-test/scripts/setup-env.sh <repo>`，宿主版本取自 `package.json`，为 `0.2.2-rc.3`。
2. 运行后端用例与浏览器用例。
3. 确认插件装载、`demo_echo` 工具调用与 `agent/created` 日志。