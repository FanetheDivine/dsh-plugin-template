# Contract: 包清单与元数据资源

宿主在不激活插件的前提下读取插件标题与描述，依据是 `package.json` 的声明与导出的 locale JSON。

## 清单声明

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs" },
    "./client": { "types": "./dist/client/index.d.ts", "default": "./dist/client.js" },
    "./locale/*.json": "./locale/*.json"
  },
  "files": ["dist", "cordis.patch.yml", "locale/*.json", "README.md"]
}
```

- `exports` MUST 暴露 `./locale/*.json`，否则宿主读不到元数据。
- `files` MUST 覆盖全部 `locale/*.json`，否则发布包缺文件。
- 既有导出 MUST 保留。

## 资源文件

```json
{
  "meta": {
    "title": "插件模板",
    "description": "示例说明"
  }
}
```

- 文件名 MUST 为 `<语言 id>.json`，与宿主内置语言 id 一致。
- `meta.title` 与 `meta.description` MUST 为非空字符串。
- 文件 MUST 是合法 JSON，用 UTF-8 编码。
- 可选 `meta.detail` 指向包内 `.md` 文档；本模板不声明，详情页回落 `README.md`。

## 读取语义

| 情况 | 宿主行为 |
| --- | --- |
| 当前语言有资源文件 | 使用该文件的 `meta.title` 与 `meta.description` |
| 当前语言无资源文件 | 按语言回退链取下一份，最终回落 `en` |
| 资源文件缺 `meta.title` 或 `meta.description` | 回落到 `package.json` 的 `name` 与 `description` |
| 资源文件缺失或非法 | 显示诊断信息，插件其余功能不受影响 |

## 前端字典（对照）

- 组件文案 MUST 经 `ctx.locale.register(namespace, { zh, en })` 注册，`en` 与 `zh` 同时存在。
- 槽位注册 MUST 传 `locale: namespace`，组件通过注入的 `t` 取文案。
- 字典与元数据 MUST 使用同一语言集合，或显式接受某语言只有其一。
