#!/usr/bin/env bash
# Upload a PDF (and optional OCR text JSON) to Convex file storage and register it as a book.
# Usage: scripts/upload-book.sh <slug> "<Bengali title>" <book.pdf> [book-text.json] ["English title"]
set -euo pipefail
slug=$1; title=$2; pdf=$3; text=${4:-}; title_en=${5:-}

upload() { # file, content-type -> storage id
  local url
  url=$(npx convex run books:generateUploadUrl | tr -d '"')
  curl -fsS -X POST -H "Content-Type: $2" --data-binary "@$1" "$url" | python3 -c 'import json,sys;print(json.load(sys.stdin)["storageId"])'
}

pdf_id=$(upload "$pdf" application/pdf)
args=$(python3 - "$slug" "$title" "$pdf_id" "$title_en" <<'PY'
import json,sys
slug,title,pdf,en=sys.argv[1:5]
d={"slug":slug,"title":title,"pdfStorageId":pdf}
if en: d["titleEn"]=en
print(json.dumps(d))
PY
)
if [ -n "$text" ]; then
  text_id=$(upload "$text" application/json)
  args=$(python3 -c 'import json,sys;d=json.loads(sys.argv[1]);d["textStorageId"]=sys.argv[2];print(json.dumps(d))' "$args" "$text_id")
fi
npx convex run books:upsert "$args"
echo "Uploaded book '$slug'. Reopen the app to see it."
