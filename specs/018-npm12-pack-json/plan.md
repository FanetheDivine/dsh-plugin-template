# Implementation Plan: npm 12 下包内容测试兼容

**Branch**: `fix/018-npm12-pack-json` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-npm12-pack-json/spec.md`

**变更类别**: 模板变更

## Summary

- 新增 `tests/support/pack-report.ts`，把 `npm pack --json` 的报告归一为文件路径集合：数组与以包名为键的对象都接受。
- `tests/package-pack.test.ts` 改调该函数，断言项不变。
- 新增 `tests/pack-report.test.ts` 覆盖四类输入。
- 删除 `.github/workflows/ci.yml` publish job 的 `npm install -g npm@latest`，注释写明 OIDC 下限由 Node 24 自带 npm 满足。
- `docs/development.md` 的 CI 节写明 npm 版本来源，测试表加入新测试文件。
- `CHANGELOG.md` 的 Unreleased 增加修复条目。

## Technical Context

**Language/Version**: TypeScript，Node.js 24.9+

**Primary Dependencies**: 无新增依赖；运行时只读 npm CLI 的 JSON 输出

**Storage**: 不适用

**Testing**: vitest；`tests/pack-report.test.ts` 进 `code` project，`tests/package-pack.test.ts` 留在 `dist` project

**Target Platform**: GitHub Actions `ubuntu-latest` 与本机 Windows、macOS、Linux

**Project Type**: DSH 插件模板

**Performance Goals**: 不适用

**Constraints**:

- 解析只处理已解析的 JSON 值，不涉及 `npm pack` 的调用与超时。
- npm 11 与 npm 12 的输出都要通过。
- CI 不安装或升级 npm。

**Scale/Scope**: 1 个新增测试工具、1 个新增测试、1 个测试改写、1 个工作流步骤删除、1 节文档、1 条 changelog

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

按宪章 2.0.0 逐条核对：

| 原则 | 结论 | 说明 |
| --- | --- | --- |
| I 宿主依赖版本 | 通过 | 不改依赖，不改 `minimumReleaseAgeExclude` |
| II 测试同步 | 通过 | 新增 `tests/pack-report.test.ts`；`package-pack` 断言项保持；不涉及宿主装载，无需实机测试 |
| III 文档结构 | 通过 | CI 步骤说明归属 `docs/development.md`；解析函数的形状说明写在代码注释；CHANGELOG 在 push 时补充 |
| IV 质量门禁 | 通过 | 每个阶段运行 `pnpm format && pnpm check` |
| V 公开引用 | 通过 | 只引用仓库内路径与公网 URL |

Phase 1 设计后复核：解析函数与快速验证见 [quickstart.md](./quickstart.md)，结论不变。

## Project Structure

### Documentation (this feature)

```text
specs/018-npm12-pack-json/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

无外部接口，不生成 `contracts/`。

### Source Code (repository root)

```text
.github/workflows/ci.yml            # 删除 npm 升级步骤
docs/development.md                 # CI 节与测试表
tests/package-pack.test.ts          # 改调解析函数
tests/support/pack-report.ts        # 新增
tests/pack-report.test.ts           # 新增
CHANGELOG.md                        # Unreleased 修复条目
```

**Structure Decision**: 解析函数放进 `tests/support/`，与 `dist-freshness.ts` 同层。它只被测试使用，不随包发布。`tests/package-pack.test.ts` 保留在 `dist` project，继续读取 `dist` 产物。

## Complexity Tracking

无偏离。
