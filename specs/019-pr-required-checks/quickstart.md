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
  --jq '{rules: [.rules[].type], bypass: [.bypass_actors[]?], strict: (.rules[] | select(.type=="required_status_checks") | .parameters.strict_required_status_checks_policy), checks: [.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context]}'
```

预期：`enforcement` 为 `active`；规则为 `required_status_checks`、`non_fast_forward`、`deletion`；`bypass` 为空；`strict` 为 `true`；`checks` 等于 `Check (typecheck + lint + test:code + build + test:dist)`。

## 2 check 未通过时不能合并

```bash
gh pr view <number> --json mergeStateStatus,statusCheckRollup --jq '{mergeStateStatus, checks: [.statusCheckRollup[] | {name, conclusion}]}'
gh pr merge <number> --squash
```

预期：check 未完成时 `mergeStateStatus` 为 `BLOCKED`，合并命令返回非零。

## 3 分支落后时不能合并

在旧基线的 PR 上执行合并。

预期：`mergeStateStatus` 为 `BEHIND`，合并被拒。

## 4 强推与删除被拒

探测失败不会改动远端。

```bash
git clone git@github.com:FanetheDivine/dsh-plugin-template.git <tmp-dir>/probe
cd <tmp-dir>/probe
git commit --amend --no-edit
git push --force origin main
git push origin --delete main
```

预期：两次推送均被拒，`main` 仍指向原提交。

## 5 普通推送保持可用

用同一组规则绑定临时分支，避免在 `main` 留下探测提交：

```bash
gh api repos/FanetheDivine/dsh-plugin-template/rulesets/<id> > <tmp-dir>/main-rules.json
jq '{name:"probe-push",target,enforcement,rules,bypass_actors,conditions:{ref_name:{include:["refs/heads/probe/push"],exclude:[]}}}' \
  <tmp-dir>/main-rules.json | gh api -X POST repos/FanetheDivine/dsh-plugin-template/rulesets --input - --jq '.id'
```

在克隆里推送普通提交：

```bash
git switch -c probe/push
git commit --allow-empty -m "probe: push allowed"
git push origin probe/push
```

预期：推送成功。随后删除探测规则集与临时分支：

```bash
gh api -X DELETE repos/FanetheDivine/dsh-plugin-template/rulesets/<probe-id>
git push origin --delete probe/push
```

## 6 正常 PR 仍可合并

在包含最新 `main`、check 通过的 PR 上合并。

预期：合并成功，`main` 前进到 PR 的合并提交。

## 7 回滚

```bash
gh api -X DELETE repos/FanetheDivine/dsh-plugin-template/rulesets/<id>
```

预期：`gh api repos/FanetheDivine/dsh-plugin-template/rulesets` 不再返回规则集，`main` 恢复无保护。
