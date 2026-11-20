# Research: 前端 UI 链接使用完整 URL

## Desktop 的前端页面加载方式

- Decision: 文档写成「Desktop 用应用内地址加载前端页面，相对链接指向该地址，打不开目标」。
- Rationale: DSH Desktop 通过应用内协议提供页面资源，证据是 `@deepseek-ai/dsh-client-ui-primitives` 里的 `dsh-app://app/...` 媒体路由。相对 `href` 以页面地址为基准解析，落到应用内部路由，目标页面不存在。
- Alternatives: 在文档里写具体协议名。协议属于宿主实现细节，写完整 URL 的规则即可，读者不需要知道协议。

## 规则放在哪一节

- Decision: `docs/development.md` 的「前端构建」之后新增「前端 UI 链接」。
- Rationale: 「前端构建」是文档里唯一讲前端实现的地方，规则紧邻构建说明，读者按顺序阅读即可看到。
- Alternatives: 放进 `docs/i18n.md` 或 `docs/how-it-works.md`。两者讲文案与机制，离 UI 写法更远。

## 规则覆盖范围

- Decision: 只覆盖前端 UI 的 `a` 标签，`README.md` 与 `meta.detail` 文档不在本次范围。
- Rationale: 用户明确限定为「插件的前端 UI」。
- Alternatives: 同时覆盖详情文档的 Markdown 链接。详情页对 Markdown 链接的渲染规则不同，需要单独的需求确认。

## 写法要求

- Decision: 要求 `href` 含协议与主机，示例用 `https://github.com/FanetheDivine/dsh-plugin-template`。
- Rationale: 完整 URL 的判定标准是可解析出协议与主机；示例给出可复制的写法。
- Alternatives: 只写「完整 URL」不给示例。模型容易写成 `/docs` 这类路径。

## 验证方式

- Decision: 文档审读加 `pnpm format && pnpm check`，不新增测试。
- Rationale: 没有代码变更；宪章原则 II 的测试要求针对代码。
- Alternatives: 增加检查相对链接的 lint。需要解析 Markdown，且现有文档没有违规，超出本次范围。

## CHANGELOG

- Decision: 交付前按分支规则补条目。
- Rationale: 宪章原则 III 要求其他分支在 push 或 merge 时增加条目。
