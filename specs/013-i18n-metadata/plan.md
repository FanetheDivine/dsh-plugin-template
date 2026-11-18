# Implementation Plan: 插件元数据国际化与规范

**Branch**: `feat/013-i18n-metadata` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-i18n-metadata/spec.md`

**变更类别**: 模板变更

## Summary

模板补齐插件元数据的国际化，并把国际化约束写进文档与宪章：

- 新增 `locale/zh.json` 与 `locale/en.json`，各含 `meta.title`、`meta.description`；宿主在插件未激活时也能读取。
- `package.json` 增加 `./locale/*.json` 导出与 `locale/*.json` 打包项；打包测试与新增的元数据测试覆盖结构与键集。
- 新增 `docs/i18n.md` 承载全部国际化规范，`AGENTS.md` 索引与 `README.md` 增加入口与一句行为说明。
- 宪章新增原则 IX「国际化」，版本 1.8.0 → 1.9.0。

## Technical Context

**Language/Version**: TypeScript 6；浏览器侧 React 18；JSON 资源文件

**Primary Dependencies**: 宿主提供 `@deepseek-ai/dsh-client-locale`（运行时，external）；本需求不新增依赖

**Storage**: `locale/<语言 id>.json` 随包分发；语言偏好由宿主 locale 服务写入 profile 设置

**Testing**: vitest（node）；`npm pack --dry-run` 回归打包内容；`playwright` 用于实机核对

**Target Platform**: DSH 0.2.2-rc.3 宿主，Web GUI

**Project Type**: DSH 插件 npm 包模板

**Performance Goals**: 切换语言后插件页文案即时切换，无需重载页面

**Constraints**: 基线语言固定 `zh` 与 `en`；元数据不声明 `meta.detail`，详情页回落 `README.md`；资源文件不得含 U+200B 与 U+FEFF

**Scale/Scope**: 新增 2 个资源文件、1 个测试文件、1 份文档；修改 `package.json`、`AGENTS.md`、`README.md`、宪章、打包测试与 CHANGELOG

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主契约 | 通过 | 入口导出不变；元数据由宿主按 `exports` 读取，不经 `src/index.ts` |
| II 依赖归属 | 通过 | 不新增依赖；`dsh-client-locale` 已在 `devDependencies` |
| III 严格配置 | 通过 | 不涉及配置 schema |
| IV 测试同步 | 通过 | 新增元数据测试并扩展打包测试；实机用例覆盖插件行与详情页文案 |
| V 文档结构 | 通过 | 国际化规范单归属 `docs/i18n.md`，`AGENTS.md` 只放索引条目，`README.md` 只写用户可见行为 |
| VI 质量门禁 | 通过 | 每个阶段提交前运行 `pnpm format && pnpm check` |
| VII 模板定位 | 通过 | 模板变更；`demo_echo`、README 与测试保持可用 |
| VIII 公开引用 | 通过 | 元数据与文档只引用仓库内路径与包名 |
| IX 国际化 | 本需求新增 | 实施阶段 3 用 `/speckit-constitution` 新增该原则，版本 1.8.0 → 1.9.0；本需求的产物即该原则的首次落地 |

## Project Structure

### Documentation (this feature)

```text
specs/013-i18n-metadata/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/bundle-metadata.md
├── checklists/requirements.md
├── spec.md
└── tasks.md
```

### Source Code (repository root)

```text
locale/
├── en.json                   # meta.title、meta.description
└── zh.json                   # 键集与英文一致
package.json                  # exports 增加 ./locale/*.json；files 增加 locale/*.json
src/client/locales.ts         # 前端字典，保持现状
tests/metadata.test.ts        # 元数据结构、键集、禁用字符与导出声明
tests/package-pack.test.ts    # 打包内容包含两份元数据
docs/i18n.md                  # 国际化规范（唯一归属）
AGENTS.md                     # 文档索引增加一条
README.md                     # 一句：标题与描述随宿主语言切换
.specify/memory/constitution.md  # 新增原则 IX，版本 1.9.0
CHANGELOG.md                  # Unreleased 增加条目
```

**Structure Decision**: 资源文件放仓库根的 `locale/`，与宿主读取约定一致；规范文档放 `docs/`，按宪章原则 V 的文档分工。

## Complexity Tracking

无偏离；宪章新增原则 IX 是本需求的产物，按治理条款以 MINOR 版本递增落地。
