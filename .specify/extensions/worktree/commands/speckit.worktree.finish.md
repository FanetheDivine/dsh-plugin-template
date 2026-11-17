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
5. Wait for CI to pass as a background job:

   ```bash
   timeout 3600 gh pr checks "<PR>" --watch --fail-fast --interval 30
   ```

   Exit 0 means every check passed. Any other code means a failing check; exit 124 means the
   deadline expired with checks still pending. On failure, read `gh pr checks "<PR>"`, fix, commit,
   push, and start a new wait. On timeout, report and start a new wait.
6. Confirm the PR has no conflicts:

   ```bash
   gh pr view "<PR>" --json mergeable,mergeStateStatus
   ```

   Continue on `MERGEABLE`. On `CONFLICTING`, run `git fetch origin && git merge origin/main`,
   resolve the conflicts, commit, push, and repeat step 5. On `UNKNOWN`, refresh with
   `git fetch origin` and query again.
7. Wait for review feedback as a background job:

   ```bash
   deadline=$((SECONDS + 3600))
   base=$(gh pr view "<PR>" --json reviews,comments --jq '(.reviews | length) + (.comments | length)')
   while (( SECONDS < deadline )); do
     [[ "$(gh pr view "<PR>" --json reviewDecision --jq .reviewDecision)" == "CHANGES_REQUESTED" ]] &&
       { echo REVIEW_REQUESTED; exit 0; }
     now=$(gh pr view "<PR>" --json reviews,comments --jq '(.reviews | length) + (.comments | length)')
     (( now > base )) && { echo NEW_FEEDBACK; exit 0; }
     sleep 60
   done
   echo STILL_WAITING
   exit 3
   ```

   `REVIEW_REQUESTED` and `NEW_FEEDBACK` mean there is feedback to read with
   `gh pr view "<PR>" --json reviews,comments`. Apply it, commit, push, and repeat steps 5 and 6.
   `STILL_WAITING` means the deadline expired; report and start a new wait.
8. Wait for the merge as a background job:

   ```bash
   deadline=$((SECONDS + 3600))
   while (( SECONDS < deadline )); do
     state=$(gh pr view "<PR>" --json state,mergedAt --jq '.state + " " + (.mergedAt // "none")')
     case "$state" in
       "MERGED "*) echo MERGED; exit 0 ;;
       "CLOSED "*) echo "$state"; exit 1 ;;
     esac
     sleep 60
   done
   echo STILL_OPEN
   exit 3
   ```

   `MERGED` continues to cleanup. `CLOSED ...` stops without cleanup: the PR was closed without
   merging; report it. `STILL_OPEN` means the deadline expired; report and start a new wait.
9. Clean up (see below).

### Waits run in the background

Steps 5, 7 and 8 are waits. Start each as a managed background job and continue when it reports
completion; keep its identifier to read the result and to stop it when it no longer matters. Keep
at most one wait of each kind running: stop the old job before starting a replacement.

The loop and its interval live inside the job. Do not wrap a wait in repeated foreground `sleep`
calls: a long foreground command is moved to the background, and its output arrives too late to act
on. Do not merge the PR yourself.

## Abandon mode

Confirm with the user that uncommitted and unpushed work in `WORKTREE_PATH` will be discarded,
then clean up with `--abandon`. A branch already pushed to the remote is left there; mention it.

## Clean up

1. Change the session working directory to `MAIN_WORKTREE` (a worktree cannot be removed while the
   session is inside it). Verify with `pwd`.
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
