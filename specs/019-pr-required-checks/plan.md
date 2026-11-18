# Implementation Plan: main 合并门禁

**Branch**: `chore/019-pr-required-checks` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-pr-required-checks/spec.md`

## Summary

把 `main` 的合并门禁落到 GitHub 仓库规则集：PR 合并前 `check` 通过、分支包含最新 `main`、管理员同样受限、直接推送被拒。仓库改动只有 `docs/development.md` 的 CI 说明与 `CHANGELOG.md` 条目，不新增文件。

## Technical Context

**Language/Version**: 无源码变更。本地校验用 Node 24 与 `gh` CLI 2.97.0。

**Primary Dependencies**: GitHub REST API 的仓库规则集端点。

**Storage**: GitHub 仓库设置。

**Testing**: API 读回、PR 合并判定、直接推送被拒。

**Target Platform**: GitHub 公开仓库 `FanetheDivine/dsh-plugin-template`，默认分支 `main`。

**Project Type**: 仓库配置。

**Performance Goals**: 不适用。

**Constraints**: 仓库不新增文件；必需 check 名依赖 `ci.yml` 中 job 的显示名。

**Scale/Scope**: 一个分支 `main`，一个必需 check。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I. 宿主依赖版本 | 通过 | 不改依赖 |
| II. 测试同步 | 通过 | 无 `src/` 与 `tests/` 变更；行为由 [quickstart.md](./quickstart.md) 的真实操作验证 |
| III. 文档结构 | 通过 | 合并机制写入 `docs/development.md` CI 节，CHANGELOG 记录条目 |
| IV. 质量门禁 | 通过 | 提交前运行 `pnpm format && pnpm check` |
| V. 公开引用 | 通过 | 文档只引用仓库内路径与公网 URL |

Phase 1 设计完成后复评：结论不变，无偏离。

## Project Structure

### Documentation (this feature)

```text
specs/019-pr-required-checks/
├── spec.md
├── plan.md
├── research.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

### Repository files

```text
docs/development.md   # CI 节增加 main 门禁说明
CHANGELOG.md          # Unreleased / Changed 增加条目
```

无源码、无新增配置文件。

## 规则集载荷

名称 `main`，目标分支，`enforcement: active`，绑定默认分支，绕过名单为空：

```json
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "Check (typecheck + lint + test:code + build + test:dist)" }
        ]
      }
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    }
  ],
  "bypass_actors": []
}
```

`pull_request` 规则的参数必须全量给出，缺字段返回 422（已实测）。`required_status_checks` 的 `context` 取 PR 上运行的 check 名。

## 实施备注

- `resolve-template.sh` 与 `setup-plan.sh` 依赖 Python 3，当前环境没有。仓库没有模板 override 层，直接使用 `.specify/templates/` 的模板文件。
- 规则集一旦启用，改名 CI job 显示名会让必需 check 永久等待。改名时同步更新规则集。
- 删除规则集是唯一回滚手段，`gh api -X DELETE repos/<owner>/<repo>/rulesets/<id>`。
