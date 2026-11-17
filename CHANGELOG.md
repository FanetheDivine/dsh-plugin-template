# Changelog

## Unreleased

### Changed

- `README.md` 补齐功能、安装、配置与工具
- `docs/` 增加前端加载、构建、验证与风险说明
- `speckit-worktree-finish` 交付流程改为创建 PR 后等待 CI、冲突与评审，合并后删除远程分支、本地分支与 worktree；清理脚本新增 `--merged` 与 `REMOTE_DELETED`
- `AGENTS.md` 要求在用户给出需求、缺陷或其他变更要求时立刻获取 skill `speckit-specify`；删除交互指令与 `before_specify` 钩子说明，步骤表 skill 名去除斜杠
- 升级宿主依赖 `@deepseek-ai/dsh-agent` / `@deepseek-ai/dsh-tools` 至 `0.2.2-rc.3`，`@deepseek-ai/cordis` 至 `~4.1.0`，`zod` 至 `4.6.6`
- `engines.node` 改为 `>=24.9.0`，`@types/node` 升到 24.x，对齐 DSH 的 Node 24 要求
- `src/events.ts` 删除 `agent/session-start` 监听，创建来源改由 `agent/created` 记录
- `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 换为 `0.2.2-rc.3`
- 宪章升到 v1.7.0：原则 I 新增模板定位与宿主依赖版本规则——版本以 `@deepseek-ai/dsh` 的最新发布为准，没有对应版本的 `@deepseek-ai/*` 依赖从模板移除
- 宪章升到 v1.6.0：
  - 原则 V 中 `AGENTS.md` 归属为通用的信息和指令，宪章归属为变更过程中必须遵循的硬约束
  - 「开发流程」节移至 `AGENTS.md`
- `AGENTS.md` 开发流程节只保留步骤表与实施规则，分支、worktree、澄清与收尾规则由对应 skill 提供
- `docs/development.md` 的开发流程链接指向 `AGENTS.md`
- 宪章升到 v1.5.0：
  - 原则 VII 要求模板转化在发布设置之前向用户确认是否把全部 `@deepseek-ai/dsh-*` 依赖升级到最新版本
  - 新增原则 VIII「公开引用」：提交内容只能引用公网 URL 或仓库内路径
- `AGENTS.md` 写明仓库内的任何变更都按 Spec Kit 流程开发
- 实机测试脚本 `run-test.mjs` 报错信息中的示例路径改为占位符
- `docs/how-it-works.md` 与 `docs/known-risks.md` 中复述宪章原则 II、III 的规则改为链接
- `speckit-worktree-finish` 的 CHANGELOG 规则来源改为宪章原则 V
- `docs/development.md` 的 Spec Kit 流程节只保留命令与产物表，测试要求与流程规则改为链接宪章
- `AGENTS.md` 只保留交互指令、写作规范、Spec Kit 流程入口与文档索引，流程细则与文档分级移入宪章
- 宪章升到 v1.4.0：
  - 原则 V 改为「文档结构」：说明 README、`AGENTS.md`、宪章、`docs/`、代码注释的读者与归属内容，禁止相互复述
  - 「开发流程」节承载全部流程规则，clarify 改为存在不确定项时执行，基线取 `base_ref`
  - Governance 新增优先级：用户的明确要求优先于宪章，冲突时先提示再执行
- 升级宿主依赖 `@deepseek-ai/dsh-agent` / `@deepseek-ai/dsh-tools` 至 `0.1.0-rc.8`
- CI 的 `check` job 统一到 Node 24，`publish` job 改为 `if: false` 默认禁用，原触发条件以注释保留
- 宪章升到 v1.3.0：原则 VII 增加模板转化的发布步骤（清空 `package.json` 的 `version`、解禁 `publish`、提醒用户配置 npm Trusted Publisher）
- 实机测试的浏览器用例改用 `playwright` 驱动本机 Chrome 无头运行，新增 `scripts/browser-test.mjs`，`playwright` 加入 `devDependencies`
- mock provider 识别 `role: 'tool'` 的工具结果消息
- 宪章升到 v1.2.0：
  - 原则 II 改为「依赖归属」：宿主提供的依赖保持 external，宿主未提供的依赖加入 `dependencies` 并列入 `tsdown.config.ts` 的 `alwaysBundle`
  - 原则 IV 要求 `dsh` 版本变更后提醒用户执行实机测试
  - 原则 V 只保留文档分级与同步义务，写作规范由 `AGENTS.md` 承载
  - 新增原则 VII「模板定位」：spec 声明模板变更或模板转化，模板转化须重新修订宪章与 `AGENTS.md`
- `AGENTS.md` 只保留每个会话都需要的指令与通用信息，开发约定移入宪章
- 文档改为三级结构：`AGENTS.md` 与 README 说明规则和用户用法，`docs/` 说明机制、风险与开发，代码注释说明文件与函数职责
- README 收敛为面向插件用户的说明：功能、安装、配置与工具
- 宪章升到 v1.1.0：原则「文档描述现状」改为「文档人类友好」，加入三级文档要求与写作规范
- `speckit-worktree-create` 命令改为工具无关描述：先 `--dry-run` 获取参数，支持用原生工具或脚本创建 worktree
- `finish-worktree.sh` 在 `git worktree remove --force` 失败时回退到 `node rmSync` + `git worktree prune`，处理 Windows 长路径

### Added

- 前端示例：浏览器入口在 Web GUI 会话输入区上方注册示例行，含中英文字典与计数按钮
- 浏览器构建组：`tsdown.config.ts` 以闭包工厂产出 `dist/client.js`，平台种子保持 external
- `package.json` 的 `./client` 导出与 `dsh.client` 声明，新增 React 与客户端宿主包开发依赖
- 测试 `tests/client.test.ts`、`tests/client-bundle.test.ts`；打包测试覆盖前端产物；实机浏览器用例 C3
- `docs/how-it-works.md`、`docs/known-risks.md`、`docs/development.md` 三个开发者文档
- AGENTS.md 写作规范：简洁优先、不自造术语、长内容用列表或表格、少用括号、优先肯定句、禁用堆叠否定
- 项目 skill `real-device-test`：在真实宿主上验证插件装载、真实对话链路、配置热更新与 GUI 展示
  - `scripts/setup-env.sh` 对齐宿主版本、创建 profile、安装插件、写隔离配置并注册工作区
  - `scripts/run-test.mjs` 与 `scripts/mock-provider.mjs` 运行后端用例，结果写入 `results.json`
  - `scripts/gui-up.sh` 启动 GUI 并导出访问地址
  - `references/cases.md` 说明用例推导与报告结构，`references/pitfalls.md` 记录宿主差异与环境问题
  - 已在宿主 0.1.0-rc.8 与 0.2.1-rc.5 上验证通过
- 项目 skill `release`：发布新版本、跟踪 CI 并核对 npm 版本
- 接入 [Spec Kit](https://github.com/github/spec-kit)（`specify init --integration dsh --script sh`）作为唯一开发流程：`.dsh/skills/speckit-*` 规格驱动开发 skill 与 `.specify/` 模板、脚本
- 项目宪章 `.specify/memory/constitution.md`
- 本地 Spec Kit 扩展 `worktree`：`/speckit-specify` 前创建分支与嵌套 worktree，`/speckit-worktree-finish` 推送并创建 PR 或放弃，并清理 worktree；脚本由 `tests/worktree-extension.test.ts` 覆盖
- 插件工程骨架：`scripts/release-archive.mjs` CHANGELOG 归档脚本与 `changelogs/` 归档目录、`pnpm run release` 脚本、CI 的类型检查与发布流程

### Removed

- 项目级 skill `dsh-plugin-coding`（由 Spec Kit 流程取代）
