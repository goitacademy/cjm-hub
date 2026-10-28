#!/usr/bin/env bash
# Create a new CJM folder: site/<course-slug>-<6 random hex chars>/
# Prints the created folder path relative to the repository root.
set -euo pipefail

slug="${1:-}"
if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Usage: $0 <course-slug>   (lowercase latin letters, digits, hyphens; e.g. ai-automator)" >&2
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"

shopt -s nullglob
existing=("$root/site/$slug"-??????)
if ((${#existing[@]} > 0)); then
  echo "WARNING: a CJM for '$slug' already exists: ${existing[*]#"$root/"}" >&2
  echo "WARNING: to change it, edit that folder instead of creating a new one." >&2
fi

folder="site/$slug-$(openssl rand -hex 3)"
mkdir -p "$root/$folder"
echo "$folder"
