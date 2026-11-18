# Data Model: 产物测试的构建新鲜度

## 构建输入（BuildInput）

参与生成 `dist` 的仓库文件。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `path` | 仓库内相对路径 | 例如 `src/client/index.ts`、`tsdown.config.ts` |
| `mtime` | 时间戳 | 文件最后写入时间 |

来源：`src/` 下全部文件，加固定文件 `tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json`、`package.json`。

## 产物（BuildProduct）

`pnpm build` 应生成的发布文件。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `path` | 仓库内相对路径 | `dist/client.js`、`dist/index.mjs`、`dist/index.d.ts`、`dist/client/index.d.ts` |
| `exists` | 布尔 | 文件是否存在 |
| `mtime` | 时间戳 | 文件最后写入时间；不存在时为空 |

## 新鲜度判定（Freshness）

| 状态 | 条件 | `test:dist` 行为 |
| --- | --- | --- |
| 新鲜 | 全部产物存在，且每个构建输入都不晚于最旧产物 | 执行断言 |
| 过期 | 任一构建输入晚于最旧产物 | 失败，列出输入与产物，提示 `pnpm build` |
| 缺失 | 任一产物不存在 | 失败，列出缺失文件，提示 `pnpm build` |

判定按单次读取计算。`build` 结束后所有产物晚于构建输入，因此随后的 `test:dist` 判为新鲜。

## 状态转换

```text
源码修改（输入变新） → 过期
未构建的干净检出（产物不存在） → 缺失
pnpm build（先重写产物，再运行 test:dist） → 新鲜
```

约束：

- 判定只读文件系统，不写 `dist`。
- 一次 `test:dist` 内每个文件只 stat 一次。
- 判定结果不缓存，多个测试文件各自得到同一结论。