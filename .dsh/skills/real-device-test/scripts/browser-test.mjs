// 实机测试浏览器驱动：用 Playwright 驱动无头 Chrome 打开 GUI，执行对话、插件页与配置页流程。
// 用法：在 profile 目录运行 node browser-test.mjs；RDT_REPO 必填，RDT_GUI_URL 由 gui-up.sh 导出。
// env：RDT_HEADLESS=0 显示浏览器；RDT_SHOTS 截图目录，默认 profile 目录下的 shots。
// 结果写入 browser-results.json，全部通过时退出码为 0。

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = process.env.RDT_PROFILE_DIR ?? dirname(fileURLToPath(import.meta.url));
const url = process.env.RDT_GUI_URL;
if (!url) throw new Error('RDT_GUI_URL 必填：先 eval $(bash gui-up.sh <profile名>)');
const REPO = process.env.RDT_REPO;
if (!REPO) throw new Error('RDT_REPO 必填：插件仓库绝对路径');
const PLUGIN = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).name;
/** 插件在界面上的显示名：宿主优先显示元数据标题，缺失时回落包名。 */
const DISPLAY_NAMES = [
  ...new Set([
    ...['zh', 'en'].flatMap((lang) => {
      try {
        const meta = JSON.parse(readFileSync(join(REPO, 'locale', `${lang}.json`), 'utf8')).meta;
        return typeof meta?.title === 'string' ? [meta.title] : [];
      } catch {
        return [];
      }
    }),
    PLUGIN,
  ]),
];
/** 为每个显示名拼出带前缀的按钮标签，如「查看 插件模板」。 */
const withNames = (prefixes) =>
  prefixes.flatMap((prefix) => DISPLAY_NAMES.map((name) => `${prefix} ${name}`));
const shots = process.env.RDT_SHOTS ?? join(root, 'shots');
mkdirSync(shots, { recursive: true });

/** GUI 的中英文标签，按顺序尝试，取第一个存在的。 */
const LABELS = {
  welcome: ['继续', 'Continue'],
  workspace: ['选择工作区', 'Choose workspace'],
  send: ['发送消息', 'Send message'],
  newSession: ['新建会话', 'New session'],
  plugins: ['插件', 'Plugins'],
  installed: ['已安装插件', 'Installed plugins'],
  view: ['查看', 'View'],
  configure: ['配置', 'Configure'],
  turn: /已完成|Completed/,
  toolGroup: ['已调用工具', 'Called tools'],
  save: ['保存', 'Save'],
  prefixLabel: ['回显前缀', 'Echo prefix'],
  invalidPrefix: [
    '前缀需要至少一个非空白字符。',
    'The prefix needs at least one non-blank character.',
  ],
};

const results = [];

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

