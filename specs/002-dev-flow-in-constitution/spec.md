# Feature Specification: 开发流程与文档结构集中到宪章

**Feature Branch**: `main`（本次直接在 main 提交，不使用 worktree）

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "speckit-specify 会引用 constitution.md。AGENTS.md 只引用 /speckit-specify 作为入口，把开发流程放到 constitution.md；docs/development.md 保留命令与产物表，规则链到宪章；在 main 分支进行。本次不强制 worktree；宪章说明 README、AGENTS、docs、代码注释的文档结构及其与宪章的关系，禁止相互复述；宪章优先级低于用户要求，但用户要求与流程或项目要求冲突时要提示。"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-17

- Q: 是否允许跳过 worktree 直接在 main 上走流程？ → A: 本次不强制 worktree。宪章保留默认建 worktree，用户要求可覆盖，覆盖时按 FR-008 提示冲突。
- Q: 宪章与用户要求的优先级？ → A: 用户要求优先于宪章。用户要求与流程或项目要求冲突时，Agent 先指出冲突再执行。
- Q: 文档之间可以重复描述同一事实吗？ → A: 禁止相互复述。每条信息只有一个归属文件，其他位置只放链接。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 流程规则只有一处来源 (Priority: P1)

执行 Spec Kit 流程的 Agent 在任一 `speckit-*` 步骤读取宪章，就能查到该步骤的全部约束，且不会读到与其他文件矛盾的版本。

**Why this priority**: 流程目前写在 `AGENTS.md`、宪章、`docs/development.md` 三处。其中 clarify 一处写「必做」、一处写「按需」，基线一处写死 `origin/main`、一处写可配置，Agent 无法确定以哪处为准。

**Independent Test**: 逐项列出 `AGENTS.md` 原「Spec Kit 开发流程」节中的每条规则，在宪章「开发流程」节中都能找到；在 `AGENTS.md` 与 `docs/development.md` 中找不到第二份规则表述。

**Acceptance Scenarios**:

1. **Given** 宪章「开发流程」节，**When** 核对 `AGENTS.md` 原流程节的每条规则，**Then** 每条都在宪章中出现，且表述无歧义。
2. **Given** clarify 步骤，**When** 查阅宪章，**Then** 只看到一种执行条件。
3. **Given** 基线分支，**When** 查阅宪章，**Then** 看到它由 `worktree-config.yml` 的 `base_ref` 决定。

---

### User Story 2 - 会话一开始就知道流程入口 (Priority: P1)

新会话中的 Agent 收到需求或缺陷时，仅凭 `AGENTS.md` 就知道要从 `/speckit-specify <需求描述>` 开始，并知道完整流程在宪章。

**Why this priority**: 宪章只在运行 `speckit-*` skill 时才被读取。入口一旦从 `AGENTS.md` 删除，Agent 可能绕过流程直接改代码。

