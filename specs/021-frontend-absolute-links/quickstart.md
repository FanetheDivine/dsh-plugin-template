# Quickstart: 验证前端 UI 链接规则

## 前置

- Node.js 24.9 及以上，pnpm 11。
- 在 worktree 根目录执行。

## 步骤

1. 运行 `pnpm format`。
2. 运行 `pnpm check`。
3. 打开 `docs/development.md` 的「前端 UI 链接」小节，核对三项内容：
   - `a` 标签的 `href` MUST 使用完整 URL；
   - Desktop 下相对链接打不开目标的原因；
   - 完整 URL 的写法示例。
4. 核对 `git diff` 只含 `docs/development.md` 与本次 spec 产物。

## 期望结果

- 质量门禁通过。
- 改动不含前端代码与 `dist` 产物。

## 可选实机检查

1. 在 `src/client/demo-dock.tsx` 临时加一个完整 URL 的 `a` 标签。
2. 构建后在 Desktop 中点击该链接，确认打开目标页面。
3. 还原临时改动，不提交。
