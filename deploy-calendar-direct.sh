#!/bin/bash

# Deploy Calendar Routes - Direct File Copy Method
# Copies compiled files directly to server

set -e

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"

echo "🚀 Deploying Calendar Routes (Direct Method)"
echo "=============================================="

# Step 1: Create the calendar routes file directly on server
echo ""
echo "📝 Step 1: Creating calendar.routes.js on server..."

CALENDAR_ROUTES_CONTENT='
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");

const router = express_1.default.Router();
router.use(auth_1.authenticateToken);
router.use(tenant_1.tenantMiddleware);

router.get("/events", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { start, end, type } = req.query;
        let query = `SELECT * FROM calendar_events WHERE tenant_id = $1`;
        const params = [tenantId];
        
        if (start) {
            params.push(start);
            query += ` AND start_date >= $${params.length}`;
        }
        if (end) {
            params.push(end);
            query += ` AND end_date <= $${params.length}`;
        }
        if (type) {
            params.push(type);
            query += ` AND event_type = $${params.length}`;
        }
        
        query += " ORDER BY start_date ASC";
        const result = await database_1.default.query(query, params);
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error("Get calendar events error:", error);
        if (error.code === "42P01") {
            res.json({ success: true, data: [] });
        }
        else {
            res.status(500).json({ success: false, error: "Failed to fetch calendar events" });
        }
    }
});

router.post("/events", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;
        const { title, description, startDate, endDate, location, eventType, attendees, reminders, isAllDay } = req.body;
        
        const result = await database_1.default.query(
            `INSERT INTO calendar_events 
            (tenant_id, user_id, title, description, start_date, end_date, location, event_type, attendees, reminders, is_all_day)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [tenantId, userId, title, description, startDate, endDate, location, eventType || "meeting", 
             JSON.stringify(attendees || []), JSON.stringify(reminders || []), isAllDay || false]
        );
        
        res.status(201).json({ success: true, data: result.rows[0], message: "Event created successfully" });
    }
    catch (error) {
        console.error("Create calendar event error:", error);
        if (error.code === "42P01") {
            res.status(500).json({ success: false, error: "Calendar table not initialized" });
        }
        else {
            res.status(500).json({ success: false, error: "Failed to create calendar event" });
        }
    }
});

router.put("/events/:id", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        const { title, description, startDate, endDate, location, eventType } = req.body;
        
        const result = await database_1.default.query(
            `UPDATE calendar_events SET
            title = COALESCE($3, title),
            description = COALESCE($4, description),
            start_date = COALESCE($5, start_date),
            end_date = COALESCE($6, end_date),
            location = COALESCE($7, location),
            event_type = COALESCE($8, event_type),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND tenant_id = $2 RETURNING *`,
            [id, tenantId, title, description, startDate, endDate, location, eventType]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Event not found" });
        }
        res.json({ success: true, data: result.rows[0], message: "Event updated successfully" });
    }
    catch (error) {
        console.error("Update calendar event error:", error);
        res.status(500).json({ success: false, error: "Failed to update calendar event" });
    }
});

router.delete("/events/:id", async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { id } = req.params;
        
        const result = await database_1.default.query(
            "DELETE FROM calendar_events WHERE id = $1 AND tenant_id = $2 RETURNING id",
            [id, tenantId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Event not found" });
        }
        res.json({ success: true, message: "Event deleted successfully" });
    }
    catch (error) {
        console.error("Delete calendar event error:", error);
        res.status(500).json({ success: false, error: "Failed to delete calendar event" });
    }
});

exports.default = router;
'

# Encode the content
ENCODED_CONTENT=$(echo "$CALENDAR_ROUTES_CONTENT" | base64 -w 0)

COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[\"echo '$ENCODED_CONTENT' | base64 -d > /home/ec2-user/backend/dist/routes/calendar.routes.js && chown ec2-user:ec2-user /home/ec2-user/backend/dist/routes/calendar.routes.js && ls -la /home/ec2-user/backend/dist/routes/calendar.routes.js\"]" \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Creating calendar routes file..."
sleep 8

STATUS=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "Status" \
  --output text)

if [ "$STATUS" != "Success" ]; then
  echo "❌ Failed to create calendar routes file"
  aws ssm get-command-invocation \
    --command-id $COMMAND_ID \
    --instance-id $INSTANCE_ID \
    --region $REGION \
    --query "[StandardOutputContent, StandardErrorContent]" \
    --output text
  exit 1
fi

echo "✅ Calendar routes file created"

# Step 2: Update index.js to register calendar routes
echo ""
echo "📝 Step 2: Registering calendar routes in index.js..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "cd /home/ec2-user/backend/dist",
    "echo Backing up index.js...",
    "cp index.js index.js.backup",
    "echo Adding calendar routes import...",
    "sed -i \"/const communicationsRoutes/a const calendarRoutes_1 = require(\\\"./routes/calendar.routes\\\");\" index.js",
    "echo Adding calendar routes registration...",
    "sed -i \"/v1Router.use.*communications.*communicationsRoutes/a v1Router.use(\\\"/calendar\\\", apiLimiter, calendarRoutes_1.default);\" index.js",
    "echo Verifying changes...",
    "grep -A 2 calendar index.js | head -6"
  ]' \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Updating index.js..."
sleep 8

OUTPUT=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "StandardOutputContent" \
  --output text)

if echo "$OUTPUT" | grep -q "calendarRoutes"; then
  echo "✅ Calendar routes registered in index.js"
else
  echo "⚠️  Registration may need manual verification"
fi

# Step 3: Restart backend
echo ""
echo "🔄 Step 3: Restarting backend service..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "systemctl restart aetheros-backend",
    "sleep 10",
    "systemctl status aetheros-backend --no-pager --lines=10"
  ]' \
  --query "Command.CommandId" \
  --output text)

echo "📤 Command sent: $COMMAND_ID"
echo "⏳ Restarting service..."
sleep 15

OUTPUT=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "StandardOutputContent" \
  --output text)

if echo "$OUTPUT" | grep -q "active (running)"; then
  echo "✅ Backend service is running"
else
  echo "❌ Backend service status unclear. Output:"
  echo "$OUTPUT"
fi

# Step 4: Test endpoint
echo ""
echo "🧪 Step 4: Testing calendar endpoint..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids $INSTANCE_ID \
  --region $REGION \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "curl -s -w \"HTTP_CODE:%{http_code}\" http://localhost:5000/api/calendar/events"
  ]' \
  --query "Command.CommandId" \
  --output text)

sleep 8

OUTPUT=$(aws ssm get-command-invocation \
  --command-id $COMMAND_ID \
  --instance-id $INSTANCE_ID \
  --region $REGION \
  --query "StandardOutputContent" \
  --output text)

echo "Response: $OUTPUT"

if echo "$OUTPUT" | grep -q "HTTP_CODE:401\|HTTP_CODE:403\|HTTP_CODE:200"; then
  echo ""
  echo "=============================================="
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo "=============================================="
  echo ""
  echo "Calendar API endpoints are now live:"
  echo "  GET    /api/calendar/events"
  echo "  POST   /api/calendar/events"
  echo "  PUT    /api/calendar/events/:id"
  echo "  DELETE /api/calendar/events/:id"
  echo ""
  echo "Test from your app at:"
  echo "  https://primesources.site/api/calendar/events"
  echo ""
else
  echo ""
  echo "⚠️  Endpoint test returned unexpected response"
  echo "Please check backend logs with:"
  echo "  ./check-logs-ssm.sh"
fi
