#!/usr/bin/env bash
# Helpers shared by the worktree scripts: extract spec numbers from ref names and
# match branches that use the same number.
#
# Source this file; it defines functions only.

# feature_number_from_branch BRANCH: print the 3+ digit prefix of the branch's
# last path segment, or nothing when the name has no number.
feature_number_from_branch() {
  local base="${1##*/}"
  if [[ "$base" =~ ^([0-9]{3,})- ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
  fi
  return 0
}

# remote_branches: read `git ls-remote --heads` output on stdin and print branch
# names without the refs/heads/ prefix.
remote_branches() {
  local line ref
  while IFS= read -r line; do
    if [[ -n "$line" ]]; then
      ref="${line#*$'\t'}"
      printf '%s\n' "${ref#refs/heads/}"
    fi
  done
  return 0
}

# spec_branches_with_number NUMBER: read branch names on stdin and print those
# whose last segment starts with NUMBER-.
spec_branches_with_number() {
  local number="$1" branch
  while IFS= read -r branch; do
    if [[ "${branch##*/}" == "${number}-"* ]]; then
      printf '%s\n' "$branch"
    fi
  done
  return 0
}
