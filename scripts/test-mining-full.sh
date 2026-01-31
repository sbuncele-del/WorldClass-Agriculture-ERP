#!/bin/bash
# Complete mining test with all features

# Get fresh token
echo "Logging in..."
curl -s -X POST https://siyabusaerp.co.za/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"miningtestx@test.co.za","password":"Mining@12345"}' > /tmp/login.json

TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/login.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))")
TENANT=$(python3 -c "import json; d=json.load(open('/tmp/login.json')); print(d.get('data',{}).get('tenant',{}).get('id',''))")

echo "Token: ${TOKEN:0:40}..."
echo "Tenant: $TENANT"
echo ""

echo "=== 1. Create Mining Site ==="
curl -s -X POST "https://siyabusaerp.co.za/api/v2/mining/sites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT" \
  -H "Content-Type: application/json" \
  -d '{"code":"SITE001","name":"Johannesburg Gold Mine","locationLat":-26.2041,"locationLng":28.0473,"province":"Gauteng","areaHectares":500,"mineralType":"gold","miningMethod":"underground"}'
echo ""

echo ""
echo "=== 2. Get Mining Sites ==="
curl -s "https://siyabusaerp.co.za/api/v2/mining/sites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT"
echo ""

echo ""
echo "=== 3. Get Mining Dashboard ==="
curl -s "https://siyabusaerp.co.za/api/v2/mining/dashboard" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT"
echo ""

echo ""
echo "=== 4. Get Mining Equipment ==="
curl -s "https://siyabusaerp.co.za/api/v2/mining/equipment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT"
echo ""

echo ""
echo "=== 5. Get Mining Production ==="
curl -s "https://siyabusaerp.co.za/api/v2/mining/production" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT"
echo ""

echo ""
echo "=== 6. Get Mining Safety ==="
curl -s "https://siyabusaerp.co.za/api/v2/mining/safety" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT"
echo ""

echo ""
echo "=== MINING MODULE TEST COMPLETE ==="
