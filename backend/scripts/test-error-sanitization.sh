#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
TMP_BODY=$(mktemp)
trap 'rm -f "$TMP_BODY"' EXIT

STATUS=$(curl -s -o "$TMP_BODY" -w "%{http_code}" "${BASE_URL}/api/test-error") || true
BODY=$(cat "$TMP_BODY")

if [[ "$STATUS" -ne 500 ]]; then
  echo "Expected 500 status, got $STATUS"
  echo "Body: $BODY"
  exit 1
fi

if [[ "$BODY" != *"Internal server error"* ]] || [[ "$BODY" != *"requestId"* ]]; then
  echo "Sanitized payload missing expected fields"
  echo "Body: $BODY"
  exit 1
fi

echo "✅ Sanitized error response verified"
exit 0
