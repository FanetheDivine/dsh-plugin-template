// 实机测试浏览器驱动：用 Playwright 驱动无头 Chrome 打开 GUI，执行对话与插件页流程。
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
  turn: /已完成|Completed/,
  toolGroup: ['已调用工具', 'Called tools'],
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
    const reply = 'mock：工具返回 [rdt]';
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
    for (const name of LABELS.send) {
      const btn = page.getByRole('button', { name });
      if (await btn.count()) {
        await btn.first().click();
        break;
      }
    }
    // 等回复出现，最多 60 秒
    await page.getByText(reply, { exact: false }).first().waitFor({ timeout: 60000 });
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
    const repo = process.env.RDT_REPO;
    if (!repo) throw new Error('RDT_REPO 必填');
    const plugin = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).name;
    let opened = false;
    for (const name of LABELS.plugins) {
      const btn = page.getByRole('button', { name, exact: true });
      if (await btn.count()) {
        await btn.first().click();
        opened = true;
        break;
      }
    }
    if (!opened) throw new Error('找不到插件页入口');
    // 插件清单首次加载要读取整个宿主包树，可能超过 10 秒；等到已安装区出现再断言
    await page.getByText(LABELS.installed[0], { exact: false }).first().waitFor({ timeout: 60000 });
    await page.getByText(plugin, { exact: false }).first().waitFor({ timeout: 60000 });
    const text = await page.locator('body').innerText();
    if (!text.includes(plugin)) throw new Error(`插件页未列出 ${plugin}`);
    // 宿主用 role=switch 的控件承载启用状态，aria-label 为「启用 <插件名>」
    const toggle = page.getByRole('switch', { name: `启用 ${plugin}`, exact: true });
    if (!(await toggle.count())) throw new Error(`${plugin} 没有启用开关`);
    const enabled = (await toggle.first().getAttribute('aria-checked')) === 'true';
    await page.screenshot({ path: join(shots, 'c2-plugins.png'), fullPage: true });
    if (!enabled) throw new Error(`${plugin} 的启用开关为关闭状态`);
    return { plugin, listed: true, enabled };
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
