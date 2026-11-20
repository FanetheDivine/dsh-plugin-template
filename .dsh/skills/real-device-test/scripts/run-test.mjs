// 实机测试后端驱动：在真实宿主中加载已安装的插件与 mock provider，逐条运行用例。
// 用法：在 profile 目录运行 node run-test.mjs；RDT_KEEPALIVE=1 时结束后保留运行时。
// env：RDT_REPO 必填；RDT_PROFILE_DIR 默认脚本所在目录；RDT_PROFILE 默认目录名；RDT_DSH_PKG 默认全局宿主。
// 结果写入 results.json，全部通过时退出码为 0。
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { plain, TOOL_NAME } from './mock-provider.mjs';

const root = process.env.RDT_PROFILE_DIR ?? dirname(fileURLToPath(import.meta.url));
const REPO = process.env.RDT_REPO;
if (!REPO) throw new Error('RDT_REPO 必填：插件仓库绝对路径，例如 <drive>:/path/to/<repo>');
const PLUGIN = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;
const dshPkg =
  process.env.RDT_DSH_PKG ??
  join(execSync('npm root -g', { encoding: 'utf8' }).trim(), '@deepseek-ai', 'dsh', 'package.json');

// 清理上一轮残留，固定的 sessionId 会与落盘会话冲突
for (const f of ['test-sessions', 'requests.jsonl', 'results.json', 'fatal.txt'])
  rmSync(join(root, f), { recursive: true, force: true });

const require = createRequire(dshPkg);
const { createUserMessage } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-llm')));
const { createLaunchEnvironmentSnapshot } = await import(
  pathToFileURL(require.resolve('@deepseek-ai/dsh-launch-environment'))
);
const { runProfile } = await loadRunProfile(join(dirname(dshPkg), 'lib'));

/** 加载宿主的 runProfile。新版宿主提供 lib/profile-boot.js，旧版只有带 hash 的 profile-boot-*.js。 */
async function loadRunProfile(libDir) {
  const files = readdirSync(libDir)
    .filter((f) => /^profile-boot.*\.js$/.test(f))
    .sort((a, b) => a.length - b.length);
  for (const f of files) {
    const mod = await import(pathToFileURL(join(libDir, f)));
    if (typeof mod.runProfile === 'function') return mod;
  }
  throw new Error(`${libDir} 中找不到 runProfile`);
}

process.env.DSH_PROFILE = process.env.RDT_PROFILE ?? basename(root);
process.env.DSH_PROFILE_DIR = root;
process.env.DSH_TELEMETRY_DISABLED = '1';
const runtime = await runProfile({
  profile: process.env.DSH_PROFILE,
  environment: createLaunchEnvironmentSnapshot([{ source: 'process', values: process.env }]),
  patchFiles: [],
  args: ['--no-open', '--port', '0'],
});
const app = runtime.ctx;
const adapter = app.get('rdtMock');
const entry = [...app.loader.entries()].find((e) => e.options.name === PLUGIN);
const results = [];
const handles = [];

/** cordis fiber 状态：2 为已激活，3 为 apply 抛错。 */
const FIBER_ACTIVE = 2;
const FIBER_FAILED = 3;

/** 测试使用的基础配置。 */
const base = { prefix: 'rdt' };

/** 热更新插件配置并等待插件重新激活。 */
async function config(patch = {}) {
  await entry.update({ config: { ...base, ...patch } });
  await app.loader.await();
}

/** 用 mock 模型创建会话。 */
async function create(id) {
  const h = await app.agents.create({
    sessionId: id,
    meta: { cwd: REPO },
    agentOptions: { provider: 'mock', model: 'mock-model' },
  });
  handles.push(h);
  return h.agent;
}

