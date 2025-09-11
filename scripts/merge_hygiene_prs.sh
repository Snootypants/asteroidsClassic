#!/usr/bin/env bash
set -euo pipefail

# merge_hygiene_prs.sh
# Batch-triage, test, and merge “hygiene/QA” PRs in a safe order.
# Requirements: gh, git, jq, bash, and one of pnpm|yarn|npm available.
#
# Usage:
#   scripts/merge_hygiene_prs.sh \
#     --dry-run           # show what would happen, do not merge
#     --staging           # integrate into a staging branch first, open one PR to main
#     --label SAFE_LABEL  # only process PRs with this label (can repeat)
#     --exclude-label L   # skip PRs with this label (can repeat)
#     --author NAME       # only PRs from this author (login)
#     --repo OWNER/NAME   # target repo (defaults to current)
#     --limit N           # max PRs to consider (default 100)
#     --yes               # non-interactive, assume yes to merges

dry_run=0
use_staging=0
staging_branch_override=""
assume_yes=0
skip_conflicts=0
skip_tests=0
ignore_test_failures=0
repo=""
limit=100
include_labels=()
exclude_labels=()
author_filter=""

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"
}

confirm() {
  if [[ "$assume_yes" == "1" ]]; then return 0; fi
  read -r -p "$1 [y/N]: " ans || true
  [[ "${ans:-}" =~ ^[Yy]$ ]]
}

print_help() {
  sed -n '1,60p' "$0"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) dry_run=1; shift ;;
    --staging) use_staging=1; shift ;;
    --yes) assume_yes=1; shift ;;
    --staging-branch) staging_branch_override="$2"; use_staging=1; shift 2 ;;
    --skip-conflicts) skip_conflicts=1; shift ;;
    --skip-tests) skip_tests=1; shift ;;
    --ignore-test-failures) ignore_test_failures=1; shift ;;
    --repo) repo="$2"; shift 2 ;;
    --limit) limit="$2"; shift 2 ;;
    --label) include_labels+=("$2"); shift 2 ;;
    --exclude-label) exclude_labels+=("$2"); shift 2 ;;
    --author) author_filter="$2"; shift 2 ;;
    --skip-conflicts) skip_conflicts=1; shift ;;
    --skip-tests) skip_tests=1; shift ;;
    --ignore-test-failures) ignore_test_failures=1; shift ;;
    -h|--help) print_help; exit 0 ;;
    *) die "Unknown arg: $1" ;;
  esac
done

need gh
need jq
need git

# Pick package manager
pkg=""
if command -v pnpm >/dev/null 2>&1; then
  pkg="pnpm"
elif command -v yarn >/dev/null 2>&1; then
  pkg="yarn"
elif command -v npm >/dev/null 2>&1; then
  pkg="npm"
else
  die "No package manager found (pnpm|yarn|npm)"
fi

pm_install() {
  case "$pkg" in
    pnpm) pnpm install --frozen-lockfile || pnpm install ;;
    yarn) yarn install --frozen-lockfile || yarn install ;;
    npm)  npm ci || npm install ;;
  esac
}

pm_script() {
  local script="$1"
  case "$pkg" in
    pnpm) pnpm run "$script" ;;
    yarn) yarn "$script" ;;
    npm)  npm run "$script" ;;
  esac
}

# Bash 3 compatibility helpers
read_file_into_array() {
  # usage: read_file_into_array varname filepath
  local __name="$1"; local __file="$2"
  local __arr=(); local __line
  while IFS= read -r __line; do __arr+=("$__line"); done < "$__file"
  eval "$__name=(\"\${__arr[@]}\" )"
}

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  die "Working tree not clean. Commit or stash changes first."
fi

# Resolve repo
if [[ -z "$repo" ]]; then
  repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)" || die "Not inside a GitHub repo and no --repo provided"
fi

# Ensure on default branch and updated
default_branch="$(gh repo view "$repo" --json defaultBranchRef -q .defaultBranchRef.name)"
git fetch origin "$default_branch" --prune
git checkout "$default_branch"
git pull --ff-only origin "$default_branch"

