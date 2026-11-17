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

  it('finish：未推送时拒绝；推送后清理 worktree 与本地分支', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'ship-it'));
    const wt = path.join(repo, 'worktrees', '002-ship-it');
    writeFileSync(path.join(wt, 'feature.txt'), 'done\n');
    git(wt, 'add', '-A');
    git(wt, 'commit', '--quiet', '-m', 'feat: ship');

    const refused = script(repo, 'finish-worktree.sh', '--json', '--path', wt);
    expect(refused.status).not.toBe(0);
    expect(refused.stderr).toContain('no upstream');

    git(wt, 'push', '--quiet', '-u', 'origin', 'feat/002-ship-it');
    const out = json(script(repo, 'finish-worktree.sh', '--json', '--path', wt));
    expect(out.BRANCH_NAME).toBe('feat/002-ship-it');
    expect(out.ABANDONED).toBe(false);
    expect(existsSync(wt)).toBe(false);
    expect(git(repo, 'branch', '--list', 'feat/002-ship-it')).toBe('');
  });

  it('finish --abandon：丢弃未提交改动并清理', () => {
    json(script(repo, 'create-worktree.sh', '--json', '--short-name', 'drop-it'));
    const wt = path.join(repo, 'worktrees', '002-drop-it');
    writeFileSync(path.join(wt, 'wip.txt'), 'wip\n');
    const out = json(script(repo, 'finish-worktree.sh', '--json', '--abandon', '--path', wt));
    expect(out.ABANDONED).toBe(true);
    expect(existsSync(wt)).toBe(false);
    expect(git(repo, 'branch', '--list', 'feat/002-drop-it')).toBe('');
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
});
