# 任务：实机测试热更新

**输入**：`specs/020-hot-plugin-update/` 下的 plan.md、spec.md、research.md、data-model.md、quickstart.md

**前提**：规格与计划均为 Approved，无待确认决策。

**组织方式**：按用户故事分阶段；每个阶段对应一个 commit。

## 格式

- `[P]`：可并行，与其他任务不改同一文件
- `[USn]`：对应用户故事

## 阶段 1：搭建脚本（基础）

**目标**：实机 profile 以链接方式加载仓库产物，并启用 HMR 监听。

- [ ] T001 在 `.dsh/skills/real-device-test/scripts/setup-env.sh` 第 4 步把 `pnpm pack` 与 tgz 安装改为 `dsh plugin --profile "$PROFILE" add "$REPO"`，删除 tgz 相关变量
- [ ] T002 在 `.dsh/skills/real-device-test/scripts/setup-env.sh` 第 5 步生成的 `cordis.patch.yml` 中加入 `- id: hmr` 与 `config.root: ["$REPO/dist"]`；复用已有 profile 且缺该块时补齐，并先移除孤立的 `[]` 占位行
- [ ] T003 更新 `.dsh/skills/real-device-test/scripts/setup-env.sh` 末尾提示，写明构建后自动生效与轮次结束删除 profile
- [ ] T004 阶段 1 提交：只包含上述脚本改动

## 阶段 2：热更新说明（US1）

**目标**：skill 写明「改代码 → 构建 → 同一实例生效」，并完成一次实机确认。

**独立测试**：启动 GUI，改工具说明并构建，界面与工具行为更新且进程号不变。

- [ ] T005 [US1] 在 `.dsh/skills/real-device-test/SKILL.md` 增加迭代小节：`pnpm build` 或 `pnpm dev` 后同一实例自动替换后端与前端，不重装、不重启，并给出观察方法
- [ ] T006 [US1] 按 quickstart 做一次实机确认：链接安装、构建、观察新行为、记录进程号不变，结论写入报告
- [ ] T007 [US1] 阶段 2 提交

## 阶段 3：skill 主流程与排错（US2）

**目标**：模型按 skill 就能完成迭代，遇到问题能自查。

**独立测试**：只读 skill 即可复现「改代码 → 构建 → 观察」，排错条目覆盖常见失败。

- [ ] T008 [P] [US2] 在 `.dsh/skills/real-device-test/SKILL.md` 阶段 0 增加「先构建」，阶段 1 说明链接安装与 HMR 补丁
- [ ] T009 [P] [US2] 在 `.dsh/skills/real-device-test/references/pitfalls.md` 新增「热更新」条目：构建后无变化、仓库路径含点目录、加载旧产物、前端未更新
- [ ] T010 [P] [US2] 在 `.dsh/skills/real-device-test/references/cases.md` 增加热更新验证步骤与报告结构中的「热更新验证」一节
- [ ] T011 [US2] 阶段 3 提交

## 阶段 4：装载校验与清理（US3）

**目标**：A1 文案与链接安装一致，收尾删除 profile，记录变更。

**独立测试**：跑 `node run-test.mjs`，A1 通过且文案指向仓库 `dist`；按 skill 收尾后 profile 不存在。

- [ ] T012 [P] [US3] 在 `.dsh/skills/real-device-test/scripts/run-test.mjs` 更新 A1 用例标题与失败提示，指向链接安装与仓库 `dist`，断言不变
- [ ] T013 [P] [US3] 在 `.dsh/skills/real-device-test/SKILL.md` 阶段 5 改为先写报告与保留截图、再结束 GUI、最后删除 profile
- [ ] T014 [P] [US3] 在 `CHANGELOG.md` 增加本分支条目
- [ ] T015 [US3] 阶段 4 提交

## 阶段 5：收尾（Polish）

- [ ] T016 运行 `pnpm format && pnpm check`
- [ ] T017 全量实机回归：按 skill 搭建、跑后端与浏览器用例、再做一次热更新验证
- [ ] T018 阶段 5 提交

## 依赖与顺序

- 阶段 1 先完成，其后的验证才能进行。
- 阶段 2 依赖阶段 1；阶段 3 与阶段 4 可并行开展，但提交按阶段分开。
- 阶段 5 依赖前四个阶段。

## 并行示例

```text
T008、T009、T010 可同时进行（不同文件）
T012、T013、T014 可同时进行（不同文件）
```

## 实施策略

先完成阶段 1 并用临时 profile 验证链接安装与 HMR；再补 skill 文档；最后统一回归。
