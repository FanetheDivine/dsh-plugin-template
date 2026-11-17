# Implementation Plan: Serena 符号查询

**Branch**: `feat/006-serena-symbol-cli` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-serena-symbol-cli/spec.md`

## Summary

把参考仓库的 Serena 2.1.0 只读符号查询能力移植为模板开发工具。`uv` 根据脚本内联元数据准备 Python 依赖，CLI 通过项目级认证后台实例复用语言服务器；独立 Node helper 使用仓库现有 TypeScript 编译器解析工程成员。测试使用模板自身源码、发布脚本和临时项目验证真实行为。

## Technical Context

**Language/Version**: Python 3.11–3.14；Node.js `^22.19.0 || >=24.0.0`；现有 TypeScript 6

**Primary Dependencies**: 开发期 `serena-agent==2.1.0`、测试期 `psutil==7.0.0`，均由 `uv run --script` 准备；复用现有 TypeScript、Vitest 和 Node.js 内置模块

**Storage**: 用户级 `~/.serena/serena-cli/` 中的项目实例 JSON、锁与日志；测试通过环境变量使用临时目录

**Testing**: Vitest 驱动真实 CLI、Node helper 和后台实例；Python `unittest` 覆盖运行时边界与进程探针；现有 `package-pack` 回归发布内容

**Target Platform**: Windows、macOS、Linux 开发环境；CI Ubuntu

**Project Type**: DSH 插件模板的开发期 CLI

**Performance Goals**: 同项目连续查询复用一个实例；默认空闲 900 秒退出；默认启动等待 120 秒、查询请求等待 900 秒

**Constraints**: 查询只读；回环请求必须认证；请求体上限 1 MB；不执行项目代码或配置插件；不新增 npm 运行依赖；不改变发布包和 `demo_echo`

**Scale/Scope**: 一个项目一个实例；支持 TypeScript、JavaScript、JSX、TSX、MJS、CJS 的 Serena 可识别符号；增加 2 个脚本、5 个测试文件和 1 个固定夹具

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 前置检查 | 设计后检查 | 结论 |
| --- | --- | --- | --- |
| I. 宿主契约 | PASS | PASS | 不修改 `src/index.ts` 的导出、标识与注入。 |
| II. 依赖归属 | PASS | PASS | Serena 与 psutil 是脚本声明的开发期依赖，不进入 `dependencies` 或 bundle；复用现有 TypeScript。 |
| III. 严格配置 | PASS | PASS | 不修改插件配置解析。CLI 参数与环境变量在命令边界校验。 |
| IV. 测试同步 | PASS | PASS | 新增真实 CLI、工程解析、实例生命周期与安全回归；保留 package-pack 检查。 |
| V. 文档结构 | PASS | PASS | 开发命令归属 `docs/development.md`，Agent 使用规则归属 `AGENTS.md`，CI 与文件地图同步更新。 |
| VI. 质量门禁 | PASS | PASS | 实施后运行 `pnpm format && pnpm check`，合并前再次通过。 |
| VII. 模板定位 | PASS | PASS | 类别为模板变更；保留 `demo_echo`、README、测试与发布设置。 |
| VIII. 公开引用 | PASS | PASS | 跟踪文件只使用仓库内相对路径、环境变量占位符和公网 action 引用。 |

## Project Structure

### Documentation (this feature)

```text
specs/006-serena-symbol-cli/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
└── tasks.md
```

### Source Code (repository root)

```text
scripts/
├── release-archive.mjs          # 现有脚本，同时作为引用查询夹具
├── serena-cli.py                # 查询、实例、认证、锁与生命周期
└── serena-projects.cjs          # 受信任 TypeScript 配置与成员解析
tests/
├── fixtures/
│   ├── serena-multi.ts          # 同一声明行的歧义符号
│   └── serena-live-*/           # 测试运行时创建并清理的外部修改夹具
├── serena-cli.test.ts           # 真实定义、引用、文档与文件同步
├── serena-daemon.test.ts        # 实例复用、并发、安全、超时与回退
├── serena-projects.test.ts      # 工程配置、成员、引用与安全边界
├── serena-reference-lifecycle.test.py # 临时 JS 缓冲区释放
└── serena-runtime.test.py       # 查询准备、错误边界、缓存与进程探针
.github/workflows/ci.yml         # check 与 publish 准备 uv/Python
.gitignore                       # 忽略项目内 Serena 缓存
AGENTS.md                        # Agent 符号查询与 worktree 清理规则
docs/development.md              # 前置要求、命令、实例行为与文件地图
docs/known-risks.md               # Serena 私有 API、环境准备与实例残留风险
package.json                     # serena、serena:setup、prepare
```

**Structure Decision**: 沿用单项目模板。Serena 完全位于开发脚本与测试中，不进入 `src/` 或 `dist/`。

## Complexity Tracking

无偏离。
