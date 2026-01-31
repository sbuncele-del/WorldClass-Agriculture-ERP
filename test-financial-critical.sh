#!/bin/bash
BASE_URL="http://51.20.92.38:3000/api/financial"
TENANT="x-tenant-id: 00000000-0000-0000-0000-000000000001"

echo "=== CRITICAL FINANCIAL ENDPOINTS TEST ==="
echo ""

echo "1. Journal Entry Detail (ID 18):"
curl -s "$BASE_URL/journal-entries/18" -H "$TENANT" | jq -r '.success, (.data.lines | length)'

echo ""
echo "2. General Ledger:"
curl -s "$BASE_URL/ledger/general?from_date=2025-11-01&to_date=2025-11-30" -H "$TENANT" | jq -r '.success, .count'

echo ""
echo "3. Account Ledger (1200 - AR):"
curl -s "$BASE_URL/ledger/accounts/1200?from_date=2025-11-01&to_date=2025-11-30" -H "$TENANT" | jq -r '.success, .count'

echo ""
echo "4. Fiscal Years:"
curl -s "$BASE_URL/fiscal-years" -H "$TENANT" | jq -r '.success, .count'

echo ""
echo "5. Fiscal Periods:"
curl -s "$BASE_URL/fiscal-periods?year=2025" -H "$TENANT" | jq -r '.success, .count'

echo ""
echo "6. Cash Flow Statement:"
curl -s "$BASE_URL/cash-flow?fromDate=2025-11-01&toDate=2025-11-30" -H "$TENANT" | jq -r '.success, (.data.totals.net_cash_flow // "error")'

