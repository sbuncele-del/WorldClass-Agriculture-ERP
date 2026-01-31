# Cash Management Module - Deployment & Configuration

## Last Updated: January 12, 2026 - v24

---

## 🔐 LOGIN CREDENTIALS

### Production Admin
```
URL: https://siyabusaerp.co.za
Email: admin@siyabusaerp.co.za
Password: Admin123!
Tenant ID: d0a49212-96f5-46c7-9d69-fec0f235a90c
User ID: 3657bbaa-9097-4305-9c3c-957189fbc5ce
```

### Get Fresh Token
```bash
curl -s -X POST "https://siyabusaerp.co.za/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@siyabusaerp.co.za","password":"Admin123!"}' \
  | jq -r '.data.tokens.accessToken' > /tmp/token.txt
```

### Use Token
```bash
TOKEN=$(cat /tmp/token.txt)
curl -s "https://siyabusaerp.co.za/api/endpoint" -H "Authorization: Bearer $TOKEN"
```

---

## 🏗️ AWS INFRASTRUCTURE

### Region: af-south-1 (Cape Town)

### ECS
- **Cluster**: worldclass-erp-cluster
- **Service**: worldclass-erp-backend
- **Current Task Definition**: worldclass-erp-backend:24
- **Desired Count**: 2 tasks

### ECR
- **Repository**: 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend
- **Current Tag**: v24

### RDS PostgreSQL
- **Host**: worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: erp_database
- **User**: erpadmin
- **Password**: WorldClass2024SecureDB

### Redis ElastiCache
- **Host**: worldclass-redis.raszuy.0001.afs1.cache.amazonaws.com
- **Port**: 6379

### Domain
- **URL**: https://siyabusaerp.co.za
- **SSL**: AWS ACM Certificate

---

## 🚀 DEPLOYMENT COMMANDS

### 1. Build Backend
```bash
cd /workspaces/WorldClass-ERP/backend
npm run build
```

### 2. Build Docker Image
```bash
# Increment version number each deployment
docker build -t worldclass-erp-backend:v25 .
```

### 3. Login to ECR
```bash
export AWS_REGION=af-south-1
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  483636500494.dkr.ecr.$AWS_REGION.amazonaws.com
```

### 4. Tag and Push
```bash
docker tag worldclass-erp-backend:v25 \
  483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend:v25

docker push 483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend:v25
```

### 5. Register Task Definition
```bash
export AWS_REGION=af-south-1

cat > /tmp/task-def.json << 'TASKDEF'
{
  "family": "worldclass-erp-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::483636500494:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "483636500494.dkr.ecr.af-south-1.amazonaws.com/worldclass-erp-backend:v25",
      "essential": true,
      "portMappings": [{"containerPort": 3000, "hostPort": 3000, "protocol": "tcp"}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"},
        {"name": "DB_HOST", "value": "worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com"},
        {"name": "DB_PORT", "value": "5432"},
        {"name": "DB_USER", "value": "erpadmin"},
        {"name": "DB_PASSWORD", "value": "WorldClass2024SecureDB"},
        {"name": "DB_NAME", "value": "erp_database"},
        {"name": "DATABASE_URL", "value": "postgresql://erpadmin:WorldClass2024SecureDB@worldclass-erp-db.c92ou2c2e43l.af-south-1.rds.amazonaws.com:5432/erp_database"},
        {"name": "JWT_SECRET", "value": "worldclass-erp-jwt-secret-2024-production"},
        {"name": "JWT_REFRESH_SECRET", "value": "worldclass-erp-refresh-secret-2024-production"},
        {"name": "REDIS_HOST", "value": "worldclass-redis.raszuy.0001.afs1.cache.amazonaws.com"},
        {"name": "REDIS_PORT", "value": "6379"},
        {"name": "CORS_ORIGIN", "value": "https://siyabusaerp.co.za"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/worldclass-erp-backend",
          "awslogs-region": "af-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
TASKDEF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-def.json \
  --region $AWS_REGION
```

