# 🚀 QUICK DEPLOYMENT via AWS EC2 Instance Connect

**Since SSH port 22 is blocked, use the browser-based terminal shown in your screenshot!**

---

## Step 1: Connect via Browser

1. **AWS Console** → **EC2** → **Instances**
2. Select instance: **i-0b20fd06fae7e84b1**
3. Click **"Connect"** button (orange, top right)
4. Choose tab: **"EC2 Instance Connect"**
5. Username: **`ec2-user`** (already filled in your screenshot)
6. Click **"Connect"** → Browser terminal opens

---

## Step 2: Upload Files to Server

**Option A: Create Files Directly on Server**

In the browser terminal, create each migration file:

```bash
# Create migrations directory
mkdir -p /tmp/migrations
cd /tmp/migrations

# Create Multi-Entity migration
cat > /tmp/017_multi_entity.sql << 'EOF'
[paste entire content of 017_multi_entity.sql here]
EOF

# Repeat for other files...
```

**Option B: Use S3 Bucket (Recommended if you have one)**

```bash
# On your local machine
aws s3 cp backend/database/migrations/ s3://your-bucket/deployment/ --recursive

# On server (in browser terminal)
aws s3 sync s3://your-bucket/deployment/ /tmp/
```

**Option C: Use GitHub Gist (Quick & Easy)**

1. Create a GitHub Gist with each file
2. Get raw URLs
3. On server:

```bash
# Example
curl -o /tmp/017_multi_entity.sql https://gist.githubusercontent.com/...
curl -o /tmp/018_reports_analytics.sql https://gist.githubusercontent.com/...
# etc...
```

---

## Step 3: Quick Manual Deployment

Once files are on server (`/tmp/`), run these commands in the browser terminal:

###  A. Backup Database

```bash
# Set environment
cd /var/www/backend  # Or your backend directory
export $(grep -v '^#' .env | xargs)  # Load env vars

# Create backup
pg_dump $DATABASE_URL > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
ls -lh /tmp/backup_*
```

### B. Run Migrations (IN ORDER!)

```bash
# 1. Multi-Entity (MUST BE FIRST - other modules depend on it)
psql $DATABASE_URL -f /tmp/017_multi_entity.sql

# 2. Reports & Analytics
psql $DATABASE_URL -f /tmp/018_reports_analytics.sql

# 3. Treasury Management
psql $DATABASE_URL -f /tmp/019_treasury_management.sql

# 4. Healthcare Operations
psql $DATABASE_URL -f /tmp/020_healthcare_operations_module.sql

# 5. Super Admin Portal
psql $DATABASE_URL -f /tmp/021_super_admin_portal.sql

# Verify tables created
psql $DATABASE_URL -c "\dt" | grep -E "entities|reports|treasury|healthcare|support_tickets"
```

### C. Deploy Code Files

```bash
# Backup current code
cd /var/www/backend
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Copy controllers
cp /tmp/multi-entity.controller.ts src/controllers/
cp /tmp/reports.controller.ts src/controllers/
cp /tmp/treasury.controller.ts src/controllers/
cp /tmp/ai-assistant.controller.ts src/controllers/
cp /tmp/healthcare.controller.ts src/controllers/
cp /tmp/superadmin.controller.ts src/controllers/

# Copy routes
cp /tmp/multi-entity.routes.ts src/routes/
cp /tmp/reports.routes.ts src/routes/
cp /tmp/treasury.routes.ts src/routes/
cp /tmp/ai-assistant.routes.ts src/routes/
cp /tmp/healthcare.routes.ts src/routes/
cp /tmp/superadmin.routes.ts src/routes/

# Copy service
mkdir -p src/services
cp /tmp/ai-assistant.service.ts src/services/

# Update index.ts
cp /tmp/index.ts.new src/index.ts
```

### D. Install Dependencies & Build

```bash
# Install AI packages
npm install openai @anthropic-ai/sdk

# Build
npm run build

# Check for errors
echo "Exit code: $?"
```

### E. Restart Application

```bash
# If using PM2
pm2 restart all
pm2 status
pm2 logs --lines 20

# If using systemd
sudo systemctl restart worldclass-erp
sudo systemctl status worldclass-erp
```

### F. Test Deployment

```bash
# Test health
curl http://localhost:3000/api/health

# Test new endpoints (will return 401 without auth, but route exists)
curl -I http://localhost:3000/api/entities
curl -I http://localhost:3000/api/reports
curl -I http://localhost:3000/api/treasury/accounts
curl -I http://localhost:3000/api/ai/agents
curl -I http://localhost:3000/api/healthcare/facilities
curl -I http://localhost:3000/api/super-admin/system/health

# Check PM2 logs for errors
pm2 logs --err --lines 50
```

---

## Alternative: Use the Automated Script

If you uploaded `DEPLOY.sh`:

```bash
# Make executable
chmod +x /tmp/DEPLOY.sh

# Run
cd /var/www/backend
/tmp/DEPLOY.sh
```

---

## 🚨 If Something Goes Wrong

### Rollback Database

```bash
# Find your backup
ls -lh /tmp/backup_*

# Restore it
psql $DATABASE_URL < /tmp/backup_YYYYMMDD_HHMMSS.sql
```

### Rollback Code

```bash
cd /var/www/backend
rm -rf src
mv src.backup.YYYYMMDD_HHMMSS src
npm run build
pm2 restart all
```

---

## 📋 File Transfer Checklist

Upload these files to `/tmp/` on the server:

**Migrations (5 files)**:
- [ ] `/tmp/017_multi_entity.sql`
- [ ] `/tmp/018_reports_analytics.sql`
- [ ] `/tmp/019_treasury_management.sql`
- [ ] `/tmp/020_healthcare_operations_module.sql`
- [ ] `/tmp/021_super_admin_portal.sql`

**Controllers (6 files)**:
- [ ] `/tmp/multi-entity.controller.ts`
- [ ] `/tmp/reports.controller.ts`
- [ ] `/tmp/treasury.controller.ts`
- [ ] `/tmp/ai-assistant.controller.ts`
- [ ] `/tmp/healthcare.controller.ts`
- [ ] `/tmp/superadmin.controller.ts`

**Routes (6 files)**:
- [ ] `/tmp/multi-entity.routes.ts`
- [ ] `/tmp/reports.routes.ts`
- [ ] `/tmp/treasury.routes.ts`
- [ ] `/tmp/ai-assistant.routes.ts`
- [ ] `/tmp/healthcare.routes.ts`
- [ ] `/tmp/superadmin.routes.ts`

**Services (1 file)**:
- [ ] `/tmp/ai-assistant.service.ts`

**Config (1 file)**:
- [ ] `/tmp/index.ts.new` (updated index.ts)

**Total: 19 files**

---

## 🎯 Success Indicators

After deployment, you should see:

✅ No TypeScript build errors  
✅ PM2 processes running (green)  
✅ No errors in PM2 logs  
✅ All endpoint HTTP codes: 200, 401, or 403 (means route exists)  
✅ Database has new tables (65 total)  

---

## 💡 Pro Tips

1. **Use `screen` or `tmux`** so your session doesn't disconnect:
   ```bash
   screen -S deployment
   # Do your work
   # Press Ctrl+A then D to detach
   # Reconnect: screen -r deployment
   ```

2. **Keep logs open** in another browser tab:
   ```bash
   pm2 logs --lines 50 --timestamp
   ```

3. **Test incrementally** - after each migration, verify it worked:
   ```bash
   psql $DATABASE_URL -c "\dt" | tail -20
   ```

---

**Ready to deploy? Let's go! 🚀**
