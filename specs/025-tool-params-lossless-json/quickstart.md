# Quickstart: 工具参数声明的无损 JSON 与手写声明

## 前置条件

- Node 24.9 及以上，pnpm 11.7。
- 已执行 `pnpm install`，`@deepseek-ai/dsh-*` 为 `0.2.2-rc.5`。
- 在 worktree `worktrees/025-tool-params-lossless-json` 内操作。

## 验证命令

```sh
pnpm format && pnpm full-check
```

期望：

- `pnpm format` 不改写任何文件。
- 类型检查通过：手写声明满足 `ParametersSchemaOf<EchoArgs>`，两条类型断言成立。
- `tests/dependency-versions.test.ts` 通过：全部 `dsh-*` 为 `0.2.2-rc.5` 且列入排除表。
- 新增的声明校验测试与一致性测试通过。
- 构建与 `dist` 项目测试通过。

## 场景

### S1 声明的形态

```sh
pnpm vitest run --project code tests/tool-schema.test.ts tests/plugin.test.ts
```

期望：`demo_echo` 的 `parameters` 是 `type: object` 的根对象，含 `properties.text`、`required: ['text']`，不含 `$schema` 与 `~standard`。

### S2 手写声明与 zod 投影一致

期望：`ECHO_PARAMETERS` 与 `z.toJSONSchema(echoArgsSchema)` 剔除 `$schema` 与 `~standard` 后结构相等。

### S3 类型约束拦住漂移

手动制造三处漂移，每处都应让 `pnpm typecheck` 失败，确认后改回：

1. 把 `properties.text.type` 改成 `'number'`。
2. 删掉 `required`。
3. 加一个 `properties.extra` 属性。

### S4 zod 原始输出不合规

期望：对 `z.toJSONSchema(echoArgsSchema)` 的原始返回值运行校验函数时失败，失败信息指向 `~standard` 键。

### S5 全部已注册工具

期望：经 `apply` 注册的全部工具声明在同一次校验中全部通过。

### S6 非法值的判定

期望：校验函数对下列输入分别抛出错误：不可枚举键、嵌套对象中的不可枚举键、`NaN`、`Infinity`、`-0`、循环引用、类实例、稀疏数组、数组附加属性。

### S7 工具行为不变

```sh
pnpm vitest run --project code tests/plugin.test.ts
```

期望：合法参数返回 `[demo] (session a1) hi`；非法参数返回以「参数不合法」开头的提示。

### S8 升级核对项

打开 `docs/development.md` 的「依赖升级」小节，确认含「检查宿主能否直接接受 zod 输出」的核对项与简化步骤。

## 失败处理

- 类型检查因 rc.5 的接口变化失败：按实际错误修正，范围超出本次改动时先报告。
- 一致性测试失败：以 zod 的投影为准更新手写声明，不反向改 zod schema。
- 校验函数与宿主规则不一致：以 `@deepseek-ai/dsh-util-values` 的 `walkJsonValue` 为准修正测试。
- 安装失败：检查 `minimumReleaseAgeExclude` 是否已包含全部 `dsh-*` 的新版本。