# Build PR query
jq_filters=()
if [[ ${#include_labels[@]} -gt 0 ]]; then
  for l in "${include_labels[@]}"; do
    jq_filters+=(".labels[].name == \"$l\"")
  done
fi
if [[ ${#exclude_labels[@]} -gt 0 ]]; then
  for l in "${exclude_labels[@]}"; do
    jq_filters+=("(.labels | any(.name == \"$l\") | not)")
  done
fi
if [[ -n "$author_filter" ]]; then
  jq_filters+=(".author.login == \"$author_filter\"")
fi

log "Fetching open PRs from $repo…"
prs_json="$(gh pr list --repo "$repo" --state open --limit "$limit" --json number,title,author,labels,headRefName,baseRefName,isDraft,url)" || die "Failed to list PRs"

if [[ ${#jq_filters[@]} -gt 0 ]]; then
  local_filter=".[] | select($(IFS=' and '; echo "${jq_filters[*]}"))"
else
  local_filter=".[]"
fi
prs=()
tmp_prs="$(mktemp)"
jq -c "$local_filter" <<<"$prs_json" > "$tmp_prs"
read_file_into_array prs "$tmp_prs"
rm -f "$tmp_prs"

if [[ ${#prs[@]} -eq 0 ]]; then
  log "No PRs matched filters."; exit 0
fi

# Classification by title patterns. Order defines merge order.
order_patterns=(
  'ci|workflow|github actions|actions|pipeline'
  'lint|eslint|prettier|style|format'
  'docs?|readme|chore'
  'types?|ts-check|strict|noImplicit'
  'dead code|remove unused|cleanup'
  'dep(|s)|dependencies|bump|upgrade|update'
  'refactor'
)

classify_bucket() {
  local title="$1"; local idx=0
  for pat in "${order_patterns[@]}"; do
    if [[ "$title" =~ $pat ]]; then echo "$idx"; return 0; fi
    idx=$((idx+1))
  done
  echo 999
}

tmp_sort="$(mktemp)"
for row in "${prs[@]}"; do
  num=$(jq -r .number <<<"$row")
  title=$(jq -r .title <<<"$row")
  bucket=$(classify_bucket "$title")
  printf '%04d\t%s\n' "$bucket" "$row" >> "$tmp_sort"
done
sorted=()
tmp_sorted="$(mktemp)"
sort -n "$tmp_sort" | cut -f2- > "$tmp_sorted"
read_file_into_array sorted "$tmp_sorted"
rm -f "$tmp_sorted"
rm -f "$tmp_sort"

log "Planned order:"
for row in "${sorted[@]}"; do
  printf '#%s  %s\n' "$(jq -r .number <<<"$row")" "$(jq -r .title <<<"$row")" >&2
done

if ! confirm "Proceed with this order"; then log "Aborted."; exit 1; fi

ts="$(date +%Y%m%d%H%M)"
staging_branch=${staging_branch_override:-"hygiene-integration-$ts"}
if [[ $use_staging -eq 1 ]]; then
  if [[ $dry_run -eq 1 ]]; then
    log "[DRY RUN] Would create/refresh staging branch: $staging_branch"
  else
    if git show-ref --verify --quiet "refs/heads/$staging_branch"; then
      log "Using existing staging branch: $staging_branch"
      git checkout "$staging_branch"
      git fetch origin "$default_branch"
      # Do not reset existing staging; keep accumulated merges
    else
      log "Creating staging branch: $staging_branch"
      git checkout -B "$staging_branch" "origin/$default_branch"
    fi
  fi
fi

run_ci_local() {
  log "Installing deps"
  pm_install
  if jq -e '.scripts.lint? != null' package.json >/dev/null 2>&1; then
    log "Running lint"; pm_script lint; fi
  if jq -e '.scripts.typecheck? != null' package.json >/dev/null 2>&1; then
    log "Running typecheck"; pm_script typecheck; fi
  if jq -e '.scripts.build? != null' package.json >/dev/null 2>&1; then
    log "Running build"; pm_script build; fi
  if jq -e '.scripts.test? != null' package.json >/dev/null 2>&1; then
    if [[ $skip_tests -eq 1 ]]; then
      log "Skipping tests (--skip-tests)"
    else
      if jq -e '.scripts["test:ci"]? != null' package.json >/dev/null 2>&1; then
        log "Running tests (ci)"
        if [[ $ignore_test_failures -eq 1 ]]; then
          set +e; pm_script test:ci; rc=$?; set -e; if [[ $rc -ne 0 ]]; then log "Tests failed but continuing (--ignore-test-failures)"; fi
        else
          pm_script test:ci
        fi
      else
        log "Running tests"
        if [[ $ignore_test_failures -eq 1 ]]; then
          set +e; CI=1 pm_script test; rc=$?; set -e; if [[ $rc -ne 0 ]]; then log "Tests failed but continuing (--ignore-test-failures)"; fi
        else
          CI=1 pm_script test
        fi
      fi
    fi
  fi
}

merge_squash_auto() {
  local num="$1"; local url="$2"
  if [[ $dry_run -eq 1 ]]; then log "DRY RUN: would merge PR #$num"; return 0; fi
  log "Merging PR #$num"
  gh pr merge "$num" --repo "$repo" --squash --delete-branch --auto
  log "Merge requested: $url"
}

merge_into_staging() {
  local num="$1"; local headRef="$2"; local url="$3"
  if [[ $dry_run -eq 1 ]]; then
    log "[DRY RUN] Would merge #$num ($headRef) into $staging_branch"
    return 0
  fi
  log "Merging #$num ($headRef) into $staging_branch"
  git checkout "$staging_branch"
  git fetch origin "pull/$num/head:pr-$num"
  set +e
  git merge --no-ff "pr-$num" -m "Merge #$num into $staging_branch"
  rc=$?
  set -e
  if [[ $rc -ne 0 ]]; then
    if [[ $skip_conflicts -eq 1 ]]; then
      log "Conflict while merging #$num. Aborting merge and skipping due to --skip-conflicts."
      git merge --abort || true
      return 0
    else
      log "Conflict while merging #$num. Resolve manually, then continue."; die "Conflicts detected in staging merge."
    fi
  fi
  if [[ -f package.json ]]; then run_ci_local "PR #$num"; else log "No package.json; skipping JS steps."; fi
}

for row in "${sorted[@]}"; do
  num=$(jq -r .number <<<"$row")
  title=$(jq -r .title <<<"$row")
  url=$(jq -r .url <<<"$row")
  head=$(jq -r .headRefName <<<"$row")

  log "=== PR #$num: $title ==="
  tmp_branch="tmp-pr-$num-$ts"
  git fetch origin "pull/$num/head:$tmp_branch" --force
  git checkout "$tmp_branch"

  git fetch origin "$default_branch"
  set +e
  git rebase "origin/$default_branch"
  rebase_rc=$?
  set -e
  if [[ $rebase_rc -ne 0 ]]; then
    log "Rebase conflict on #$num. Aborting rebase and skipping."
    git rebase --abort || true
    git checkout "$default_branch"
    continue
  fi

  if [[ -f package.json ]]; then run_ci_local "$title"; else log "No package.json; skipping JS steps."; fi

  git checkout "$default_branch"
  if [[ $use_staging -eq 1 ]]; then
    merge_into_staging "$num" "$head" "$url"
  else
    if confirm "Squash-merge #$num into $default_branch"; then
      merge_squash_auto "$num" "$url"
    else
      log "Skipped #$num"
    fi
  fi
done

if [[ $use_staging -eq 1 ]]; then
  if [[ $dry_run -eq 1 ]]; then
    log "[DRY RUN] Would push staging branch and open PR to $default_branch"
  else
    log "Pushing staging branch"
    git push -u origin "$staging_branch"
    log "Creating PR $staging_branch -> $default_branch"
    gh pr create \
      --repo "$repo" \
      --base "$default_branch" \
      --head "$staging_branch" \
      --title "Hygiene batch integration" \
      --body "Batched merges from hygiene QA. Order enforced by title patterns. Local CI run per PR."
  fi
fi

log "Done."
