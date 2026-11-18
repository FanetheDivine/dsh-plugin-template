# Research: 产物测试的构建新鲜度

## 1. 测试拆分方式

**Decision**: 在 `vitest.config.ts` 用 `test.projects` 声明 `code` 与 `dist` 两个 project，脚本用 `vitest run --project <name>` 选择。

**Rationale**: 一份配置维护两条 include 规则；`vitest run` 仍可一次跑完两个 project；vitest 4.1 支持 inline project 的 `extends: true` 继承根配置的 alias 与 environment。

**Alternatives considered**:

- 两个 `vitest.config.*` 文件：alias 与 exclude 规则要复制两份。
- CLI 传文件清单：新增产物测试时要同步改脚本，容易漏。

## 2. 过期产物的处理

**Decision**: `test:dist` 在断言前调用 `assertFreshDist()`；产物缺失或过期时抛错，错误信息要求运行 `pnpm build`。测试不构建。

**Rationale**: `build` 已经负责生成产物；测试再构建会让构建与测试互相调用，而且失败时无法区分是源码错还是产物旧。显式失败让「产物过期」与「契约不符」两种原因分开。

**Alternatives considered**:

- 测试内按时间戳自动重建：`pnpm build` 末尾运行 `test:dist` 会递归；且测试承担构建职责。
- 每次运行都构建：`test:code` 也要等构建，违背拆分目的。
- 内容哈希戳：要改构建脚本并把戳文件排除出发布内容，复杂度高于收益。

## 3. 新鲜度判定依据

**Decision**: 比较构建输入与产物文件的时间戳；任一产物缺失，或任一构建输入晚于最旧产物，即视为过期。

构建输入：`src/` 下全部文件、`tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`。

产物：`dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts`。

**Rationale**: 这些文件共同决定产物内容；`tsconfig.json` 被 `tsconfig.build.json` 继承，`package.json` 决定包名与依赖。时间戳比较不需要改构建脚本，也不往 `dist` 写额外文件。

**Alternatives considered**:

- 只比较 `dist/client.js`：漏掉宿主产物与类型声明，package-pack 测试会读到旧类型。
- 哈希戳：结果更确定，但要改 `build` 并处理 `dist` 内的戳文件进包问题。

## 4. 检查位置与错误信息

**Decision**: 新增 `tests/support/dist-freshness.ts`，导出 `assertFreshDist()`；`tests/client-bundle.test.ts` 与 `tests/package-pack.test.ts` 在读取 `dist` 前调用。错误信息列出缺失与过期文件，并给出 `pnpm build`。

**Rationale**: 两个测试共用同一规则与同一条修复提示；失败信息直接指向操作，不要求读测试源码。

## 5. 脚本流水线

**Decision**:

| 脚本 | 内容 |
| --- | --- |
| `test:code` | `vitest run --project code` |
| `test:dist` | `vitest run --project dist` |
| `check` | `typecheck && lint && test:code` |
| `build` | `tsdown && tsc -p tsconfig.build.json && test:dist` |

不保留 `test` 脚本：代码质量入口是 `pnpm check`，产物验证随 `pnpm build`。`full-check` 保持 `check && build`，CI 不变。

**Rationale**: `build` 末尾验证刚生成的产物；`check` 在没有 `dist` 的干净检出上也能通过；`test` 保留一次性跑完的入口。

**Alternatives considered**:

- `build` 只打包，把 `test:dist` 放进 `full-check`：`pnpm build` 单独运行时产物无人验证，偏离本次需求。

## 6. CI 与发布

**Decision**: `.github/workflows/ci.yml` 的 job 描述改为体现 `test:code` 与 `test:dist`；`publish` job 的 `pnpm build` 现在会运行 `test:dist`，其安装步骤已包含 devDependencies，无需调整。

**Rationale**: 脚本变化后 CI 行为已自动跟随；只更新描述避免文档与 CI 名词不一致。