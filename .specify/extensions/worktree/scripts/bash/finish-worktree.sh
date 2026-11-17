#!/usr/bin/env bash
# Remove a feature worktree and its local branch after the feature is finished.
#
# Usage: finish-worktree.sh [--json] [--abandon] --path WORKTREE_PATH
#
# Run it from the primary checkout (the session must not be inside the worktree
# being removed). Without --abandon the worktree must be clean and its branch
# fully pushed to its upstream; --abandon discards everything.
set -euo pipefail

JSON=false
ABANDON=false
WT_PATH=""

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    --abandon) ABANDON=true ;;
    --path)
      [[ $# -ge 2 ]] || die "--path requires a value"
      WT_PATH="$2"
      shift
      ;;
    -h | --help)
      sed -n '2,8p' "$0"
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

if ! $ABANDON; then
  [[ -z "$(git -C "$WT_PATH" status --porcelain)" ]] || die "worktree has uncommitted changes"
  upstream="$(git -C "$WT_PATH" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)" ||
    die "branch '$BRANCH_NAME' has no upstream; push it first"
  [[ "$(git -C "$WT_PATH" rev-list --count "$upstream..HEAD")" == "0" ]] ||
    die "branch '$BRANCH_NAME' has unpushed commits"
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

if $JSON; then
  printf '{"BRANCH_NAME":"%s","WORKTREE_PATH":"%s","MAIN_WORKTREE":"%s","ABANDONED":%s}\n' \
    "$BRANCH_NAME" "$WT_PATH" "$MAIN_WORKTREE" "$ABANDON"
else
  echo "BRANCH_NAME=$BRANCH_NAME"
  echo "WORKTREE_PATH=$WT_PATH"
  echo "MAIN_WORKTREE=$MAIN_WORKTREE"
  echo "ABANDONED=$ABANDON"
fi
