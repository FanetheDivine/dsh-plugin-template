# Quickstart: 宪章精简

在 worktree 根目录执行。

1. 宪章原则与版本：

   ```bash
   grep -nE '^### |^\*\*Version' .specify/memory/constitution.md
   ```

   预期：依次为 I 宿主依赖版本、II 测试同步、III 文档结构、IV 质量门禁、V 公开引用；版本 `2.0.0`。

2. 已删除原则不再被引用：

   ```bash
   git grep -nE '原则 ?(VI|VII|VIII|IX)\b|principle V\b' -- ':!specs' ':!changelogs' ':!CHANGELOG.md'
   ```

   预期：无输出。

3. 规则迁移：按 [data-model.md](./data-model.md) 的迁移表逐行在归属文档中查到对应规则。

4. 模板转化入口：`AGENTS.md` 有模板说明节与索引条目，链接 `docs/template-conversion.md`；该文档步骤与原原则 VII 顺序一致。

5. 依赖回归：

   ```bash
   pnpm vitest run tests/dependency-versions.test.ts
   ```

   预期：通过。把 `package.json` 中任一 `dsh-*` 版本改成其他值后失败，改回后通过。

6. 门禁：

   ```bash
   pnpm format && pnpm check
   ```
