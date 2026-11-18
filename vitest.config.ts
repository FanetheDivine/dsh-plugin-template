import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** 仓库根目录（配置文件所在目录）。 */
const ROOT = path.dirname(fileURLToPath(import.meta.url));

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
  },
});
