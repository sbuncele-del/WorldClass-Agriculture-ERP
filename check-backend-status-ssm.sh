#!/bin/bash

# Deploy Backend Files Directly via SSM
INSTANCE_ID="i-0b20fd06fae7e84b1"

echo "🚀 Deploying Backend via SSM - Direct Method"
echo ""

# Step 1: Check current PM2 status
echo "📊 Step 1: Checking current application status..."

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Check PM2 status" \
    --parameters 'commands=[
        "#!/bin/bash",
        "echo \"=== PM2 Status ===\"",
        "pm2 list",
        "echo",
        "echo \"=== Current Backend Structure ===\"",
        "ls -la /home/ec2-user/backend/src/ | head -20",
        "echo",
        "echo \"=== Package.json ===\"",
        "cat /home/ec2-user/backend/package.json"
    ]' \
    --output text \
    --query 'Command.CommandId')

sleep 5

echo "Results:"
echo "=========================================="
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query 'StandardOutputContent' \
    --output text
echo "=========================================="
echo ""

# Step 2: Sync files using GitHub (if this is a git repo) or create update script
echo "📝 Step 2: Preparing deployment method..."
echo ""
echo "Choose deployment method:"
echo "1. Manual file upload (create files on server)"
echo "2. Git pull (if backend is a git repository)"
echo "3. Copy via clipboard (for small updates)"
echo ""
echo "Recommended: Set up Git repository and use 'git pull' for easy deployments"
echo ""

# For now, let's create a helper script to update specific files
cat > /tmp/update-backend.sh << 'EOF'
#!/bin/bash
# Helper script to update backend files on EC2

INSTANCE_ID="i-0b20fd06fae7e84b1"
FILE_PATH="$1"
FILE_CONTENT="$2"

if [ -z "$FILE_PATH" ] || [ -z "$FILE_CONTENT" ]; then
    echo "Usage: $0 <file-path> <file-content>"
    echo "Example: $0 src/index.ts \"console.log('hello');\""
    exit 1
fi

# Escape content for shell
ESCAPED_CONTENT=$(printf '%s' "$FILE_CONTENT" | sed "s/'/'\\\\''/g")

aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
        'cd /home/ec2-user/backend',
        'cat > $FILE_PATH << '\''FILECONTENT'\''',
        '$ESCAPED_CONTENT',
        'FILECONTENT',
        'chown ec2-user:ec2-user $FILE_PATH',
        'echo \"✅ File updated: $FILE_PATH\"',
        'npm run build',
        'pm2 restart all'
    ]" \
    --output text

echo "✅ Update command sent"
EOF

chmod +x /tmp/update-backend.sh

echo "✅ Helper script created: /tmp/update-backend.sh"
echo ""
echo "================================================================"
echo "NEXT STEPS:"
echo "================================================================"
echo ""
echo "Option 1: Update individual files"
echo "  ./tmp/update-backend.sh 'src/index.ts' \"\$(cat backend/src/index.ts)\""
echo ""
echo "Option 2: Set up Git deployment (RECOMMENDED)"
echo "  1. Initialize git in backend folder"
echo "  2. Push to GitHub/GitLab"
echo "  3. Clone on EC2 and use 'git pull' for updates"
echo ""
echo "Option 3: Use interactive SSM session"
echo "  aws ssm start-session --target $INSTANCE_ID"
echo "  Then manually edit files or use git"
echo ""
