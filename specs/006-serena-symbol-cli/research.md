# Research: Serena 符号查询

## 参考实现范围

- Decision: 移植 `dsh-plugin-om` 当前 Serena 2.1.0 脚本及其最终安全、工程引用和生命周期行为。
- Rationale: 参考实现已覆盖用户要求的定义、引用、文档、实例管理与 Windows 行为。
- Alternatives considered: 初版单进程脚本缺少实例复用、工程成员解析和安全防护，采用当前完整实现。

## 依赖准备

- Decision: 使用 PEP 723 脚本元数据固定 `serena-agent==2.1.0`，通过 `pnpm serena:setup` 和 `prepare` 调用 `uv`。
- Rationale: 依赖与 CLI 版本同处一个脚本，安装依赖时可复现准备，不增加插件运行依赖。
- Alternatives considered: npm 包装依赖会引入额外发布边界；全局 pip 安装难以固定隔离版本。

## 查询与实例

- Decision: 默认使用每项目一个回环 HTTP 后台实例，以随机 Bearer token、项目锁、原子状态文件和构建摘要保护；启动失败才回退单进程。
- Rationale: 复用语言服务器，避免并发启动竞争；查询提交后不重放，防止重复执行。
- Alternatives considered: 全程单进程实现简单但重复初始化慢；无认证回环服务存在本机请求伪造风险。

## 工程成员解析

- Decision: 在独立 Node helper 中加载调用者指定的受信任 TypeScript 编译器，仅解析配置 API 和显式源文件集合，并跟踪配置依赖使缓存失效。
- Rationale: 支持 `extends`、JSONC、工程引用与 `allowJs`，同时避免执行项目代码和配置插件。
- Alternatives considered: 手工解析 JSON 无法完整支持继承和引用；让语言服务器自由扫描会扩大成员范围并产生不稳定引用结果。

## 测试策略

- Decision: Vitest 驱动真实 `uv` CLI 与临时项目，Python `unittest` 覆盖无语言服务器的错误边界，并用模板现有 `parseEchoArgs`、`planArchive` 等符号替换参考仓库专属夹具。
- Rationale: 同时验证外部行为与关键内部边界，测试目标在模板仓库中真实存在。
- Alternatives considered: 全部 mock 无法证明 Serena、语言服务器和后台实例协作；复制参考仓库硬编码路径会在模板中失败。

## CI 与发布边界

- Decision: check 和 publish 两个 job 都在 `pnpm install` 前安装 uv 与 Python 3.12；忽略 `.serena/`，沿用现有 `files` 白名单。
- Rationale: 两个 job 都会执行 `prepare`；开发脚本不进入 npm 包。
- Alternatives considered: 只在 check 安装 uv 会使 publish 的依赖安装失败。
