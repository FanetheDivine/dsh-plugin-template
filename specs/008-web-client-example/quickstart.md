# Quickstart: 前端示例

## 前置

- Node.js 24.9 及以上，pnpm 11。
- 依赖已安装：`pnpm i`。

## 构建与检查

```sh
pnpm build
pnpm check
```

预期：

- `dist/index.mjs`、`dist/client.js`、`dist/index.d.ts` 存在。
- `dist/client.js` 以 `window.__ModuleLoader__.load({ id: "dsh-plugin-template"` 开头。
- `pnpm check` 全部通过。

## 本地加载

1. 运行 `pnpm dev`。
2. 在 profile 的 `cordis.patch.yml` 加入插件行，指向 `file:///<repo>/dist/index.mjs`。
3. 运行宿主，打开 Web GUI，进入任一会话。

## 验收

| 步骤 | 预期 |
| --- | --- |
| 进入会话 | 输入区上方出现示例行，中文界面显示「模板前端已加载」 |
| 切换宿主语言为英文 | 示例行显示「Template frontend loaded」 |
| 点击行内按钮 | 计数从 0 递增 |
| 禁用插件并刷新页面 | 示例行消失 |
| 展开控制台 | 无模块解析错误 |

## 实机回归

```sh
bash .dsh/skills/real-device-test/scripts/setup-env.sh <repo> [profile名]
cd <profile目录> && node run-test.mjs
eval $(bash .dsh/skills/real-device-test/scripts/gui-up.sh <profile名>)
node .dsh/skills/real-device-test/scripts/browser-test.mjs
```

浏览器用例 C3 断言示例行出现、点击计数递增，截图写入 profile 的 `shots/`。