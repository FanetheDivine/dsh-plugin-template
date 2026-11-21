#!/usr/bin/env bash
# Fast-forward the primary checkout's `main` to `origin/main`.
#
# Usage: sync-main.sh [--json] [--prepare]
#
# Runs from the primary checkout or any linked worktree; it always acts on the
# primary checkout (the first entry of `git worktree list`).
#
# Without --prepare only `git fetch` and `git pull --ff-only` touch the primary
# checkout. Exit 0 means `main` equals `origin/main`; exit 2 means the primary
# checkout is not on `main`, has changes, or has commits that are not on
# `origin/main`; exit 1 means any other failure. Nonzero exits leave the primary
# checkout untouched.
#
# With --prepare the checkout is first made ready to fast-forward: uncommitted
# changes are stashed, another branch is switched back to `main`, and `main`
# commits ahead of `origin/main` are saved on a `wip/...` branch before `main`
# is reset. Nonzero exits keep the stash and the temporary branch.
set -euo pipefail

STASHED=false

# stash_changes WORKTREE: save tracked and untracked changes of WORKTREE.
stash_changes() {
  local wt="$1"
  [[ -n "$(git -C "$wt" status --porcelain)" ]] || return 0
  git -C "$wt" stash push --quiet --include-untracked \
    -m "worktree-finish: save primary checkout changes" >&2 ||
    fail 2 "failed to stash primary checkout changes"
  STASHED=true
}

main() {
  local json=false prepare=false
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --json) json=true ;;
      --prepare) prepare=true ;;
      -h | --help)
        sed -n '2,/^$/p' "$0" | sed '$d'
        return 0
        ;;
      *) fail 1 "unknown argument: $1" ;;
    esac
    shift
  done

  local main_wt
  main_wt="$(git worktree list --porcelain | sed -n '1s/^worktree //p')" ||
    fail 1 "not inside a git repository"
  [[ -n "$main_wt" ]] || fail 1 "cannot determine the primary checkout"
  main_wt="$(cd "$main_wt" && pwd)"

  local branch
  branch="$(git -C "$main_wt" symbolic-ref --quiet --short HEAD || echo HEAD)"

  local temp_branch=""

  if $prepare; then
    if [[ "$branch" == "HEAD" ]]; then
      stash_changes "$main_wt"
      temp_branch="wip/detached-$(date +%Y%m%dT%H%M%S)"
      git -C "$main_wt" branch "$temp_branch" HEAD >&2 ||
        fail 2 "failed to save detached HEAD on '$temp_branch'"
      git -C "$main_wt" switch --quiet main >&2 ||
        fail 2 "failed to switch primary checkout to main"
    elif [[ "$branch" != "main" ]]; then
      stash_changes "$main_wt"
      git -C "$main_wt" switch --quiet main >&2 ||
        fail 2 "failed to switch primary checkout to main"
    else
      stash_changes "$main_wt"
    fi
  else
    [[ "$branch" == "main" ]] ||
      fail 2 "primary checkout is not on main (current: $branch)"
    [[ -z "$(git -C "$main_wt" status --porcelain)" ]] ||
      fail 2 "primary checkout has uncommitted changes: $(git -C "$main_wt" status --porcelain | tr '\n' ' ')"
  fi

  git -C "$main_wt" fetch --quiet origin main >&2 || fail 1 "failed to fetch 'origin'"

  local before remote
  before="$(git -C "$main_wt" rev-parse HEAD)"
  remote="$(git -C "$main_wt" rev-parse refs/remotes/origin/main)" ||
    fail 1 "'origin/main' does not resolve to a commit"

  if ! git -C "$main_wt" merge-base --is-ancestor "$before" "$remote"; then
    $prepare || fail 2 "primary checkout's main has commits not on origin/main"
    local saved="wip/main-$(date +%Y%m%dT%H%M%S)"
    git -C "$main_wt" branch "$saved" "$before" >&2 ||
      fail 2 "failed to save main commits on '$saved'"
    temp_branch="${temp_branch:+$temp_branch,}$saved"
    git -C "$main_wt" reset --quiet --hard "$remote" >&2 ||
      fail 2 "failed to reset main to origin/main"
  fi

  local current after updated=false
  current="$(git -C "$main_wt" rev-parse HEAD)"
  if [[ "$current" != "$remote" ]]; then
    git -C "$main_wt" pull --quiet --ff-only origin main >&2 || fail 1 "git pull --ff-only failed"
  fi
  after="$(git -C "$main_wt" rev-parse HEAD)"
  [[ "$before" == "$after" ]] || updated=true

  if $json; then
    local path="${main_wt//\\/\\\\}"
    local saved_path="${temp_branch//\"/\\\"}"
    printf '{"MAIN_WORKTREE":"%s","BEFORE_COMMIT":"%s","MAIN_COMMIT":"%s","UPDATED":%s,"STASHED":%s,"TEMP_BRANCH":"%s"}\n' \
      "${path//\"/\\\"}" "$before" "$after" "$updated" "$STASHED" "$saved_path"
  else
    echo "MAIN_WORKTREE=$main_wt"
    echo "BEFORE_COMMIT=$before"
    echo "MAIN_COMMIT=$after"
    echo "UPDATED=$updated"
    echo "STASHED=$STASHED"
    echo "TEMP_BRANCH=$temp_branch"
  fi
}

# fail CODE MESSAGE: print the reason to stderr and exit with CODE.
fail() {
  echo "ERROR: $2" >&2
  exit "$1"
}

main "$@"; exit $?