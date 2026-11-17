# 用例推导与报告

功能会变化，用例每轮现场推导。

## 推导方法

1. 列出改动：

   ```sh
   git log <上个 tag>..HEAD --oneline
   ```

   结合 CHANGELOG 判断每个改动是否涉及宿主交互：
   - 工具注册与执行。
   - 事件监听与中间件。
   - 配置解析与热更新。
   - 宿主服务调用，例如 `llm`、`sessions`、`tokenMeter`。
   - 前端展示，例如工具卡片、插件详情页、配置表单。
2. 为每个交互设计 mock 脚本：哪一轮返回什么工具调用，注入什么错误。
3. 以会话落盘事件为依据写断言，覆盖成功与失败两条路径。
4. 每个用户可见的界面元素写一条浏览器流程，用元素断言和截图双重取证。

## 新增用例

- 后端用例：在 `run-test.mjs` 中加一个 `check('<编号> <名称>', fn)`。
- 新的模型行为：在 `mock-provider.mjs` 中加一个消息标记，例如 `XXX_CASE`。
- 浏览器用例：在 `browser-test.mjs` 中加一个 `check`，并在 SKILL.md 阶段 3 的表格中加一行。

## 常用断言依据

| 依据 | 获取方式 |
| --- | --- |
| 插件状态 | `entry.fiber.state`：`2` 为已激活，`3` 为 `apply` 抛错 |
| 落盘事件 | `agent.session.snapshotEvents()`，按 `type` 过滤 |
| 工具结果 | `tool/result` 事件的 `data.message` |
| 模型请求 | `adapter.calls` 或 profile 目录的 `requests.jsonl` |
| 请求携带的工具 | 请求的 `tools` 字段 |

## 报告结构

```markdown
# 实机测试报告 <插件版本> <commit>

## 环境
- 宿主版本：
- profile：
- 浏览器：

## 后端用例
| 用例 | 结果 | 关键断言 |

## 浏览器流程
| 流程 | 结果 | 截图 |

## 发现的问题

## 产物
- results.json、browser-results.json、requests.jsonl、会话目录、截图路径
```
