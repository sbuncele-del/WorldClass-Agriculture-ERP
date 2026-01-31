#!/bin/bash

# Test Double-Entry Flow and Trial Balance
# This script tests:
# 1. Creating a journal entry
# 2. Posting to GL
# 3. Verifying Trial Balance reflects the posting

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║          🧪 TESTING DOUBLE-ENTRY FLOW & TRIAL BALANCE           ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000/api/financial"

echo "📊 Step 1: Get Trial Balance BEFORE posting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TB_BEFORE=$(curl -s "${BASE_URL}/trial-balance?as_of_date=2025-11-06")
echo "$TB_BEFORE" | jq '.data.accounts[] | select(.account_code | startswith("1100") or startswith("6100")) | {account_code, account_name, debit_balance, credit_balance}'
echo ""

echo "📝 Step 2: Create Journal Entry (Office Supplies - R5,000)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CREATE_PAYLOAD='{
  "journal_date": "2025-11-06",
  "description": "Office supplies purchase",
  "notes": "Testing double-entry posting",
  "source_type": "MANUAL",
  "lines": [
    {
      "account_code": "6100",
      "debit_amount": 5000,
      "description": "Office supplies expense"
    },
    {
      "account_code": "1100",
      "credit_amount": 5000,
      "description": "Cash payment"
    }
  ]
}'

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/journal-entries" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

echo "$CREATE_RESPONSE" | jq '.'
ENTRY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id')
echo ""
echo "✅ Journal Entry Created: $ENTRY_ID"
echo ""

echo "📮 Step 3: Post Journal Entry to General Ledger..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

POST_PAYLOAD='{
  "user_id": "test-user"
}'

POST_RESPONSE=$(curl -s -X POST "${BASE_URL}/journal-entries/${ENTRY_ID}/post" \
  -H "Content-Type: application/json" \
  -d "$POST_PAYLOAD")

echo "$POST_RESPONSE" | jq '.'
echo ""

if echo "$POST_RESPONSE" | jq -e '.success' > /dev/null; then
  echo "✅ Journal Entry Posted Successfully!"
else
  echo "❌ Failed to post journal entry"
  echo "$POST_RESPONSE" | jq '.error'
  exit 1
fi
echo ""

echo "⏳ Waiting 2 seconds for GL updates..."
sleep 2
echo ""

echo "📊 Step 4: Get Trial Balance AFTER posting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TB_AFTER=$(curl -s "${BASE_URL}/trial-balance?as_of_date=2025-11-06")
echo "$TB_AFTER" | jq '.data.accounts[] | select(.account_code | startswith("1100") or startswith("6100")) | {account_code, account_name, debit_balance, credit_balance}'
echo ""

echo "📊 Step 5: Verify Trial Balance Totals..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$TB_AFTER" | jq '{
  total_debits: .data.total_debits,
  total_credits: .data.total_credits,
  difference: .data.difference,
  is_balanced: .data.is_balanced
}'
echo ""

echo "📊 Step 6: Check GL Account Balances Directly..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
GL_BALANCE=$(curl -s "${BASE_URL}/general-ledger/balances?as_of_date=2025-11-06")
echo "$GL_BALANCE" | jq '.data[] | select(.account_code | startswith("1100") or startswith("6100"))'
echo ""

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                    ✅ TEST RESULTS SUMMARY                       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if balances updated
CASH_CREDIT=$(echo "$TB_AFTER" | jq -r '.data.accounts[] | select(.account_code == "1100") | .credit_balance')
EXPENSE_DEBIT=$(echo "$TB_AFTER" | jq -r '.data.accounts[] | select(.account_code == "6100") | .debit_balance')

echo "Expected Results:"
echo "  • Account 1100 (Cash): Credit balance should increase by R5,000"
echo "  • Account 6100 (Office Expenses): Debit balance should increase by R5,000"
echo ""
echo "Actual Results:"
echo "  • Account 1100 Credit Balance: R${CASH_CREDIT}"
echo "  • Account 6100 Debit Balance: R${EXPENSE_DEBIT}"
echo ""

if echo "$TB_AFTER" | jq -e '.data.is_balanced' > /dev/null; then
  echo "✅ Trial Balance is BALANCED (Debits = Credits)"
else
  echo "❌ Trial Balance is OUT OF BALANCE"
fi
echo ""

echo "Entry ID for reference: $ENTRY_ID"
echo ""
echo "🎉 Test Complete!"
