# Quickstart: 前端服务可选

## 前置

```bash
pnpm install
```

## 验证

1. 单元测试：

   ```bash
   pnpm run test:code -- tests/client.test.ts
   ```

   期望：服务组合、晚就绪、撤掉用例全部通过。

2. 全量检查：

   ```bash
   pnpm format && pnpm check
   ```

   期望：通过。

3. 构建与产物测试：

   ```bash
   pnpm build
   ```

   期望：`dist/client.js` 生成，产物测试通过。

## 实机核对

按 [real-device-test](../.dsh/skills/real-device-test/SKILL.md) 在真实宿主验证：

1. 打开 Web GUI，会话输入区上方显示示例行。
2. 打开“插件”页，模板行的配置页正常渲染并可保存。
3. 宿主未加载 `dsh-client-ui-settings` 时，示例行仍显示，配置页不出现，插件不报错。
