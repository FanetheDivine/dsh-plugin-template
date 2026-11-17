# Quickstart: 验证文档归属

## 前置

在仓库根目录，`main` 分支。

## 场景

| # | 操作 | 预期 |
| --- | --- | --- |
| 1 | 只读 `AGENTS.md` | 能回答「需求从哪条命令开始」与「完整流程在哪里」，流程相关内容不超过 3 行 |
| 2 | 读宪章「开发流程」节，逐条对照 `git show 1f6d4e1:AGENTS.md` 的原流程节 | 每条规则都在宪章中出现，clarify 只有一种执行条件，基线写为 `base_ref` |
| 3 | 读宪章原则 V | 看到五类文档的读者、归属内容、引用关系与禁止复述规则 |
| 4 | 读宪章 Governance | 看到优先级与冲突提示规则 |
| 5 | 按 [data-model.md](./data-model.md) 的「待清理副本」逐项检查 | 每项都已处理 |
| 6 | 对比 worktree-finish 扩展源与渲染产物去掉 frontmatter 后的正文 | 输出 `BODY_SAME`，且 CHANGELOG 步骤引用宪章 |
| 7 | 运行 `pnpm format && pnpm check` | 全部通过 |

场景 6 的命令：

```sh
strip(){ awk 'NR==1&&/^---/{f=1;next} f&&/^---/{f=0;next} !f' "$1" | tr -d '\r'; }
diff <(strip .specify/extensions/worktree/commands/speckit.worktree.finish.md) \
     <(strip .dsh/skills/speckit-worktree-finish/SKILL.md) && echo BODY_SAME
```
