# 实施计划：两段访谈与审查门禁

**分支**：`feat/019-spec-clarification-review` | **日期**：2026-11-19 | **规格**：[spec.md](./spec.md)

**输入**：`specs/019-spec-clarification-review/spec.md`

**状态**：Approved

## 待确认决策

无。

## 澄清记录

### 2026-11-19 会话

| 编号 | 已确认决定 |
| --- | --- |
| Q1 | 使用状态字段与 `## 审查记录`，记录日期、完整批准或豁免、适用范围 |
| Q2 | 实质修改后将状态改为 `Draft`，保留历史记录并重新请求审查 |
| Q3 | 使用 `## 待确认决策` 持久化未答问题，回答后移除并写入澄清记录 |
| Q4 | 按会话记录带稳定编号的问答项 |
| Q5 | 按依赖分批，每批收集当前全部可独立回答的问题 |
| Q6 | clarify 改为必做，specify 完成报告固定指向 clarify |
| Q7 | 修改 `specify`、`clarify`、`plan`、`tasks`、`implement` 五个 skill |
| Q8 | spec 与 plan 模板都增加访谈与审查区块 |
| Q9 | 修改受管文件后同步 integration manifest 哈希 |
| Q10 | 只审查文档与 diff，不运行真实宿主验证；保留仓库既有质量检查 |

## 审查记录

- 2026-11-19：用户批准当前完整计划。未确认事项：无。风险：无。

## 摘要

本次只修改 Spec Kit 的 Markdown skill、产物模板与流程文档。`speckit-clarify` 在需求探索后分批完成需求访谈，并请求用户审查完整规格；`speckit-plan` 在技术探索后分批完成实现细节访谈，并请求用户审查完整计划。`speckit-tasks` 与 `speckit-implement` 通过文档状态、待确认决策和审查记录判断是否允许继续。

批准与豁免不依赖可执行脚本。Agent 按统一 Markdown 结构维护状态。实质修改使当前批准失效，历史审查记录保留。

## 技术背景

**形式**：Markdown 指令与模板，无新增运行时代码

**主要依赖**：现有 DSH skill 加载机制与 Spec Kit 文件结构，无新增依赖

**存储**：各功能目录下的 `spec.md`、`plan.md` 及其中的 Markdown 区块

**验证**：文档审查、`git diff --check`、`pnpm format && pnpm check`、`pnpm run full-check`

**目标平台**：DSH Agent 的 Spec Kit skill 主流程

**项目类型**：DSH 插件模板开发流程

**约束**：保持插件运行时代码、示例工具、现有脚本与外部 workflow 不变；不运行真实宿主验证

**规模/范围**：五个核心 skill、两个产物模板、两个 integration manifest、`AGENTS.md` 与 `docs/development.md`

## 宪章检查

*Phase 0 前与 Phase 1 后均已逐条复核。*

| 原则 | 结果 | 核验 |
| --- | --- | --- |
| I. 宿主依赖版本 | 通过 | 不变更任何 `@deepseek-ai/*` 依赖或版本排除配置 |
| II. 测试同步 | 通过 | 本次只有文档与指令变更，无代码变更；保持现有测试和发布包回归；按用户选择不运行真实宿主验证 |
| III. 文档结构 | 通过 | `AGENTS.md` 维护强制步骤，skill 维护执行细节，`docs/development.md` 维护命令、维护说明与文件地图 |
| IV. 质量门禁 | 通过 | 实施后运行 `pnpm format && pnpm check`，交付前运行完整检查 |
| V. 公开引用 | 通过 | 所有新内容只使用仓库相对路径 |

## 项目结构

### 本功能文档

```text
specs/019-spec-clarification-review/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── workflow.md
└── tasks.md
```

### 仓库结构

