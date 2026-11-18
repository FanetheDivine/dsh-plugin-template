# Quickstart: 产物测试的构建新鲜度

先决条件：Node.js 24.9+、pnpm 11、已执行 `pnpm install`。

在仓库根目录依次执行：

```sh
# 1. 干净检出（无 dist）上源码测试通过
rm -rf dist
pnpm test:code

# 2. 无产物时产物测试给出构建提示
pnpm test:dist
# 预期：失败，信息包含 dist/client.js 等缺失文件与「pnpm build」

# 3. 构建产物并自动运行产物测试
pnpm build
# 预期：tsdown、tsc 依次完成，test:dist 通过；末尾不出现构建动作

# 4. 产物新鲜时产物测试不再构建
pnpm test:dist
# 预期：通过，输出中没有 tsdown/tsc

# 5. 让产物过期
touch src/client/index.ts
pnpm test:dist
# 预期：失败，信息包含 src/client/index.ts 晚于产物

# 6. 恢复新鲜并跑完整检查
pnpm build
pnpm check
# 预期：typecheck、lint、test:code 全部通过，不读取 dist
```

重新克隆后执行 `pnpm check && pnpm build`，两项都应一次通过。