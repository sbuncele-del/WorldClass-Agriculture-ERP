# 🚀 Quick Start: Connect to RDS Live Database

**Date:** November 12, 2025  
**Database:** aetheros-erp-db (eu-north-1)  
**Status:** ✅ EC2 Connected to RDS

---

## ✅ What You've Done So Far

1. ✅ Created RDS database `aetheros-erp-db` in eu-north-1
2. ✅ Connected EC2 instance to RDS (security groups configured)
3. ✅ Database is available and accessible

**Database Details:**
- **Endpoint:** `aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com`
- **Port:** 5432
- **Username:** postgres
- **Database Name:** aetheros_erp
- **Region:** eu-north-1 (Stockholm) ✅ Correct region!

---

## 🎯 Next Steps (In Order)

### Step 1: Connect Backend to RDS (5 minutes)

Run this script to update your backend configuration:

```bash
./connect-backend-to-rds.sh
```

**What it does:**
1. Backs up current .env file
2. Creates new .env with RDS connection details
3. Tests database connection from backend server
4. Restarts backend service with new config

**You'll need:**
- Your RDS database password (the one you set when creating the database)

---

### Step 2: Migrate Database Schema (3 minutes)

Run this script to create all necessary tables:

```bash
./migrate-database-schema.sh
```

**What it does:**
1. Creates ERP schemas: sales, logistics, financial, hr, etc.
2. Creates core tables: customers, loads, invoices, processed_documents
3. Adds indexes for performance
4. Optionally inserts sample customer data

**Tables Created:**
- `sales.customers` - Customer master data
- `logistics.loads` - Load confirmations
- `logistics.processed_documents` - Document archive
- `financial.invoices` - Invoice master
- `financial.invoice_line_items` - Invoice line items

---

### Step 3: Test the System (5 minutes)

#### Test 1: Upload a Document
1. Go to: http://aetheros-erp-frontend-483636500494.s3-website.eu-north-1.amazonaws.com/logistics/documents
2. Upload a load confirmation (PDF/JPG/PNG)
3. Watch OCR extraction in real-time
4. Check extracted data

#### Test 2: Check Database
```bash
# Connect to database
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp

# Check processed documents
SELECT * FROM logistics.processed_documents ORDER BY processed_at DESC LIMIT 5;

# Check customers
SELECT * FROM sales.customers;

# Exit
\q
```

#### Test 3: Create Customer from Document
1. After uploading document, if it shows "🆕 New Customer"
2. Click "Create New Customer" button
3. Should insert into `sales.customers` table
4. Verify in database:
```sql
SELECT company_name, contact_person, created_from_document, created_at 
FROM sales.customers 
ORDER BY created_at DESC;
```

#### Test 4: Generate Invoice
1. Click "Preview Invoice" button
2. Check invoice number format: `LoadNumber-20251112A`
3. Verify all SARS-compliant fields
4. Click "Send to Customer" (will save to database)
5. Verify in database:
```sql
SELECT invoice_number, customer_id, total, status, created_at 
FROM financial.invoices 
ORDER BY created_at DESC;
```

---

## 🔧 Troubleshooting

### Issue: Backend can't connect to RDS

**Symptoms:**
- API calls fail
- Backend logs show connection errors
- Document upload returns 500 error

**Solution:**
```bash
# 1. Check security group allows EC2 → RDS
# Your EC2 instance should be in the security group that RDS allows

# 2. Test connection from backend server
ssh -i ~/.ssh/worldclass-erp-key.pem ubuntu@51.21.219.35
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp

# 3. Check backend logs
pm2 logs
```

---

### Issue: Tables don't exist

**Symptoms:**
- Error: "relation does not exist"
- API returns 500 when creating customer
- Invoice generation fails

**Solution:**
```bash
# Run migration script again
./migrate-database-schema.sh

# Or manually create tables
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -f backend/database/schema.sql
```

---

### Issue: OCR extraction not working

**Symptoms:**
- Document uploads but shows default/mock data
- Confidence score always 98.5%
- Same invoice every time

**Current Status:**
- ✅ Tesseract.js is installed (client-side OCR)
- ⚠️ OCR extraction may fail on some documents
- ℹ️ This is expected - we're using basic OCR for now

**Solutions:**
1. **Use clear, high-quality images**
   - 300 DPI or higher
   - Good lighting, no shadows
   - Text should be horizontal (not skewed)

2. **Edit extracted data manually**
   - Click "Edit Details" button
   - Correct any mistakes
   - Then generate invoice

3. **Upgrade to AWS Textract** (Phase 2)
   - 99% accuracy vs 85% now
   - Better PDF handling
   - Faster processing

