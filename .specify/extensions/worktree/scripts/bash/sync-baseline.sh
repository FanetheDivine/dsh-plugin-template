#!/usr/bin/env bash
# Merge the latest base branch into the current feature branch before pushing.
#
# Usage: sync-baseline.sh [--json] [--no-install] [--base-ref REF]
#
# Run it inside the feature worktree. It fetches origin, merges REF (default
# origin/main) into the current branch, then runs `pnpm install` so the lock
# file matches the merged dependency set. Exit 0 means the branch contains the
# base and is ready to push; exit 3 means the merge left conflicts to resolve;
# exit 1 means the fetch or the merge failed for another reason.
set -euo pipefail

JSON=false
INSTALL=true
BASE_REF="origin/main"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    --no-install) INSTALL=false ;;
    --base-ref)
      [[ $# -ge 2 ]] || die "--base-ref requires a value"
      BASE_REF="$2"
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

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$BRANCH" != "HEAD" ]] || die "HEAD is detached; check out the feature branch first"

# A paused merge leaves staged entries in the index; every other state must be clean.
if ! git rev-parse -q --verify MERGE_HEAD >/dev/null; then
  [[ -z "$(git status --porcelain --untracked-files=no)" ]] ||
    die "working tree has uncommitted changes; commit them before syncing"
fi

emit() {
  local base_commit="$1" merged="$2" installed="$3" synced="$4"
  if $JSON; then
    printf '{"BRANCH":"%s","BASE_REF":"%s","BASE_COMMIT":"%s","MERGED":%s,"INSTALLED":%s,"SYNCED":%s}\n' \
      "$BRANCH" "$BASE_REF" "$base_commit" "$merged" "$installed" "$synced"
  else
    echo "BRANCH=$BRANCH"
    echo "BASE_REF=$BASE_REF"
    echo "BASE_COMMIT=$base_commit"
    echo "MERGED=$merged"
    echo "INSTALLED=$installed"
    echo "SYNCED=$synced"
  fi
}

install_deps() {
  $INSTALL || return 0
  command -v pnpm >/dev/null 2>&1 ||
    die "'pnpm' is not on PATH; rerun with --no-install or install pnpm"
  pnpm install --reporter=silent || die "dependency install failed after merging '$BASE_REF'"
  INSTALLED=true
}

INSTALLED=false

git fetch --quiet origin || die "failed to fetch 'origin'"
BASE_COMMIT="$(git rev-parse --verify "$BASE_REF^{commit}")" ||
  die "'$BASE_REF' does not resolve to a commit"

unmerged="$(git diff --name-only --diff-filter=U)"

if [[ -n "$(git rev-parse -q --verify MERGE_HEAD || true)" ]]; then
  [[ -z "$unmerged" ]] || { emit "$BASE_COMMIT" false false false; exit 3; }
  git commit --quiet --no-edit || die "failed to complete the in-progress merge"
  install_deps
  emit "$BASE_COMMIT" true "$INSTALLED" true
  exit 0
fi

if git merge-base --is-ancestor "$BASE_COMMIT" HEAD; then
  emit "$BASE_COMMIT" false false true
  exit 0
fi

if ! git merge --no-edit --quiet "$BASE_REF"; then
  unmerged="$(git diff --name-only --diff-filter=U)"
  if [[ -n "$unmerged" ]]; then
    echo "CONFLICT:" >&2
    echo "$unmerged" >&2
    emit "$BASE_COMMIT" false false false
    exit 3
  fi
  die "failed to merge '$BASE_REF'"
fi

install_deps
emit "$BASE_COMMIT" true "$INSTALLED" true
