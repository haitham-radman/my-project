#!/bin/bash
# Inventory a skill folder and flag lines worth reading before importing it.
# Usage: scan.sh <skill-dir>
set -euo pipefail

dir="${1:?usage: scan.sh <skill-dir>}"
[ -d "$dir" ] || { echo "not a directory: $dir" >&2; exit 2; }

echo "== Files by type =="
find "$dir" -type f | sed -E 's/.*\.([^./]+)$/\1/; t; s/.*/(none)/' | sort | uniq -c | sort -rn
echo
echo "Total: $(find "$dir" -type f | wc -l) files, $(du -sh "$dir" | cut -f1)"

scan() {
  local label="$1" pattern="$2"
  local hits
  hits=$(grep -rnIE --exclude-dir=.git "$pattern" "$dir" 2>/dev/null | cut -c1-200 || true)
  echo
  echo "== $label ($(printf '%s' "$hits" | grep -c . || true)) =="
  [ -n "$hits" ] && printf '%s\n' "$hits" | sed -n '1,20p'
  return 0
}

scan "Code fetched at run time" 'npx |npm (i|install)|pip3? install|uvx |curl[^|]*\|[[:space:]]*(ba)?sh|wget[^|]*\|[[:space:]]*(ba)?sh|go install|cargo install'
scan "Shell / process execution" 'subprocess|os\.system|child_process|execSync|spawn\(|\beval\(|\bexec\('
scan "Network calls" 'https?://|requests\.(get|post)|urllib|fetch\(|axios|httpx|aiohttp'
scan "Uploads / hosted processing" 'upload|--ocr hosted|multipart|files=|FormData'
scan "Credentials" 'API_KEY|_TOKEN|SECRET|PASSWORD|Authorization:|Bearer |cookie'
