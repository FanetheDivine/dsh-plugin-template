import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** 仓库根目录（配置文件所在目录）。 */
const ROOT = path.dirname(fileURLToPath(import.meta.url));

/** 读取 dist 的产物测试，由 build 末尾的 test:dist 执行。 */
const DIST_TESTS = ['tests/client-bundle.test.ts', 'tests/package-pack.test.ts'];

export default defineConfig({
  resolve: {
    // 平台种子包按源码解析：已发布的 lib 内联了大量未声明的依赖，源码只依赖
    // react、clsx 与 dsh-client-store，见 tests/support/primitives.ts。
    alias: [
      {
        find: /^@deepseek-ai\/dsh-client-ui-primitives$/,
        replacement: path.join(ROOT, 'tests', 'support', 'primitives.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    // worktrees/ contains full checkouts; exclude them from test discovery.
    exclude: ['worktrees/**', 'node_modules/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'code',
          include: ['tests/**/*.test.ts', 'tests/**/*.test.mjs'],
          exclude: [...DIST_TESTS, 'worktrees/**', 'node_modules/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dist',
          include: DIST_TESTS,
        },
      },
    ],
  },
});
