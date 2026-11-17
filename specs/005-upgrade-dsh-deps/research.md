# Research: 模板宿主依赖对齐 DSH 0.2.2-rc.3

**Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

## R1 目标版本由 `@deepseek-ai/dsh` 决定

`npm view` 结果：

| 包 | `latest` 标签 | `next` 标签 | 最新发布 |
| --- | --- | --- | --- |
| `@deepseek-ai/dsh` | 0.2.2-rc.1 | 0.2.2-rc.3 | 0.2.2-rc.3 |
| `@deepseek-ai/dsh-agent` | 0.1.0-rc.6 | 0.2.2-rc.3 | 0.2.2-rc.3 |
| `@deepseek-ai/dsh-tools` | 0.0.1-rc.1 | 0.2.2-rc.3 | 0.2.2-rc.3 |
| `@deepseek-ai/cordis` | 4.1.0 | 4.0.6-alpha.2 | 4.1.0 |

子包的 `latest` 标签落后于发布线，不能作为升级依据。目标取 `0.2.2-rc.3`：`@deepseek-ai/dsh` 的最新发布，也是本机运行宿主的版本。

结论：`dsh-agent`、`dsh-tools` 都有 `0.2.2-rc.3`，不触发移除规则。`cordis` 按 `@deepseek-ai/dsh` 0.2.2-rc.3 的依赖声明 `~4.1.0` 取值。

## R2 宿主实例版本

从安装目录解析：

- `@deepseek-ai/dsh` 0.2.2-rc.3 依赖 `@deepseek-ai/cordis` `~4.1.0`。
- `@deepseek-ai/dsh-agent` 0.2.2-rc.3 依赖 `zod` 4.6.6；宿主实例的 zod 也是 4.6.6。
- 模板原 `zod` 4.4.3 低于宿主实例，按「宿主实例唯一」原则升到 4.6.6。

`dsh-agent`、`dsh-tools` 的 peer 要求 `@deepseek-ai/cordis ~4.1.0`，与上述一致。

## R3 `agent/session-start` 已不存在

在 0.2.2-rc.3 上运行 `tsc --noEmit` 的唯一报错：

```text
src/events.ts(19,10): error TS2345: Argument of type '"agent/session-start"' is not assignable to parameter of type 'keyof Events'.
```

`@deepseek-ai/dsh-agent` 0.2.2-rc.3 的 `Events` 接口包含 `agent/created`、`agent/disposed`、`agent/status`、`agent/pre-step`、`agent/turn-stopping` 等，不含 `agent/session-start`。

`agent/created` 的 payload 为 `{ agent, source: SessionStartSource, signal? }`。来源信息已并入创建事件，示例改为在 `agent/created` 中记录 `source`，删除 `agent/session-start` 监听。

安装目录的 `docs/upgrade-guide/` 没有覆盖该事件的条目，迁移依据是类型定义。

## R4 Node 24.9 要求

`docs/upgrade-guide/v0.2.1-rc.2/node-24/guide.zh.md`：DSH 要求 Node.js 24.9 及以上，不再支持 Node 22。模板 `engines.node` 由 `^22.19.0 || >=24.0.0` 改为 `>=24.9.0`，`@types/node` 同步到 24.x。

本机 Node 为 22.22.1，`pnpm install` 与 `pnpm check` 仍可运行，只影响声明与 CI 版本对齐。

## R5 实机测试脚本的版本来源

`.dsh/skills/real-device-test/scripts/setup-env.sh` 从 `package.json` 的 `@deepseek-ai/dsh-agent` 取值并去掉 `^`/`~`。精确版本 `0.2.2-rc.3` 直接可用，脚本无需改动。

## R6 试验验证

在仓库外的临时目录按新版本安装依赖后：

- `tsc --noEmit` 只报 R3 的错误。
- `vitest run` 中插件相关用例与依赖版本无关，全部通过。

结论：代码改动只需处理 `agent/session-start`。