// 工具声明测试：全部已注册工具的 parameters 必须是宿主可克隆的无损 JSON，
// 且 demo_echo 的手写声明与 zod 投影一致。宿主限制解除前的写法见 src/demo-tool.ts。
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ECHO_ARGS_SCHEMA, ECHO_PARAMETERS } from '../src/demo-tool.ts';
import { apply } from '../src/index.ts';
import { makeCtx } from './helpers.ts';
import { assertLosslessJson, LosslessJsonError } from './support/lossless-json.ts';

/** 取出声明里的 parameters 字段。 */
function parametersOf(tool: unknown): Record<string, unknown> {
  const definition = tool as { name?: string; parameters?: Record<string, unknown> };
  if (definition.parameters === undefined) {
    throw new Error(`工具 ${definition.name ?? '<unknown>'} 缺少 parameters`);
  }
  return definition.parameters;
}

/** zod 投影：剔除模型不需要的 `$schema` 与不可枚举的 `~standard`。 */
function zodProjection(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _schema, ...parameters } = z.toJSONSchema(schema) as Record<string, unknown>;
  return parameters;
}

describe('已注册工具的声明', () => {
  const ctx = makeCtx();
  apply(ctx, {});

  it('经真实注册入口收集到工具', () => {
    expect(ctx._registeredTools.length).toBeGreaterThan(0);
  });

  it('全部声明都是无损 JSON', () => {
    for (const tool of ctx._registeredTools) {
      expect(() => assertLosslessJson(parametersOf(tool))).not.toThrow();
    }
  });

  it('声明不含 $schema 与 ~standard', () => {
    for (const tool of ctx._registeredTools) {
      const parameters = parametersOf(tool);
      expect(Object.hasOwn(parameters, '$schema')).toBe(false);
      expect(Object.hasOwn(parameters, '~standard')).toBe(false);
    }
  });
});

describe('手写声明与 zod 投影一致', () => {
  it('剔除 $schema 与 ~standard 后结构相等', () => {
    expect(ECHO_PARAMETERS).toEqual(zodProjection(ECHO_ARGS_SCHEMA));
  });

  it('声明是对象根，text 必填', () => {
    expect(ECHO_PARAMETERS.type).toBe('object');
    expect(ECHO_PARAMETERS.required).toEqual(['text']);
    expect(ECHO_PARAMETERS.properties.text.type).toBe('string');
  });

  it('zod 原始输出通不过校验，这是手写声明的原因', () => {
    // 宿主升级后若已能直接接受该输出，可删除 ECHO_PARAMETERS 与上一条一致性断言，
    // 改为 parameters: z.toJSONSchema(ECHO_ARGS_SCHEMA)。核对项见 docs/development.md。
    expect(() => assertLosslessJson(z.toJSONSchema(ECHO_ARGS_SCHEMA))).toThrow(LosslessJsonError);
  });
});

describe('无损 JSON 校验', () => {
  it('通过时返回深拷贝，副本与原始互不影响', () => {
    const source = { type: 'object', properties: { text: { type: 'string' } } };
    const copy = assertLosslessJson(source) as typeof source;
    expect(copy).toEqual(source);
    expect(copy).not.toBe(source);
    expect(copy.properties).not.toBe(source.properties);
    copy.properties.text.type = 'number';
    expect(source.properties.text.type).toBe('string');
  });

  it('拒绝不可枚举键', () => {
    const value = { type: 'object' };
    Object.defineProperty(value, 'hidden', { value: 1, enumerable: false });
    expect(() => assertLosslessJson(value)).toThrow(/hidden/);
  });

  it('拒绝嵌套的不可枚举键', () => {
    const inner = { type: 'string' };
    Object.defineProperty(inner, 'hidden', { value: 1, enumerable: false });
    expect(() => assertLosslessJson({ properties: { text: inner } })).toThrow(/hidden/);
  });

  it('拒绝符号键', () => {
    expect(() => assertLosslessJson({ [Symbol('k')]: 1 })).toThrow(/符号键/);
  });

  it('拒绝 NaN、Infinity 与 -0', () => {
    expect(() => assertLosslessJson({ v: Number.NaN })).toThrow(/有限数字/);
    expect(() => assertLosslessJson({ v: Number.POSITIVE_INFINITY })).toThrow(/有限数字/);
    expect(() => assertLosslessJson({ v: -0 })).toThrow(/有限数字/);
  });

  it('拒绝循环引用', () => {
    const value: Record<string, unknown> = { type: 'object' };
    value.self = value;
    expect(() => assertLosslessJson(value)).toThrow(/循环引用/);
  });

  it('拒绝类实例', () => {
    class Custom {
      type = 'object';
    }
    expect(() => assertLosslessJson(new Custom())).toThrow(/原型/);
  });

  it('拒绝稀疏数组', () => {
    // biome-ignore lint/suspicious/noSparseArray: 构造稀疏数组是本用例的目的
    const sparse = [1, , 3];
    expect(() => assertLosslessJson(sparse)).toThrow(/连续下标/);
  });

  it('拒绝数组附加属性', () => {
    const list = [1, 2] as number[] & { extra?: number };
    list.extra = 3;
    expect(() => assertLosslessJson(list)).toThrow(/连续下标/);
  });

  it('接受 null、布尔、字符串与有限数字', () => {
    expect(assertLosslessJson(null)).toBeNull();
    expect(assertLosslessJson(true)).toBe(true);
    expect(assertLosslessJson('x')).toBe('x');
    expect(assertLosslessJson(0)).toBe(0);
  });
});
