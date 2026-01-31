#!/bin/bash

# Comprehensive End-to-End Test Suite
# Tests: Double-Entry, Trial Balance, Period Management, Approvals

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║        🧪 COMPREHENSIVE END-TO-END SYSTEM TEST 🧪               ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000/api/financial"
PASS="✅"
FAIL="❌"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
test_api() {
  local test_name="$1"
  local endpoint="$2"
  local expected_success="$3"
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "Testing: $test_name... "
  
  response=$(curl -s "$endpoint")
  success=$(echo "$response" | jq -r '.success' 2>/dev/null)
  
  if [ "$success" = "$expected_success" ]; then
    echo "$PASS"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo "$FAIL"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "  Expected success=$expected_success, got: $success"
    return 1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PART 1: BACKEND API HEALTH CHECKS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_api "Chart of Accounts" "${BASE_URL}/chart-of-accounts" "true"
test_api "Trial Balance" "${BASE_URL}/trial-balance" "true"
test_api "Period Summary" "${BASE_URL}/periods/summary" "true"
test_api "Dimensions Summary" "${BASE_URL}/dimensions/summary" "true"
test_api "Approval Stats" "${BASE_URL}/approvals/stats" "true"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 PART 2: DOUBLE-ENTRY POSTING TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Trial Balance BEFORE
echo "Step 1: Get Trial Balance BEFORE posting..."
TB_BEFORE=$(curl -s "${BASE_URL}/trial-balance")
TOTAL_DEBITS_BEFORE=$(echo "$TB_BEFORE" | jq -r '.data.total_debits')
TOTAL_CREDITS_BEFORE=$(echo "$TB_BEFORE" | jq -r '.data.total_credits')
echo "  Debits: R${TOTAL_DEBITS_BEFORE}"
echo "  Credits: R${TOTAL_CREDITS_BEFORE}"
echo ""

# Create Journal Entry
echo "Step 2: Create Journal Entry (R10,000 transaction)..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/journal-entries" \
  -H "Content-Type: application/json" \
  -d '{
    "journal_date": "2025-11-06",
    "description": "E2E Test: Office equipment purchase",
    "notes": "Automated test transaction",
    "source_type": "MANUAL",
    "lines": [
      {
        "account_code": "1500",
        "debit_amount": 10000,
        "description": "Office equipment"
      },
      {
        "account_code": "1100",
        "credit_amount": 10000,
        "description": "Cash payment"
      }
    ]
  }')

CREATE_SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
ENTRY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // empty')

if [ "$CREATE_SUCCESS" = "true" ] && [ -n "$ENTRY_ID" ]; then
  echo "  $PASS Created entry: $ENTRY_ID"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "  $FAIL Failed to create entry"
  echo "$CREATE_RESPONSE" | jq '.'
  FAILED_TESTS=$((FAILED_TESTS + 1))
  ENTRY_ID=""
fi
echo ""

# Post Journal Entry
if [ -n "$ENTRY_ID" ]; then
  echo "Step 3: Post Journal Entry to GL..."
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  POST_RESPONSE=$(curl -s -X POST "${BASE_URL}/journal-entries/${ENTRY_ID}/post" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "test-user-001"}')
  
  POST_SUCCESS=$(echo "$POST_RESPONSE" | jq -r '.success')
  
  if [ "$POST_SUCCESS" = "true" ]; then
    echo "  $PASS Entry posted successfully"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "  $FAIL Failed to post entry"
    echo "$POST_RESPONSE" | jq '.'
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
  echo ""
  
  # Wait for GL update
  echo "Step 4: Waiting 2 seconds for GL to update..."
  sleep 2
  echo ""
  
  # Get Trial Balance AFTER
  echo "Step 5: Get Trial Balance AFTER posting..."
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  TB_AFTER=$(curl -s "${BASE_URL}/trial-balance")
  TOTAL_DEBITS_AFTER=$(echo "$TB_AFTER" | jq -r '.data.total_debits')
  TOTAL_CREDITS_AFTER=$(echo "$TB_AFTER" | jq -r '.data.total_credits')
  IS_BALANCED=$(echo "$TB_AFTER" | jq -r '.data.is_balanced')
  
  echo "  Debits: R${TOTAL_DEBITS_AFTER} (was R${TOTAL_DEBITS_BEFORE})"
  echo "  Credits: R${TOTAL_CREDITS_AFTER} (was R${TOTAL_CREDITS_BEFORE})"
  echo "  Balanced: $IS_BALANCED"
  
  # Calculate increase
  DEBIT_INCREASE=$(echo "$TOTAL_DEBITS_AFTER - $TOTAL_DEBITS_BEFORE" | bc)
  CREDIT_INCREASE=$(echo "$TOTAL_CREDITS_AFTER - $TOTAL_CREDITS_BEFORE" | bc)
  
  if [ "$DEBIT_INCREASE" = "10000.00" ] && [ "$CREDIT_INCREASE" = "10000.00" ] && [ "$IS_BALANCED" = "true" ]; then
    echo "  $PASS Trial Balance updated correctly (+R10,000 both sides)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo "  $FAIL Trial Balance not correct"
    echo "    Debit increase: R$DEBIT_INCREASE (expected R10000.00)"
    echo "    Credit increase: R$CREDIT_INCREASE (expected R10000.00)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗓️  PART 3: PERIOD MANAGEMENT TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get current period
