# Contract: 浏览器模块

插件交给宿主 Web GUI 的前端契约。文中 `<包名>` 指 `package.json` 的 `name`。

## 包清单

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./client": { "types": "./dist/client/index.d.ts", "default": "./dist/client.js" }
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-ui-renderer"
      ]
    }
  }
}
```

| 字段 | 约束 |
| --- | --- |
| `platform` | `web`；宿主只在该平台加载 |
| `inject` | 宿主客户端包名，用于工厂到达与插件组合 |
| `exports["./client"]` | 浏览器产物路径；宿主按包名取用 |

## 产物格式

```js
window.__ModuleLoader__.load({
  id: '<包名>',
  factory(require) {
    // 模块体
    return { inject: ['slots', 'locale'], apply(ctx) { /* ... */ } };
  },
});
```

| 约束 | 说明 |
| --- | --- |
| 模块体副作用 | 全部位于 `factory` 内，执行注册脚本时不渲染 |
| `id` | 必须等于包名 |
| 导出 | `inject` 与 `apply` |
| `require` | 只请求平台种子；其余模块内联 |

## 注册

```ts
ctx.effect(() => ctx.locale.register('dsh-plugin-template', { zh, en }), 'demo dictionary');
ctx.slots.inject('conversation.composer.dock', () =>
  ctx.slots.register(
    { name: 'conversation.composer.dock', id: 'demo', order: 5, locale: 'dsh-plugin-template' },
    DemoDock,
  ),
);
```

| 约束 | 说明 |
| --- | --- |
| 注册位置 | 全部在 `apply` 内，随插件卸载释放 |
| 槽位 | `conversation.composer.dock`，类型 `list`，作用域 `session`，无 owner props |
| 文案 | 通过 `locale` 座位取字典；键集由 `LocaleNamespaceMap` 合并约束 |
| 样式 | 只引用 `--dsw-*` 主题令牌与行内样式 |