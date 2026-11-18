#!/usr/bin/env bash
# Fast-forward the primary checkout's `main` to `origin/main`.
#
# Usage: sync-main.sh [--json]
#
# Runs from the primary checkout or any linked worktree; it always acts on the
# primary checkout (the first entry of `git worktree list`). Only `git fetch` and
# `git pull --ff-only` touch it. Exit 0 means `main` equals `origin/main`; exit 2
# means the primary checkout is not on `main`, has changes, or has commits that
# are not on `origin/main`; exit 1 means any other failure. Nonzero exits leave
# the primary checkout untouched.
set -euo pipefail

# `git pull` may rewrite this file while it runs. The whole script is a function
# and the call shares one line with `exit`, so bash parses everything up front.
main() {
  local json=false
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --json) json=true ;;
      -h | --help)
        sed -n '2,11p' "$0"
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
  [[ "$branch" == "main" ]] || fail 2 "primary checkout is not on main (current: $branch)"
  [[ -z "$(git -C "$main_wt" status --porcelain)" ]] ||
    fail 2 "primary checkout has uncommitted changes: $(git -C "$main_wt" status --porcelain | tr '\n' ' ')"

  git -C "$main_wt" fetch --quiet origin main >&2 || fail 1 "failed to fetch 'origin'"

  local before remote
  before="$(git -C "$main_wt" rev-parse HEAD)"
  remote="$(git -C "$main_wt" rev-parse refs/remotes/origin/main)" ||
    fail 1 "'origin/main' does not resolve to a commit"
  git -C "$main_wt" merge-base --is-ancestor "$before" "$remote" ||
    fail 2 "primary checkout's main has commits not on origin/main"

  local updated=false
  if [[ "$before" != "$remote" ]]; then
    git -C "$main_wt" pull --quiet --ff-only origin main >&2 || fail 1 "git pull --ff-only failed"
    updated=true
  fi
  local after
  after="$(git -C "$main_wt" rev-parse HEAD)"

  if $json; then
    local path="${main_wt//\\/\\\\}"
    printf '{"MAIN_WORKTREE":"%s","BEFORE_COMMIT":"%s","MAIN_COMMIT":"%s","UPDATED":%s}\n' \
      "${path//\"/\\\"}" "$before" "$after" "$updated"
  else
    echo "MAIN_WORKTREE=$main_wt"
    echo "BEFORE_COMMIT=$before"
    echo "MAIN_COMMIT=$after"
    echo "UPDATED=$updated"
  fi
}

# fail CODE MESSAGE: print the reason to stderr and exit with CODE.
fail() {
  echo "ERROR: $2" >&2
  exit "$1"
}

main "$@"; exit $?