echo "Step 1: Get current period..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

PERIOD_SUMMARY=$(curl -s "${BASE_URL}/periods/summary")
CURRENT_PERIOD=$(echo "$PERIOD_SUMMARY" | jq -r '.data.current_period.period_name // empty')
CURRENT_STATUS=$(echo "$PERIOD_SUMMARY" | jq -r '.data.current_period.status // empty')
OPEN_PERIODS=$(echo "$PERIOD_SUMMARY" | jq -r '.data.open_periods // 0')

if [ -n "$CURRENT_PERIOD" ]; then
  echo "  $PASS Current Period: $CURRENT_PERIOD"
  echo "  Status: $CURRENT_STATUS"
  echo "  Open Periods: $OPEN_PERIODS"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "  $FAIL Could not get current period"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "Step 2: Get all periods..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

ALL_PERIODS=$(curl -s "${BASE_URL}/periods")
PERIOD_COUNT=$(echo "$ALL_PERIODS" | jq -r '.data | length')

if [ "$PERIOD_COUNT" -ge "12" ]; then
  echo "  $PASS Found $PERIOD_COUNT periods (expected 12+)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "  $FAIL Found only $PERIOD_COUNT periods"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "Step 3: Check fiscal year..."
TOTAL_TESTS=$((TOTAL_TESTS + 1))

FISCAL_YEARS=$(curl -s "${BASE_URL}/periods/fiscal-years")
FY_SUCCESS=$(echo "$FISCAL_YEARS" | jq -r '.success')
FY_CODE=$(echo "$FISCAL_YEARS" | jq -r '.data[0].year_code // empty')

if [ "$FY_SUCCESS" = "true" ] && [ -n "$FY_CODE" ]; then
  echo "  $PASS Fiscal Year: $FY_CODE"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo "  $FAIL Could not get fiscal year"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PART 4: APPROVAL WORKFLOWS TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -n "$ENTRY_ID" ]; then
  echo "Step 1: Submit entry for approval..."
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  SUBMIT_RESPONSE=$(curl -s -X POST "${BASE_URL}/approvals/submit/${ENTRY_ID}" \
    -H "Content-Type: application/json" \
    -d '{"user_id": "preparer-001"}')
  
  SUBMIT_SUCCESS=$(echo "$SUBMIT_RESPONSE" | jq -r '.success')
  WORKFLOW_NAME=$(echo "$SUBMIT_RESPONSE" | jq -r '.data.workflow_name // empty')
  
  if [ "$SUBMIT_SUCCESS" = "true" ]; then
    echo "  $PASS Submitted for approval"
    echo "  Workflow: $WORKFLOW_NAME"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Get pending approvals
    echo ""
    echo "Step 2: Check pending approvals..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    PENDING=$(curl -s "${BASE_URL}/approvals/pending")
    PENDING_COUNT=$(echo "$PENDING" | jq -r '.data | length')
    
    if [ "$PENDING_COUNT" -ge "1" ]; then
      echo "  $PASS Found $PENDING_COUNT pending approval(s)"
      PASSED_TESTS=$((PASSED_TESTS + 1))
    else
      echo "  $FAIL No pending approvals found"
      FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
  else
    echo "  $FAIL Failed to submit for approval"
    echo "$SUBMIT_RESPONSE" | jq '.'
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
else
  echo "⏭️  Skipping approval tests (no entry created)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📐 PART 5: DIMENSIONS TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_api "Cost Centers" "${BASE_URL}/dimensions/cost-centers" "true"
test_api "Departments" "${BASE_URL}/dimensions/departments" "true"
test_api "Projects" "${BASE_URL}/dimensions/projects" "true"
test_api "Products" "${BASE_URL}/dimensions/products" "true"
test_api "Locations" "${BASE_URL}/dimensions/locations" "true"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PART 6: REPORTS TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_api "Journal Entries List" "${BASE_URL}/journal-entries" "true"
test_api "Dashboard Stats" "${BASE_URL}/dashboard/stats" "true"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                      📊 TEST RESULTS SUMMARY                     ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_PERCENTAGE=$(echo "scale=1; ($PASSED_TESTS * 100) / $TOTAL_TESTS" | bc)
else
  PASS_PERCENTAGE=0
fi

echo "Total Tests Run:    $TOTAL_TESTS"
echo "Tests Passed:       $PASSED_TESTS ($PASS_PERCENTAGE%)"
echo "Tests Failed:       $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED! System is fully operational! 🎉"
  echo ""
  echo "✅ Double-Entry Posting: Working"
  echo "✅ Trial Balance: Balanced"
  echo "✅ Period Management: Active"
  echo "✅ Approval Workflows: Functional"
  echo "✅ Dimensions: Available"
  echo "✅ Reports: Generating"
  echo ""
  echo "🚀 READY FOR PRODUCTION DEPLOYMENT!"
  exit 0
else
  echo "⚠️  Some tests failed. Review the output above."
  echo ""
  echo "Common issues:"
  echo "  • Backend not running (port 3000)"
  echo "  • Database not seeded"
  echo "  • API endpoints changed"
  exit 1
fi
