# 研究：实机测试热更新

**日期**：2026-11-20 | **规格**：[spec.md](./spec.md)

## R1 链接安装

**决策**：搭建脚本用 `dsh plugin --profile <profile> add <repo>` 安装被测插件，profile 记录 `link:<仓库绝对路径>`，`node_modules/<插件>` 成为指向仓库的符号链接。

**理由**：宿主 HMR 只替换「链接包的目标文件」与 profile 目录下安装副本中变化的文件；`node_modules` 下的副本不再随仓库重建而变化。

**验证**：在临时 profile 上执行安装后，`package.json` 记录 `link:D:/...`，`node_modules/dsh-plugin-template` 指向仓库；`run-test.mjs` 的 A1 通过符号链接读到版本与哈希，六个后端用例全部通过。

**备选**：保留 tgz 安装并在重建后同步产物。需要额外的重载触发方式，且同步副本与打包内容分离，未采用。

## R2 HMR 启用方式

**决策**：在实机 profile 的 `cordis.patch.yml` 写入 `- id: hmr` 与 `config.root: ["<repo>/dist"]`。

**理由**：`@deepseek-ai/dsh-base` 在 launcher 提供 `profileContext` 时启用 `hmr` 条目，`root` 默认为空；补丁按 `id` 合并配置。监听根用绝对路径，路径由 `cygpath -m` 生成正斜杠形式。

**验证**：临时 profile 启用监听后，在运行中的驱动里执行一次构建，插件实例 `fiber.uid` 从 `176` 变为 `339`，随后工具调用与配置用例继续通过。

**风险**：HMR 的 `ignored` 默认含 `**/.*`，仓库路径含点目录时监听会被跳过。写入 `pitfalls.md`。

**备选**：设置 `base` 为仓库路径并用相对 `root`。`base` 由 `new URL(config.base, ctx.baseUrl)` 解析，Windows 盘符路径会被当作协议，未采用。

## R3 前端自动更新

**决策**：不做额外处理，说明前端产物由宿主自动替换。

**依据**：`@deepseek-ai/dsh-client-hmr` 每 500 毫秒轮询每个图条目的客户端产物，变化时调用 `clientModules.rebuilt(id)` 并推送重建帧；链接安装下产物路径就是仓库 `dist/client.js`，浏览器端据此替换插件。

**验证**：GUI 端到端确认放在实现后的实机验证，不在研究阶段执行。

## R4 装载用例

**决策**：A1 保持「版本一致 + `dist/index.mjs` 哈希一致」。不新增非链接安装的检测分支。

**理由**：用户确认每轮结束删除 profile，不存在旧安装实例；链接安装下哈希比较读取同一文件，仍能发现仓库与加载产物不一致。

## R5 profile 补丁格式

**决策**：搭建脚本在新建 profile 时整块写入隔离配置与 `hmr` 块；复用已有 profile 时若缺 `hmr` 块则补齐。

**依据**：`dsh --from-default-profile` 生成的 `cordis.patch.yml` 只有注释与 `[]`；直接在 `[]` 后追加列表项会产生非法 YAML（研究中已复现解析错误）。整块写入避开该问题，补齐分支需要先移除 `[]` 占位行。

## R6 每轮清理

**决策**：skill 的收尾阶段删除实机 profile，不再保留。

**理由**：用户确认每次实机结束后删除 profile，旧 profile 不兼容；下一轮重新搭建。

**影响**：`setup-env.sh` 不需要迁移旧安装；A1 不需要旧安装分支；截图与结果文件随 profile 删除，报告需在删除前完成取证。

## R7 Windows 路径与监听

**决策**：`root` 使用 `cygpath -m` 生成的正斜杠绝对路径。

**理由**：现有脚本同样用 `cygpath -m` 处理 node 与 dsh 的路径；YAML 中正斜杠避免转义。

**风险**：仓库位于点目录下时监听被忽略，记入 `pitfalls.md`。

## R8 验证方式

**决策**：实现完成后按 skill 走一次手工验证：启动 GUI、记录进程号、修改插件代码并构建、确认页面与后端行为更新且进程号不变。

**理由**：用户确认不新增脚本化用例；研究阶段已用临时驱动验证了替换机制，GUI 侧需在实现后确认。

## 未决项

无。
