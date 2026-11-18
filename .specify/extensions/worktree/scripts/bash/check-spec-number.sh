#!/usr/bin/env bash
# Check that the spec number of a feature branch is unique across the remote
# branches and the base ref's specs/ directory.
#
# Usage: check-spec-number.sh [--json] [--branch NAME] [--base-ref REF]
#
# Exit codes: 0 unique (or no number to check), 4 conflict, 1 error.
set -euo pipefail

JSON=false
BRANCH=""
BASE_REF="origin/main"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    --branch)
      [[ $# -ge 2 ]] || die "--branch requires a value"
      BRANCH="$2"
      shift
      ;;
    --base-ref)
      [[ $# -ge 2 ]] || die "--base-ref requires a value"
      BASE_REF="$2"
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/spec-number-lib.sh"

[[ -n "$BRANCH" ]] || BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$BRANCH" != "HEAD" ]] || die "HEAD is detached; check out the feature branch first"

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  printf '%s' "${value//\"/\\\"}"
}

CONFLICTS=()
NUMBER=""
SKIPPED=false

print_result() {
  local unique="$1" joined="" item
  if $JSON; then
    for item in "${CONFLICTS[@]}"; do
      if [[ -n "$joined" ]]; then
        joined+=","
      fi
      joined+="$(json_escape "$item")"
    done
    printf '{"BRANCH":"%s","FEATURE_NUM":"%s","UNIQUE":%s,"SKIPPED":%s,"CONFLICTS":"%s"}\n' \
      "$(json_escape "$BRANCH")" "$NUMBER" "$unique" "$SKIPPED" "$joined"
  else
    echo "BRANCH=$BRANCH"
    echo "FEATURE_NUM=$NUMBER"
    echo "UNIQUE=$unique"
    echo "SKIPPED=$SKIPPED"
    for item in "${CONFLICTS[@]}"; do
      echo "CONFLICT=$item"
    done
  fi
}

NUMBER="$(feature_number_from_branch "$BRANCH")"
if [[ -z "$NUMBER" ]]; then
  SKIPPED=true
  print_result true
  exit 0
fi

# Refresh the base ref so the specs/ check sees the latest merged specs.
remote="${BASE_REF%%/*}"
base_branch="${BASE_REF#*/}"
if [[ "$remote" != "$BASE_REF" ]] && git remote | grep -qx "$remote"; then
  git fetch --quiet "$remote" "$base_branch" >&2 || die "failed to fetch '$BASE_REF'"
fi
git rev-parse --verify --quiet "$BASE_REF^{commit}" >/dev/null || die "base ref '$BASE_REF' not found"

remote_heads="$(git ls-remote --heads origin)" || die "failed to query remote 'origin'"
while IFS= read -r conflict; do
  if [[ -n "$conflict" && "$conflict" != "$BRANCH" ]]; then
    CONFLICTS+=("$conflict")
  fi
done < <(printf '%s\n' "$remote_heads" | remote_branches | spec_branches_with_number "$NUMBER")

base_specs="$(git ls-tree --name-only "$BASE_REF" -- specs/ 2>/dev/null || true)"
while IFS= read -r spec_path; do
  if [[ -n "$spec_path" ]]; then
    spec_name="${spec_path#specs/}"
    if [[ "$spec_name" == "${NUMBER}-"* && "$spec_name" != "${BRANCH##*/}" ]]; then
      CONFLICTS+=("$spec_path")
    fi
  fi
done < <(printf '%s\n' "$base_specs")

if [[ ${#CONFLICTS[@]} -eq 0 ]]; then
  print_result true
  exit 0
fi

print_result false
exit 4