```text
AGENTS.md
docs/development.md
.dsh/skills/
├── speckit-specify/SKILL.md
├── speckit-clarify/SKILL.md
├── speckit-plan/SKILL.md
├── speckit-tasks/SKILL.md
└── speckit-implement/SKILL.md
.specify/
├── integrations/
│   ├── dsh.manifest.json
│   └── speckit.manifest.json
└── templates/
    ├── plan-template.md
    └── spec-template.md
```

**结构决策**：访谈与审查指令归属对应 skill，通用产物结构归属 spec/plan 模板，主流程归属 `AGENTS.md`。不修改 `.specify/scripts/`、`.specify/workflows/`、插件源码或测试文件。

## 设计

### 主流程

1. `speckit-specify` 创建规格草稿与待确认决策列表，完成报告固定指向必经的 `speckit-clarify`，不自行完成正式需求访谈。
2. `speckit-clarify` 先检查代码库、现有文档、接口与约束，再按依赖分批提问。全部答案写回规格后，请求用户审查完整规格。
3. 用户批准或明确豁免规格审查后，`speckit-plan` 才能创建计划草稿。计划、研究和设计完成后，再按依赖分批确认实现细节。
4. 实现细节答案写回计划及受影响设计文档后，请求用户审查完整计划。
5. `speckit-tasks` 核验规格与计划均为当前完整版本的 `Approved` 或 `Waived`，且待确认决策均为空或已被用户豁免。
6. `speckit-implement` 再次核验状态。发现新未决项时暂停受影响工作，返回对应探索、访谈与审查。

### 访谈批次

- 每段访谈开始前完成对应探索，再建立完整决策列表。
- 每个决策项包含稳定编号、问题、推荐答案、理由与依赖。
- 每批一次性提出依赖已满足的全部问题，不设置固定数量上限。
- 依赖未满足的问题保留到后续批次，在前置答案确定后改写成具体问题。
- 用户可按编号回答全部或部分问题。已答项写回文档，未答项保留在待确认列表。
- 用户跳过单个问题时，该项保持未决；访谈结束时必须回答或由用户明确豁免访谈。
- 用户改变先前答案时，更新相关决策并重新审查受影响的文档。

### 文档区块

规格与计划模板都提供以下区块：

- 状态字段：`Draft`、`Approved` 或 `Waived`。
- `## 待确认决策`：持久化未答问题、依赖和当前状态。
- `## 澄清记录`：按会话记录带稳定编号的最终问答。
- `## 审查记录`：追加记录日期、决定、适用范围、未确认事项与风险。

状态语义：

- `Draft`：尚未获得当前完整版本的批准或豁免。
- `Approved`：用户明确批准当前完整文档。
- `Waived`：用户明确豁免当前环节，并已记录未确认事项与风险。

### 审查与失效

- 审查请求必须链接完整文档，并概括待确认内容。
- 部分认可不构成批准，Agent 先解决其余意见。
- 批准或豁免记录在对应文档内追加，历史记录保留。
- 需求、约束、验收标准、技术方案、接口或验证方式的实质修改会将状态改回 `Draft`。
- 纯排版修正不改变批准状态。
- 规格重新进入 `Draft` 时，下游计划与任务暂停；计划重新进入 `Draft` 时，任务与实现暂停。

### 受管文件同步

修改五个核心 skill 后，更新 `.specify/integrations/dsh.manifest.json` 中对应 SHA-256。修改 spec/plan 模板后，更新 `.specify/integrations/speckit.manifest.json` 中对应 SHA-256。`docs/development.md` 记录上游刷新时重新应用本地流程变更的维护要求。

## 验证

- 审查五个 skill 的阶段顺序、探索前置条件、批次规则与审查出口。
- 审查两个模板都包含状态、待确认决策、澄清记录和审查记录。
- 检查 `AGENTS.md` 将 clarify 标为必做，plan 包含实现细节访谈与计划审查。
- 核对两个 manifest 的哈希与实际文件一致。
- 运行 `git diff --check`、`pnpm format && pnpm check` 与 `pnpm run full-check`。
- 按用户选择不运行真实宿主验证。

## 复杂度跟踪

无宪章偏离。
