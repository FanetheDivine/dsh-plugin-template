---
description: "Create a <type>/<NNN>-<short-name> branch in a nested worktree at worktrees/<NNN>-<name>"
---

# Create Feature Worktree

Create the feature branch in a new nested git worktree at `worktrees/<NNN>-<short-name>` inside
the primary checkout. This command handles **branch + worktree creation only** — the spec
directory and files are created by the core `/speckit-specify` workflow afterwards.

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty). When invoked as the
`before_specify` hook, the input is the feature description given to `/speckit-specify`.

## Steps

1. **Pick the branch type** from the feature description: `feat` (new capability), `fix`
   (defect), `refactor`, `docs`, `test`, `chore`. Default to `feat`. If the user explicitly named
   a type, use it.

2. **Generate a short name** (2-4 words, kebab-case, action-noun form, keep technical terms),
   e.g. "Fix payment processing timeout bug" → `payment-timeout`. Do not repeat the type in it.

3. **Sync the primary checkout.** Run from the repository root or any worktree:

   ```
   .specify/extensions/worktree/scripts/bash/sync-main.sh --json
   ```

   The script fast-forwards the primary checkout's `main` to `origin/main` with `git fetch` and
   `git pull --ff-only`. Parse `MAIN_COMMIT` and `UPDATED` from the JSON output.

   - Exit 0: `main` equals `origin/main`; continue.
   - Exit 2: the primary checkout is not on `main`, has changes, or has commits not on
     `origin/main`. Stop, report the stderr reason and ask the user to fix the primary checkout.
     Do not create a worktree.
   - Exit 1: report the error and stop. Do not create a worktree.

   Run this step in every case, including when the session is already inside a feature worktree.

4. **Create the branch and worktree.** The target state is: branch `<type>/<NNN>-<short-name>`
   checked out in a nested worktree at `worktrees/<NNN>-<short-name>` inside the primary checkout,
   with no tracking upstream, based on `origin/main` (or the `base_ref` in
   `worktree-config.yml`).

   Run the script from the repository root. It pushes the branch to `origin` before creating the
   worktree, so other developers see the number as taken; a failed push aborts with no worktree and
   no branch left behind.

   ```
   .specify/extensions/worktree/scripts/bash/create-worktree.sh --json --type "<type>" --short-name "<short-name>"
   ```

   - Do NOT create the worktree with a host-native worktree tool: that path skips the claim push.
   - Parse the JSON output: `BRANCH_NAME`, `FEATURE_NUM`, `FEATURE_NAME`, `FEATURE_DIRECTORY`,
     `WORKTREE_PATH`, `MAIN_WORKTREE`, `BASE_REF`, `CREATED`, `IN_WORKTREE`, `CLAIMED`.
   - Do NOT pass `--base-ref` unless the user asked for a specific base.
   - If `IN_WORKTREE` is `true`, the session is already inside a feature worktree — reuse it and
     skip to step 5.
   - If creation fails, stop and report the error. Do not retry by hand or continue without a
     confirmed result.

5. **Hand back to `/speckit-specify`** with the following values:
   - `SPECIFY_FEATURE_DIRECTORY = FEATURE_DIRECTORY` (`specs/<NNN>-<short-name>`) — treat as
     explicitly provided so the spec directory, feature number and branch all share one name.
   - The spec and all subsequent Spec Kit artifacts (`plan.md`, `tasks.md`) MUST be written inside
     `WORKTREE_PATH` (not the primary checkout), because `WORKTREE_PATH` is an independent
     checkout on `BRANCH_NAME`. If the agent can change its working directory, do so now;
     otherwise proceed and ensure every file path is relative to `WORKTREE_PATH`.

## Output

Report `BRANCH_NAME`, `WORKTREE_PATH`, `FEATURE_DIRECTORY`, `CLAIMED` and the primary checkout's
`MAIN_COMMIT` and `UPDATED` in one short block, then continue with the calling workflow.
