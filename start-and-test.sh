#!/bin/bash

echo "=========================================="
echo "🚀 Starting Backend and Frontend Servers"
echo "=========================================="

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "ts-node-dev" || true
pkill -f "vite" || true
sleep 2

# Start backend in background
echo ""
echo "📦 Starting Backend Server..."
cd /workspaces/WorldClass-ERP/backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend is running"
    tail -20 /tmp/backend.log
else
    echo "❌ Backend failed to start"
    cat /tmp/backend.log
    exit 1
fi

# Test the login endpoint
echo ""
echo "=========================================="
echo "🧪 Testing Login API Endpoint"
echo "=========================================="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo ""
    echo "=========================================="
    echo "✅ LOGIN TEST PASSED!"
    echo "=========================================="
    echo "Demo credentials work:"
    echo "  Email: admin@demo.com"
    echo "  Password: admin123"
else
    echo ""
    echo "=========================================="
    echo "❌ LOGIN TEST FAILED!"
    echo "=========================================="
fi

# Start frontend
echo ""
echo "📱 Starting Frontend Server..."
cd /workspaces/WorldClass-ERP/frontend
npm run dev -- --host > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend is running"
    echo ""
    tail -15 /tmp/frontend.log
    echo ""
    echo "=========================================="
    echo "🎉 SERVERS ARE READY!"
    echo "=========================================="
    echo "Backend:  http://localhost:3000"
    echo "Frontend: Check the Ports tab for port 5173"
    echo ""
    echo "Login with:"
    echo "  Email: admin@demo.com"
    echo "  Password: admin123"
    echo "=========================================="
else
    echo "❌ Frontend failed to start"
    cat /tmp/frontend.log
fi

# Keep script running
echo ""
echo "Press Ctrl+C to stop servers..."
wait
