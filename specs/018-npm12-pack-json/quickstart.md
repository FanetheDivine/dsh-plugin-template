# Quickstart: npm 12 下包内容测试兼容

## 自动验证

```bash
pnpm install
pnpm format && pnpm check
pnpm build
```

| 命令 | 预期 |
| --- | --- |
| `pnpm test:code` | 含 `tests/pack-report.test.ts`，四类输入全部通过 |
| `pnpm build` | 末尾的 `test:dist` 通过，`package-pack` 断言项与改动前一致 |

## 两种 npm 版本

默认 npm 覆盖数组形状。用 npm 12 再跑一次产物测试：

```bash
npm install -g npm@12 --prefix /tmp/npm12
PATH="/tmp/npm12/bin:/tmp/npm12:$PATH" pnpm test:dist
```

Windows 的 npm 12 前缀目录下是 `npm.cmd`，把该目录加到 `PATH` 最前面即可。

| 场景 | 预期 |
| --- | --- |
| npm 11 输出数组 | `test:dist` 通过 |
| npm 12 输出对象 | `test:dist` 通过 |
| 输出既不是数组也不是对象 | 用例失败，消息含输出片段 |

## 文档与工作流验证

1. `.github/workflows/ci.yml` 的 publish job 步骤里没有 `npm install -g npm@latest`。
2. publish job 的注释写明 OIDC 要求的 npm 下限与 Node 24 自带版本的对应关系。
3. `docs/development.md` 的 CI 节写明 npm 由 Node 提供。
4. `docs/development.md` 的测试表含 `tests/pack-report.test.ts`。

## 手工验证

在仓库根目录运行：

```bash
pnpm vitest run --project code tests/pack-report.test.ts
```

预期四类输入全部通过。
