#!/usr/bin/env bash
# Remove a feature worktree and its branches after the feature is finished.
#
# Usage: finish-worktree.sh [--json] (--merged | --abandon) --path WORKTREE_PATH
#
# Run it from the primary checkout (the session must not be inside the worktree
# being removed). --merged cleans up after the PR merged and deletes the remote
# branch; --abandon discards everything, closes the open PRs of the branch and
# deletes the remote branch. A missing gh, a missing PR or a missing remote
# branch is skipped with a note. A failed PR or remote step exits 5 after the
# local cleanup and lists the failures in WARNINGS. WORKTREE_GH overrides gh.
set -euo pipefail

GH="${WORKTREE_GH:-gh}"
JSON=false
ABANDON=false
MERGED=false
WT_PATH=""

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    --abandon) ABANDON=true ;;
    --merged) MERGED=true ;;
    --path)
      [[ $# -ge 2 ]] || die "--path requires a value"
      WT_PATH="$2"
      shift
      ;;
    -h | --help)
      sed -n '2,11p' "$0"
      exit 0
      ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

[[ -n "$WT_PATH" ]] || die "--path is required"
[[ -d "$WT_PATH" ]] || die "worktree path '$WT_PATH' does not exist"
WT_PATH="$(cd "$WT_PATH" && pwd)"

MAIN_WORKTREE="$(git -C "$WT_PATH" worktree list --porcelain | sed -n '1s/^worktree //p')"
MAIN_WORKTREE="$(cd "$MAIN_WORKTREE" && pwd)"
[[ "$WT_PATH" != "$MAIN_WORKTREE" ]] || die "refusing to remove the primary checkout"
case "$(pwd)/" in
  "$WT_PATH"/*) die "current directory is inside the worktree; switch to $MAIN_WORKTREE first" ;;
esac

BRANCH_NAME="$(git -C "$WT_PATH" rev-parse --abbrev-ref HEAD)"
REMOTE_DELETED=false

if ! $ABANDON; then
  $MERGED || die "deliver cleanup runs after the PR is merged; pass --merged"
  [[ -z "$(git -C "$WT_PATH" status --porcelain)" ]] || die "worktree has uncommitted changes"
  if upstream="$(git -C "$WT_PATH" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"; then
    [[ "$(git -C "$WT_PATH" rev-list --count "$upstream..HEAD")" == "0" ]] ||
      die "branch '$BRANCH_NAME' has unpushed commits"
  fi
  remote_heads="$(git -C "$MAIN_WORKTREE" ls-remote --heads origin "$BRANCH_NAME")" ||
    die "failed to query remote 'origin'"
  if [[ -n "$remote_heads" ]]; then
    git -C "$MAIN_WORKTREE" push --quiet origin --delete "$BRANCH_NAME" ||
      die "failed to delete remote branch '$BRANCH_NAME'"
    REMOTE_DELETED=true
    [[ -z "$(git -C "$MAIN_WORKTREE" ls-remote --heads origin "$BRANCH_NAME")" ]] ||
      die "remote branch '$BRANCH_NAME' still exists"
  fi
fi

if ! git -C "$MAIN_WORKTREE" worktree remove --force "$WT_PATH" 2>/dev/null; then
  # Windows: deep node_modules paths exceed MAX_PATH; git fails with "Filename too long".
  # Fall back to Node.js rmSync which uses a different Windows API without the limit.
  command -v node >/dev/null 2>&1 || die "git worktree remove failed and 'node' is not on PATH; remove '$WT_PATH' manually"
  node -e "require('fs').rmSync(process.argv[1], {recursive:true, force:true})" "$WT_PATH" \
    || die "failed to remove worktree directory '$WT_PATH'"
  git -C "$MAIN_WORKTREE" worktree prune
fi
git -C "$MAIN_WORKTREE" branch -D "$BRANCH_NAME" >/dev/null

# Abandon mode: close the open PRs and delete the remote branch. The local
# cleanup above is already done; failures here are recorded and exit 5.
PR_CLOSED=""
WARNINGS=""
warn() {
  echo "WARNING: $*" >&2
  WARNINGS="${WARNINGS:+$WARNINGS; }$*"
}

if $ABANDON; then
  if ! command -v "$GH" >/dev/null 2>&1; then
    echo "NOTE: '$GH' is not available; skipped closing the PRs of '$BRANCH_NAME'" >&2
  elif ! prs="$(cd "$MAIN_WORKTREE" && "$GH" pr list --head "$BRANCH_NAME" --state open --json number --jq '.[].number')"; then
    warn "failed to list the PRs of '$BRANCH_NAME'; close them manually"
  elif [[ -z "${prs//[[:space:]]/}" ]]; then
    echo "NOTE: no open PR for '$BRANCH_NAME'" >&2
  else
    for pr in $prs; do
      if (cd "$MAIN_WORKTREE" && "$GH" pr close "$pr" >&2); then
        PR_CLOSED="${PR_CLOSED:+$PR_CLOSED,}$pr"
      else
        warn "failed to close PR #$pr"
      fi
    done
  fi

  if ! remote_heads="$(git -C "$MAIN_WORKTREE" ls-remote --heads origin "$BRANCH_NAME")"; then
    warn "failed to query remote 'origin'; delete '$BRANCH_NAME' manually"
  elif [[ -z "$remote_heads" ]]; then
    echo "NOTE: remote branch '$BRANCH_NAME' does not exist" >&2
  elif git -C "$MAIN_WORKTREE" push --quiet origin --delete "$BRANCH_NAME" >&2; then
    REMOTE_DELETED=true
  else
    warn "failed to delete remote branch '$BRANCH_NAME'"
  fi
fi

if $JSON; then
  printf '{"BRANCH_NAME":"%s","WORKTREE_PATH":"%s","MAIN_WORKTREE":"%s","ABANDONED":%s,"REMOTE_DELETED":%s,"PR_CLOSED":"%s","WARNINGS":"%s"}\n' \
    "$BRANCH_NAME" "$WT_PATH" "$MAIN_WORKTREE" "$ABANDON" "$REMOTE_DELETED" "$PR_CLOSED" \
    "${WARNINGS//\"/\\\"}"
else
  echo "BRANCH_NAME=$BRANCH_NAME"
  echo "WORKTREE_PATH=$WT_PATH"
  echo "MAIN_WORKTREE=$MAIN_WORKTREE"
  echo "ABANDONED=$ABANDON"
  echo "REMOTE_DELETED=$REMOTE_DELETED"
  echo "PR_CLOSED=$PR_CLOSED"
  echo "WARNINGS=$WARNINGS"
fi

[[ -z "$WARNINGS" ]] || exit 5
