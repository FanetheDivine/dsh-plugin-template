先阅读 [README.md](./README.md) 了解项目。

优先通过ask_user_question和用户交互。

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

# 开发流程

仓库内的任何变更都按照 [Spec Kit](https://github.com/github/spec-kit) 流程进行开发，从 skill `speckit-specify` 开始。
