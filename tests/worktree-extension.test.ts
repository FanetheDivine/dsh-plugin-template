// Spec Kit worktree 扩展脚本测试：在临时 git 仓库（含 bare origin）里运行
// .specify/extensions/worktree/scripts/bash 下的 create-worktree.sh / finish-worktree.sh，
// 断言分支命名、编号、平行 worktree 位置、复用与清理行为。
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** 仓库根目录（tests/ 的上一级）。 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXT_DIR = path.join(ROOT, '.specify', 'extensions', 'worktree');

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function run(cmd: string, args: string[], cwd: string): RunResult {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: GIT_ENV });
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

function git(cwd: string, ...args: string[]): string {
  const res = run('git', args, cwd);
  if (res.status !== 0) throw new Error(`git ${args.join(' ')} 失败：${res.stderr}`);
  return res.stdout.trim();
}

function script(cwd: string, name: string, ...args: string[]): RunResult {
  return run('bash', [`.specify/extensions/worktree/scripts/bash/${name}`, ...args], cwd);
}

/** 在临时仓库把特性分支合入 main 并推送，模拟 PR 合并后的状态。 */
function mergeIntoMain(cwd: string, branch: string): void {
  git(cwd, 'merge', '--quiet', '--no-ff', '--no-edit', branch);
  git(cwd, 'push', '--quiet', 'origin', 'main');
}

/** 在临时 origin 旁再建一个克隆，模拟第二名开发者。 */
function secondClone(base: string): string {
  const clone = path.join(base, 'dev2');
  git(base, 'clone', '--quiet', path.join(base, 'origin.git'), clone);
  return clone;
}

/** 在克隆中从 main 建分支并推送，然后回到 main。 */
function pushBranch(clone: string, branch: string): void {
  git(clone, 'checkout', '--quiet', '-B', branch, 'main');
  git(clone, 'push', '--quiet', 'origin', branch);
  git(clone, 'checkout', '--quiet', 'main');
}

/** 远程分支名列表，去掉 refs/heads/ 前缀。 */
function remoteBranches(cwd: string): string[] {
  return git(cwd, 'ls-remote', '--heads', 'origin')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('\t')[1]?.replace('refs/heads/', '') ?? '');
}

function json(res: RunResult): Record<string, string | boolean> {
  if (res.status !== 0) throw new Error(`脚本失败：${res.stderr}`);
  return JSON.parse(res.stdout.trim().split('\n').pop() ?? '{}');
}

