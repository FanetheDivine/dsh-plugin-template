先阅读 [README.md](./README.md) 了解项目。

# 文档索引

- [how-it-works.md](./docs/how-it-works.md)：插件的构造方式与运行流程。
- [known-risks.md](./docs/known-risks.md)：已知风险与宿主限制。
- [development.md](./docs/development.md)：本地开发、命令、测试、Spec Kit 命令一览、worktree 扩展维护与文件地图。

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

# LSP 能力

本项目提供 `pnpm serena` 命令，以使用 Serena 的 LSP 能力。

**优先使用此能力，而不是 `grep` 或其他文本搜索能力。**

- `pnpm install` 会自动准备 Serena。若安装脚本被跳过，运行 `pnpm serena:setup`。
- 优先使用三个只读命令：
  - `pnpm serena definition <name_path>`：寻找定义。
  - `pnpm serena references <name_path>`：寻找引用。
  - `pnpm serena doc <name_path>`：查看签名和注释。
- 三个命令支持 `--at <file_path>[:<line>]`，与 `name_path` 二选一。省略行号时返回带 `line` 的文件符号候选，提供行号时只解析该行声明的符号。
- 删除 worktree 前在目标目录运行 `pnpm serena stop`，确认停止后离开目录再删除。
- 输入和输出中的行号均为 1 起始，输出路径使用 `/`。
- 使用 `pnpm serena --help` 或 `pnpm serena <命令> --help` 查看参数。

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
