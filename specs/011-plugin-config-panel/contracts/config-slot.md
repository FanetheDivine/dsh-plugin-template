# Contract: 配置插槽与热重载

## 浏览器侧：`plugins.row.config`

```ts
ctx.slots.inject('plugins.row.config', () =>
  ctx.slots.register(
    { name: 'plugins.row.config', key: '<包名>#<行 id>', locale: NS, inject: () => form.inject() },
    ConfigPage,
  ),
);
```

| 项 | 约定 |
| --- | --- |
| 键 | `<包名>#<行 id>`；行 id 取 `cordis.patch.yml` 中的 `id` |
| owner props | `view: 'summary' \| 'page'`，`form` 为页面静态快照，模板不使用 |
| `summary` | 返回一行文字，作为页头描述缺省时的回退 |
| `page` | 返回表单；保存区由 `SettingsForm` 提供 |
| 生命周期 | 随插件前端注册，插件禁用后配置入口消失 |

同族插槽：

| 插槽 | 键 | 用途 |
| --- | --- | --- |
| `plugins.bundle.config` | 包名 | bundle 详情页内的配置，只渲染 `page` |
| `plugins.row.config` | `<包名>#<行 id>` | 某一行的配置页 |
| `plugins.item` | 无，用 `id` 与 `label` | 官方内置插件，不供第三方使用 |

## 宿主机侧：`Config`

```ts
export interface Config { demoEnabled: Volatile<boolean>; prefix: Volatile<string> }
export const Config = Schema.object({
  demoEnabled: Schema.boolean().default(true).volatile(),
  prefix: Schema.string().default('demo').pattern(/\S/).volatile(),
});
```

| 项 | 约定 |
| --- | --- |
| 表单暴露 | 只有 `.volatile()` 字段出现在面板表单 |
| 读取 | `config.prefix.get()`，每次操作读取，不缓存 |
| 通知 | 字段变化后触发 `loader/volatile-update`，载荷为变化路径 |
| 普通字段 | 变化会重启插件，不出现在表单 |
