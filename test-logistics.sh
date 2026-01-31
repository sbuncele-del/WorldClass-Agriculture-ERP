#!/bin/bash

# Logistics Module Test Script
BASE_URL="https://siyabusaerp.co.za/api"
TENANT_ID="4b9f577c-5eb5-472f-8853-bcef542d1e72"
TIMESTAMP=$(date +%s)

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "LOGISTICS MODULE - API TEST SUITE"
echo "========================================"
echo ""

# Login
echo -e "${YELLOW}Step 1: Logging in...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "miningtestx@test.co.za", "password": "Mining@12345"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.tokens.accessToken // .token // .accessToken // empty')
if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo -e "${GREEN}✓ Login successful${NC}"
echo ""

PASS=0
FAIL=0

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}Testing: $description${NC}"
  
  if [ "$method" == "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID")
  elif [ "$method" == "POST" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" == "PUT" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID" \
      -H "Content-Type: application/json" \
      -d "$data")
  elif [ "$method" == "DELETE" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-ID: $TENANT_ID")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
    echo -e "${GREEN}✓ $description - HTTP $HTTP_CODE${NC}"
    ((PASS++))
  else
    echo -e "${RED}✗ $description - HTTP $HTTP_CODE${NC}"
    ((FAIL++))
    echo "Error: $BODY" | head -2
  fi
  echo ""
}

echo "========================================"
echo "LOGISTICS API TESTS"
echo "========================================"
echo ""

# Dashboard
test_endpoint "GET" "/logistics/dashboard" "" "GET Dashboard Statistics"

# Vehicles CRUD (use timestamp for unique registration)
test_endpoint "GET" "/logistics/vehicles" "" "GET All Vehicles"
test_endpoint "POST" "/logistics/vehicles" "{\"vehicle_registration\":\"TEST-$TIMESTAMP-GP\",\"vehicle_type\":\"TRUCK\",\"make\":\"Mercedes\",\"model\":\"Actros\",\"year\":2022,\"capacity_kg\":25000,\"capacity_m3\":80,\"fuel_type\":\"Diesel\",\"fuel_tank_capacity\":500}" "POST Create Vehicle"

# Drivers CRUD (use timestamp for unique driver)
test_endpoint "GET" "/logistics/drivers" "" "GET All Drivers"
test_endpoint "POST" "/logistics/drivers" "{\"first_name\":\"Test\",\"last_name\":\"Driver$TIMESTAMP\",\"id_number\":\"99010158$TIMESTAMP\",\"license_number\":\"TEST$TIMESTAMP\",\"license_expiry_date\":\"2026-12-31\",\"phone\":\"0821234567\",\"email\":\"testdriver$TIMESTAMP@logistics.co.za\"}" "POST Create Driver"

# Trips
test_endpoint "GET" "/logistics/trips" "" "GET All Trips"

# Fuel
test_endpoint "GET" "/logistics/fuel" "" "GET Fuel Transactions"

# Loads
test_endpoint "GET" "/logistics/loads" "" "GET All Loads"

# Routes
test_endpoint "GET" "/logistics/routes" "" "GET All Routes"

# Maintenance
test_endpoint "GET" "/logistics/maintenance" "" "GET Maintenance Records"

# Enterprise Feature Gates
test_endpoint "GET" "/logistics/enterprise/feature-gates" "" "GET Enterprise Feature Gates"

# Tracking Positions
test_endpoint "GET" "/logistics/tracking/positions" "" "GET Tracking Positions"

echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo "Total: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}SOME TESTS FAILED${NC}"
  exit 1
fi
