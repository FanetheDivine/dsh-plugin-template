# Research: 插件元数据国际化与规范

## 宿主如何读取插件元数据

- Decision: 元数据放 `locale/<语言 id>.json` 的 `meta` 下，经 `package.json` 的 `./locale/*.json` 导出；不写 `meta.detail`。
- Rationale: 安装版 `@deepseek-ai/dsh-client-locale` 与 dsh-doc 的宿主约定一致说明：插件面板与设置页在不激活插件时读取导出的 locale JSON；缺字段回落 `package.json` 的 `name` 与 `description`；未声明 `meta.detail` 时详情页使用包 README。
- Alternatives considered: 把文案写进 `package.json` 的 `description`。切语言不生效，被否决。声明 `meta.detail` 指向预览图文档。模板没有特性图，且宿主约定只允许一张图，被否决。

## 语言集合

- Decision: 只提供 `zh` 与 `en`。
- Rationale: 前端字典的基线语言就是这两个，元数据与服务端字典保持同一集合；其他内置语言由使用者按文档新增，模板不承担 8 份文案的维护成本。
- Alternatives considered: 补齐宿主 8 种内置语言。键集与文案维护成本高，模板收益低，被否决。

## 前端字典与元数据的分工

- Decision: 组件文案走 `ctx.locale.register(NS, { zh, en })` 与槽位 `locale` 选项；元数据只负责插件行与详情页。
- Rationale: 两者由宿主不同代码路径读取，字典进浏览器，元数据由宿主读文件；混用会让停用状态下的元数据显示不全。
- Alternatives considered: 在元数据里重复组件文案。两处维护，切换语言时不同步，被否决。

## 校验方式

- Decision: JSON 结构与键集由 `tests/metadata.test.ts` 断言，打包内容由 `tests/package-pack.test.ts` 断言；不写运行时校验代码。
- Rationale: 元数据在安装时读取，加载期校验只会让插件加载失败；测试能在提交前暴露缺字段、键集不一致与漏打包。
- Alternatives considered: 在 `apply` 里校验 `locale/*.json`。宿主读取发生在插件激活之前，校验位置错误，被否决。

## 禁用字符

- Decision: 测试拒绝元数据与前端字典中的 U+200B 与 U+FEFF。
- Rationale: 宿主首方仓库的 `check:i18n` 使用同一规则；模板没有该脚本，用测试覆盖等价约束。
- Alternatives considered: 引入宿主脚本。它依赖宿主仓库结构，模板不可复现，被否决。

## 文档与宪章的归属

- Decision: 全部国际化规范写 `docs/i18n.md`；宪章新增原则 IX 只写硬约束；`README.md` 写一句用户可见行为；`AGENTS.md` 加索引条目。
- Rationale: 宪章原则 V 要求每条信息单一归属。原则可被 plan 与 analyze 逐条核对，步骤说明放在 `docs/`。
- Alternatives considered: 规范并入 `docs/development.md`。会把流程与国际化混在一份文档，用户已选择独立文件。

## 宪章修订

- Decision: 新增原则 IX「国际化」，版本 1.8.0 → 1.9.0，同步影响报告记录新增原则与模板核对结论。
- Rationale: 治理条款规定新增原则属 MINOR 变更；现有原则 I–VIII 不受影响。
- Alternatives considered: 把国际化条目并入原则 V 文档结构。约束对象是文案与资源，与文档分工不同，被否决。