/** 关闭可能出现的欢迎弹窗。 */
async function dismissWelcome(page) {
  for (const name of LABELS.welcome) {
    const btn = page.getByRole('button', { name, exact: true });
    if (await btn.count()) {
      await btn.first().click();
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

/** 输入框。hero 与已打开的会话都只有一个可编辑元素。 */
const composer = (page) => page.locator('textarea, [contenteditable="true"]').first();

/** 按中英文标签依次尝试点击一个按钮。 */
async function clickLabel(page, names, exact = true) {
  for (const name of names) {
    const btn = page.getByRole('button', { name, exact });
    if (await btn.count()) {
      await btn.first().click();
      return true;
    }
  }
  return false;
}

/** 打开插件页。 */
async function openPluginsPage(page) {
  if (!(await clickLabel(page, LABELS.plugins))) throw new Error('找不到插件页入口');
  await page.waitForTimeout(1500);
}

/** 打开被测插件的行配置页：插件页 → 包详情 → 行配置。 */
async function openRowConfig(page) {
  await openPluginsPage(page);
  const card = page.locator(`[data-plugin-package="${PLUGIN}"]`);
  await card.waitFor({ state: 'visible', timeout: 60000 });
  if (!(await clickLabel(page, withNames(LABELS.view)))) {
    throw new Error(`找不到 ${PLUGIN} 的详情入口`);
  }
  if (!(await clickLabel(page, withNames(LABELS.configure)))) {
    throw new Error(`找不到 ${PLUGIN} 行的配置入口`);
  }
  await page.locator('[data-plugin-config]').waitFor({ state: 'visible', timeout: 30000 });
}

/** 在配置页里按标签找控件：`switch` 与 `button` 按角色找，其余按关联标签找。 */
async function configControl(page, names, role = 'label') {
  for (const name of names) {
    const control =
      role === 'switch'
        ? page.getByRole('switch', { name, exact: true })
        : role === 'button'
          ? page.getByRole('button', { name, exact: true })
          : page.getByLabel(name, { exact: true });
    if (await control.count()) return control.first();
  }
  throw new Error(`找不到控件：${names.join(' / ')}`);
}

/** 新建会话，发送带前缀标记的消息，等待工具回显。 */
async function sendEcho(page, marker, timeout = 60000) {
  if (!(await clickLabel(page, LABELS.newSession))) throw new Error('找不到新建会话入口');
  await page.waitForTimeout(2000);
  const box = composer(page);
  await box.waitFor({ state: 'visible' });
  await box.click();
  await box.fill(`ECHO_CASE:${marker}`);
  await clickLabel(page, LABELS.send, false);
  await page.getByText(`mock：工具返回 [${marker}]`, { exact: false }).first().waitFor({ timeout });
}

const browser = await chromium.launch({
  channel: 'chrome',
  headless: process.env.RDT_HEADLESS !== '0',
});
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);

try {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (resp?.status() !== 200) throw new Error(`打开 GUI 失败：HTTP ${resp?.status()}`);
  await page.waitForTimeout(5000);
  const dismissed = await dismissWelcome(page);
  console.log('GUI 已加载', JSON.stringify({ welcome: dismissed }));

  await check('C1 对话冒烟：工具卡片与回复', async () => {
    // 工作区未就绪时先选择测试仓库
    const placeholder = await composer(page).getAttribute('placeholder');
    if (placeholder && /选择.*工作区|Choose a workspace/.test(placeholder)) {
      await page.getByRole('button', { name: LABELS.workspace[0] }).first().click();
      await page.waitForTimeout(1500);
      await page.getByRole('treeitem').first().click();
      await page.waitForTimeout(2000);
    }
    const box = composer(page);
    await box.click();
    await box.fill('ECHO_CASE:gui');
    await clickLabel(page, LABELS.send, false);
    // 前缀由持久化配置决定，只断言回显形状
    await page
      .getByText(/mock：工具返回 \[[^\]]+\]/)
      .first()
      .waitFor({ timeout: 60000 });
    await page.screenshot({ path: join(shots, 'c1-reply.png'), fullPage: true });

    // 展开本轮，读取工具卡片
    const turn = page.getByText(LABELS.turn).last();
    if (await turn.count()) {
      await turn.click();
      await page.waitForTimeout(1200);
    }
    for (const name of LABELS.toolGroup) {
      const btn = page.getByRole('button', { name });
      if (await btn.count()) {
        await btn.first().click();
        await page.waitForTimeout(1200);
        break;
      }
    }
    const text = await page.locator('body').innerText();
    if (!/demo_echo/.test(text)) throw new Error('对话中没有 demo_echo 工具卡片');
    await page.screenshot({ path: join(shots, 'c1-toolcard.png'), fullPage: true });
    return { reply: true, toolCard: 'demo_echo' };
  });

  await check('C3 前端示例：输入区上方出现示例行且可交互', async () => {
    const row = page.locator('[data-dsh-template-demo]');
    await row.waitFor({ state: 'visible', timeout: 30000 });
    const counter = row.locator('[data-dsh-template-demo-count]');
    const before = (await counter.innerText()).trim();
    await row.getByRole('button').first().click();
    await page.waitForTimeout(500);
    const after = (await counter.innerText()).trim();
    if (before === after) throw new Error(`点击后计数未变化：${before}`);
    await page.screenshot({ path: join(shots, 'c3-demo-dock.png'), fullPage: true });
    return { before, after };
  });

  await check('C2 插件页：被测插件已安装且启用', async () => {
    await openPluginsPage(page);
    // 插件清单首次加载要读取整个宿主包树，可能超过 10 秒；等到已安装区出现再断言
    await page.getByText(LABELS.installed[0], { exact: false }).first().waitFor({ timeout: 60000 });
    // 插件卡片以包名标记，显示名随语言与元数据变化
    const card = page.locator(`[data-plugin-package="${PLUGIN}"]`);
    await card.waitFor({ state: 'visible', timeout: 60000 });
    // 宿主用 role=switch 的控件承载启用状态，aria-label 为「启用 <显示名>」
    const toggle = card.getByRole('switch');
    if (!(await toggle.count())) throw new Error(`${PLUGIN} 没有启用开关`);
    const enabled = (await toggle.first().getAttribute('aria-checked')) === 'true';
    await page.screenshot({ path: join(shots, 'c2-plugins.png'), fullPage: true });
    if (!enabled) throw new Error(`${PLUGIN} 的启用开关为关闭状态`);
    return { plugin: PLUGIN, listed: true, enabled };
  });

  await check('C4 配置页：改前缀保存后热重载生效', async () => {
    await openRowConfig(page);
    const toggle = await configControl(page, ['启用 demo 工具', 'Enable the demo tool'], 'switch');
    if ((await toggle.getAttribute('aria-checked')) !== 'true')
      throw new Error('demo 开关初始应为开');
    const prefix = await configControl(page, LABELS.prefixLabel);
    // 取一个与当前值不同的前缀，重复运行也能观察到变化
    const current = await prefix.inputValue();
    const next = current === 'gui' ? 'gui2' : 'gui';
    await prefix.fill(next);
    const save = await configControl(page, LABELS.save, 'button');
    if (await save.isDisabled()) throw new Error('改前缀后保存按钮应可用');
    await save.click();
    // 宿主异步写盘，最多轮询 15 秒
    let patch = '';
    for (let waited = 0; waited < 15000; waited += 500) {
      await page.waitForTimeout(500);
      patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8');
      if (patch.includes(`prefix: ${next}`)) break;
    }
    if (!patch.includes(`prefix: ${next}`)) throw new Error(`cordis.patch.yml 未写入 ${next}`);
    await page.screenshot({ path: join(shots, 'c4-config.png'), fullPage: true });

    // 不重启 GUI：新会话的工具回显已使用新前缀
    await sendEcho(page, next);
    await page.screenshot({ path: join(shots, 'c4-echo.png'), fullPage: true });
    return { prefix: next, patch: 'cordis.patch.yml' };
  });

  await check('C5 空白前缀被拒绝，无效草稿不写入', async () => {
    /** profile 补丁里写入的前缀。 */
    const storedPrefix = () => {
      const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8');
      return /^\s*prefix:\s*(.*)$/m.exec(patch)?.[1] ?? '';
    };
    await openRowConfig(page);
    const before = storedPrefix();
    const prefix = await configControl(page, LABELS.prefixLabel);
    await prefix.fill('   ');
    await page.waitForTimeout(500);
    const save = await configControl(page, LABELS.save, 'button');
    if (!(await save.isDisabled())) throw new Error('空白前缀时保存按钮应禁用');
    const text = await page.locator('[data-plugin-config]').innerText();
    const shown = LABELS.invalidPrefix.some((message) => text.includes(message));
    if (!shown) throw new Error('没有显示非法前缀提示');
    if (storedPrefix() !== before)
      throw new Error(`空白草稿改变了配置：${before} -> ${storedPrefix()}`);
    await page.screenshot({ path: join(shots, 'c5-invalid.png'), fullPage: true });

    // 保存合法前缀，保证重复运行时的初始状态稳定
    await prefix.fill('rdt');
    await save.click();
    await page.waitForTimeout(2500);
    return { invalidRejected: true, restored: 'rdt' };
  });
} catch (e) {
  console.error(e);
  results.push({ label: 'FATAL', status: 'FAIL', error: e?.stack ?? String(e) });
} finally {
  writeFileSync(join(root, 'browser-results.json'), JSON.stringify(results, null, 2));
  await context.close();
  await browser.close();
}

const fail = results.filter((r) => r.status === 'FAIL').length;
console.log('RDT_BROWSER_DONE', JSON.stringify({ pass: results.length - fail, fail }));
process.exit(fail ? 1 : 0);
