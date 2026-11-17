#!/usr/bin/env bash
# Create a feature branch `<type>/<NNN>-<short-name>` in a nested git worktree
# at `<repo-root>/worktrees/<NNN>-<short-name>`.
#
# Usage: create-worktree.sh [--json] [--dry-run] [--no-fetch] [--base-ref REF]
#                           [--type TYPE] --short-name NAME
#
# Output (--json): BRANCH_NAME, FEATURE_NUM, FEATURE_NAME, FEATURE_DIRECTORY,
# WORKTREE_PATH, MAIN_WORKTREE, BASE_REF, CREATED, IN_WORKTREE.
set -euo pipefail

JSON=false
DRY_RUN=false
FETCH=true
BASE_REF=""
TYPE="feat"
SHORT_NAME=""

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) JSON=true ;;
    --dry-run) DRY_RUN=true ;;
    --no-fetch) FETCH=false ;;
    --base-ref)
      [[ $# -ge 2 ]] || die "--base-ref requires a value"
      BASE_REF="$2"
      shift
      ;;
    --type)
      [[ $# -ge 2 ]] || die "--type requires a value"
      TYPE="$2"
      shift
      ;;
    --short-name)
      [[ $# -ge 2 ]] || die "--short-name requires a value"
      SHORT_NAME="$2"
      shift
      ;;
    -h | --help)
      sed -n '2,9p' "$0"
      exit 0
      ;;
    *) die "unknown argument: $1" ;;
  esac
  shift
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repository"

CURRENT_ROOT="$(git rev-parse --show-toplevel)"
# The first entry of `git worktree list` is always the primary checkout.
MAIN_WORKTREE="$(git worktree list --porcelain | sed -n '1s/^worktree //p')"
[[ -n "$MAIN_WORKTREE" ]] || die "cannot determine the primary worktree"
MAIN_WORKTREE="$(cd "$MAIN_WORKTREE" && pwd)"
CURRENT_ROOT="$(cd "$CURRENT_ROOT" && pwd)"

emit() {
  # emit KEY VALUE pairs as JSON or KEY=VALUE lines
  if $JSON; then
    local out="{" first=true
    while [[ $# -gt 0 ]]; do
      local key="$1" value="$2"
      shift 2
      $first || out+=","
      first=false
      if [[ "$value" == "true" || "$value" == "false" ]]; then
        out+="\"$key\":$value"
      else
        value="${value//\\/\\\\}"
        value="${value//\"/\\\"}"
        out+="\"$key\":\"$value\""
      fi
    done
    echo "$out}"
  else
    while [[ $# -gt 0 ]]; do
      echo "$1=$2"
      shift 2
    done
  fi
}

# Already in a linked feature worktree: reuse it instead of nesting another one.
if [[ "$CURRENT_ROOT" != "$MAIN_WORKTREE" ]]; then
  BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
  FEATURE_NAME="${BRANCH_NAME##*/}"
  FEATURE_NUM=""
  [[ "$FEATURE_NAME" =~ ^([0-9]{3,})- ]] && FEATURE_NUM="${BASH_REMATCH[1]}"
  emit BRANCH_NAME "$BRANCH_NAME" FEATURE_NUM "$FEATURE_NUM" FEATURE_NAME "$FEATURE_NAME" \
    FEATURE_DIRECTORY "specs/$FEATURE_NAME" WORKTREE_PATH "$CURRENT_ROOT" \
    MAIN_WORKTREE "$MAIN_WORKTREE" BASE_REF "" CREATED false IN_WORKTREE true
  exit 0
fi

[[ -n "$SHORT_NAME" ]] || die "--short-name is required"
[[ "$TYPE" =~ ^[a-z]+$ ]] || die "--type must be lowercase letters (feat, fix, refactor, docs, chore, ...)"

# Sanitize the short name into a kebab-case slug.
SLUG="$(printf '%s' "$SHORT_NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
[[ -n "$SLUG" ]] || die "--short-name produced an empty slug"

# Resolve the base ref: flag > config > origin/main.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../../worktree-config.yml"
if [[ -z "$BASE_REF" && -f "$CONFIG_FILE" ]]; then
  BASE_REF="$(sed -nE 's/^base_ref:[[:space:]]*"?([^"#[:space:]]+)"?.*$/\1/p' "$CONFIG_FILE" | head -n 1)"
fi
[[ -n "$BASE_REF" ]] || BASE_REF="origin/main"

if $FETCH; then
  remote="${BASE_REF%%/*}"
  if [[ "$remote" != "$BASE_REF" ]] && git remote | grep -qx "$remote"; then
    git fetch --quiet "$remote" "${BASE_REF#*/}" >&2 || die "git fetch $remote ${BASE_REF#*/} failed"
  fi
fi

git rev-parse --verify --quiet "$BASE_REF^{commit}" >/dev/null || die "base ref '$BASE_REF' not found"
# (colon-free `<ref> -- <path>` form: MSYS rewrites `<ref>:<path>` arguments on Windows)
[[ -n "$(git ls-tree --name-only "$BASE_REF" -- .specify/init-options.json)" ]] ||
  die "base ref '$BASE_REF' has no Spec Kit setup (.specify/); commit and push it first"

# Next feature number: one past the highest number used by specs on the base ref,
# specs in the primary checkout, or any local/remote branch.
max=0
consider() {
  local name="${1##*/}"
  if [[ "$name" =~ ^([0-9]{3,})- ]]; then
    local n=$((10#${BASH_REMATCH[1]}))
    ((n > max)) && max=$n
  fi
  return 0
}
while IFS= read -r entry; do consider "$entry"; done < <(git ls-tree --name-only "$BASE_REF" -- specs/ 2>/dev/null || true)
if [[ -d "$MAIN_WORKTREE/specs" ]]; then
  while IFS= read -r entry; do consider "$entry"; done < <(ls -1 "$MAIN_WORKTREE/specs")
fi
while IFS= read -r entry; do consider "$entry"; done < <(git for-each-ref --format='%(refname:short)' refs/heads refs/remotes)

FEATURE_NUM="$(printf '%03d' $((max + 1)))"
FEATURE_NAME="$FEATURE_NUM-$SLUG"
BRANCH_NAME="$TYPE/$FEATURE_NAME"
# Nested layout: worktrees/<NNN>-<slug> inside the primary checkout.
WORKTREE_PATH="$MAIN_WORKTREE/worktrees/$FEATURE_NAME"

git show-ref --verify --quiet "refs/heads/$BRANCH_NAME" && die "branch '$BRANCH_NAME' already exists"
[[ -e "$WORKTREE_PATH" ]] && die "path '$WORKTREE_PATH' already exists"

CREATED=false
if ! $DRY_RUN; then
  mkdir -p "$MAIN_WORKTREE/worktrees"
  git -C "$MAIN_WORKTREE" worktree add --quiet --no-track -b "$BRANCH_NAME" "$WORKTREE_PATH" "$BASE_REF" >&2
  CREATED=true
fi

emit BRANCH_NAME "$BRANCH_NAME" FEATURE_NUM "$FEATURE_NUM" FEATURE_NAME "$FEATURE_NAME" \
  FEATURE_DIRECTORY "specs/$FEATURE_NAME" WORKTREE_PATH "$WORKTREE_PATH" \
  MAIN_WORKTREE "$MAIN_WORKTREE" BASE_REF "$BASE_REF" CREATED "$CREATED" IN_WORKTREE false
