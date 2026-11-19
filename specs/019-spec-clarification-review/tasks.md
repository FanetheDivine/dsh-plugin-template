# 任务：两段访谈与审查门禁

**输入**：`specs/019-spec-clarification-review/` 中已批准的规格与计划
**范围**：纯 Markdown skill、模板与流程文档；不新增代码或测试
**提交规则**：每个阶段完成检查并对应一个 commit

## 阶段 1：建立已批准基线

**目的**：保存规格、计划、研究和任务清单，供后续阶段核对。

- [X] T001 核对批准状态与文档一致性，提交 `specs/019-spec-clarification-review/` 下的 spec、plan、research、data-model、contracts、quickstart 与 tasks

**阶段提交**：`docs(019): 记录两段访谈与审查门禁设计`

---

## 阶段 2：建立统一文档区块

**目的**：为规格与计划提供状态、待确认决策、澄清记录和审查记录。

- [X] T002 [P] 在 `.specify/templates/spec-template.md` 增加 `Draft|Approved|Waived` 状态语义、待确认决策、带稳定编号的澄清记录和包含日期/范围/未确认事项/风险的审查记录
- [X] T003 [P] 在 `.specify/templates/plan-template.md` 增加同一组状态与区块，并保留原有技术背景、宪章检查和项目结构

**独立验证**：两个模板都包含四类区块，且没有新增脚本或状态文件。
**阶段提交**：`docs(019): 增加规格与计划审查区块`

---

## 阶段 3：用户故事 1 - 探索后的分批访谈（P1）

**目标**：每个变更都先探索，再按依赖批量确认全部需求决策。

**独立验证**：clarify 不再包含固定五问或一次一问，specify 固定进入 clarify；待确认列表支持部分回答与跨会话恢复。

- [X] T004 [P] [US1] 修改 `.dsh/skills/speckit-specify/SKILL.md`，保留规格草稿生成，将正式提问移至必经的 clarify，并在完成报告固定指向 clarify
- [X] T005 [P] [US1] 修改 `.dsh/skills/speckit-clarify/SKILL.md`，在提问前完成代码库/文档/接口/约束探索，持久化待确认决策，按依赖在每批提出全部独立问题，附稳定编号和推荐答案，取消数量上限并处理部分回答与跳过

**阶段提交**：`docs(019): 实现探索后的分批需求访谈`

---

## 阶段 4：用户故事 2 - 完整规格批准门禁（P1）

**目标**：规格访谈结束后必须审查当前完整规格，批准或用户豁免后才允许计划。

**独立验证**：未批准、部分认可和无豁免时均保持 `Draft`；实质修改使旧批准失效，历史记录保留。

- [X] T006 [US2] 修改 `.dsh/skills/speckit-clarify/SKILL.md`，在访谈写回后请求完整规格审查，维护 `Draft|Approved|Waived`、审查记录、部分认可处理、豁免风险和实质修改失效
- [X] T007 [US2] 修改 `.dsh/skills/speckit-plan/SKILL.md`，在 setup-plan 前检查规格为 `Approved` 或 `Waived`，且待确认决策均为空或已豁免；失败时返回规格审查

**阶段提交**：`docs(019): 增加完整规格批准门禁`

---

## 阶段 5：用户故事 3 - 实现访谈与完整计划批准门禁（P1）

**目标**：技术探索后确认全部实现细节，计划批准或用户豁免后才允许任务与实现。

**独立验证**：plan 在技术探索后分批确认实现细节并请求计划审查；tasks/implement 在状态缺失或未决项未豁免时停止。

- [X] T008 [US3] 修改 `.dsh/skills/speckit-plan/SKILL.md`，在 Phase 0/1 与技术探索完成后按依赖分批确认全部实现细节，写回受影响设计文档，请求完整计划审查并维护状态与实质修改失效
- [X] T009 [P] [US3] 修改 `.dsh/skills/speckit-tasks/SKILL.md`，在 setup-tasks 前检查规格和计划的 `Approved|Waived` 状态及待确认决策，缺失时返回对应审查
- [X] T010 [P] [US3] 修改 `.dsh/skills/speckit-implement/SKILL.md`，实现前复查规格/计划状态与未决项，发现新未决项时暂停受影响工作并返回对应探索、访谈与审查

**阶段提交**：`docs(019): 增加实现访谈与计划批准门禁`

---

## 阶段 6：流程文档、清单与质量检查

**目的**：统一入口说明、维护要求、受管文件清单与最终质量。

- [ ] T011 [P] 更新 `AGENTS.md` 开发流程表，将 clarify 标为必做，并写明两段探索后访谈、完整规格/计划审查及未决项清零门禁
- [ ] T012 [P] 更新 `docs/development.md` 的 Spec Kit 流程、命令产出、核心 skill 本地定制与 manifest 同步说明、测试清单和文件地图
- [ ] T013 更新 `.specify/integrations/dsh.manifest.json` 与 `.specify/integrations/speckit.manifest.json`，使五个 skill 和两个模板的 SHA-256 与实际文件一致
- [ ] T014 按 `specs/019-spec-clarification-review/quickstart.md` 审查最终 diff，并运行 `git diff --check`、`pnpm format && pnpm check` 与 `pnpm run full-check`

**阶段提交**：`docs(019): 同步流程说明与受管文件清单`

## 依赖与执行顺序

- 阶段 1 → 阶段 2 → 阶段 3 → 阶段 4 → 阶段 5 → 阶段 6。
- 用户故事按主流程顺序执行，不并行修改同一 skill。
- 每个阶段结束前标记该阶段任务为 `[X]`，检查 diff 后提交。

## 并行机会

- T002 与 T003 修改不同模板。
- T004 与 T005 修改不同 skill。
- T009 与 T010 修改不同 skill。
- T011 与 T012 修改不同文档。

## 实施策略

1. 先提交已批准设计，再建立统一文档区块。
2. 依次完成需求访谈、规格门禁、计划门禁。
3. 最后同步文档与 manifest，并运行完整质量检查。
4. 按用户决定不运行真实宿主验证；实际访谈质量由后续使用验收。
