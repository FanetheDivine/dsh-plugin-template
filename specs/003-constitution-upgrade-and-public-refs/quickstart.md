# Quickstart: 验证本次变更

在 worktree 根目录执行。

## 1. 质量门禁

```bash
pnpm format && pnpm check
```

预期：全部通过。

## 2. 宪章内容

打开 `.specify/memory/constitution.md`：

- 原则 VII 的模板转化步骤含 dsh 依赖升级确认，确认后同步 `minimumReleaseAgeExclude` 并提醒实机测试。
- 原则 VIII「公开引用」列出覆盖范围、禁止项与允许项。
- 版本为 1.5.0，Sync Impact Report 已更新。

## 3. 本机引用扫描

```bash
git grep -nE '[A-Za-z]:[\\/](Git|Users)|/(c|d)/(Git|Users)|AppData' -- . ':!specs/003-constitution-upgrade-and-public-refs/quickstart.md'
```

预期：无输出。命令本身含扫描模式，因此排除本文件。

## 4. AGENTS.md

开发流程节写明「仓库内的任何变更都按照 Spec Kit 流程进行开发」。
