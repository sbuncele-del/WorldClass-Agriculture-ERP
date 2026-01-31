# AWS RDS Migration Guide - Fuel Management

## Issue: Cannot Connect to RDS from Local Machine ❌
```
Connection timeout to aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com
```

This is **expected and secure** - your RDS database is protected and only accessible from within AWS.

## Solution Options:

---

## ✅ Option 1: Via AWS CloudShell (EASIEST)

AWS CloudShell is a browser-based shell that has access to your AWS resources.

### Steps:

1. **Open AWS Console**
   - Go to: https://console.aws.amazon.com
   - Sign in to your account

2. **Open CloudShell**
   - Click the CloudShell icon (>_) in the top navigation bar
   - Or search for "CloudShell" in the AWS console

3. **Upload Migration File**
   ```bash
   # Click Actions > Upload file
   # Select: backend/database/migrations/020_create_fuel_transactions.sql
   ```

4. **Install PostgreSQL Client**
   ```bash
   sudo yum install postgresql15 -y
   ```

5. **Run Migration**
   ```bash
   psql postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp -f 020_create_fuel_transactions.sql
   ```

6. **Verify**
   ```bash
   psql postgresql://postgres:caxMex-0putca-dyjnah@aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com:5432/aetheros_erp -c "\d logistics_fuel_transactions"
   ```

---

## ✅ Option 2: Via EC2 Instance (If you have backend deployed)

If your backend is running on EC2, you can SSH into it and run the migration.

### Steps:

1. **SSH to EC2 Instance**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

2. **Navigate to Backend Directory**
   ```bash
   cd /path/to/backend
   ```

3. **Run Migration Script**
   ```bash
   ./migrate-fuel-to-aws.sh
   ```

   Or directly with psql:
   ```bash
   psql $DATABASE_URL -f database/migrations/020_create_fuel_transactions.sql
   ```

---

## ✅ Option 3: Via Backend Application API

Add a migration endpoint to your backend that runs migrations programmatically.

**This is already prepared!** Just deploy the backend code we created.

### Backend will auto-run migrations on startup if configured

Or you can manually trigger via API endpoint:
```bash
curl -X POST http://your-backend-url/api/admin/migrate
```

---

## ✅ Option 4: Direct SQL via AWS RDS Query Editor

1. **Open AWS Console**
2. **Navigate to RDS**
3. **Select your database**: `aetheros-erp-db`
4. **Click "Query Editor"**
5. **Connect** with your credentials:
   - Username: `postgres`
   - Password: `caxMex-0putca-dyjnah`
   - Database: `aetheros_erp`

6. **Paste and Execute this SQL**:

```sql
-- Create Fuel Transactions Table
CREATE TABLE IF NOT EXISTS logistics_fuel_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    vehicle VARCHAR(100) NOT NULL,
    driver VARCHAR(200) NOT NULL,
    litres DECIMAL(10, 2) NOT NULL,
    price_per_litre DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    odometer_reading INTEGER NOT NULL,
    supplier VARCHAR(200) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    journal_entry_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(entry_id) ON DELETE SET NULL
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON logistics_fuel_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle ON logistics_fuel_transactions(vehicle);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_supplier ON logistics_fuel_transactions(supplier);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_journal ON logistics_fuel_transactions(journal_entry_id);

-- Add Comment
COMMENT ON TABLE logistics_fuel_transactions IS 'Stores fuel purchase transactions linked to financial journal entries';

-- Verify
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'logistics_fuel_transactions'
ORDER BY ordinal_position;
```

7. **Verify Success**
   ```sql
   SELECT COUNT(*) FROM logistics_fuel_transactions;
   ```

---

## ✅ Option 5: Via AWS CLI with SSM Session Manager

If you have AWS CLI configured:

```bash
# Start a session to an EC2 instance that has RDS access
aws ssm start-session --target i-your-instance-id

# Then run psql from within the instance
psql $DATABASE_URL -f /path/to/migration.sql
```

---

## 🎯 RECOMMENDED: Option 1 (CloudShell) or Option 4 (Query Editor)

**CloudShell is fastest for one-time migrations**
**Query Editor is easiest - no CLI needed**

---

## What Happens After Migration?

Once the table is created in AWS RDS:

### ✅ Fuel Management Goes LIVE
1. **Frontend** (already deployed): ✅
   - http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/logistics/fuel

2. **Backend API** (already coded): ✅
   - POST /api/logistics/fuel/transactions

3. **Database Table** (needs creation): ⏳
   - logistics_fuel_transactions

### 🔄 Live Data Flow:
```
User fills form in Frontend
     ↓
Frontend sends POST request to Backend API
     ↓
Backend creates fuel transaction record in RDS
     ↓
Backend creates journal entry in RDS
     ↓
Backend links transaction ↔ journal entry
     ↓
Response sent back to Frontend
     ↓
User sees success message + transaction ID + journal ID
     ↓
Transaction appears in table
     ↓
Journal entry clickable → goes to Finance module
```

### 🎁 You Get:
- ✅ Real-time fuel expense tracking
- ✅ Automatic double-entry bookkeeping
- ✅ Supplier account management
- ✅ Full audit trail
- ✅ Integration with P&L and Balance Sheet
- ✅ Live demo ready!

---

## Need Help?

Choose **Option 4 (RDS Query Editor)** - it's the easiest:
1. AWS Console → RDS → Query Editor
2. Copy/paste the SQL above
3. Execute
4. Done! 🎉

Let me know which option you'd like to use and I can guide you through it!
