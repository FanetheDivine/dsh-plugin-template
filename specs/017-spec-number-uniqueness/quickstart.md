# Quickstart: 验证 spec 编号唯一性

## 前置条件

- 仓库已配置 `origin`，当前主工作区在 `main` 且干净。
- 已安装 pnpm 与 node。
- 测试用临时目录记为 `<tmp>`，仓库副本记为 `<repo-a>`、`<repo-b>`。

## 准备两个克隆

```bash
git clone <origin-url> <repo-a>
git clone <origin-url> <repo-b>
```

## 场景 1：创建后远程可见

在 `<repo-a>` 执行：

```bash
.specify/extensions/worktree/scripts/bash/create-worktree.sh --json --type fix --short-name claim-a
```

预期：

- JSON 的 `CLAIMED` 为 `true`。
- `git ls-remote --heads origin` 含 `<type>/<NNN>-claim-a`。

在 `<repo-b>` 执行同一命令，`--short-name claim-b`。预期编号大于 `<repo-a>` 的编号。

## 场景 2：本机未 fetch 仍避让

1. 在 `<repo-b>` 创建并推送分支后，`<repo-a>` 不执行 `fetch`。
2. 在 `<repo-a>` 执行 `create-worktree.sh --json --type fix --short-name no-fetch`。

预期：编号大于 `<repo-b>` 已推送的编号。

## 场景 3：同号冲突自动改号

1. 在 `<repo-b>` 推送 `fix/003-alpha`。
2. 在 `<repo-a>` 用 `--no-fetch` 创建 `--short-name zeta`，使其先算出 003。

预期：

- 结果编号为 004。
- `git ls-remote --heads origin` 含 `fix/003-alpha` 与 `fix/004-zeta`。
- 远程不含 `fix/003-zeta`。

## 场景 4：占号失败中止

在 `<repo-a>` 把 `origin` 指向不可达路径，再执行 `create-worktree.sh --json --no-fetch --type fix --short-name offline`。

预期：

- 退出码非 0，stderr 说明推送失败。
- `worktrees/` 下没有新目录。
- `git branch --list` 不含新分支。

## 场景 5：交付前校验

1. 在已有 spec 的 worktree 内推送同号分支，模拟另一名开发者的占号。
2. 执行 `check-spec-number.sh --json`。

预期：退出码 4，`CONFLICTS` 列出同号分支；没有冲突时退出码 0、`UNIQUE` 为 `true`。

## 自动化验证

```bash
pnpm test:code -- tests/worktree-extension.test.ts
pnpm format && pnpm check
```

测试覆盖占号、过期引用避让、自动改号、失败回滚与交付前校验。
