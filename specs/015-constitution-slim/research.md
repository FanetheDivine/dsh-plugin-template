# Research: 宪章精简

## R1 原则 I 宿主依赖版本的范围

- Decision：原则 I 覆盖 `package.json` 中全部 `@deepseek-ai/*` 依赖，以同版本 `@deepseek-ai/dsh` 为准：
  - `@deepseek-ai/dsh-*` 子包的版本号与 `@deepseek-ai/dsh` 相同，全部锁定为同一确切版本。
  - cordis 子包与其他 `@deepseek-ai/*` 依赖沿用该版本 `@deepseek-ai/dsh` 在 `dependencies` 中声明的版本或范围。
  - 每个 `@deepseek-ai/dsh-*` 依赖以 `<包名>@<版本>` 列入 `minimumReleaseAgeExclude`。
- Rationale：
  - 用户确认「一切 cordis 与 dsh 子包以同版本 `@deepseek-ai/dsh` 为准」。
  - `@deepseek-ai/dsh@0.2.2-rc.3` 声明 `@deepseek-ai/cordis ~4.1.0`、`@deepseek-ai/cordis-plugin-loader ~1.1.0`、`@deepseek-ai/schemastery ~3.19.0`，与模板现状一致。
  - 模板用到的 `dsh-*` 子包多数不在 `@deepseek-ai/dsh` 的直接依赖中，版本号统一按 `@deepseek-ai/dsh` 的版本号。
- Alternatives considered：只约束 `dsh-*` 子包。cordis 子包会与宿主错位，被否决。

## R2 被移出原则的归属

| 原原则 | 归属文档 | 处理 |
| --- | --- | --- |
| I 宿主契约 | `docs/how-it-works.md`「入口契约」 | 补齐 `inject` 完整、`.volatile()`、type-only 导入三条 |
| II 依赖归属 | `docs/how-it-works.md`「依赖复用」 | 写入两类依赖的归属与打包规则 |
| III 严格配置 | `docs/how-it-works.md`「配置解析」 | 写入四条解析规则 |
| VII 模板定位 | 新增 `docs/template-conversion.md` | 变更类别、模板变更要求、模板转化步骤 |
| IX 国际化 | `docs/i18n.md` 新增「约束」节 | 写入原原则全部条目，删除指向宪章的首行 |

- Rationale：原则 V 要求每条信息只有一个归属。宿主契约、依赖归属、严格配置描述插件的构造方式，属于 how-it-works 的范围。
- Alternatives considered：依赖归属放 `docs/development.md`。该文档讲本地开发与命令，依赖复用的现有说明已在 how-it-works，被否决。
- `minimumReleaseAgeExclude` 规则留在宪章原则 I，`docs/known-risks.md` 链接原则 I。

## R3 模板转化文档与 AGENTS 特别说明

- Decision：
  - 新增 `docs/template-conversion.md`，读者是把模板改造成插件的开发者与 Agent。
  - `AGENTS.md` 新增「模板说明」节：本仓库是模板；spec 声明变更类别；模板转化前先读该文档。
  - `AGENTS.md` 文档索引列出该文档。
- Rationale：用户确认「新文档，写到 AGENTS 特别说明」。变更类别在每个需求中都要声明，Agent 需要在会话开始时看到。
- 文档中的步骤顺序与原原则 VII 一致。依赖升级确认引用宪章原则 I 与原则 II。

## R4 编号引用的同步

重新编号：I 宿主依赖版本、II 测试同步、III 文档结构、IV 质量门禁、V 公开引用。

| 位置 | 原引用 | 新引用 |
| --- | --- | --- |
| `docs/development.md` 测试节 | 原则 IV | 原则 II |
| `docs/development.md` CI 节 | 原则 VII | `docs/template-conversion.md` |
| `docs/how-it-works.md` 配置解析 | 原则 III | 本节内容 |
| `docs/how-it-works.md` 依赖复用 | 原则 II | 本节内容，版本规则链接原则 I |
| `docs/known-risks.md` 安装 rc 依赖 | 原则 II | 原则 I |
| `docs/known-risks.md` 共享宿主实例 | 原则 II | how-it-works「依赖复用」 |
| `docs/i18n.md` 首行 | 原则 IX | 删除 |
| `.github/workflows/ci.yml` 注释 | 原则 VII | `docs/template-conversion.md` |
| worktree 扩展源与渲染 skill | principle V | principle III |

- 本机未安装 `specify` CLI。扩展源 `commands/speckit.worktree.finish.md` 与 `.dsh/skills/speckit-worktree-finish/SKILL.md` 正文相同，两处做同样的修改，并核对正文一致。
- 历史 `specs/`、`changelogs/` 与 CHANGELOG 已有条目保持不变。

## R5 回归测试

- Decision：新增 `tests/dependency-versions.test.ts`，属于 `code` project：
  - 全部 `@deepseek-ai/dsh-*` 依赖版本为同一确切版本，不含范围符号。
  - 每个 `@deepseek-ai/dsh-*` 依赖在 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 中有 `<包名>@<版本>` 条目。
  - `minimumReleaseAgeExclude` 中的 `@deepseek-ai/dsh-*` 条目都对应一个依赖。
- Rationale：测试不联网，cordis 子包与 `@deepseek-ai/dsh` 声明的比对在升级时人工核对。
- `pnpm-workspace.yaml` 结构简单，按行解析列表项，无需新增依赖。

## R6 宪章版本

- Decision：`1.9.0` → `2.0.0`，Ratified 保持 `2026-11-17`，Last Amended 为 `2026-11-18`。
- Rationale：删除与重新定义原则属于 MAJOR。
- Sync Impact Report 沿用仓库现有做法，保留在文件顶部。
