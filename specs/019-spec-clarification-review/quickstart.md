# 验证指南：两段访谈与审查门禁

## 前置条件

- 在功能 worktree 中执行。
- 已安装仓库现有依赖。

## 文档审查

1. 检查 `AGENTS.md`：clarify 为必做；plan 包含技术探索、实现细节访谈和计划审查。
2. 检查 `speckit-specify`：创建草稿与待确认列表，完成报告固定进入 clarify。
3. 检查 `speckit-clarify`：先探索，再按依赖分批确认全部独立问题，最后请求完整规格审查。
4. 检查 `speckit-plan`：先核验规格状态，再完成计划与设计，分批确认实现细节，最后请求完整计划审查。
5. 检查 `speckit-tasks` 与 `speckit-implement`：未批准、未豁免或存在未豁免待确认决策时停止。
6. 检查 spec/plan 模板：包含状态、待确认决策、澄清记录与审查记录。
7. 检查审查失效规则：实质修改回到 `Draft`，历史记录保留，部分认可不能推进。
8. 检查未新增 Node.js 门禁脚本、JSON 状态文件、外部 workflow 修改或插件运行时代码变更。

## Manifest 核对

计算修改后的 skill 与模板 SHA-256，核对：

- `.specify/integrations/dsh.manifest.json`
- `.specify/integrations/speckit.manifest.json`

清单值必须与实际文件一致。

## 仓库检查

```sh
git diff --check
pnpm format && pnpm check
pnpm run full-check
```

## 验收边界

按用户决定，本次不运行真实 DSH 会话验证，不新增流程行为测试。实际模型是否充分探索和提问，由后续实际使用验收。
