#!/usr/bin/env bash
# Load the JSONL files from scripts/build-seed.py into Convex (replaces each table's rows).
# Usage: scripts/import-seed.sh [table ...]   (default: every table)   Add --prod via CONVEX_FLAGS.
set -euo pipefail
cd "$(dirname "$0")/.."
tables=("$@"); [ ${#tables[@]} -eq 0 ] && tables=(hadithBooks surahs ayahs duas names quotes hadith)
for t in "${tables[@]}"; do
  f=content-source/seed/out/$t.jsonl
  if [ ! -s "$f" ]; then echo "skip $t (empty)"; continue; fi
  echo "importing ${t}..."
  npx convex import --table "$t" --replace --yes ${CONVEX_FLAGS:-} "$f"
done
