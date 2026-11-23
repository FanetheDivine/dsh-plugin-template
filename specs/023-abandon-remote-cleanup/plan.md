# Implementation Plan: 放弃模式关闭 PR 并清理远程分支

**Branch**: `feat/023-abandon-remote-cleanup` | **Date**: 2026-11-23 | **Spec**: [spec.md](./spec.md)

**Status**: Waived

**变更类别**: 模板变更

## Open Decisions

无。

## Clarifications

- 规格阶段的决策见 [spec.md](./spec.md#澄清记录)。
- [P-001] 问：墓碑放在哪里？ → 答：远程 `refs/tags/abandoned/<分支名>`，指向被删除的分支头。
- [P-002] 问：编号逻辑读什么？ → 答：`create-worktree.sh` 读 base ref 的 `specs/`、主工作区 `specs/`、本地与远程跟踪分支；占号后用 `git ls-remote` 校验。墓碑加入这两处来源。

## Review Record

- 2026-11-23：任务指令要求自行实现、PR 与合并。 | Decision: Waived | Scope: current full document | Open items: none | Risks: 默认删除远程分支；墓碑 tag 积累在远程

## Summary

- `spec-number-lib.sh` 新增 `remote_spec_refs`：从 `git ls-remote --heads --tags` 输出提取分支名与 `abandoned/*` 墓碑名。
- `create-worktree.sh`：
  - fetch 用显式 refspec 同步分支与 `refs/tags/abandoned/*`。
  - 初始算号读取 `refs/tags/abandoned`。
  - 占号校验读取墓碑；同号墓碑存在时改号。
- `check-spec-number.sh`：同号墓碑列为冲突。
- `finish-worktree.sh --abandon`：
  - 删除 worktree 与本地分支后，用 `gh pr list --head` 查 open PR 并 `gh pr close --comment`。
  - `git push --atomic origin +<sha>:refs/tags/abandoned/<branch> :refs/heads/<branch>`。
  - 失败记入 `WARNINGS` 并继续。
  - `--keep-remote` 跳过以上两步。
- 文档与测试同步。

## Constitution Check

| 原则 | 结论 |
| --- | --- |
| I 宿主依赖版本 | 通过：不改依赖 |
| II 测试同步 | 通过：`tests/worktree-extension.test.ts` 覆盖新行为 |
| III 文档结构 | 通过：更新 finish 命令、skill、`docs/development.md` 与 CHANGELOG |
| IV 质量门禁 | 通过：`pnpm run full-check` |
| V 公开引用 | 通过：无新增外部引用 |
