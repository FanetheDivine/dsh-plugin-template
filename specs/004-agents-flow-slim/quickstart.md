# Quickstart: AGENTS.md 开发流程精简与文档归属调整

在 worktree 根目录执行。

1. 质量门禁：

   ```bash
   pnpm format && pnpm check
   ```

   预期：全部通过。

2. `AGENTS.md` 开发流程节：

   ```bash
   grep -nE 'no-track|worktrees/|gh pr create|abandon|clarify 或询问' AGENTS.md
   grep -nE '每个阶段 MUST 对应一个 commit|\[P\]' AGENTS.md
   ```

   预期：第一条无输出；第二条输出两条实施规则。

3. 宪章：

   ```bash
   grep -n '^## 开发流程' .specify/memory/constitution.md
   grep -nE '通用的信息和指令|变更过程中必须遵循的硬约束' .specify/memory/constitution.md
   ```

   预期：第一条无输出；第二条输出原则 V 表格的两行。

4. 失效链接：

   ```bash
   git grep -n 'constitution.md#开发流程' -- ':!specs' ':!CHANGELOG.md'
   ```

   预期：无输出。
