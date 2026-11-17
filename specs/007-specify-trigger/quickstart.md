# Quickstart: AGENTS.md 立即触发 speckit-specify

在 worktree 根目录执行。

1. 质量门禁：

   ```bash
   pnpm format && pnpm check
   ```

   预期：全部通过。

2. 删除项：

   ```bash
   grep -nE 'ask_user_question|/speckit-|before_specify' AGENTS.md
   ```

   预期：无输出。

3. 开发流程首句与步骤表：

   ```bash
   grep -n '立刻' AGENTS.md
   grep -n '^| 1 |' AGENTS.md
   ```

   预期：
   - 第一条输出「在用户给出需求、缺陷或其他变更要求时，**立刻**获取 skill `speckit-specify` 的内容，并按流程推进。」
   - 第二条输出 `` | 1 | `speckit-specify` | 必做 | ``。

4. 实际行为：在新会话中提出一个变更要求。

   预期：Agent 第一个动作为获取 skill `speckit-specify`，期间不询问是否走流程。