**Independent Test**: 只阅读 `AGENTS.md`，能回答「需求从哪条命令开始」和「完整流程在哪里」两个问题。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`，**When** 查找流程入口，**Then** 看到「需求与缺陷一律走 Spec Kit，从 `/speckit-specify <需求描述>` 开始」以及指向宪章「开发流程」节的链接。
2. **Given** `AGENTS.md`，**When** 查找流程细节，**Then** 只看到入口与链接，没有步骤列表或约束条目。

---

### User Story 3 - 每条信息只有一个归属文件 (Priority: P1)

维护者修改某条规则或说明时，只需要改一个文件；读者在任何文档中读到的内容都不会与其他文档矛盾。

**Why this priority**: 文档分级当前同时写在 `AGENTS.md` 与宪章原则 V，两者分工也各自描述了一遍。副本越多，漂移越快。

**Independent Test**: 按宪章列出的文档结构，逐个文件检查：同一条规则或说明只在其归属文件中完整出现，其他文件只以链接引用。

**Acceptance Scenarios**:

1. **Given** 宪章，**When** 查找文档结构，**Then** 看到 `README.md`、`AGENTS.md`、宪章、`docs/`、代码注释各自的读者、内容范围与相互关系。
2. **Given** 宪章，**When** 查找跨文档规则，**Then** 看到「禁止相互复述，引用其他文档时只放链接」。
3. **Given** `AGENTS.md`，**When** 查找文档分级，**Then** 只看到文档索引链接，分级说明在宪章中。

---

### User Story 4 - 用户要求与规则冲突时 Agent 会提示 (Priority: P1)

用户提出的要求与宪章、流程或其他项目要求冲突时，Agent 先说明冲突的条款与影响，然后按用户要求执行。

**Why this priority**: 宪章当前声明自己优先于其他开发惯例，未说明与用户要求的关系。001 与本需求都按用户要求跳过了 worktree，但没有规则说明这样做是否允许、是否需要提示。

**Independent Test**: 在宪章 Governance 中查到优先级与冲突提示规则；用一个冲突场景演练，例如要求在 main 上直接开发，Agent 应先提示被覆盖的条款。

**Acceptance Scenarios**:

1. **Given** 宪章 Governance，**When** 查找优先级，**Then** 看到用户的明确要求优先于宪章。
2. **Given** 用户要求跳过 worktree，**When** Agent 开始执行，**Then** 先指出被覆盖的宪章条款，再在 main 上继续。
3. **Given** 一次覆盖了宪章条款的 Spec Kit 流程，**When** 查看 plan，**Then** Complexity Tracking 记录了偏离的条款，理由为用户要求。

---

### User Story 5 - 开发者在 docs 中查到命令一览 (Priority: P2)

人类开发者打开 `docs/development.md`，看到每条 `speckit-*` 命令的作用与产物，并通过链接跳到宪章查看约束。

**Why this priority**: 开发说明需要命令一览；约束交给宪章，以免出现第三份副本。

**Independent Test**: 打开 `docs/development.md` 的「Spec Kit 流程」节，确认有命令与产物表，且规则条目只以宪章链接出现。

**Acceptance Scenarios**:

1. **Given** `docs/development.md`，**When** 阅读「Spec Kit 流程」节，**Then** 看到命令与产物表和指向宪章「开发流程」节的链接。
2. **Given** 同一节，**When** 查找 MUST 类约束，**Then** 找不到。

---

### User Story 6 - worktree-finish 引用正确的规则来源 (Priority: P3)

运行 `/speckit-worktree-finish` 的 Agent 按 skill 中的指引查找 CHANGELOG 规则，能在被引用的文件中找到它。

**Why this priority**: skill 当前写「per `AGENTS.md`」，但 CHANGELOG 规则在宪章原则 V。

**Independent Test**: 打开 `.dsh/skills/speckit-worktree-finish/SKILL.md`，CHANGELOG 步骤引用宪章，且与扩展源 `commands/speckit.worktree.finish.md` 一致。

**Acceptance Scenarios**:

1. **Given** worktree 扩展源与渲染后的 skill，**When** 阅读 CHANGELOG 步骤，**Then** 两者都引用宪章原则 V。

### Edge Cases

- 用户要求在 `main` 上直接进行：Agent 提示被覆盖的 worktree 条款后在 main 上执行，跳过 worktree-create 与 worktree-finish，CHANGELOG 按 main 的规则维护。
- 用户要求与 `AGENTS.md` 的写作规范冲突：同样先提示再执行。
- 宪章修改尚未合入 `base_ref`：新建的 worktree 读到的是旧宪章，新规则在合入后才生效。
- 只读 `AGENTS.md` 的场景，例如回答问题而不改代码：Agent 不需要流程细节，入口与链接足够。
- 代码注释需要说明某条约束的原因：只写与该代码相关的一句理由，约束全文链接到宪章。

## Requirements *(mandatory)*

### Functional Requirements

**开发流程**

- **FR-001**: 宪章「开发流程」节 MUST 完整承载以下规则：
  - 步骤顺序与各步执行条件。
  - 分支名 `<type>/<NNN>-<short-name>`、`<type>` 取值、`--no-track`、worktree 位置。
  - 基线由 `worktree-config.yml` 的 `base_ref` 决定。
  - plan 的 Constitution Check 逐条通过。
  - `tasks.md` 每阶段一个 commit，`[P]` 任务可交给子代理并行。
  - 自测、用户验收、`/speckit-worktree-finish` 的两种结局与清理。
- **FR-002**: clarify 的执行条件 MUST 只有一种表述：存在不确定项时执行。
- **FR-003**: `AGENTS.md` MUST 只保留流程入口：
  - 「需求与缺陷一律走 Spec Kit，从 `/speckit-specify <需求描述>` 开始」。
  - 指向宪章「开发流程」节的链接。
- **FR-004**: `docs/development.md` 的「Spec Kit 流程」节 MUST 保留命令与产物表，规则改为链接宪章。

**文档结构**

- **FR-005**: 宪章 MUST 说明文档结构，覆盖 `README.md`、`AGENTS.md`、宪章、`docs/`、代码注释：
  - 每类文档的读者。
  - 每类文档的内容范围。
  - 宪章与其他文档的关系。
- **FR-006**: 宪章 MUST 规定文档之间禁止相互复述：
  - 每条信息只有一个归属文件。
  - 其他文件引用时只放链接。
- **FR-007**: 现有副本 MUST 按 FR-006 清理：
  - `AGENTS.md` 的文档分级表与分工说明，只保留文档索引链接。
  - `AGENTS.md` 补充说明中与宪章重复的条目，例如自测命令、`<type>` 取值。
  - `docs/development.md` 中与宪章重复的规则。

**优先级**

- **FR-008**: 宪章 Governance MUST 规定优先级与冲突提示：
  - 用户的明确要求优先于宪章。
  - 用户要求与宪章、流程或其他项目要求冲突时，Agent MUST 先指出冲突条款及影响，再按用户要求执行。
  - Spec Kit 流程中的偏离 MUST 记录在 plan 的 Complexity Tracking，理由注明用户要求。
- **FR-009**: 宪章开发流程中「MUST 创建 worktree」的条款保持为默认行为，用户可按 FR-008 覆盖。

**其他**

- **FR-010**: worktree 扩展源 `commands/speckit.worktree.finish.md` MUST 把 CHANGELOG 规则来源改为宪章原则 V，并重新渲染 `.dsh/skills/speckit-worktree-finish/SKILL.md`。
- **FR-011**: 宪章修订 MUST 经 `/speckit-constitution` 进行，按语义化规则递增版本号并更新 Sync Impact Report。
- **FR-012**: `CHANGELOG.md` MUST 记录本次变更。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 流程规则的出现位置从 3 处降为 1 处，即宪章。
- **SC-002**: `AGENTS.md` 中与 Spec Kit 流程相关的内容不超过 3 行。
- **SC-003**: 原 `AGENTS.md` 流程节的规则在宪章中的覆盖率为 100%。
- **SC-004**: 按文档结构逐文件检查，复述其他文件规则的段落数为 0。
- **SC-005**: 宪章中能一处查到文档结构、优先级与冲突提示规则。
- **SC-006**: `pnpm format && pnpm check` 通过，`tests/worktree-extension.test.ts` 不受影响。

## Assumptions

- `AGENTS.md` 继续承载写作规范与 `ask_user_question` 指令，宪章只链接写作规范。
- `README.md` 只引导开发者阅读 `AGENTS.md`，内容范围不变。
- 「复述」指完整重写另一文件已有的规则或说明；一句话的链接锚文本与代码注释中的单句理由不算复述。
- 宪章版本号递增级别在 plan 阶段按 Governance 规则确定。
- 本次只调整文档与 skill 文本，脚本与测试代码不变。
