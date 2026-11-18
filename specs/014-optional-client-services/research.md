# Research: 前端服务可选

## 宿主能否声明可选服务

- Decision: 前端入口不导出 `inject`，依赖通过 `ctx.inject([服务], 回调)` 声明。
- Rationale: 安装的 `@deepseek-ai/cordis` 把 `inject`（数组或映射）声明的服务一律视为必需。`Inject.resolve` 对数组逐项置 `null`，加载条件要求全部服务可用；服务访问失败时抛 `cannot get required service "<name>" in inactive context`。分组用 `ctx.inject` 即可表达可选：单组依赖就绪才加载。
- Alternatives considered:
  - `inject.optional`：该版本的 `Inject` 类型只有数组与映射两种形态，无此字段。
  - 全部改为 `ctx.get` 并判空：`ctx.get` 拿到的是服务实例，仍需自行等待就绪，无法在服务晚到时自动加载，且丢失子 fiber 的卸载语义。

## 分组粒度

- Decision: 三组独立加载。
  - 字典：`['locale']`。
  - 输入区示例行：`['slots', 'locale']`。
  - 面板配置页：`['slots', 'locale', 'configForms']`。
- Rationale: 每个功能只列自己读到的服务。配置页读 `ctx.configForms` 与 `ctx.slots`，示例行读 `ctx.slots` 且渲染文案经 `t` 翻译，因此两组都要 `locale`。
- Alternatives considered:
  - 整块包在 `ctx.inject(['slots'], ...)` 内：`slots` 缺失时字典也不注册，与 FR-002 冲突。

## 注册与清理的位置

- Decision: 每组回调内直接注册，回调返回清理由 `ctx.inject` 的子 fiber 承担；配置页的表单作用域仍在组内 `ctx.effect` 释放。
- Rationale: `ctx.inject` 的回调是子 fiber，服务撤掉时子 fiber 卸载，其中的 `ctx.effect` 与槽位注册随之清理，重新就绪时重跑回调。避免重复注册。
- Alternatives considered:
  - 组外预建表单、组内注册：服务撤掉后表单单例残留，重新就绪时订阅计数累加。

## 测试如何模拟可选服务

- Decision: `makeClientCtx` 增加 `inject(deps, cb)`，记录依赖组；提供 `_grant(names)` / `_revoke(names)` 控制可用服务，`inject` 仅在依赖全可用时执行回调，撤掉时执行回调返回的清理函数。
- Rationale: 现有模拟同步执行回调，无法表达晚就绪与撤掉；FR-006 要求覆盖这两类。
- Alternatives considered: 引入真实 cordis 实例。测试目标是接线而非宿主行为，且真实实例需要注入全部宿主服务。

## 后端入口

- Decision: `src/index.ts` 的 `inject` 保持 `['tools', 'llm', 'tokenMeter', 'sessions']`。
- Rationale: 用户要求限前端；后端服务缺失时插件本就不该启动。
- Alternatives considered: 一并改为可选。超出本次范围，且工具注册依赖 `ctx.tools`。
