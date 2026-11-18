# Feature Specification: 产物测试的构建新鲜度

**Feature Branch**: `fix/012-bundle-artifact-freshness`

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "@tests/client-bundle.test.ts 这个测试会在产物过时的时候失效"

**变更类别**: 模板变更（宪章原则 VII）

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 源码测试与产物测试分开运行 (Priority: P1)

开发者修改源码后运行 `pnpm test:code` 或 `pnpm check`，只跑源码测试，不读取 `dist`；需要验证产物时运行 `pnpm build`，构建完成后自动运行产物测试。

**Why this priority**: 当前测试只在产物缺失时构建。产物存在但已过期时，测试读取旧产物，断言结果与源码无关：源码改动会让测试误报失败，源码破坏也可能让测试误报通过，测试失去回归价值。

**Independent Test**: 修改 `src/client/index.ts` 的注入列表但不构建，先运行 `pnpm test:code`（不受影响），再运行 `pnpm test:dist`，得到产物过期的明确提示，运行 `pnpm build` 后全部通过。

**Acceptance Scenarios**:

1. **Given** 产物存在且早于源码修改，**When** 运行 `pnpm test:dist`，**Then** 测试失败，错误信息要求运行 `pnpm build`。
2. **Given** 产物与构建输入一致，**When** 运行 `pnpm test:dist`，**Then** 测试直接断言产物，不触发构建。
3. **Given** 仓库没有产物（干净克隆），**When** 运行 `pnpm test:dist`，**Then** 测试失败，错误信息要求运行 `pnpm build`。
4. **Given** 产物过期，**When** 运行 `pnpm build`，**Then** 构建重建产物，随后产物测试通过。
5. **Given** 源码无法构建，**When** 运行 `pnpm build`，**Then** 构建失败并输出构建错误，产物测试不执行。
6. **Given** 产物过期，**When** 运行 `pnpm check`，**Then** 检查照常通过，全程不读取 `dist`。

---

### User Story 2 - 打包测试共用同一新鲜度规则 (Priority: P2)

`tests/package-pack.test.ts` 也读取 `dist`，过期产物会让打包断言检查旧内容。两个产物测试共用同一新鲜度检查。

**Why this priority**: 同一缺陷出现在第二个测试文件里；逐个修复会再次遗漏。共用规则一次覆盖。

**Independent Test**: 让 `dist` 过期后单独运行 `tests/package-pack.test.ts`，得到与前端产物测试相同的过期提示。

**Acceptance Scenarios**:

1. **Given** 产物过期，**When** 运行打包测试，**Then** 测试失败并提示运行 `pnpm build`。
2. **Given** 产物新鲜，**When** 运行打包测试，**Then** 直接断言 tarball 内容。

---

### Edge Cases

- 产物目录只存在部分文件（例如只有 `dist/client.js`）时视为过期。
- 构建输入包含源码、打包配置与决定包名、依赖的 `package.json`；其中任一项晚于产物即视为过期。
- 产物测试失败时不读取产物，避免基于旧内容断言。
- 断言内容与当前源码的契约保持一致：包名注册、`inject` 列表、槽位注册。
- 并行运行多个产物测试文件时，过期检查各自执行，结果一致。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `test:dist` MUST 在执行断言前检查产物缺失与过期状态。
- **FR-002**: 产物缺失或任一构建输入晚于产物时，`test:dist` MUST 失败，错误信息给出修复命令 `pnpm build`。
- **FR-003**: `test:dist` MUST 复用仓库既有的构建输入定义，不在测试里维护打包配置。
- **FR-004**: `build` MUST 在生成产物与类型声明后运行 `test:dist`；构建失败时 MUST 不运行 `test:dist`。
- **FR-005**: `check` MUST 只运行源码测试，不读取 `dist`。
- **FR-006**: 前端产物契约测试 MUST 继续断言当前契约：按包名注册闭包工厂、导出 `inject` 与 `apply`、注册两个槽位。
- **FR-007**: `tests/client-bundle.test.ts` 与 `tests/package-pack.test.ts` MUST 共用同一新鲜度检查。
- **FR-008**: 新鲜度检查 MUST 覆盖仓库定义的构建输入与全部发布产物。

### Key Entities

- **构建输入**：参与打包与类型生成的仓库文件，包括 `src/`、`tsdown.config.ts`、`tsconfig.json`、`tsconfig.build.json` 与 `package.json`。
- **产物**：`pnpm build` 生成的 `dist/client.js`、`dist/index.mjs`、`dist/index.d.ts` 与 `dist/client/index.d.ts`。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 产物过期时，运行产物测试的开发者看到的第一条失败信息包含 `pnpm build`，无需阅读测试源码。
- **SC-002**: 产物新鲜时，`pnpm test:dist` 不触发构建，断言直接执行。
- **SC-003**: `pnpm check` 在没有任何产物时一次通过。
- **SC-004**: 干净克隆上运行 `pnpm build` 一次通过，产物测试针对本次构建结果执行。
- **SC-005**: 产物过期不再产生与源码无关的断言结果。

## Assumptions

- 产物测试属于构建验证，由 `build` 触发；源码测试是默认回归入口。
- 新鲜度以文件时间戳与文件存在性判断，不引入构建缓存。
- CI 的 `full-check` 保持 `check` 后接 `build`，产物测试随构建执行。
- 只调整脚本、测试与文档，不改变产物格式、导出契约与发布内容。