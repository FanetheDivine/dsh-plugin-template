# Quickstart: 验证 main 合并门禁

**Feature**: `specs/019-pr-required-checks/spec.md` | **Date**: 2026-11-19

前置条件：

- 已登录的 `gh` CLI，对 `FanetheDivine/dsh-plugin-template` 有管理员权限。
- 规则集 `main` 已应用，见 [plan.md](./plan.md#规则集载荷)。

## 1 读回规则

```bash
gh api repos/FanetheDivine/dsh-plugin-template/rulesets \
  --jq '.[] | select(.name=="main") | {id,enforcement}'
gh api repos/FanetheDivine/dsh-plugin-template/rulesets/<id> \
  --jq '{rules: [.rules[].type], bypass: .bypass_actors, strict: (.rules[] | select(.type=="required_status_checks") | .parameters.strict_required_status_checks_policy), checks: [.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context]}'
```

预期：`enforcement` 为 `active`；规则含 `required_status_checks` 与 `pull_request`；`bypass` 为空数组；`strict` 为 `true`；`checks` 等于 `Check (typecheck + lint + test:code + build + test:dist)`。

## 2 check 未通过时不能合并

```bash
gh pr view <number> --json mergeStateStatus,statusCheckRollup --jq '{mergeStateStatus, checks: [.statusCheckRollup[] | {name, conclusion}]}'
```

预期：check 未完成或失败时 `mergeStateStatus` 为 `BLOCKED`；`gh pr merge <number> --squash` 返回非零。

## 3 分支落后时不能合并

在旧基线的 PR 上执行合并。

预期：`mergeStateStatus` 为 `BEHIND`，合并被拒。

## 4 直接推送被拒

```bash
git clone git@github.com:FanetheDivine/dsh-plugin-template.git <tmp-dir>/protection-check
cd <tmp-dir>/protection-check
git commit --allow-empty -m "probe: direct push"
git push origin main
```

预期：推送被拒，提示受保护分支。推送被拒不会改动远端。

## 5 正常 PR 仍可合并

在包含最新 `main`、check 通过的 PR 上合并。

预期：合并成功，`main` 前进到 PR 的合并提交。

## 6 回滚

```bash
gh api -X DELETE repos/FanetheDivine/dsh-plugin-template/rulesets/<id>
```

预期：`gh api repos/FanetheDivine/dsh-plugin-template/rulesets` 不再返回规则集，`main` 恢复无保护。
