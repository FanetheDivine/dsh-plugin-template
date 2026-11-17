---
name: release
description: 发布新版本到 npm，并跟踪 CI 直到新版本上线。用户要求发布或发版时使用。
disable-model-invocation: true
---

# release

在 `main` 分支的主工作区执行。

1. 同步代码：

   ```sh
   git pull
   pnpm i
   ```

2. 确认 `CHANGELOG.md` 的 `## Unreleased` 下有待发布条目。没有条目时停止，请用户补充。
3. 运行 `pnpm run release`。脚本依次完成：
   1. `pnpm check` 与 `pnpm format`。
   2. `npm version patch`，升级版本并打 tag。
   3. 把 CHANGELOG 归档到 `changelogs/`。
   4. push 分支与 tag。
4. 跟踪 CI：

   ```sh
   gh run list --limit 3
   gh run watch <run-id> --exit-status
   ```

5. 确认 npm 上的版本与 `package.json` 一致：

   ```sh
   npm view dsh-plugin-template version
   ```

6. 向用户汇报：
   - 新版本号与 tag。
   - CI 结果与链接。
   - npm 版本核对结果。

## 失败处理

| 现象 | 处理 |
| --- | --- |
| `pnpm check` 失败 | 停止发布，报告错误。版本号尚未改动 |
| push 失败 | 报告错误，请用户确认远程权限后重试 `git push && git push --tags` |
| CI 的 publish 失败 | 报告日志。常见原因是 npm 的 Trusted Publisher 没有绑定本仓库 |
| npm 版本未更新 | npm 同步有延迟，等待一分钟后重查 |
