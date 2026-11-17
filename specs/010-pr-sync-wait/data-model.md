# Data Model: 交付流程的基线同步与无上限等待

## 基线同步结果

`sync-baseline.sh` 的产出。字段与 JSON 输出一一对应。

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `BRANCH` | string | 当前分支名 |
| `BASE_REF` | string | 合入的来源，固定为 `origin/main` |
| `BASE_COMMIT` | string | 拉取后 `origin/main` 的提交 |
| `MERGED` | boolean | 本次是否产生了合入提交 |
| `INSTALLED` | boolean | 是否运行了依赖安装 |
| `SYNCED` | boolean | 分支已包含 `BASE_REF`，可以推送 |

状态转移：

1. 拉取失败 → 退出码 `1`，工作区不变。
2. `BASE_REF` 已是当前分支的祖先 → `MERGED=false`、`SYNCED=true`，不安装依赖。
3. 合入成功 → `MERGED=true`，运行依赖安装，`INSTALLED=true`、`SYNCED=true`。
4. 合入冲突 → 退出码 `3`，冲突文件保留在工作区，`SYNCED=false`。

## 交付等待

后台任务的终止条件。

| 状态 | 触发条件 | 后续动作 |
| --- | --- | --- |
| `MERGED` | PR 已合并 | 清理 |
| `CLOSED` | PR 关闭且未合并 | 停止，报告，不清理 |
| `CONFLICTING` | 可合并性为 `CONFLICTING` | 同步基线，重推，重新等待 CI 与评论及合并 |
| `FEEDBACK` | 有新评论或 `reviewDecision` 为 `CHANGES_REQUESTED` | 判断是否有缺陷，按需同步基线后修复，重推，重新等待 |
| `CI_FAILED` | 检查全部结束且有失败项 | 修复，重推，重新等待 |
| `CI_PASSED` | 检查全部通过 | 进入评论与合并等待 |

约束：

- 同一时刻只有一个等待任务。
- 等待任务没有时间上限。
- `MERGED` 优先于其他状态：反馈与合并同时命中时按合并处理。

## 交付阶段顺序

```text
质量门禁 → CHANGELOG → 基线同步 → 提交 → 推送并创建 PR
  → 等待 CI（无上限）→ 等待评论/冲突/合并（无上限）
  → 冲突或缺陷 → 回到基线同步 → 等待 CI → 等待评论/冲突/合并
  → MERGED → 清理
```