describe('worktree 扩展脚本', { timeout: 30_000 }, () => {
  let base: string;
  let repo: string;

  beforeEach(() => {
    base = mkdtempSync(path.join(tmpdir(), 'speckit-wt-'));
    const origin = path.join(base, 'origin.git');
    repo = path.join(base, 'proj');
    git(base, 'init', '--quiet', '--bare', '-b', 'main', origin);
    git(base, 'clone', '--quiet', origin, repo);
    git(repo, 'checkout', '--quiet', '-b', 'main');
    mkdirSync(path.join(repo, '.specify', 'extensions'), { recursive: true });
    cpSync(EXT_DIR, path.join(repo, '.specify', 'extensions', 'worktree'), { recursive: true });
    writeFileSync(path.join(repo, '.specify', 'init-options.json'), '{}\n');
    mkdirSync(path.join(repo, 'specs', '001-first'), { recursive: true });
    writeFileSync(path.join(repo, 'specs', '001-first', 'spec.md'), '# first\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '--quiet', '-m', 'init');
    git(repo, 'push', '--quiet', '-u', 'origin', 'main');
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  /** 在 repo 的 main 上提交一个文件并推送，模拟基线前进。 */
  function advanceMain(name: string, content: string): void {
    writeFileSync(path.join(repo, name), content);
    git(repo, 'add', '-A');
    git(repo, 'commit', '--quiet', '-m', `main: ${name}`);
    git(repo, 'push', '--quiet', 'origin', 'main');
  }

  it('在 worktrees/ 下创建 <type>/<NNN>-<slug> 分支的 worktree，主工作区 HEAD 不变', () => {
    const out = json(
      script(repo, 'create-worktree.sh', '--json', '--type', 'fix', '--short-name', 'User Auth'),
    );
    expect(out.BRANCH_NAME).toBe('fix/002-user-auth');
    expect(out.FEATURE_NUM).toBe('002');
    expect(out.FEATURE_DIRECTORY).toBe('specs/002-user-auth');
    expect(out.BASE_REF).toBe('origin/main');
    expect(out.CREATED).toBe(true);
    expect(out.IN_WORKTREE).toBe(false);
    // Script outputs an MSYS path; verify by checking the last two segments and existence.
    expect(String(out.WORKTREE_PATH).replace(/\\/g, '/').endsWith('worktrees/002-user-auth')).toBe(
      true,
    );

    const wt = path.join(repo, 'worktrees', '002-user-auth');
    expect(existsSync(path.join(wt, '.specify', 'init-options.json'))).toBe(true);
    expect(git(wt, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('fix/002-user-auth');
    expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main');
    // --no-track：新分支不跟踪 base ref
    expect(run('git', ['rev-parse', '--abbrev-ref', '@{u}'], wt).status).not.toBe(0);
  });

  it('编号取 specs 与本地/远程分支中的最大值 + 1', () => {
    git(repo, 'branch', 'feat/007-other');
    const out = json(
      script(repo, 'create-worktree.sh', '--json', '--dry-run', '--short-name', 'next'),
    );
    expect(out.BRANCH_NAME).toBe('feat/008-next');
    expect(out.CREATED).toBe(false);
    expect(existsSync(path.join(repo, 'worktrees', '008-next'))).toBe(false);
  });

  it('创建时推送占号分支，CLAIMED 为 true', () => {
    const out = json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'claimed'));
    expect(out.CLAIMED).toBe(true);
    expect(remoteBranches(repo)).toContain('feat/002-claimed');
  });

  it('--dry-run 不占号也不创建 worktree', () => {
    const out = json(
      script(repo, 'create-worktree.sh', '--json', '--dry-run', '--short-name', 'dry'),
    );
    expect(out.CLAIMED).toBe(false);
    expect(out.CREATED).toBe(false);
    expect(remoteBranches(repo)).not.toContain('feat/002-dry');
    expect(existsSync(path.join(repo, 'worktrees', '002-dry'))).toBe(false);
  });

  it('占号推送失败时中止且不留下分支与 worktree', () => {
    git(repo, 'remote', 'set-url', 'origin', path.join(base, 'missing.git'));
    const res = script(
      repo,
      'create-worktree.sh',
      '--json',
      '--no-fetch',
      '--short-name',
      'offline',
    );
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('failed to push claim branch');
    expect(git(repo, 'branch', '--list', 'feat/002-offline')).toBe('');
    expect(existsSync(path.join(repo, 'worktrees', '002-offline'))).toBe(false);
  });

  it('同号冲突时字典序靠后的分支自动改号', () => {
    const dev2 = secondClone(base);
    pushBranch(dev2, 'fix/002-alpha');
    const out = json(
      script(
        repo,
        'create-worktree.sh',
        '--json',
        '--no-fetch',
        '--type',
        'fix',
        '--short-name',
        'zeta',
      ),
    );
    expect(out.FEATURE_NUM).toBe('003');
    expect(out.CLAIMED).toBe(true);
    const branches = remoteBranches(repo);
    expect(branches).toContain('fix/002-alpha');
    expect(branches).toContain('fix/003-zeta');
    expect(branches).not.toContain('fix/002-zeta');
  });

  it('同号冲突时字典序靠前的分支保留编号', () => {
    const dev2 = secondClone(base);
    pushBranch(dev2, 'fix/002-beta');
    const out = json(
      script(
        repo,
        'create-worktree.sh',
        '--json',
        '--no-fetch',
        '--type',
        'fix',
        '--short-name',
        'alpha',
      ),
    );
    expect(out.FEATURE_NUM).toBe('002');
    expect(out.BRANCH_NAME).toBe('fix/002-alpha');
    expect(remoteBranches(repo)).toContain('fix/002-beta');
  });

  it('check-spec-number：编号唯一时退出 0', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'unique'));
    const wt = path.join(repo, 'worktrees', '002-unique');
    const out = json(script(wt, 'check-spec-number.sh', '--json'));
    expect(out.UNIQUE).toBe(true);
    expect(out.FEATURE_NUM).toBe('002');
  });

  it('check-spec-number：同号分支时退出 4', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'conflict'));
    const wt = path.join(repo, 'worktrees', '002-conflict');
    const dev2 = secondClone(base);
    pushBranch(dev2, 'fix/002-alpha');
    const res = script(wt, 'check-spec-number.sh', '--json');
    expect(res.status).toBe(4);
    const out = JSON.parse(res.stdout.trim());
    expect(out.UNIQUE).toBe(false);
    expect(out.CONFLICTS).toContain('fix/002-alpha');
  });

  it('check-spec-number：base ref 有同号 spec 目录时退出 4', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'merged'));
    const wt = path.join(repo, 'worktrees', '002-merged');
    const dev2 = secondClone(base);
    mkdirSync(path.join(dev2, 'specs', '002-other'), { recursive: true });
    writeFileSync(path.join(dev2, 'specs', '002-other', 'spec.md'), '# other\n');
    git(dev2, 'add', '-A');
    git(dev2, 'commit', '--quiet', '-m', 'spec: 002-other');
    git(dev2, 'push', '--quiet', 'origin', 'main');

    const res = script(wt, 'check-spec-number.sh', '--json');
    expect(res.status).toBe(4);
    expect(res.stdout).toContain('specs/002-other');
  });

  it('算号前同步远程分支，未 fetch 的占号分支被避让', () => {
    const dev2 = secondClone(base);
    pushBranch(dev2, 'fix/002-other');
    const out = json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'fresh'));
    expect(out.FEATURE_NUM).toBe('003');
    expect(remoteBranches(repo)).toContain('fix/002-other');
    expect(remoteBranches(repo)).toContain('feat/003-fresh');
  });

  it('--no-fetch 跳过同步时仍完成占号', () => {
    const out = json(
      script(repo, 'create-worktree.sh', '--json', '--no-fetch', '--short-name', 'no-fetch'),
    );
    expect(out.FEATURE_NUM).toBe('002');
    expect(out.CLAIMED).toBe(true);
    expect(remoteBranches(repo)).toContain('feat/002-no-fetch');
  });

  it('已在 feature worktree 内运行时复用当前 worktree', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'reuse-me'));
    const wt = path.join(repo, 'worktrees', '002-reuse-me');
    const out = json(script(wt, 'create-worktree.sh', '--json', '--short-name', 'ignored'));
    expect(out.IN_WORKTREE).toBe(true);
    expect(out.CREATED).toBe(false);
    expect(out.BRANCH_NAME).toBe('feat/002-reuse-me');
    expect(out.FEATURE_DIRECTORY).toBe('specs/002-reuse-me');
  });

  it('base ref 缺少 Spec Kit 配置时拒绝创建', () => {
    git(repo, 'checkout', '--quiet', '--orphan', 'bare');
    git(repo, 'rm', '-r', '--quiet', '--cached', '.');
    git(repo, 'commit', '--quiet', '--allow-empty', '-m', 'empty');
    const res = script(
      repo,
      'create-worktree.sh',
      '--json',
      '--base-ref',
      'bare',
      '--short-name',
      'x',
    );
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('no Spec Kit setup');
  });

  it('finish：未传 --merged 时拒绝清理', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'no-merge'));
    const wt = path.join(repo, 'worktrees', '002-no-merge');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: no merge');
    git(wt, 'push', '--quiet', '-u', 'origin', 'feat/002-no-merge');

    const refused = script(repo, 'finish-worktree.sh', '--json', '--path', wt);
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain('pass --merged');
    expect(existsSync(wt)).toBe(true);
    expect(git(repo, 'branch', '--list', 'feat/002-no-merge')).not.toBe('');
  });

  it('finish --merged：合并后删除远程分支、本地分支与 worktree', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'ship-it'));
    const wt = path.join(repo, 'worktrees', '002-ship-it');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: ship');
    git(wt, 'push', '--quiet', '-u', 'origin', 'feat/002-ship-it');
    mergeIntoMain(repo, 'feat/002-ship-it');

    const out = json(script(repo, 'finish-worktree.sh', '--json', '--merged', '--path', wt));
    expect(out.BRANCH_NAME).toBe('feat/002-ship-it');
    expect(out.ABANDONED).toBe(false);
    expect(out.REMOTE_DELETED).toBe(true);
    expect(existsSync(wt)).toBe(false);
    expect(git(repo, 'branch', '--list', 'feat/002-ship-it')).toBe('');
    expect(git(repo, 'ls-remote', '--heads', 'origin', 'feat/002-ship-it')).toBe('');
  });

  it('finish --merged：远程分支已被删除时仍清理成功', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'auto-deleted'));
    const wt = path.join(repo, 'worktrees', '002-auto-deleted');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: auto');
    git(wt, 'push', '--quiet', '-u', 'origin', 'feat/002-auto-deleted');
    mergeIntoMain(repo, 'feat/002-auto-deleted');
    git(repo, 'push', '--quiet', 'origin', '--delete', 'feat/002-auto-deleted');

    const out = json(script(repo, 'finish-worktree.sh', '--json', '--merged', '--path', wt));
    expect(out.REMOTE_DELETED).toBe(false);
    expect(existsSync(wt)).toBe(false);
    expect(git(repo, 'branch', '--list', 'feat/002-auto-deleted')).toBe('');
  });

  it('finish --merged：有未推送提交时拒绝清理', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'unpushed'));
    const wt = path.join(repo, 'worktrees', '002-unpushed');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: pushed');
    git(wt, 'push', '--quiet', '-u', 'origin', 'feat/002-unpushed');
    mergeIntoMain(repo, 'feat/002-unpushed');
    writeFileSync(path.join(wt, 'late.txt'), 'late\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: late');

    const refused = script(repo, 'finish-worktree.sh', '--json', '--merged', '--path', wt);
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain('unpushed commits');
    expect(existsSync(wt)).toBe(true);
    expect(git(repo, 'branch', '--list', 'feat/002-unpushed')).not.toBe('');
  });

  it('finish --abandon：丢弃未提交改动并保留远程分支', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'drop-it'));
    const wt = path.join(repo, 'worktrees', '002-drop-it');
    git(wt, 'push', '--quiet', '-u', 'origin', 'feat/002-drop-it');
    writeFileSync(path.join(wt, 'wip.txt'), 'wip\n');
    const out = json(script(repo, 'finish-worktree.sh', '--json', '--abandon', '--path', wt));
    expect(out.ABANDONED).toBe(true);
    expect(out.REMOTE_DELETED).toBe(false);
    expect(existsSync(wt)).toBe(false);
    expect(git(repo, 'branch', '--list', 'feat/002-drop-it')).toBe('');
    expect(git(repo, 'ls-remote', '--heads', 'origin', 'feat/002-drop-it')).not.toBe('');
  });

  it('finish 拒绝在 worktree 内部运行', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'inside'));
    const wt = path.join(repo, 'worktrees', '002-inside');
    const res = script(wt, 'finish-worktree.sh', '--json', '--abandon', '--path', '.');
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('inside the worktree');
  });

  it('finish --abandon：含深层 node_modules 时仍能删除 worktree', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'deep-nm'));
    const wt = path.join(repo, 'worktrees', '002-deep-nm');
    // 构造超出 MAX_PATH 的 pnpm 风格路径
    const deep = path.join(
      wt,
      'node_modules',
      '.pnpm',
      '@scope+pkg@1.0.0_@types+node@22.0.0_react@19.0.0',
      'node_modules',
      '@scope',
      'pkg',
      'dist',
      'esm',
      'components',
      'internal',
      'helpers',
      'deeply',
      'nested',
      'subdirectory',
      'another',
      'level',
    );
    mkdirSync(deep, { recursive: true });
    writeFileSync(path.join(deep, 'index.js'), 'x\n');

    const out = json(script(repo, 'finish-worktree.sh', '--json', '--abandon', '--path', wt));
    expect(out.ABANDONED).toBe(true);
    expect(existsSync(wt)).toBe(false);
    expect(git(repo, 'branch', '--list', 'feat/002-deep-nm')).toBe('');
  });

  it('sync：基线已包含时不产生合入提交且不安装依赖', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'synced'));
    const wt = path.join(repo, 'worktrees', '002-synced');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: work');
    const head = git(wt, 'rev-parse', 'HEAD');

    const out = json(script(wt, 'sync-baseline.sh', '--json', '--no-install'));
    expect(out.MERGED).toBe(false);
    expect(out.INSTALLED).toBe(false);
    expect(out.SYNCED).toBe(true);
    expect(out.BASE_REF).toBe('origin/main');
    expect(git(wt, 'rev-parse', 'HEAD')).toBe(head);
  });

  it('sync：基线前进时产生合入提交', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'behind'));
    const wt = path.join(repo, 'worktrees', '002-behind');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: work');
    advanceMain('main.txt', 'base\n');
    const baseCommit = git(repo, 'rev-parse', 'HEAD');

    const out = json(script(wt, 'sync-baseline.sh', '--json', '--no-install'));
    expect(out.MERGED).toBe(true);
    expect(out.SYNCED).toBe(true);
    expect(out.BASE_COMMIT).toBe(baseCommit);
    expect(git(wt, 'rev-parse', 'origin/main')).toBe(baseCommit);
    expect(git(wt, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ')).toHaveLength(3);
    expect(existsSync(path.join(wt, 'main.txt'))).toBe(true);
  });

  it('sync：合入冲突时退出码 3 并保留冲突现场', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'clash'));
    const wt = path.join(repo, 'worktrees', '002-clash');
    writeFileSync(path.join(wt, 'shared.txt'), 'feature\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: shared');
    advanceMain('shared.txt', 'main\n');

    const res = script(wt, 'sync-baseline.sh', '--json', '--no-install');
    expect(res.status).toBe(3);
    expect(res.stderr).toContain('CONFLICT');
    expect(git(wt, 'diff', '--name-only', '--diff-filter=U')).toBe('shared.txt');
  });

  it('sync：工作区有未提交改动时拒绝同步', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'dirty'));
    const wt = path.join(repo, 'worktrees', '002-dirty');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: work');
    writeFileSync(path.join(wt, 'feature.txt'), 'dirty\n');

    const res = script(wt, 'sync-baseline.sh', '--json', '--no-install');
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('uncommitted changes');
  });
});
