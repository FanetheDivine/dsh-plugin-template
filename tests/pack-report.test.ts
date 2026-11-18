// 打包报告解析的回归测试：npm 11 输出数组，npm 12 输出以包名为键的对象。
import { describe, expect, it } from 'vitest';

import { packedFilePaths } from './support/pack-report.ts';

/** 单个包的报告：文件列表是解析唯一读取的字段。 */
const PACK_REPORT = {
  name: 'demo-pkg',
  version: '1.0.0',
  files: [{ path: 'dist/index.mjs' }, { path: 'README.md' }],
};

describe('打包报告解析（npm pack --json）', () => {
  it('接受 npm 11 的数组形状', () => {
    expect(packedFilePaths([PACK_REPORT])).toEqual(['dist/index.mjs', 'README.md']);
  });

  it('接受 npm 12 的对象形状', () => {
    expect(packedFilePaths({ 'demo-pkg': PACK_REPORT })).toEqual(['dist/index.mjs', 'README.md']);
  });

  it('跳过缺少 files 的包', () => {
    expect(packedFilePaths([{ name: 'empty' }, PACK_REPORT])).toEqual([
      'dist/index.mjs',
      'README.md',
    ]);
  });

  it('拒绝其他形状并带出输出片段', () => {
    expect(() => packedFilePaths(null)).toThrow(TypeError);
    expect(() => packedFilePaths(null)).toThrow(/null/);
    expect(() => packedFilePaths('[]')).toThrow(/\[\]/);
  });
});
