# Research: README 面向用户与宪章文档结构调整

## R1 README 正文

- Decision: README 全文如下。

  ```markdown
  # dsh-plugin-template

  [![npm](https://img.shields.io/npm/v/dsh-plugin-template)](https://www.npmjs.com/package/dsh-plugin-template)

  DSH 插件模板，演示宿主工具与 Web GUI 前端的接入方式。

  ## 功能

  - `demo_echo` 工具：把文本加上前缀后回显。
  - agent 事件日志：记录 agent 的创建、销毁、状态变化与 turn 结束。
  - 配置页：在“插件”页的行详情里修改配置，保存后立即生效。
  - 示例行：位于会话输入区上方，点击按钮后计数递增。
  - 中英双语：插件标题、描述与界面文案随宿主语言切换。
  ```

- Rationale:
  - 简介对应 `locale/zh.json` 的 `meta.description`。
  - 功能列表与 `src/` 的行为一致：`demo_echo`、`src/events.ts` 的事件日志、配置页、`src/client/demo-dock.tsx` 的示例行、`locale/` 与 `src/client/locales.ts` 的双语文案。
  - 本模板没有易混淆的功能，不写「使用建议」。
- Alternatives considered: 保留配置表。配置项的标题与说明已在插件页表单展示，因此删除。

## R2 宪章原则 III

- Decision: 原则 III 改写如下。

  ```markdown
  ### III. 文档结构

  文档分为用户文档与技术文档，按读者归属内容：

  | 文档 | 类别 | 读者 | 归属内容 |
  | --- | --- | --- | --- |
  | `README.md` | 用户文档 | 插件用户 | 简介、功能、使用建议 |
  | `AGENTS.md` | 技术文档 | 每个会话的 Agent | 通用的信息和指令 |
  | 本宪章 | 技术文档 | 执行 Spec Kit 流程的 Agent 与维护者 | 变更过程中必须遵循的硬约束 |
  | `docs/` | 技术文档 | 开发者 | 工作机制、已知风险、开发说明 |
  | 代码注释 | 技术文档 | 读代码的人 | 文件职责、函数与常量用途 |

  引用规则：

  - 技术文档中的每条信息 MUST 只有一个归属文档。
  - 技术文档之间引用时 MUST 只放链接，禁止相互复述。
  - 复述指完整重写另一文档已归属的规则或说明。以下不算复述：
    - 链接及其一句话锚文本。
    - `AGENTS.md` 文档索引中的条目说明。
    - 代码注释中与该代码相关的一句理由。
  - `README.md` 不计入单一归属，可以复述技术文档的内容。

  README 规则：

  - 开头 MUST 依次包含插件名、npm 版本徽标与简介，随后是功能列表。
  - npm 徽标 MUST 使用 shields.io 的版本徽标，链接到 npmjs.com 的包页。
  - MUST 省略安装命令、配置表、工具表、实现细节与面向开发者的内容。
  - 插件存在易混淆的功能或配置时，增加「使用建议」一节，内容限于该插件的具体功能。
  - 指向仓库文件的链接 MUST 使用 GitHub 绝对 URL。

  同步要求：

  - 插件功能或使用建议变化 MUST 更新 `README.md`。
  - 机制、风险、流程或文件结构变化 MUST 更新对应的归属文档。
  - CHANGELOG MUST 按分支规则维护：
    - `main` 上每个 commit 都增加条目。
    - 其他分支在 push 或 merge 时增加。

  注释规则：

  - 文件顶部 MUST 用一两句话说明职责和关键导出。
  - 函数与常量 MUST 用一句话说明用途。

  理由：技术文档的每条信息只在一处维护，文档之间不会相互矛盾；README 面向插件用户，按用户需要组织内容。
  ```

- Rationale:
  - 用户要求 README 不属于技术文档，不计入内容唯一。
  - README 本身不写维护规则，规则放在宪章。
  - 版本 2.1.0：原则 III 实质调整，未删除或重新定义原则。
- Alternatives considered: README 规则写进 `docs/`。README 的内容约束属于变更过程的硬约束，归属宪章。

## R3 相关文档

- Decision:
  - `AGENTS.md` 索引条目：`- [README.md](./README.md)：插件简介与功能。`
  - `docs/template-conversion.md` 模板变更：`新用户能按 README 跑通` 改为 `README 与插件功能一致`。
  - `docs/template-conversion.md` 模板转化：`更新项目名、包名、README 与 cordis.patch.yml` 保持不变，README 的徽标随包名更新。
- Rationale: `docs/i18n.md` 与 `docs/how-it-works.md` 只提到 README 进包与详情页回落，与新范围一致，不改。

## R4 测试

- Decision: 不新增测试。
- Rationale: 无代码变更；`tests/package-pack.test.ts` 已断言 README 进包。
