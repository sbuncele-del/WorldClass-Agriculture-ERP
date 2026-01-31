#!/bin/bash
BASE="http://51.20.92.38:3000/api"
H="x-tenant-id: 00000000-0000-0000-0000-000000000001"

test_endpoint() {
  local name="$1"
  local endpoint="$2"
  result=$(curl -s "$BASE$endpoint" -H "$H" 2>&1)
  if echo "$result" | jq -e '.success == true or .customers or .vendors or .purchase_orders or .employees' &>/dev/null; then
    echo "✅ $name"
    return 0
  else
    echo "❌ $name"
    return 1
  fi
}

echo "SALES MODULE:"
test_endpoint "Customers" "/sales/customers"
test_endpoint "Invoices" "/sales/invoices"
test_endpoint "Quotes" "/sales/quotes"
test_endpoint "Orders" "/sales/orders"
echo ""

echo "PURCHASE MODULE:"
test_endpoint "Vendors" "/purchase/vendors"
test_endpoint "PO List" "/purchase/purchase-orders"
test_endpoint "Requisitions" "/purchase/requisitions"
echo ""

echo "INVENTORY MODULE:"
test_endpoint "Items" "/inventory/items"
test_endpoint "Stock Levels" "/inventory/stock-levels"
test_endpoint "Movements" "/inventory/stock-movements"
echo ""

echo "FINANCIAL MODULE:"
test_endpoint "COA" "/financial/chart-of-accounts"
test_endpoint "Journal Entries" "/financial/journal-entries"
test_endpoint "General Ledger" "/financial/ledger/general?from_date=2025-11-01&to_date=2025-11-30&limit=5"

