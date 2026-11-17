---
description: "Push the feature branch, open a PR, wait for CI, reviews and the merge, then clean up"
---

# Finish Feature Worktree

Close out the feature developed in the current worktree: after the user accepts the result, push
the branch, open a pull request, and stay with the PR until it is merged; then remove the worktree,
the local branch and the remote branch. If the user abandons the feature, discard it and leave a
pushed branch on the remote.

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

   Record the PR number. If `gh` is unavailable, give the user the compare URL from the push
   output and stop, leaving the worktree and both branches in place.
5. Wait for CI to pass:

   ```bash
   gh pr checks "<PR>" --watch --fail-fast --interval 30
   ```

   A non-zero exit means failing or unfinished checks. Read the details with
   `gh pr checks "<PR>"`, fix the failures, commit, push, and repeat this step.
6. Confirm the PR has no conflicts:

   ```bash
   gh pr view "<PR>" --json mergeable,mergeStateStatus
   ```

   Continue on `MERGEABLE`. On `CONFLICTING`, run `git fetch origin && git merge origin/main`,
   resolve the conflicts, commit, push, and repeat step 5. On `UNKNOWN`, refresh with
   `git fetch origin` and query again.
7. Wait for review comments:

   ```bash
   gh pr view "<PR>" --json reviews,comments,reviewDecision
   ```

   Apply the requested changes, commit, push, and repeat steps 5 and 6. Keep polling while the
   session is active.
8. Wait for the merge:

   ```bash
   gh pr view "<PR>" --json state,mergedAt
   ```

   Poll until `state` is `MERGED`. If `state` is `CLOSED` without `mergedAt`, stop without cleanup
   and report that the PR was closed without merging.
9. Clean up (see below).

Between polls, wait 30–60 seconds and report the current state. Do not merge the PR yourself.

## Abandon mode

Confirm with the user that uncommitted and unpushed work in `WORKTREE_PATH` will be discarded,
then clean up with `--abandon`. A branch already pushed to the remote is left there; mention it.

## Clean up

1. Call the `working_directory` tool with `cd` = `MAIN_WORKTREE` (a worktree cannot be removed
   while the session is inside it). Verify with `pwd`.
2. Run:

   ```bash
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --merged --path "<WORKTREE_PATH>"   # deliver, after the PR merged
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --abandon --path "<WORKTREE_PATH>"  # abandon
   ```

3. If the script refuses (missing `--merged`, uncommitted changes, unpushed commits), report the
   reason; do not force removal in deliver mode.
4. `REMOTE_DELETED` in the output tells whether the remote branch was deleted; `false` means it
   was already gone.

## Output

Report the outcome: PR URL, and that the worktree, local branch and remote branch were removed
(deliver), or the discarded branch (abandon).
