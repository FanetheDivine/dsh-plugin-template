# Research: npm 12 下包内容测试兼容

## R1 输出形状

- Decision: 解析函数同时接受数组与以包名为键的对象，两种形状都按「包的集合」处理，值里的 `files[].path` 汇总成路径列表。
- Rationale:
  - npm 11.19.1 的 `npm pack --dry-run --json` 输出单元素数组。
  - npm 12.2.3 输出 `{ "<包名>": { ... } }`，单个包的报告字段与数组元素一致。
  - 本机实测两份输出，`files[].path` 结构相同。
- Alternatives considered:
  - 只支持对象：npm 11 与本机 Node 24 自带的 npm 会失败。
  - 按 npm 主版本分支：需要探测 `npm --version`，多一次进程调用，也要处理版本解析失败。

## R2 解析函数的位置

- Decision: 新增 `tests/support/pack-report.ts`，导出 `packedFilePaths(report: unknown): string[]`。
- Rationale:
  - 纯函数，可被 `code` project 直接单测。
  - `tests/support/` 不进包，不影响发布内容。
  - 与 `tests/support/dist-freshness.ts` 同层，符合现有结构。
- Alternatives considered:
  - 留在 `tests/package-pack.test.ts` 内：该文件属于 `dist` project，单测需要先构建产物，回归成本高。

## R3 CI 的 npm 版本来源

- Decision: 删除 publish job 的 `npm install -g npm@latest`，用 `actions/setup-node` 安装的 Node 24 自带 npm。
- Rationale:
  - Node 24.22.2 自带 npm 11.19.1，满足 Trusted Publishing 的 npm ≥ 11.5.1。
  - `npm@latest` 是随时间漂移的输入：npm 12.2.3 发布后，未改动的仓库打 tag 即失败。
  - 用户已确认删除该步骤。
- Alternatives considered:
  - 固定 `npm@12`：同样可复现，但要随 npm 主版本手动跟进，且与 Node 自带的 npm 形成两份来源。
  - 保留 `npm@latest`：漂移仍在，下次 npm 改动输出格式会再失败一次。

## R4 回归测试层级

- Decision: 解析的四种输入放 `tests/pack-report.test.ts`（`code` project）；真实 `npm pack` 调用与 tarball 断言留在 `tests/package-pack.test.ts`（`dist` project）。
- Rationale:
  - 形状解析与 npm 进程、`dist` 产物无关，用纯函数测试即可定位。
  - tarball 断言需要真实构建产物，继续留在产物测试里。
- Alternatives considered:
  - 在 `dist` project 里对两种形状各跑一次真实 `npm pack`：多一次跨版本安装，CI 变慢。

## R5 非法形状的失败信息

- Decision: 遇到数组与对象之外的输入抛 `TypeError`，消息带 `JSON.stringify(report)` 的前 200 个字符。
- Rationale:
  - 下次 npm 改格式时，失败信息直接给出实际输出，免去翻日志找原始 JSON。
  - `JSON.stringify` 对 `undefined`、函数返回 `undefined`，用 `String(report)` 兜底。
- Alternatives considered:
  - 返回空数组：断言层报缺失文件，掩盖输出格式变化。
