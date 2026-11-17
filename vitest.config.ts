import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // worktrees/ contains full checkouts; exclude them from test discovery.
    exclude: ['worktrees/**', 'node_modules/**'],
  },
});