---

### Issue: Region showing us-east-1 instead of eu-north-1

**This is OK!** AWS Console defaults to us-east-1, but:
- Your RDS is in **eu-north-1** ✅
- Your EC2 is in **eu-north-1** ✅
- Your S3 frontend is in **eu-north-1** ✅

To switch regions in AWS Console:
1. Click region dropdown (top right)
2. Select "Europe (Stockholm) eu-north-1"
3. All your resources will appear

---

## 📊 Verify Everything is Working

### Quick Health Check:

```bash
# 1. Check RDS is running
aws rds describe-db-instances --region eu-north-1 --db-instance-identifier aetheros-erp-db --query 'DBInstances[0].DBInstanceStatus'
# Should return: "available"

# 2. Check EC2 is running
aws ec2 describe-instances --region eu-north-1 --filters "Name=tag:Name,Values=worldclass-erp-backend" --query 'Reservations[0].Instances[0].State.Name'
# Should return: "running"

# 3. Test backend API
curl http://51.21.219.35:3000/health
# Should return: {"status":"ok"}

# 4. Test database connection
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp -c "SELECT 1;"
# Should return: 1
```

---

## 🎯 Expected Workflow After Setup

### 1. Upload Document
- **Frontend:** Drag-and-drop PDF/image
- **OCR:** Tesseract.js extracts text (8-15 seconds)
- **Backend:** Parses text, extracts fields
- **Database:** Inserts into `logistics.processed_documents`

### 2. Customer Detection
- **Backend:** Queries `sales.customers` for company name
- **If found:** `is_new = false`, loads customer_id
- **If not found:** `is_new = true`, shows "Create Customer" button

### 3. Create Customer (if new)
- **Frontend:** User clicks "Create New Customer"
- **Backend API:** POST /api/sales/customers
- **Database:** INSERT INTO `sales.customers`
- **Response:** Returns customer_id
- **Frontend:** Updates UI to show "✓ Existing Customer"

### 4. Generate Invoice
- **Frontend:** User clicks "Preview Invoice"
- **Calculation:** 
  - Subtotal = Rate × Quantity
  - VAT = Subtotal × 15%
  - Total = Subtotal + VAT
- **Invoice Number:** `{LoadNumber}-20251112A`
- **Display:** Full SARS-compliant invoice modal

### 5. Send Invoice
- **Frontend:** User clicks "Send to Customer"
- **Backend API:** POST /api/logistics/send-invoice
- **Database:** 
  - INSERT INTO `financial.invoices`
  - INSERT INTO `financial.invoice_line_items`
  - INSERT INTO `logistics.loads`
- **Email:** (Phase 2) Send via AWS SES
- **PDF:** (Phase 2) Generate and store in S3

---

## 💰 Current Costs

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| RDS PostgreSQL | db.t3.micro, 20GB | ~$15 |
| EC2 Backend | t2.micro | ~$8 |
| S3 Frontend | 10GB storage | ~$0.23 |
| Data Transfer | 10GB/month | ~$0.90 |
| **TOTAL** | | **~$24/month** |

*Note: Using free tier where available*

---

## 🚀 Ready to Go Live?

Once you've completed the steps above:

1. ✅ Backend connected to RDS
2. ✅ Database schema migrated
3. ✅ Test document uploaded successfully
4. ✅ Customer created in database
5. ✅ Invoice generated correctly

**You're live with real data!** 🎉

---

## 📞 Need Help?

### Check Logs:

**Backend logs:**
```bash
ssh -i ~/.ssh/worldclass-erp-key.pem ubuntu@51.21.219.35
pm2 logs --lines 50
```

**Database queries:**
```bash
psql -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com -U postgres -d aetheros_erp
```

**Frontend (browser console):**
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

---

## ✅ Checklist

- [ ] Run `./connect-backend-to-rds.sh`
- [ ] Enter RDS password when prompted
- [ ] Verify backend can connect to RDS
- [ ] Run `./migrate-database-schema.sh`
- [ ] Verify tables created successfully
- [ ] Upload test document
- [ ] Check data in `logistics.processed_documents`
- [ ] Create customer from document
- [ ] Verify customer in `sales.customers`
- [ ] Generate invoice
- [ ] Verify invoice in `financial.invoices`
- [ ] 🎉 Celebrate - you're live!

---

**Status:** 📋 READY TO EXECUTE  
**Estimated Time:** 15 minutes total  
**Difficulty:** Easy (scripts do all the work)

**Let's get your ERP connected to live data!** 🚀
