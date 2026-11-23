---
description: "Push the feature branch, open a PR, wait for CI, reviews and the merge without deadlines, then clean up"
---

# Finish Feature Worktree

Close out the feature developed in the current worktree: after the user accepts the result, merge
the latest base into the branch, push it, open a pull request, and stay with the PR until it is
merged; then fast-forward the primary checkout's `main`, and remove the worktree, the local branch
and the remote branch. If the user abandons the feature, sync `main` the same way, discard the
feature, close its PR and delete the remote branch.

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

5. Verify the spec number is unique:

   ```bash
   .specify/extensions/worktree/scripts/bash/check-spec-number.sh --json
   ```

   - Exit 0: the number is unique; continue.
   - Exit 4: another branch or the base branch uses the same number. Report the conflicting refs
     from `CONFLICTS` and stop; do not push or open the PR.
   - Exit 1: report the error and stop.

6. Push and open the PR:

   ```bash
   git push -u origin "<BRANCH_NAME>"
   gh pr create --fill --base main
   ```

   Record the PR number. If `gh` is unavailable, give the user the compare URL from the push
   output and stop, leaving the worktree and both branches in place.
7. Wait for CI as a background job:

   ```bash
   gh pr checks "<PR>" --watch --fail-fast --interval 15
   ```

   Exit 0 means every check passed. Any other code means a failing check: read
   `gh pr checks "<PR>"`, fix, then go back to step 3 to sync the base, commit, push and start a
   new wait.
8. Wait for feedback, conflicts and the merge as one background job:

   ```bash
   base=$(gh pr view "<PR>" --json reviews,comments --jq '(.reviews | length) + (.comments | length)')
   start=$(date +%s)
   while :; do
     snapshot=$(gh pr view "<PR>" --json state,mergedAt,mergeable,reviewDecision,reviews,comments --template '{{.state}}|{{if .mergedAt}}{{.mergedAt}}{{else}}none{{end}}|{{.mergeable}}|{{.reviewDecision}}|{{len .reviews}}|{{len .comments}}')
     IFS='|' read -r state merged_at mergeable review_decision reviews comments <<<"$snapshot"
     if [[ "$state" == "MERGED" ]]; then echo MERGED; break; fi
     if [[ "$state" == "CLOSED" ]]; then echo "CLOSED $merged_at"; break; fi
     if [[ "$mergeable" == "CONFLICTING" ]]; then echo CONFLICTING; break; fi
     if [[ "$review_decision" == "CHANGES_REQUESTED" ]]; then echo FEEDBACK; break; fi
     if (( reviews + comments > base )); then echo FEEDBACK; break; fi
     if (( $(date +%s) - start < 300 )); then sleep 10; else sleep 30; fi
   done
   ```

   The loop has no deadline and makes one `gh pr view` call per iteration. Each iteration checks the
   merge state first, then the conflict state, then feedback, so a merge that lands while feedback is
   pending wins. The interval is 10 seconds for the first 5 minutes and 30 seconds afterwards; the
   window starts when the loop starts. As with the other snippets, substitute the recorded PR number
   for `"<PR>"`.

   - `MERGED`: continue to step 9.
   - `CLOSED ...`: the PR was closed without merging; report and stop without cleanup.
   - `CONFLICTING`: go back to step 3, sync the base, commit, push, then restart step 7 and this
     step.
   - `FEEDBACK`: read it with `gh pr view "<PR>" --json reviews,comments`. When it reports a defect,
     fix it and go back to step 3 before pushing. When it asks for something else, apply it,
     commit, push and restart step 7 and this step.

9. Sync the primary checkout, then clean up (see below).

### Waits run in the background

Steps 7 and 8 are waits, each with no deadline. Start one as a managed background job and continue
when it reports completion; keep its identifier to stop it when it no longer matters. Run at most
one wait at a time: stop the finished job before starting its replacement, and never reuse a job
that already exited.

The loop and its interval live inside the job; the merge wait switches from 10 to 30 seconds after
5 minutes. Do not wrap a wait in repeated foreground `sleep` calls: a long foreground command is
moved to the background, and its output arrives too late to act on. The waits do not block the
session; keep handling other user requests while they run.

Only three things in this loop need action: a failing CI check, feedback that reports a defect, and
a conflict with the base. Whether the merge itself causes problems is the merger's concern. Do not
merge the PR yourself.

## Abandon mode

Confirm with the user that uncommitted and unpushed work in `WORKTREE_PATH` will be discarded,
then sync the primary checkout and clean up with `--abandon`. The script closes the open PR of the
branch and deletes the remote branch. Exit 5 means the local cleanup finished and `WARNINGS`
lists the PR or remote steps that failed; report them.

## Sync the primary checkout, then clean up

Both modes run these steps in this order.

1. Change the session working directory to `MAIN_WORKTREE` (a worktree cannot be removed while the
   session is inside it). Verify with `pwd`.
2. Sync `main`:

   ```bash
   .specify/extensions/worktree/scripts/bash/sync-main.sh --json --prepare
   ```

   The script stashes uncommitted changes, switches another branch back to `main`, saves `main`
   commits that are not on `origin/main` on a `wip/...` branch, and fast-forwards `main`. Parse
   `MAIN_COMMIT`, `UPDATED`, `STASHED` and `TEMP_BRANCH` from the JSON output.

   - Exit 0: `main` equals `origin/main`; continue.
   - Exit 2 or 1: report the stderr reason and continue. The primary checkout keeps its state.

   The stash and the temporary branch stay in the repository; report them and leave them for the
   user.
3. Remove the worktree and branches:

   ```bash
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --merged --path "<WORKTREE_PATH>"   # deliver, after the PR merged
   .specify/extensions/worktree/scripts/bash/finish-worktree.sh --json --abandon --path "<WORKTREE_PATH>"  # abandon
   ```

4. If the script refuses (missing `--merged`, uncommitted changes, unpushed commits), report the
   reason; do not force removal in deliver mode.
5. `REMOTE_DELETED` in the output tells whether the remote branch was deleted; `false` means it
   was already gone.

## Output

Report the outcome: PR URL, and that the worktree, local branch and remote branch were removed
(deliver), or the discarded branch, `PR_CLOSED` and `REMOTE_DELETED` (abandon). Add the primary
checkout sync result: `MAIN_COMMIT`, `UPDATED`, the stash created (`STASHED`), the temporary
branch (`TEMP_BRANCH`), or the reason the sync failed.
