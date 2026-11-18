# Research: main 合并门禁

**Feature**: `specs/019-pr-required-checks/spec.md` | **Date**: 2026-11-19

## D1 承载方式：仓库规则集

- **决定**：新建仓库规则集，`target: branch`，绑定默认分支，`enforcement: active`。
- **理由**：规则集是 GitHub 当前的推荐机制，一个对象承载全部合并条件；经典分支保护需要多个字段，且与规则集并存时判定复杂。
- **备选**：经典分支保护 `PUT /branches/main/protection`；功能相同，作为规则集不可用时的回退。
- **备选**：组织级规则集；本仓库是个人账户下的公开仓库，没有组织层。

## D2 必需检查的来源

- **决定**：`required_status_checks` 的 `context` 取 `ci.yml` 中 `check` job 的显示名 `Check (typecheck + lint + test:code + build + test:dist)`。
- **理由**：PR 上只有这一个 job 运行；`publish` job 由 `if: false` 禁用，只在 tag 上运行，不参与 PR。
- **备选**：规则集的 required workflow 规则，直接要求整个 `ci.yml` 通过；个人公开仓库的可用性未验证，先不采用。
- **风险**：job 显示名变化后必需 check 永远等不到。实测验证放在 [quickstart.md](./quickstart.md)。

## D3 分支最新

- **决定**：`strict_required_status_checks_policy: true`。
- **理由**：检查针对即将进入 `main` 的最终内容运行。

## D4 管理员受限

- **决定**：`bypass_actors: []`。
- **理由**：需求要求管理员同样受限。管理员仍可编辑或删除规则集本身，这是仓库级设置的边界。

## D5 直接推送被拒

- **决定**：加 `pull_request` 规则，`required_approving_review_count: 0`。
- **理由**：仅靠 `required_status_checks` 不保证拦截直接推送；`pull_request` 规则要求改动经 PR 进入，同时满足「不要求评审」。
- **实测**：`pull_request` 规则必须给出全部参数，缺字段返回 422；不带参数可创建，但语义不明。全量参数已验证可创建。

## D6 应用与幂等

- **决定**：先按名称查询规则集；存在则 `PUT /rulesets/<id>`，不存在则 `POST /rulesets`；随后读回校验。
- **理由**：重复执行得到同一状态。
- **命令**：`gh api -X POST repos/FanetheDivine/dsh-plugin-template/rulesets --input <payload>`。

## D7 回滚

- **决定**：删除规则集 `DELETE /rulesets/<id>`。
- **理由**：规则集是独立对象，删除后 `main` 恢复无保护状态，不留残余字段。

## D8 环境限制

- **决定**：Spec Kit 的 `resolve-template.sh` 与 `setup-plan.sh` 依赖 Python 3，本机没有；直接使用 `.specify/templates/` 的基础模板。
- **理由**：仓库没有 preset 或模板 override 层，基础模板就是最终模板。
