# Research: AGENTS.md 立即触发 speckit-specify

## R1 Agent 延迟进入 speckit-specify 的原因

- Decision：按用户给出的四处修改调整 `AGENTS.md`。
- Rationale：

| 原因 | 对应修改 |
| --- | --- |
| 开发流程节只描述流程，缺少触发时机与第一个动作 | 首句改为立刻获取 skill `speckit-specify` |
| `/speckit-*` 是斜杠命令写法，Agent 理解为由用户触发 | skill 名去除前导斜杠 |
| 「优先通过ask_user_question和用户交互」鼓励先提问 | 删除该句 |
| 钩子细节让 Agent 预期建分支与 worktree 等副作用，倾向先确认 | 删除钩子说明 |

- Alternatives considered：修改 `speckit-specify` 的 `description` 提高匹配率。该文件由 spec-kit 生成，升级时会被覆盖。

## R2 钩子说明的归属

- Decision：从 `AGENTS.md` 删除。
- Rationale：
  - `speckit-specify` 的 Pre-Execution Checks 读取 `.specify/extensions.yml` 并执行 `before_specify` 钩子。
  - 钩子注册在 `.specify/extensions.yml`，为 `optional: false`。
  - 按宪章原则 V，`AGENTS.md` 不复述其他位置已归属的规则。
- Alternatives considered：保留并改为链接。Agent 调用 skill 即执行钩子，链接无额外价值。
