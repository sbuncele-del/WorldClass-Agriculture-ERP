# Compliance Module - Manual Deployment Instructions

## Package Contents
This folder contains all files needed to deploy the Compliance & Governance Module:

- `015_compliance_governance_module.sql` - Database schema (44 tables)
- `compliance.controller.ts` - Compliance controller (28KB)
- `sars-sentinel.controller.ts` - SARS Sentinel controller (22KB)
- `audit-ready.controller.ts` - Audit-Ready controller (24KB)
- `compliance.routes.ts` - Compliance routes (18 endpoints)
- `sars-sentinel.routes.ts` - SARS Sentinel routes (13 endpoints)
- `audit-ready.routes.ts` - Audit-Ready routes (13 endpoints)
- `index.ts` - Updated main app file
- `DEPLOY.sh` - Automated deployment script

## Deployment Steps

### Option 1: Automated (Recommended)

1. **Upload this entire folder to EC2:**
   ```bash
   scp -r compliance-deployment ec2-user@51.21.219.35:/home/ec2-user/
   ```

2. **SSH into EC2:**
   ```bash
   ssh ec2-user@51.21.219.35
   ```

3. **Run the deployment script:**
   ```bash
   cd /home/ec2-user/compliance-deployment
   ./DEPLOY.sh
   ```

### Option 2: Manual Step-by-Step

1. **Upload folder to EC2** (same as above)

2. **SSH into EC2** (same as above)

3. **Deploy database schema:**
   ```bash
   cd /home/ec2-user/compliance-deployment
   
   PGPASSWORD="Worldclass2025" psql \
     -h aetheros-erp-db.cxoqqoowwgxt.eu-north-1.rds.amazonaws.com \
     -U worldclass_admin \
     -d aetheros_erp \
     -f 015_compliance_governance_module.sql
   ```

4. **Copy controllers:**
   ```bash
   cp *.controller.ts /home/ec2-user/backend/src/controllers/
   ```

5. **Copy routes:**
   ```bash
   cp *.routes.ts /home/ec2-user/backend/src/routes/
   ```

6. **Copy main app file:**
   ```bash
   cp index.ts /home/ec2-user/backend/src/
   ```

7. **Build and restart:**
   ```bash
   cd /home/ec2-user/backend
   npm run build
   pm2 restart aetheros-backend
   ```

8. **Verify deployment:**
   ```bash
   # Test Compliance endpoints
   curl http://localhost:3000/api/compliance/frameworks
   curl http://localhost:3000/api/compliance/risk-categories
   
   # Test SARS Sentinel endpoints
   curl http://localhost:3000/api/sars-sentinel/dashboard/stats
   curl http://localhost:3000/api/sars-sentinel/correspondence-types
   
   # Test Audit-Ready endpoints
   curl http://localhost:3000/api/audit/checklist-templates
   curl http://localhost:3000/api/audit/engagements
   ```

## What Gets Deployed

### Database (44 Tables)
- 5 Regulatory compliance tables
- 4 Risk management tables
- 3 Incident management tables
- 2 Training tables
- 10 SARS Sentinel tables
- 7 Audit-Ready Suite tables
- 9 Supporting tables

### Backend (44 Endpoints)
- 18 Compliance endpoints
- 13 SARS Sentinel endpoints
- 13 Audit-Ready endpoints

### Reference Data (100+ Records)
- 16 SA regulatory frameworks (FICA, POPIA, King IV, TAX, etc.)
- 16 SARS correspondence types
- 10 risk categories
- 8 policy categories
- 9 incident types
- 6 audit checklist templates
- SA tax deadline calendar

## Troubleshooting

### If schema deployment fails:
- Check database connection
- Ensure migrations directory exists
- Check if schema already deployed (re-running is safe due to IF NOT EXISTS clauses)

### If build fails:
- Run `npm install` first
- Check TypeScript errors: `npm run build`
- Check PM2 logs: `pm2 logs aetheros-backend`

### If endpoints return 404:
- Verify routes are copied: `ls /home/ec2-user/backend/src/routes/*.routes.ts`
- Check if PM2 restarted: `pm2 list`
- Restart manually: `pm2 restart aetheros-backend`

## Testing Endpoints (From Your Local Machine)

```bash
# Compliance
curl http://51.21.219.35:3000/api/compliance/frameworks
curl http://51.21.219.35:3000/api/compliance/risk-categories
curl http://51.21.219.35:3000/api/compliance/policies
curl http://51.21.219.35:3000/api/compliance/training/courses

# SARS Sentinel
curl http://51.21.219.35:3000/api/sars-sentinel/dashboard/stats
curl http://51.21.219.35:3000/api/sars-sentinel/correspondence-types
curl http://51.21.219.35:3000/api/sars-sentinel/deadline-calendar

# Audit-Ready
curl http://51.21.219.35:3000/api/audit/checklist-templates
curl http://51.21.219.35:3000/api/audit/engagements
```

## Success Criteria

✅ No build errors  
✅ PM2 shows backend running  
✅ All 44 endpoints respond (200 or 401 with auth)  
✅ Dashboard stats endpoint returns data structure  
✅ Reference data endpoints return pre-populated records  

## Next Steps After Deployment

1. Test all endpoints with proper authentication
2. Verify reference data is loaded correctly
3. Create test compliance records
4. Test SARS correspondence creation
5. Test audit engagement workflow
6. Move to next module (Reports & Analytics)
