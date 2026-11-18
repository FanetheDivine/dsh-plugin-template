# Quickstart: 验证插件元数据国际化

前置：Node.js 24.9 及以上，pnpm 11，在仓库根执行。

## 1. 结构与键集

```sh
pnpm i
pnpm vitest run tests/metadata.test.ts
```

预期：两份元数据文件的 `meta` 键集一致，`meta.title` 与 `meta.description` 非空，资源里没有 U+200B 与 U+FEFF，`package.json` 已声明 `./locale/*.json` 导出。

## 2. 打包内容

```sh
pnpm build
npm pack --dry-run --json
```

预期：输出文件列表包含 `locale/en.json` 与 `locale/zh.json`，不包含 `src/`、`tests/`、`specs/`。

## 3. 全量门禁

```sh
pnpm format && pnpm check
```

预期：类型检查、lint、测试与构建全部通过；`pnpm check` 与 CI 跑同一组检查。

## 4. 实机核对（推荐）

```sh
bash .dsh/skills/real-device-test/scripts/setup-env.sh <仓库绝对路径>
```

按脚本结尾提示启动隔离 profile，然后：

1. 打开“插件”页，找到模板插件。
2. 中文界面下核对标题与描述为中文，且描述包含 `demo_echo`、事件日志、配置页与示例行。
3. 在设置里把语言切到 English，返回“插件”页，核对标题与描述切换为英文，无需刷新页面。
4. 停用插件后再次查看详情，核对标题与描述照常显示。
5. 把语言切到未提供元数据的语言（如 `ja`），核对回落英文。

无浏览器控制时：核对已安装包内 `locale/*.json` 的内容与排版，并在交付说明中写明渲染结果未验证。

## 5. 文档核对

- `docs/i18n.md` 存在，覆盖元数据、字典、基线语言、回退顺序、占位符与打包声明。
- `AGENTS.md` 文档索引有一条指向 `docs/i18n.md`。
- `.specify/memory/constitution.md` 含原则 IX，版本为 1.9.0。