### 6. Update ECS Service
```bash
# Get the new revision number
REVISION=$(aws ecs describe-task-definition \
  --task-definition worldclass-erp-backend \
  --region $AWS_REGION \
  --query 'taskDefinition.revision' --output text)

# Update service
aws ecs update-service \
  --cluster worldclass-erp-cluster \
  --service worldclass-erp-backend \
  --task-definition worldclass-erp-backend:$REVISION \
  --force-new-deployment \
  --region $AWS_REGION
```

### 7. Wait for Deployment (90 seconds)
```bash
echo "Waiting for deployment..." && sleep 90

# Check status
aws ecs describe-services \
  --cluster worldclass-erp-cluster \
  --services worldclass-erp-backend \
  --region $AWS_REGION \
  --query 'services[0].deployments[*].{status:status,running:runningCount,task:taskDefinition}' \
  --output table
```

### 8. Verify Health
```bash
curl -s https://siyabusaerp.co.za/health
# Should return: {"status":"OK","message":"Server is running"}
```

---

## 🗄️ DATABASE MIGRATIONS

### Run Migration (Secret Header)
```bash
curl -s -X POST "https://siyabusaerp.co.za/api/migrate/MODULE_NAME" \
  -H "x-admin-secret: worldclass-migrate-2026"
```

### Available Migrations
| Module | Description |
|--------|-------------|
| `cash-management` | Creates cash_* tables from SQL migration |
| `cash-views` | Creates compatibility views for services |
| `unlock-admin` | Unlocks admin account if locked |

### Example
```bash
# Create/update cash views
curl -s -X POST "https://siyabusaerp.co.za/api/migrate/cash-views" \
  -H "x-admin-secret: worldclass-migrate-2026"
```

---

## 📋 CASH MANAGEMENT API ENDPOINTS

### Bank Accounts
```bash
TOKEN=$(cat /tmp/token.txt)

# List accounts
curl -s "https://siyabusaerp.co.za/api/cash-management/bank-accounts" \
  -H "Authorization: Bearer $TOKEN"

# Get by ID
curl -s "https://siyabusaerp.co.za/api/cash-management/bank-accounts/1" \
  -H "Authorization: Bearer $TOKEN"
```

### Statements
```bash
# List statements
curl -s "https://siyabusaerp.co.za/api/cash-management/statements" \
  -H "Authorization: Bearer $TOKEN"

# Get statement lines
curl -s "https://siyabusaerp.co.za/api/cash-management/statement-lines?statementId=3" \
  -H "Authorization: Bearer $TOKEN"
```

### CSV Import
```bash
# Preview CSV parsing
curl -s -X POST "https://siyabusaerp.co.za/api/cash-management/statements/parse-csv" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csvContent": "Date,Description,Debit,Credit,Balance\n05/01/2025,SALARY,0,25000,25000",
    "bankCode": "FNB"
  }'

# Import statement
curl -s -X POST "https://siyabusaerp.co.za/api/cash-management/statements/import" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bankAccountId": 1,
    "statementNumber": "JAN2025-001",
    "statementDate": "2025-01-31",
    "periodFrom": "2025-01-01",
    "periodTo": "2025-01-31",
    "lines": [
      {"date": "2025-01-05", "description": "SALARY", "credit": 25000}
    ]
  }'
```

### Matching & Allocation
```bash
# Auto-match statement
curl -s -X POST "https://siyabusaerp.co.za/api/cash-management/statements/3/auto-match" \
  -H "Authorization: Bearer $TOKEN"

# Allocate line (create transaction + match)
curl -s -X POST "https://siyabusaerp.co.za/api/cash-management/statement-lines/1/allocate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"SALARY","description":"Monthly salary"}'
```

