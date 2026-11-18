# 项目说明

DSH 插件模板，用 TypeScript 开发，用 tsdown 构建，用 biome 检查代码质量，用 vitest 运行测试。

- 常用 pnpm 脚本：`dev`、`build`、`check`、`full-check`、`release`、`test:code`、`test:dist`、`lint`、`lint:fix`、`format`。
- 命令说明见 [development.md](./docs/development.md#命令)。

# 文档索引

- [README.md](./README.md) 了解项目功能。
- [how-it-works.md](./docs/how-it-works.md)：插件的构造方式与运行流程。
- [known-risks.md](./docs/known-risks.md)：已知风险与宿主限制。
- [development.md](./docs/development.md)：本地开发、命令、测试、Spec Kit 命令一览、worktree 扩展维护与文件地图。
- [i18n.md](./docs/i18n.md)：插件元数据与前端字典的国际化规范。
- [template-conversion.md](./docs/template-conversion.md)：变更类别、模板变更要求与模板转化步骤。

# 模板说明

本仓库是 DSH 插件模板。

- 每个 spec 按 [template-conversion.md](./docs/template-conversion.md#变更类别) 声明变更类别。
- 把模板改造成插件前，先读 [template-conversion.md](./docs/template-conversion.md#模板转化)，按其中的顺序执行。

# 主工作区

主工作区指仓库根目录的检出，即 `git worktree list` 的第一项。

- 主工作区 MUST 位于 `main` 分支。
- 主工作区 MUST 保持干净，`git status --porcelain` 输出为空。
- 在主工作区只运行 `git fetch` 与 `git pull`。
- 任何变更 MUST 在 worktree 中进行，文档、配置、spec 与代码同样适用。

# 开发流程

在用户给出需求、缺陷或其他变更要求时，**立刻**获取 skill `speckit-specify` 的内容，并按流程推进。

| 步骤 | skill | 执行条件与要求 |
| --- | --- | --- |
| 1 | `speckit-specify` | 必做 |
| 2 | `speckit-clarify` | 存在不确定项时执行，确认行为预期、边界、影响范围与验收标准 |
| 3 | `speckit-plan` | 必做。Constitution Check MUST 逐条通过 |
| 4 | `speckit-tasks` | 必做 |
| 5 | `speckit-analyze` | 按需 |
| 6 | `speckit-implement` | 必做 |
| 7 | `speckit-worktree-finish` | 用户验收或放弃后执行 |

实施：

- `tasks.md` 的每个阶段 MUST 对应一个 commit。
- 阶段内标记 `[P]` 的任务可交给子代理并行。

# 写作规范

适用于所有由 AI 产出的文档、注释、spec、plan、提交说明与回复。

- 简洁优先。只写必要信息，删除铺垫、重复和流水账。
- 用读者熟悉的词。沿用代码、宿主文档和业界的现有名称，不自造术语。
- 一句话只讲一件事。内容超过一行时拆成有序列表、无序列表或表格。
- 直接写结论。少用括号和破折号补充解释，需要补充时另起一句。
- 用肯定句描述应该怎样做。
- 禁用两类句式：
  - 堆叠否定，例如「A，不 B，不 C」。仅写A。
  - 「不是 A，而是 B」。直接写 B。
- 只描述当前状态，不写新旧对比或变更过程。
