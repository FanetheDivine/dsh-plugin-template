---
description: "Push the feature branch, open a PR, wait for CI, reviews and the merge without deadlines, then clean up"
---

# Finish Feature Worktree

Close out the feature developed in the current worktree: after the user accepts the result, merge
the latest base into the branch, push it, open a pull request, and stay with the PR until it is
merged; then remove the worktree, the local branch and the remote branch. If the user abandons the
feature, discard it and leave a pushed branch on the remote.

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
2. CHANGELOG: per principle III of `.specify/memory/constitution.md`, branches other than `main`
   add their `CHANGELOG.md` entry when pushing. Add an entry under `## Unreleased` describing the
   feature, if not already present.
3. Sync the base branch:

   ```bash
   .specify/extensions/worktree/scripts/bash/sync-baseline.sh --json
   ```

   The script fetches `origin`, merges `origin/main` into the current branch and runs `pnpm install`.
   It reports `MERGED`, `INSTALLED`, `BASE_COMMIT` and `SYNCED` in the JSON output.

   - Exit 0 with `MERGED=false`: the branch already contains the base; continue.
   - Exit 0 with `MERGED=true`: the merge and the dependency install are done; run the quality
     gates again before committing.
   - Exit 3: the merge left conflicts. Resolve them under the Spec Kit process — update the
     artifacts the conflict touches and record the work as its own commit — then rerun the script
     until it exits 0.
   - Exit 1: report the error and stop.

4. Commit any remaining changes, including the merge and lock file updates (Conventional Commit
   message, e.g. `feat: <summary>` or `chore: merge origin/main`).
5. Push and open the PR:

   ```bash
   git push -u origin "<BRANCH_NAME>"
   gh pr create --fill --base main
   ```

   Record the PR number. If `gh` is unavailable, give the user the compare URL from the push
   output and stop, leaving the worktree and both branches in place.
6. Wait for CI as a background job:

   ```bash
   gh pr checks "<PR>" --watch --fail-fast --interval 30
   ```

   Exit 0 means every check passed. Any other code means a failing check: read
   `gh pr checks "<PR>"`, fix, then go back to step 3 to sync the base, commit, push and start a
   new wait.
7. Wait for feedback, conflicts and the merge as one background job:

   ```bash
   base=$(gh pr view "<PR>" --json reviews,comments --jq '(.reviews | length) + (.comments | length)')
   while :; do
     state=$(gh pr view "<PR>" --json state,mergedAt --jq '.state + " " + (.mergedAt // "none")')
     case "$state" in
       "MERGED "*) echo MERGED; break ;;
       "CLOSED "*) echo "$state"; break ;;
     esac
     if [[ "$(gh pr view "<PR>" --json mergeable --jq .mergeable)" == "CONFLICTING" ]]; then
       echo CONFLICTING
       break
     fi
     if [[ "$(gh pr view "<PR>" --json reviewDecision --jq .reviewDecision)" == "CHANGES_REQUESTED" ]]; then
       echo FEEDBACK
       break
     fi
     now=$(gh pr view "<PR>" --json reviews,comments --jq '(.reviews | length) + (.comments | length)')
     if (( now > base )); then
       echo FEEDBACK
       break
     fi
     sleep 60
   done
   ```

   The loop has no deadline. Each iteration checks the merge state first, then the conflict state,
   then feedback, so a merge that lands while feedback is pending wins. As with the other snippets,
   substitute the recorded PR number for `"<PR>"`.

   - `MERGED`: continue to cleanup.
   - `CLOSED ...`: the PR was closed without merging; report and stop without cleanup.
   - `CONFLICTING`: go back to step 3, sync the base, commit, push, then restart step 6 and this
     step.
   - `FEEDBACK`: read it with `gh pr view "<PR>" --json reviews,comments`. When it reports a defect,
     fix it and go back to step 3 before pushing. When it asks for something else, apply it,
     commit, push and restart step 6 and this step.

8. Clean up (see below).

### Waits run in the background

Steps 6 and 7 are waits, each with no deadline. Start one as a managed background job and continue
when it reports completion; keep its identifier to stop it when it no longer matters. Run at most
one wait at a time: stop the finished job before starting its replacement, and never reuse a job
that already exited.

The loop and its interval live inside the job. Do not wrap a wait in repeated foreground `sleep`
calls: a long foreground command is moved to the background, and its output arrives too late to act
on. The waits do not block the session; keep handling other user requests while they run.

Only three things in this loop need action: a failing CI check, feedback that reports a defect, and
a conflict with the base. Whether the merge itself causes problems is the merger's concern. Do not
merge the PR yourself.

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
5. Sync the primary checkout in both modes, after `finish-worktree.sh` succeeds:

   ```bash
   .specify/extensions/worktree/scripts/bash/sync-main.sh --json
   ```

   The script fast-forwards the primary checkout's `main` to `origin/main` with `git fetch` and
   `git pull --ff-only`. Parse `MAIN_COMMIT` and `UPDATED` from the JSON output.

   - Exit 0: `main` equals `origin/main`.
   - Exit 2 or 1: report the stderr reason and leave the primary checkout as it is.

## Output

Report the outcome: PR URL, and that the worktree, local branch and remote branch were removed
(deliver), or the discarded branch (abandon). Add the primary checkout sync result: `MAIN_COMMIT`
and `UPDATED`, or the reason the sync was skipped.