### Dashboard
```bash
# Summary
curl -s "https://siyabusaerp.co.za/api/cash-management/summary" \
  -H "Authorization: Bearer $TOKEN"

# Cash position
curl -s "https://siyabusaerp.co.za/api/cash-management/cash-position" \
  -H "Authorization: Bearer $TOKEN"

# Workspace (for reconciliation UI)
curl -s "https://siyabusaerp.co.za/api/cash-management/workspace?statementId=3" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 KEY FILES

### Services
- `backend/src/modules/cash-management/services/matching.service.ts` - Auto-matching & allocation
- `backend/src/modules/cash-management/services/bank-reconciliation.service.ts` - Accounts, statements, import

### Controllers
- `backend/src/modules/cash-management/controllers/cash-management.controller.ts` - Main endpoints
- `backend/src/modules/cash-management/controllers/cash-management.workspace.controller.ts` - Workspace

### Routes
- `backend/src/routes/cash-management.routes.ts` - Route definitions

### Database
- `backend/database/migrations/010_cash_management_module.sql` - Table definitions
- `backend/src/index.ts` - Migration endpoints (lines 227-430)

### Models
- `backend/src/modules/cash-management/models/cash-management.model.ts` - TypeScript interfaces

---

## 🗃️ DATABASE TABLES

### Core Tables (cash_* prefix)
| Table | Purpose |
|-------|---------|
| `cash_banks` | Bank master data (FNB, ABSA, etc.) |
| `cash_bank_accounts` | Company bank accounts |
| `cash_bank_statements` | Imported statement headers |
| `cash_bank_statement_lines` | Statement line items |
| `cash_transactions` | Cash/bank transactions |
| `cash_reconciliation_rules` | Auto-matching rules |

### Support Tables
| Table | Purpose |
|-------|---------|
| `bank_reconciliation_matches` | Match records (line ↔ transaction) |

### Views (for service compatibility)
| View | Maps To |
|------|---------|
| `bank_accounts` | cash_bank_accounts + bank_name |
| `bank_statements` | cash_bank_statements |
| `bank_statement_lines` | cash_bank_statement_lines |
| `bank_reconciliation_rules` | cash_reconciliation_rules |

---

## 🧪 TEST DATA (Current State)

### Bank Account
```
ID: 1
Name: Main Operating Account
Bank: First National Bank
Account Number: 62819402671
```

### Statement
```
ID: 3
Number: JAN2025-001
Period: 2025-01-01 to 2025-01-31
Status: RECONCILED
Lines: 3 (all matched)
```

### Transactions Created
| ID | Type | Category | Amount | Status |
|----|------|----------|--------|--------|
| 1 | DEPOSIT | SALARY | R25,000 | RECONCILED |
| 2 | WITHDRAWAL | RENT | R8,500 | RECONCILED |
| 3 | WITHDRAWAL | UTILITIES | R850.50 | RECONCILED |

---

## ⚠️ KNOWN ISSUES (To Fix)

1. **GL Posting Not Implemented**
   - `posted_to_gl: false` on all transactions
   - Journal entries not created
   - Account balances not updated

2. **Category → GL Account Mapping Missing**
   - SALARY → needs to map to income GL code
   - RENT → needs to map to expense GL code
   - etc.

---

## 📊 ONE-LINE DEPLOY SCRIPT

```bash
cd /workspaces/WorldClass-ERP/backend && \
npm run build && \
VERSION=v25 && \
docker build -t worldclass-erp-backend:$VERSION . && \
export AWS_REGION=af-south-1 && \
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin 483636500494.dkr.ecr.$AWS_REGION.amazonaws.com && \
docker tag worldclass-erp-backend:$VERSION 483636500494.dkr.ecr.$AWS_REGION.amazonaws.com/worldclass-erp-backend:$VERSION && \
docker push 483636500494.dkr.ecr.$AWS_REGION.amazonaws.com/worldclass-erp-backend:$VERSION && \
sed -i "s/v[0-9]*/v${VERSION#v}/g" /tmp/task-def.json && \
aws ecs register-task-definition --cli-input-json file:///tmp/task-def.json --region $AWS_REGION && \
REVISION=$(aws ecs describe-task-definition --task-definition worldclass-erp-backend --region $AWS_REGION --query 'taskDefinition.revision' --output text) && \
aws ecs update-service --cluster worldclass-erp-cluster --service worldclass-erp-backend --task-definition worldclass-erp-backend:$REVISION --force-new-deployment --region $AWS_REGION && \
echo "Deployed $VERSION as revision $REVISION"
```
