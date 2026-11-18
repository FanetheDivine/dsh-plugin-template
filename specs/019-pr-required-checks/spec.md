# Feature Specification: main 合并门禁

**Feature Branch**: `chore/019-pr-required-checks`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "当前仓库配置 pr合并必须所有check都过"

**变更类别**: 模板变更

## Clarifications

### Session 2026-11-19

- Q: 门禁强度？ → A: 要求 check 通过、分支必须与 `main` 最新、管理员同样受限。
- Q: 配置落点？ → A: 只改 GitHub 线上设置，仓库不新增文件。
- Q: 必需 check 如何确定？ → A: 以 `ci.yml` 中 PR 触发的 job 为准，当前只有 `check`。

### Session 2026-11-19 第二轮

- Q: 推送与合并的关系？ → A: 允许直接推送 `main`；PR 合并要求全部 check 通过，且分支必须最新。
- Q: 还要限制什么？ → A: 禁止强推 `main`，禁止删除 `main`。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 未通过 check 的 PR 不能合并 (Priority: P1)

开发者提交 PR 后，必需 check 成功前合并保持不可用，管理员同样无法合并。

**Why priority**: `main` 上的每个提交都经过完整质量门禁。

**Independent Test**: 用故意失败的提交开 PR，尝试合并，观察被拒。

**Acceptance Scenarios**:

1. **Given** PR 的 check 正在运行，**When** 尝试合并，**Then** 合并被拒并提示必需 check 未通过。
2. **Given** PR 的 check 失败，**When** 用管理员账号合并，**Then** 合并被拒。
3. **Given** PR 的 check 成功且分支包含 `main` 最新提交，**When** 合并，**Then** 合并成功。

---

### User Story 2 - 分支落后 main 时不能合并 (Priority: P2)

PR 分支落后 `main` 时，即使 check 成功也不能合并，需要先合入 `main` 再重跑 check。

**Why priority**: 检查针对即将进入 `main` 的最终内容运行，合并后的 `main` 才始终通过门禁。

**Independent Test**: 让 `main` 前进一个提交，在旧基线 PR 上合并，观察被拒。

**Acceptance Scenarios**:

1. **Given** PR 基于旧提交且 check 成功，**When** 合并，**Then** 合并被拒并提示分支需要更新。
2. **Given** PR 合入 `main` 后重新通过 check，**When** 合并，**Then** 合并成功。

---

### User Story 3 - main 不可强推、不可删除 (Priority: P3)

维护者可以正常推送 `main`，但无法强推改写历史，也无法删除 `main`。

**Why priority**: 强推与删除会让已验证的历史消失。

**Independent Test**: 在 `main` 上执行强推与删除，观察均被拒。

**Acceptance Scenarios**:

1. **Given** 本地 `main` 有新的普通提交，**When** `git push origin main`，**Then** 推送成功。
2. **Given** 本地 `main` 改写了历史，**When** `git push --force origin main`，**Then** 远端拒绝。
3. **Given** 已登录的管理员，**When** `git push origin --delete main`，**Then** 远端拒绝。

### Edge Cases

- check 被取消：按未通过处理，合并保持不可用。
- CI job 改名：必需 check 名与 job 显示名不一致，PR 持续等待。改名时同步更新规则。
- 新增 PR 触发的 job：新 job 按默认不阻断合并，需要加入必需检查集合。
- 应用规则时已有开放 PR：规则在下次合并判定时生效。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `main` MUST 要求 PR 合并前必需检查全部成功。
- **FR-002**: 必需检查集合 MUST 覆盖 `ci.yml` 中在 PR 触发的全部 job；当前为 `Check (typecheck + lint + test:code + build + test:dist)`。
- **FR-003**: 分支落后 `main` 时 MUST 拒绝合并，直到分支包含 `main` 的最新提交并重新通过检查。
- **FR-004**: 规则 MUST 对管理员生效，绕过名单为空。
- **FR-005**: 直接推送到 `main` MUST 保持可用。
- **FR-006**: 强推 `main` MUST 被拒绝。
- **FR-007**: 删除 `main` MUST 被拒绝。
- **FR-008**: 门禁配置 MUST 只存在于 GitHub 仓库设置，仓库不新增文件。
- **FR-009**: 应用后 MUST 从 GitHub API 读回规则，确认严格校验开启、必需检查齐全、绕过名单为空、强推与删除规则存在。
- **FR-010**: 本次交付的 PR MUST 经新门禁合并，作为真实验证。

### Key Entities *(include if feature involves data)*

- **必需检查集合**：阻止合并的 check 名单，取 PR 触发 workflow 的 job 显示名。
- **主分支规则**：绑定 `main` 的合并条件：必需检查、分支最新、管理员受限、禁止强推、禁止删除。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 未通过 check 的 PR 合并被拒，管理员账号同样被拒。
- **SC-002**: 分支落后 `main` 的 PR 合并被拒。
- **SC-003**: `main` 的强推与删除被拒，普通推送成功。
- **SC-004**: API 读回的规则中严格校验开启、绕过名单为空、必需检查等于当前 PR job 集合、强推与删除规则存在。

## Assumptions

- 仓库为 GitHub 公开仓库 `FanetheDivine/dsh-plugin-template`，默认分支 `main`。
- 当前只有 `.github/workflows/ci.yml` 的 `check` job 在 PR 运行；`publish` job 禁用且只在 tag 运行。
- 门禁由 GitHub 规则集承载；规则集不可用时退回经典分支保护，行为相同。
- Spec Kit 产物按仓库流程提交，门禁规则本身不写入仓库文件。
- 不要求 PR 评审、提交签名与线性历史。
- 允许直接推送 `main`，因此规则集不含「Require a pull request before merging」。
