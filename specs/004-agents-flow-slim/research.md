# Research: AGENTS.md 开发流程精简与文档归属调整

## R1 规则覆盖核对

- Decision：删除下表中已覆盖的规则，保留两条实施规则。
- Rationale：同一规则只在一处维护。

| `AGENTS.md` 规则 | 覆盖位置 | 处理 |
| --- | --- | --- |
| 分支命名 `<type>/<NNN>-<short-name>` 与 `<type>` 取值 | `speckit-worktree-create` 第 1–3 步，`create-worktree.sh` | 删除 |
| 从 `base_ref` 创建并使用 `--no-track` | `speckit-worktree-create` 第 3 步，`create-worktree.sh` | 删除 |
| worktree 位于 `worktrees/<NNN>-<short-name>` | `create-worktree.sh` | 删除 |
| 后续步骤在 worktree 内进行 | `speckit-worktree-create` 第 4 步 | 删除 |
| 不确定项在 plan 前消除 | `speckit-plan` 遇到未解决的澄清项报错 | 删除 |
| 自测后请用户验收 | `speckit-worktree-finish` Preconditions 与 Deliver 第 1 步 | 删除 |
| 推送、`gh pr create`、`abandon`、删除 worktree 与分支 | `speckit-worktree-finish` | 删除 |
| 每个阶段对应一个 commit | 无。tasks 模板写的是每个任务或一组任务后 commit | 保留 |
| `[P]` 任务交给子代理并行 | 无。`speckit-implement` 只写 `[P]` 任务可一起执行 | 保留 |

- Alternatives considered：
  - 用 `.specify/templates/overrides/tasks-template.md` 承载两条实施规则：用户选择留在 `AGENTS.md`。
  - 直接修改 `.dsh/skills/speckit-*`：spec-kit 升级或扩展重新渲染时会被覆盖。

## R2 原则 V 的归属

- Decision：
  - `AGENTS.md`：通用的信息和指令。
  - 宪章：变更过程中必须遵循的硬约束。
- Rationale：用户指定。开发流程属于每个会话都需要的通用指令，放在 `AGENTS.md`。

## R3 版本号

- Decision：1.5.0 → 1.6.0。
- Rationale：
  - 原则 V 名称与目标不变，只调整两类文档的归属内容，属于实质修改。
  - 开发流程节整体移到 `AGENTS.md`，规则仍然有效。
  - 按 Governance 属于 MINOR，与 1.4.0 修订原则 V 的处理一致。
- Alternatives considered：MAJOR。规则没有被删除或改变含义，不满足 MAJOR 条件。

## R4 引用修正

- Decision：`docs/development.md` 的「执行条件、分支与 worktree 规则见宪章开发流程节」改为链接 `AGENTS.md` 的开发流程节，分支与 worktree 规则由 skill 提供。
- Rationale：宪章删除开发流程节后，原锚点失效。
- 扫描范围：全部跟踪文件中的 `constitution.md#开发流程`。历史 `specs/` 与 CHANGELOG 已发布条目保持不变。
