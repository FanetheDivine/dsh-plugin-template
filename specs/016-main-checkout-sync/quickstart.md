# Quickstart: 主工作区约束与 main 同步

## 自动验证

```bash
pnpm format && pnpm check
```

`tests/sync-main.test.ts` 覆盖 [contracts/sync-main.md](./contracts/sync-main.md) 的全部退出码与以下场景：

| 场景 | 预期 |
| --- | --- |
| 本地 `main` 落后 | 退出 0，`UPDATED=true`，`MAIN_COMMIT` 等于 `origin/main` |
| 已同步 | 退出 0，`UPDATED=false` |
| 只有被忽略的文件 | 退出 0 |
| 在 feature worktree 内运行 | 主工作区被同步 |
| 不在 `main` | 退出 2，主工作区不变 |
| 有未跟踪文件 | 退出 2，主工作区不变 |
| 本地 `main` 有额外提交 | 退出 2，本地提交保留 |
| origin 不可达 | 退出 1 |
| 脚本在执行中被 `git pull` 改写 | 退出 0，输出来自原脚本 |

## 文档验证

1. 只读 `AGENTS.md`，能列出主工作区的四条约束。
2. 宪章版本仍为 `2.0.0`，不含主工作区条目。
3. `/speckit-worktree-create` 在创建 worktree 前运行 `sync-main.sh`，失败时停止。
4. `/speckit-worktree-finish` 在两种模式的清理后运行 `sync-main.sh`，失败时报告原因。
5. `.dsh/skills/speckit-worktree-*/SKILL.md` 去掉 front matter 后与对应命令正文一致。

## 手工验证

在主工作区运行：

```bash
.specify/extensions/worktree/scripts/bash/sync-main.sh --json
```

预期退出 0，`MAIN_COMMIT` 等于 `git rev-parse origin/main`。