/** 发送一条用户消息并等待本轮结束，返回本轮的模型请求。 */
async function turn(agent, text, timeout = 20000) {
  const n = adapter.calls.length;
  agent.followup(
    createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } }),
  );
  let timer;
  try {
    await Promise.race([
      agent.whenIdle(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`TEST_TIMEOUT ${agent.session.id}`)), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  const calls = adapter.calls.slice(n);
  assert(
    calls.every((c) => c.provider === 'mock'),
    '出现了发往真实模型的请求',
  );
  return calls;
}

/** 会话事件列表。新版宿主提供 snapshotEvents()，旧版只有 events 属性。 */
const events = (agent) =>
  typeof agent.session.snapshotEvents === 'function'
    ? agent.session.snapshotEvents()
    : agent.session.events;

/** 会话事件中指定类型的事件。 */
const typed = (agent, type) => events(agent).filter((e) => e.type === type);
/** 工具结果的文本。 */
const toolResults = (agent) => typed(agent, 'tool/result').map((e) => plain([e.data.message]));
/** 请求中是否携带被测工具。 */
const hasTool = (call) => (call.tools ?? []).some((t) => t.name === TOOL_NAME);

/** 运行一条用例并记录结果。 */
async function check(label, fn) {
  try {
    const detail = await fn();
    results.push({ label, status: 'PASS', detail });
    console.log('PASS', label, JSON.stringify(detail ?? {}));
  } catch (e) {
    results.push({ label, status: 'FAIL', error: e?.stack ?? String(e) });
    console.error('FAIL', label, e?.stack ?? e);
  }
}

try {
  await check('A1 插件装载且与仓库 dist 一致', async () => {
    assert(adapter, 'mock provider 未加载');
    assert(entry, `loader 中找不到 ${PLUGIN}`);
    assert.equal(entry.fiber.state, FIBER_ACTIVE, '插件未激活');
    const providers = await app.llm.listProviders();
    assert(
      providers.some((p) => p.id === 'mock'),
      'provider 列表缺少 mock',
    );
    const installed = join(root, 'node_modules', PLUGIN);
    const version = (dir) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
    assert.equal(version(installed), version(REPO), '加载的版本与仓库不一致');
    const hash = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 12);
    const sha = hash(join(installed, 'dist', 'index.mjs'));
    assert.equal(sha, hash(join(REPO, 'dist', 'index.mjs')), '加载产物与仓库 dist 不一致');
    return { version: version(installed), sha };
  });
  if (results.at(-1)?.status !== 'PASS') throw new Error('装载失败，中止后续用例');

  await check('B1 模型调用 demo_echo 并收到回显', async () => {
    await config();
    const a = await create('rdt-echo');
    const calls = await turn(a, 'ECHO_CASE:hello');
    assert(hasTool(calls[0]), '首个请求未携带 demo_echo');
    assert.equal(calls.length, 2, '应为工具调用与最终回复两次请求');
    const out = toolResults(a);
    assert.equal(out.length, 1);
    assert.equal(out[0], `[rdt] (session ${a.id}) hello`);
    return { toolResult: out[0] };
  });

  await check('B2 热更新 prefix 后回显使用新前缀', async () => {
    const uid = entry.fiber?.uid;
    await config({ prefix: 'hot' });
    assert.equal(entry.fiber.state, FIBER_ACTIVE);
    assert.equal(entry.fiber?.uid, uid, 'volatile 配置不应重新挂载插件');
    const a = await create('rdt-prefix');
    await turn(a, 'ECHO_CASE:again');
    const out = toolResults(a);
    assert(out[0]?.startsWith('[hot] '), `回显前缀错误：${out[0]}`);
    return { toolResult: out[0], sameInstance: true };
  });

  await check('B3 demoEnabled=false 时工具不出现在请求中', async () => {
    await config({ demoEnabled: false });
    assert.equal(entry.fiber.state, FIBER_ACTIVE);
    const a = await create('rdt-disabled');
    const calls = await turn(a, 'ECHO_CASE:off');
    assert(!calls.some(hasTool), '停用后请求仍携带 demo_echo');
    assert.equal(toolResults(a).length, 0);
    return { requests: calls.length };
  });

  await check('B4 未知配置键使插件加载失败，恢复后重新激活', async () => {
    // 新版宿主把 apply 异常记在 fiber.state，旧版直接在 update 时抛出
    let rejected = false;
    try {
      await config({ unknownKey: 1 });
    } catch (e) {
      rejected = true;
      assert.match(String(e), /unknown config key/, `错误信息应指出未知键：${e}`);
    }
    if (!rejected) assert.equal(entry.fiber.state, FIBER_FAILED, '未知键时插件应处于加载失败状态');
    const a = await create('rdt-bad-config');
    const calls = await turn(a, 'ECHO_CASE:bad');
    assert(!calls.some(hasTool), '加载失败时请求仍携带 demo_echo');
    await config();
    assert.equal(entry.fiber.state, FIBER_ACTIVE, '恢复配置后插件应重新激活');
    return { rejectedAtUpdate: rejected, recovered: true };
  });

  await check('B5 热重载不重启：工具随配置重新注册', async () => {
    await config({ prefix: 'rdt', demoEnabled: true });
    const uid = entry.fiber?.uid;
    assert(uid, '插件未激活');
    const description = () => app.tools.get(TOOL_NAME)?.description ?? '';

    await config({ demoEnabled: true, prefix: 'live' });
    assert.equal(entry.fiber?.uid, uid, '改 prefix 后插件被重新挂载');
    assert(description().includes('live'), `工具说明未使用新前缀：${description()}`);

    await config({ demoEnabled: false, prefix: 'live' });
    assert.equal(entry.fiber?.uid, uid, '注销工具时插件被重新挂载');
    assert.equal(app.tools.get(TOOL_NAME), undefined, '关闭后工具仍然注册');

    await config({ demoEnabled: true, prefix: 'back' });
    assert.equal(entry.fiber?.uid, uid, '注册工具时插件被重新挂载');
    assert(description().includes('back'), `工具未按新前缀重新注册：${description()}`);

    const a = await create('rdt-hot');
    await turn(a, 'ECHO_CASE:hot');
    assert.equal(toolResults(a)[0], `[back] (session ${a.id}) hot`);
    return { uid, prefix: 'back' };
  });

  writeFileSync(join(root, 'results.json'), JSON.stringify(results, null, 2));
  const fail = results.filter((r) => r.status === 'FAIL').length;
  console.log('RDT_DONE', JSON.stringify({ pass: results.length - fail, fail }));
  if (process.env.RDT_KEEPALIVE === '1') {
    console.log('RDT_KEEPALIVE');
  } else {
    for (const h of handles.reverse()) await h.dispose();
    await runtime.shutdown.shutdown(fail ? 1 : 0);
  }
} catch (e) {
  console.error(e);
  writeFileSync(join(root, 'fatal.txt'), e?.stack ?? String(e));
  await check('B5 热重载不重启：工具随配置重新注册', async () => {
    await config({ prefix: 'rdt', demoEnabled: true });
    const uid = entry.fiber?.uid;
    assert(uid, '插件未激活');
    const description = () => app.tools.get(TOOL_NAME)?.description ?? '';

    await config({ demoEnabled: true, prefix: 'live' });
    assert.equal(entry.fiber?.uid, uid, '改 prefix 后插件被重新挂载');
    assert(description().includes('live'), `工具说明未使用新前缀：${description()}`);

    await config({ demoEnabled: false, prefix: 'live' });
    assert.equal(entry.fiber?.uid, uid, '注销工具时插件被重新挂载');
    assert.equal(app.tools.get(TOOL_NAME), undefined, '关闭后工具仍然注册');

    await config({ demoEnabled: true, prefix: 'back' });
    assert.equal(entry.fiber?.uid, uid, '注册工具时插件被重新挂载');
    assert(description().includes('back'), `工具未按新前缀重新注册：${description()}`);

    const a = await create('rdt-hot');
    await turn(a, 'ECHO_CASE:hot');
    assert.equal(toolResults(a)[0], `[back] (session ${a.id}) hot`);
    return { uid, prefix: 'back' };
  });

  writeFileSync(join(root, 'results.json'), JSON.stringify(results, null, 2));
  await runtime.shutdown.shutdown(1);
}
