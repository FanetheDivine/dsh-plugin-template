# Research: 模板转化确认 dsh 升级与提交内容公开引用

## R1 升级确认的位置

- Decision：放在原则 VII 发布设置之前，作为模板转化的独立条目。
- Rationale：升级会改变 `package.json` 与锁文件，先定版本再做发布设置，发布设置只需执行一次。
- Alternatives considered：
  - 放进原则 II：原则 II 管依赖归属，与转化时机无关。
  - 放在发布设置之后：升级后还要复查发布设置。

## R2 升级后的同步动作

- Decision：引用原则 II 与原则 IV 的现有规则，只补充「同步 `minimumReleaseAgeExclude` 的版本号」。
- Rationale：原则 II 已要求 `@deepseek-ai/dsh-*` 加入 `minimumReleaseAgeExclude`，原则 IV 已要求版本变更后提醒实机测试。宪章内只写引用，避免复述。
- Alternatives considered：在原则 VII 中重写两条规则，会产生两份副本。

## R3 公开引用规则的位置与现存违例

- Decision：新增原则 VIII「公开引用」。
- Rationale：规则覆盖全部跟踪文件，与原则 V 的文档结构范围不同，单列一条便于 Constitution Check 逐条核对。
- 现存违例扫描：
  - 方法：在全部跟踪文件中搜索盘符路径、用户主目录、MSYS 盘符根、`file:`、`link:`、`../../`。
  - 违例：`.dsh/skills/real-device-test/scripts/run-test.mjs` 报错信息中作者本机的仓库绝对路径。
  - 允许项：`docs/development.md` 的 `file:///<repo>/dist/index.mjs` 为占位符；`.specify/` 脚本中的 `../..` 指向仓库内；`setup-env.sh` 的 `file:///$PDIR/...` 为运行时生成。
- Alternatives considered：扩展原则 V，会让文档结构原则承担代码与配置的约束。

## R4 版本号

- Decision：1.4.0 → 1.5.0。
- Rationale：新增原则并实质扩展原则 VII，按 Governance 属于 MINOR。
