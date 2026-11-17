import { defineConfig } from 'tsdown';

/**
 * 把插件入口打包为单个 ESM 文件。
 * npm 依赖保持 external，类型声明由 tsc -p tsconfig.build.json 生成。
 */
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  deps: {
    // 运行时使用宿主提供的依赖实例
    neverBundle: true,
    // 需要打包进产物的依赖
    alwaysBundle: [],
  },
  fixedExtension: true,
  dts: false,
  clean: true,
});
