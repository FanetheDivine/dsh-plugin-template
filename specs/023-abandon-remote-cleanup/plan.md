# Implementation Plan: 放弃模式关闭 PR 并删除远程分支

**Branch**: `feat/023-abandon-remote-cleanup` | **Date**: 2026-11-23 | **Spec**: [spec.md](./spec.md)

**Status**: Waived

**变更类别**: 模板变更

## Open Decisions

无。

## Review Record

- 2026-11-23：任务指令要求自行实现、PR 与合并。 | Decision: Waived | Scope: current full document | Open items: none | Risks: 被放弃的编号可能被后续 spec 复用

## Summary

- `finish-worktree.sh` 放弃模式在删除本地分支后：
  - `gh pr list --head <branch> --state open --json number --jq '.[].number'`，逐个 `gh pr close`。
  - `git ls-remote --heads origin <branch>` 存在时 `git push origin --delete <branch>`。
  - 失败记入 `WARNINGS`，最后以 5 退出。
- JSON 增加 `PR_CLOSED` 与 `WARNINGS`；`REMOTE_DELETED` 在放弃模式反映实际结果。
- 编号脚本保持原样。
- 同步 finish 命令、skill、`docs/development.md` 与 CHANGELOG。

## Constitution Check

| 原则 | 结论 |
| --- | --- |
| I 宿主依赖版本 | 通过：不改依赖 |
| II 测试同步 | 通过：`tests/worktree-extension.test.ts` 覆盖新行为 |
| III 文档结构 | 通过：更新 finish 命令、skill、`docs/development.md` 与 CHANGELOG |
| IV 质量门禁 | 通过：`pnpm run full-check` |
| V 公开引用 | 通过：无新增外部引用 |
