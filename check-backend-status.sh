#!/bin/bash

INSTANCE_ID="i-0b20fd06fae7e84b1"
REGION="eu-north-1"

echo "Checking backend status..."
echo ""

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "echo '\''=== PM2 Status ==='\'",",
    "pm2 status",
    "echo '\''\\n=== Environment Variables ==='\'",",
    "pm2 env 0",
    "echo '\''\\n=== Latest Logs ==='\'",",
    "pm2 logs worldclass-erp --lines 30 --nostream",
    "echo '\''\\n=== Ecosystem Config ==='\'",",
    "cat /home/ssm-user/backend/ecosystem.config.js || echo '\''No ecosystem config'\''"
  ]' \
  --region "$REGION" \
  --output text \
  --query 'Command.CommandId')

echo "Command ID: $COMMAND_ID"
sleep 6

aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$REGION" \
  --query 'StandardOutputContent' \
  --output text
