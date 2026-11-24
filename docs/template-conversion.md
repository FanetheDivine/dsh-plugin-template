# 模板定位与转化

本仓库是 DSH 插件模板。每个需求按变更类别处理。

## 变更类别

每个 spec MUST 声明变更类别：

| 类别 | 含义 |
| --- | --- |
| 模板变更 | 改进模板本身的机制、流程、文档与示例 |
| 模板转化 | 把模板改造成实际插件，替换示例实现与仓库标识 |

无法归类时 MUST 在 clarify 阶段向用户确认类别。

## 模板变更

- 保持 `demo_echo` 示例、README 与测试可用。
- README 与插件功能一致。

## 模板转化

按顺序完成：

1. 重新修订宪章与 `AGENTS.md`：
   - 删除模板相关的约定，包括 `AGENTS.md` 的模板说明。
   - 更新项目名、包名、README 与 `cordis.patch.yml`。
   - 宪章版本号按语义化规则递增，并记录修订理由。
2. 发布设置之前，向用户确认是否把依赖对齐到 npm 上最新的 `@deepseek-ai/dsh`：
   - 用户确认：按[宪章](../.specify/memory/constitution.md)原则 I 升级全部 `@deepseek-ai/*` 依赖并同步 `minimumReleaseAgeExclude`，按原则 II 提醒实机测试。
   - 用户拒绝：依赖版本保持不变。
3. 发布设置：
   1. 清空 `package.json` 的 `version`，由具体插件填入自己的首个版本号。
   2. 恢复 `.github/workflows/ci.yml` 中 `publish` job 被注释的 `if: startsWith(github.ref, 'refs/tags/')`，并删除 `if: false`。
   3. 提醒用户把 npm Trusted Publisher 绑定到新仓库与 `.github/workflows/ci.yml`。
   4. 清空过往 spec 与 changelog。

模板与插件的约束不同。混用会让模板示例与真实插件相互拖累。
