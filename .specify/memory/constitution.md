<!--
Sync Impact Report
- Version change: 1.9.0 → 2.0.0
- Modified principles:
  - I. 宿主契约 → I. 宿主依赖版本：只保留依赖版本规则，以同版本 `@deepseek-ai/dsh` 为准
  - IV. 测试同步 → II. 测试同步
  - V. 文档结构 → III. 文档结构
  - VI. 质量门禁 → IV. 质量门禁
  - VIII. 公开引用 → V. 公开引用
- Removed principles:
  - II. 依赖归属：归属规则移入 `docs/how-it-works.md`，`minimumReleaseAgeExclude` 规则并入原则 I
  - III. 严格配置：移入 `docs/how-it-works.md`
  - VII. 模板定位：移入 `docs/template-conversion.md`
  - IX. 国际化：移入 `docs/i18n.md`
- Added sections: 无
- Removed sections: 无
- Templates requiring updates: 无，plan、spec、tasks 模板在运行时读取本文件
- Follow-up TODOs: 无
-->

# dsh-plugin-template Constitution

## Core Principles

### I. 宿主依赖版本

全部 `@deepseek-ai/*` 依赖 MUST 以同版本 `@deepseek-ai/dsh` 为准：

- `@deepseek-ai/dsh-*` 依赖 MUST 锁定为同一个确切版本，版本号与对齐的 `@deepseek-ai/dsh` 相同。
- cordis 子包与其他 `@deepseek-ai/*` 依赖 MUST 使用该版本 `@deepseek-ai/dsh` 在 `dependencies` 中声明的版本。
- 每个 `@deepseek-ai/dsh-*` 依赖 MUST 以 `<包名>@<版本>` 列入 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude`。

理由：插件与宿主共享同一份实例，版本错位会产生第二份实例或接口不匹配。`dsh-*` 处于 rc 阶段，未列入 `minimumReleaseAgeExclude` 时 `pnpm install` 失败。

### II. 测试同步（不可协商）

- 代码变更 MUST 同步新增或更新 `tests/`。
- 测试 MUST 验证真实行为，不复述默认值或文案。
- 单元测试 MUST 使用 `tests/helpers.ts` 的模拟 `ctx`。
- 发布内容 MUST 由 package-pack 测试回归：
  - 进包：`dist`、`cordis.patch.yml`、`README.md`。
  - 不进包：`src`、`tests`、`scripts`。
- 涉及宿主装载或真实对话链路的变更 SHOULD 在真实宿主上做端到端验证。
- `dsh` 版本变更后 MUST 提醒用户执行实机测试，并说明变更的版本号。

理由：插件运行在宿主内部，缺少测试的问题只会在用户环境出现。

### III. 文档结构

文档分为五类，每类只写归属于自己的内容：

| 文档 | 读者 | 归属内容 |
| --- | --- | --- |
| `README.md` | 插件用户 | 功能、安装、配置、工具 |
| `AGENTS.md` | 每个会话的 Agent | 通用的信息和指令 |
| 本宪章 | 执行 Spec Kit 流程的 Agent 与维护者 | 变更过程中必须遵循的硬约束 |
| `docs/` | 开发者 | 工作机制、已知风险、开发说明 |
| 代码注释 | 读代码的人 | 文件职责、函数与常量用途 |

引用规则：

- 每条信息 MUST 只有一个归属文档。
- 其他文档引用时 MUST 只放链接，禁止相互复述。
- 复述指完整重写另一文档已归属的规则或说明。以下不算复述：
  - 链接及其一句话锚文本。
  - `AGENTS.md` 文档索引中的条目说明。
  - 代码注释中与该代码相关的一句理由。
- `README.md` 省略实现细节。

同步要求：

- 用户可见行为变化 MUST 更新 `README.md`。
- 机制、风险、流程或文件结构变化 MUST 更新对应的归属文档。
- CHANGELOG MUST 按分支规则维护：
  - `main` 上每个 commit 都增加条目。
  - 其他分支在 push 或 merge 时增加。

注释规则：

- 文件顶部 MUST 用一两句话说明职责和关键导出。
- 函数与常量 MUST 用一句话说明用途。

理由：每条信息只在一处维护，文档之间不会相互矛盾；按读者分类让信息出现在固定位置。

### IV. 质量门禁

- 文件变更后 MUST 运行 `pnpm format && pnpm check`。
- 合并前 MUST 通过 `pnpm check`。

理由：`pnpm check` 与 CI 运行同一组检查，问题在提交前暴露。

### V. 公开引用

提交到 git 的全部跟踪文件 MUST 只引用公网 URL 或仓库内路径。范围包括代码、配置、文档、skill 与 `specs/`。

禁止：

- 本机绝对路径，例如盘符路径或用户主目录。
- 指向仓库外的相对路径。
- `package.json` 中指向仓库外的 `file:` 或 `link:` 依赖。
- 其他用户无权访问的 URL。

允许：

- 占位符路径，例如 `<repo>`、`file:///<repo>/dist/index.mjs`。
- 本地回环地址的运行时说明，例如 `http://127.0.0.1:<port>`。

理由：其他用户克隆仓库后，每个链接、路径与依赖都必须能在其环境中解析。

## Governance

优先级从高到低：

1. 用户的明确要求。
2. 本宪章。
3. `AGENTS.md` 与其他文档。

冲突处理：

- 用户要求与本宪章、开发流程或其他项目要求冲突时，Agent MUST 先指出冲突的条款及影响，再按用户要求执行。
- Spec Kit 流程中偏离本宪章时，MUST 在 plan 的 Complexity Tracking 中记录：
  - 用户要求导致的偏离，理由注明「用户要求」。
  - 其他偏离写明理由，否则视为阻塞。
- 本宪章与其他文档冲突时以本宪章为准，并同步修正该文档。

修订：

- 修订通过 `/speckit-constitution` 进行，版本号按语义化规则递增：
  - MAJOR：删除或重新定义原则。
  - MINOR：新增原则或实质扩展。
  - PATCH：措辞澄清。
- `/speckit-plan` 的 Constitution Check 与 `/speckit-analyze` MUST 逐条核对本宪章。

**Version**: 2.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-18
