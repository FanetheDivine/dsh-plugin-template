# Research: 开发流程与文档结构集中到宪章

## R1 宪章版本号

- Decision: 1.3.0 → 1.4.0，MINOR。
- Rationale:
  - 原则 V 由「文档分级」扩展为「文档结构」，新增宪章自身的位置与禁止复述规则。
  - Governance 新增用户要求优先级与冲突提示。
  - 「开发流程」节吸收 `AGENTS.md` 的流程细则。
  - 以上均为实质扩展，未删除原则。
- Alternatives considered:
  - MAJOR：Governance 中「`AGENTS.md` 是执行细则」的定位改变，接近重新定义。现有原则的约束全部保留，所以按扩展处理。
  - PATCH：新增了约束，超出措辞澄清。

## R2 文档结构写在宪章的哪里

- Decision: 原则 V 改名为「文档结构」，承载五类文档的读者、归属内容、相互关系与禁止复述规则。
- Rationale: 原则 V 已经负责文档分级与同步义务，扩展它可以避免新增原则后出现两处文档规则。
- Alternatives considered: 新增原则 VIII。会把文档规则拆到两条原则里，违背本需求的单一归属目标。

## R3 优先级写在哪里

- Decision: 写在 Governance 首条，排序为：用户的明确要求 > 宪章 > `AGENTS.md` 与其他文档。
- Rationale: Governance 已定义宪章与 `AGENTS.md` 的冲突处理，优先级放在同一处。
- Alternatives considered: 写进「开发流程」节。冲突也可能发生在流程之外，例如写作规范，所以放在全局治理中。

## R4 偏离记录

- Decision: 用户要求导致的偏离写入 plan 的 Complexity Tracking，理由写「用户要求」。没有 plan 的场景只在对话中提示。
- Rationale: Governance 现有规则要求偏离必须记录，否则视为阻塞。用户覆盖也应留痕。
- Alternatives considered: 用户覆盖时免记录。会让后续 analyze 把偏离误判为阻塞。

## R5 worktree-finish skill 的重新渲染

- Decision: 同时编辑扩展源 `commands/speckit.worktree.finish.md` 与渲染产物 `.dsh/skills/speckit-worktree-finish/SKILL.md`，保持正文一致。
- Rationale:
  - 本机未安装 `specify` CLI，无法执行 `docs/development.md` 中的 `specify extension add --dev` 渲染步骤。
  - 渲染产物与源文件只差 frontmatter，正文逐字相同，手工同步结果等价。
  - `.specify-dev/` 已被 `.gitignore` 忽略，无需同步。
- Alternatives considered: 通过 `uvx` 从 GitHub 拉取 spec-kit 渲染。版本为 `1.4.2.dev0` 开发构建，难以复现同一版本。
- Verification: 去掉 frontmatter 后对比两者正文，结果为一致。

## R6 复述的判定与清理范围

- Decision: 「复述」指完整重写另一文件已归属的规则或说明。以下不算：
  - 链接及其一句话锚文本。
  - `AGENTS.md` 的文档索引条目。
  - 代码注释中与该代码相关的一句理由。
- Rationale: 索引与链接需要一句话说明目标内容，否则读者无法判断是否点开。
- 已知副本清单见 [data-model.md](./data-model.md) 的「待清理副本」。
