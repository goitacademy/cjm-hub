#!/usr/bin/env bash
# Validate site/ before publishing. Prints every problem and exits 1 if there is any.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
site="$root/site"
errors=0
fail() { echo "ERROR: $*" >&2; errors=$((errors + 1)); }

shopt -s nullglob

# Files in the site root would be public at a guessable URL.
for f in "$site"/*; do
  [[ -d "$f" ]] || fail "site/$(basename "$f"): no files allowed in the site root, only CJM folders"
done

# The shared template every CJM page loads.
for f in cjm.js cjm.css; do
  [[ -f "$site/_shared/$f" ]] || fail "site/_shared/$f is missing"
done

names=()
for dir in "$site"/*/; do
  name="$(basename "$dir")"
  [[ "$name" == "_shared" ]] || names+=("$name")
done

validate=0
command -v node >/dev/null && validate=1 || echo "WARNING: node not found, CJM data is not validated" >&2

for name in ${names[@]+"${names[@]}"}; do
  [[ "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*-[0-9a-f]{6}$ ]] \
    || fail "site/$name: folder name must be <course-slug>-<6 hex chars>; create folders with scripts/new-cjm.sh"

  page="$site/$name/index.html"
  if [[ ! -f "$page" ]]; then
    fail "site/$name: index.html is missing"
    continue
  fi

  grep -ioE '<meta[^>]*robots[^>]*>' "$page" | grep -qi noindex \
    || fail "site/$name/index.html: <head> must contain <meta name=\"robots\" content=\"noindex, nofollow\">"

  for f in cjm.js cjm.css; do
    grep -qF "../_shared/$f" "$page" || fail "site/$name/index.html: must load ../_shared/$f"
  done

  if ((validate)); then
    node "$root/scripts/validate-cjm.js" "$page" || errors=$((errors + 1))
  fi

  for other in "${names[@]}"; do
    [[ "$other" == "$name" ]] && continue
    grep -qF "$other" "$page" && fail "site/$name/index.html: links to another CJM ($other)"
  done
done

if ((errors > 0)); then
  echo "Check failed. Fix every ERROR above." >&2
  exit 1
fi
echo "OK: ${#names[@]} CJM(s) checked."
