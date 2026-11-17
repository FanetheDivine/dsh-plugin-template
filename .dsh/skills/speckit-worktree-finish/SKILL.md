---
name: speckit-worktree-finish
description: Push the feature branch and open a PR (or abandon it), then remove the worktree
compatibility: Requires spec-kit project structure with .specify/ directory
metadata:
  author: dsh-plugin-template
  source: worktree:commands/speckit.worktree.finish.md
---

# Finish Feature Worktree

Close out the feature developed in the current worktree: after the user accepts the result, push
the branch and open a pull request; if the user abandons the feature, discard it. Both outcomes
remove the worktree and the local branch.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). Input containing
`abandon` / `放弃` / `中断` selects **abandon** mode; otherwise use **deliver** mode.

## Preconditions

- Determine `WORKTREE_PATH` (`git rev-parse --show-toplevel`), `BRANCH_NAME`
  (`git rev-parse --abbrev-ref HEAD`) and `MAIN_WORKTREE` (first `worktree` line of
  `git worktree list --porcelain`). If `WORKTREE_PATH` equals `MAIN_WORKTREE`, stop: there is no
  feature worktree to finish.
- **Deliver mode requires explicit user acceptance.** If the user has not accepted the
  implementation in this conversation, show what was built (tasks completed, test results) and
  ask for acceptance before going further. When invoked as the optional `after_implement` hook,
  only offer this command — do not run it without the user's go-ahead.

## Deliver mode

Run inside `WORKTREE_PATH`:

1. Quality gates: `pnpm format && pnpm check` (typecheck → lint → test → build). Fix failures before continuing.
2. CHANGELOG: per principle V of `.specify/memory/constitution.md`, branches other than `main`
   add their `CHANGELOG.md` entry when pushing. Add an entry under `## Unreleased` describing the
   feature, if not already present.
3. Commit any remaining changes (Conventional Commit message, e.g. `feat: <summary>`).
4. Push and open the PR:

   ```bash
   git push -u origin "<BRANCH_NAME>"
   gh pr create --fill --base main
   ```

   If `gh` is unavailable, give the user the compare URL from the push output instead.
   Record the PR URL.
5. Clean up (see below).

## Abandon mode

Confirm with the user that uncommitted and unpushed work in `WORKTREE_PATH` will be discarded,
then clean up with `--abandon`. A branch already pushed to the remote is left there; mention it.

## Clean up

1. Call the `working_directory` tool with `cd` = `MAIN_WORKTREE` (a worktree cannot be removed
   while the session is inside it). Verify with `pwd`.
2. Run:

   ```bash
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --path "<WORKTREE_PATH>"            # deliver
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --abandon --path "<WORKTREE_PATH>"  # abandon
   ```

3. If the script refuses (uncommitted changes, missing upstream, unpushed commits), report the
   reason; do not force removal in deliver mode.

## Output

Report the outcome: PR URL (deliver) or discarded branch (abandon), and confirm the worktree and
local branch were removed.