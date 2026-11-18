// sync-main.sh 测试：在临时 git 仓库（含 bare origin）里运行
// .specify/extensions/worktree/scripts/bash/sync-main.sh，
// 断言主工作区快进到 origin/main，以及不满足约束时保持原样。
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** 仓库根目录（tests/ 的上一级）。 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(
  ROOT,
  '.specify',
  'extensions',
  'worktree',
  'scripts',
  'bash',
  'sync-main.sh',
);

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

/** 在 cwd 下运行命令并收集输出。 */
function run(cmd: string, args: string[], cwd: string): RunResult {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: GIT_ENV });
  return { status: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

/** 运行 git，失败时抛错，返回去掉首尾空白的 stdout。 */
function git(cwd: string, ...args: string[]): string {
  const res = run('git', args, cwd);
  if (res.status !== 0) throw new Error(`git ${args.join(' ')} 失败：${res.stderr}`);
  return res.stdout.trim();
}

/** 在 cwd 下运行 sync-main.sh --json。 */
function sync(cwd: string): RunResult {
  return run('bash', [SCRIPT, '--json'], cwd);
}

/** 解析成功输出的 JSON 行。 */
function json(res: RunResult): Record<string, string | boolean> {
  if (res.status !== 0) throw new Error(`脚本失败：${res.stderr}`);
  return JSON.parse(res.stdout.trim());
}

describe('sync-main.sh', { timeout: 30_000 }, () => {
  let base: string;
  let origin: string;
  let repo: string;
  let other: string;

  beforeEach(() => {
    base = mkdtempSync(path.join(tmpdir(), 'speckit-sync-'));
    origin = path.join(base, 'origin.git');
    repo = path.join(base, 'proj');
    other = path.join(base, 'other');
    git(base, 'init', '--quiet', '--bare', '-b', 'main', origin);
    git(base, 'clone', '--quiet', origin, repo);
    git(repo, 'checkout', '--quiet', '-b', 'main');
    writeFileSync(path.join(repo, '.gitignore'), 'worktrees/\nignored.txt\n');
    writeFileSync(path.join(repo, 'README.md'), '# proj\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '--quiet', '-m', 'init');
    git(repo, 'push', '--quiet', '-u', 'origin', 'main');
    git(base, 'clone', '--quiet', origin, other);
  });

  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  /** 从另一个 clone 推送一个提交，让 origin/main 前进；返回新提交。 */
  function advanceOrigin(name: string): string {
    writeFileSync(path.join(other, name), `${name}\n`);
    git(other, 'add', '-A');
    git(other, 'commit', '--quiet', '-m', `remote: ${name}`);
    git(other, 'push', '--quiet', 'origin', 'main');
    return git(other, 'rev-parse', 'HEAD');
  }

  it('本地 main 落后时快进到 origin/main', () => {
    const before = git(repo, 'rev-parse', 'HEAD');
    const remote = advanceOrigin('a.txt');
    const out = json(sync(repo));
    expect(out.UPDATED).toBe(true);
    expect(out.BEFORE_COMMIT).toBe(before);
    expect(out.MAIN_COMMIT).toBe(remote);
    expect(git(repo, 'rev-parse', 'HEAD')).toBe(remote);
    expect(existsSync(path.join(repo, 'a.txt'))).toBe(true);
    expect(git(repo, 'status', '--porcelain')).toBe('');
  });

  it('已同步时不更新', () => {
    const head = git(repo, 'rev-parse', 'HEAD');
    const out = json(sync(repo));
    expect(out.UPDATED).toBe(false);
    expect(out.MAIN_COMMIT).toBe(head);
  });

  it('被忽略的文件不影响同步', () => {
    writeFileSync(path.join(repo, 'ignored.txt'), 'x\n');
    mkdirSync(path.join(repo, 'worktrees', 'tmp'), { recursive: true });
    const remote = advanceOrigin('b.txt');
    expect(json(sync(repo)).MAIN_COMMIT).toBe(remote);
  });

  it('在 feature worktree 内运行时同步主工作区', () => {
    const wt = path.join(repo, 'worktrees', '002-x');
    git(repo, 'worktree', 'add', '--quiet', '-b', 'feat/002-x', wt);
    const branchHead = git(wt, 'rev-parse', 'HEAD');
    const remote = advanceOrigin('c.txt');
    const out = json(sync(wt));
    expect(out.MAIN_COMMIT).toBe(remote);
    expect(git(repo, 'rev-parse', 'HEAD')).toBe(remote);
    expect(git(wt, 'rev-parse', 'HEAD')).toBe(branchHead);
  });

  it('主工作区不在 main 时退出 2 并保持原样', () => {
    git(repo, 'checkout', '--quiet', '-b', 'topic');
    advanceOrigin('d.txt');
    const res = sync(repo);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('not on main');
    expect(res.stdout).toBe('');
    expect(git(repo, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('topic');
    expect(existsSync(path.join(repo, 'd.txt'))).toBe(false);
  });

  it('主工作区有未跟踪文件时退出 2 并保持原样', () => {
    const head = git(repo, 'rev-parse', 'HEAD');
    writeFileSync(path.join(repo, 'stray.txt'), 'x\n');
    advanceOrigin('e.txt');
    const res = sync(repo);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('has uncommitted changes');
    expect(git(repo, 'rev-parse', 'HEAD')).toBe(head);
    expect(existsSync(path.join(repo, 'stray.txt'))).toBe(true);
  });

  it('本地 main 有 origin/main 之外的提交时退出 2 并保留提交', () => {
    writeFileSync(path.join(repo, 'local.txt'), 'x\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '--quiet', '-m', 'local');
    const local = git(repo, 'rev-parse', 'HEAD');
    advanceOrigin('f.txt');
    const res = sync(repo);
    expect(res.status).toBe(2);
    expect(res.stderr).toContain('has commits not on origin/main');
    expect(git(repo, 'rev-parse', 'HEAD')).toBe(local);
  });

  it('origin 不可达时退出 1', () => {
    const head = git(repo, 'rev-parse', 'HEAD');
    git(repo, 'remote', 'set-url', 'origin', path.join(base, 'missing.git'));
    const res = sync(repo);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain("failed to fetch 'origin'");
    expect(git(repo, 'rev-parse', 'HEAD')).toBe(head);
  });

  it('脚本在执行中被 pull 改写时仍正常结束', () => {
    // 主工作区携带脚本副本，origin 上的新版本改写它；pull 后脚本必须照常输出。
    const local = path.join(repo, 'sync-main.sh');
    cpSync(SCRIPT, local);
    git(repo, 'add', '-A');
    git(repo, 'commit', '--quiet', '-m', 'add script');
    git(repo, 'push', '--quiet', 'origin', 'main');
    git(other, 'pull', '--quiet', 'origin', 'main');
    writeFileSync(path.join(other, 'sync-main.sh'), 'echo REWRITTEN\nexit 9\n');
    git(other, 'commit', '--quiet', '-am', 'rewrite script');
    git(other, 'push', '--quiet', 'origin', 'main');
    const res = run('bash', [local, '--json'], repo);
    expect(res.status).toBe(0);
    expect(res.stdout).not.toContain('REWRITTEN');
    expect(json(res).UPDATED).toBe(true);
  });
});
