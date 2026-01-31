#!/bin/bash

# Deploy Backend via AWS SSM Session Manager
# This script connects to EC2 and deploys the backend code

INSTANCE_ID="i-0b20fd06fae7e84b1"
BACKEND_DIR="/home/ec2-user/backend"

echo "🚀 Deploying Backend via AWS Systems Manager..."
echo "Instance: $INSTANCE_ID"
echo ""

# Create deployment script that will run on EC2
cat > /tmp/deploy-commands.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "✅ Connected to EC2 instance"
whoami
pwd

# Check if backend directory exists
if [ ! -d "/home/ec2-user/backend" ]; then
    echo "📁 Creating backend directory..."
    mkdir -p /home/ec2-user/backend
    cd /home/ec2-user/backend
    
    echo "📦 Initializing Node.js project..."
    npm init -y
    
    echo "📥 Installing dependencies..."
    npm install express cors dotenv pg bcryptjs jsonwebtoken helmet express-rate-limit
    npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken nodemon ts-node
    
    echo "⚙️ Setting up TypeScript..."
    npx tsc --init
    
    echo "📁 Creating directory structure..."
    mkdir -p src/controllers src/routes src/middleware src/config src/services
else
    echo "📁 Backend directory exists"
    cd /home/ec2-user/backend
fi

# Check Node.js and npm
echo "🔍 Environment check..."
node --version
npm --version

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    cat .env | grep -v PASSWORD | grep -v SECRET
else
    echo "⚠️  No .env file found. You'll need to create one."
fi

# Check if database connection works
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo "🔍 Testing database connection..."
    psql "$DATABASE_URL" -c "SELECT version();" || echo "❌ Database connection failed"
fi

# List current files
echo ""
echo "📋 Current backend files:"
ls -la src/ 2>/dev/null || echo "No src directory yet"

echo ""
echo "✅ Pre-deployment check complete!"
DEPLOY_SCRIPT

# Make it executable
chmod +x /tmp/deploy-commands.sh

# Copy script to EC2 and execute it
echo "📤 Uploading deployment script to EC2..."
aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "mkdir -p /tmp/deployment",
        "cat > /tmp/deployment/check.sh << '\''EOF'\''",
        "#!/bin/bash",
        "set -e",
        "echo \"✅ Connected to EC2 instance\"",
        "whoami",
        "pwd",
        "cd /home/ec2-user",
        "if [ ! -d \"backend\" ]; then",
        "    echo \"📁 Creating backend directory...\"",
        "    mkdir -p backend",
        "    cd backend",
        "    npm init -y",
        "else",
        "    echo \"📁 Backend directory exists\"",
        "    cd backend",
        "fi",
        "echo \"🔍 Environment check...\"",
        "node --version",
        "npm --version",
        "ls -la",
        "if [ -f \".env\" ]; then",
        "    echo \"✅ .env file found\"",
        "else",
        "    echo \"⚠️  No .env file found\"",
        "fi",
        "echo \"✅ Pre-deployment check complete!\"",
        "EOF",
        "chmod +x /tmp/deployment/check.sh",
        "/tmp/deployment/check.sh"
    ]' \
    --output text \
    --query 'Command.CommandId'

echo ""
echo "✅ Command sent! Wait 10 seconds for execution..."
sleep 10

echo ""
echo "📊 Fetching results..."
COMMAND_ID=$(aws ssm list-commands --instance-id "$INSTANCE_ID" --max-results 1 --query 'Commands[0].CommandId' --output text)

if [ "$COMMAND_ID" != "None" ] && [ -n "$COMMAND_ID" ]; then
    aws ssm get-command-invocation \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query '[Status,StandardOutputContent,StandardErrorContent]' \
        --output text
else
    echo "❌ Could not retrieve command results"
fi

echo ""
echo "✅ Done! Check output above."
