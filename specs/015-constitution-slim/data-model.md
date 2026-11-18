# Data Model: 宪章精简

## 宪章原则 2.0.0

| 编号 | 名称 | 来源 |
| --- | --- | --- |
| I | 宿主依赖版本 | 原原则 I、II 中的版本与 `minimumReleaseAgeExclude` 规则，按用户确认改写 |
| II | 测试同步（不可协商） | 原原则 IV |
| III | 文档结构 | 原原则 V |
| IV | 质量门禁 | 原原则 VI |
| V | 公开引用 | 原原则 VIII |

## 规则迁移表

| 原规则 | 归属 |
| --- | --- |
| `src/index.ts` 只导出 `name`、`inject`、`apply`、`Config` | how-it-works「入口契约」 |
| `Config` 声明 schema，热重载字段用 `.volatile()` | how-it-works「入口契约」 |
| `name` 与 `cordis.patch.yml` 的 `id` 一致 | how-it-works「入口契约」 |
| `inject` 列出 `apply` 用到的全部宿主服务 | how-it-works「入口契约」 |
| 宿主类型经 `src/types.ts` type-only 导入 | how-it-works「入口契约」 |
| 版本以 `@deepseek-ai/dsh` 最新发布为准 | 删除 |
| 无对应版本的 `@deepseek-ai/*` 依赖移除 | 删除 |
| 新增依赖在 plan 中声明归属 | how-it-works「依赖复用」 |
| 宿主自带依赖放 `devDependencies`，`neverBundle` 保持 external | how-it-works「依赖复用」 |
| 宿主未提供的依赖放 `dependencies`，列入 `alwaysBundle`，package-pack 回归 | how-it-works「依赖复用」 |
| 新增 `@deepseek-ai/dsh-*` 加入 `minimumReleaseAgeExclude` | 宪章原则 I |
| 严格配置四条 | how-it-works「配置解析」 |
| 变更类别、模板变更要求、模板转化步骤 | `docs/template-conversion.md` |
| 国际化八条 | i18n「约束」 |
