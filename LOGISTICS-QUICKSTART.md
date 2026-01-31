# Logistics Module - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Configure AWS Credentials (2 minutes)

1. **Get AWS credentials:**
   - Go to: https://console.aws.amazon.com/iam/
   - Create user: `worldclass-erp-textract`
   - Attach policy: `AmazonTextractFullAccess`
   - Copy Access Key ID and Secret Key

2. **Configure backend:**
   ```bash
   cd backend
   cp .env.example .env
   nano .env
   ```

3. **Add your credentials:**
   ```env
   AWS_REGION=eu-north-1
   AWS_ACCESS_KEY_ID=AKIA...your_key
   AWS_SECRET_ACCESS_KEY=wJal...your_secret
   ```

### Step 2: Install Dependencies (1 minute)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3: Start Development Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Look for: `✅ AWS Textract client initialized successfully`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 4: Test the Text Extractor (1 minute)

1. Open browser: `http://localhost:5173/logistics`
2. Click "Document Processing"
3. Upload a test document (load confirmation, delivery note, or invoice)
4. Watch the processing steps complete
5. Review extracted data

**Supported formats:** PDF, JPG, PNG (max 10MB)

---

## 🎯 Quick Commands

### Check AWS Setup
```bash
chmod +x check-aws-setup.sh
./check-aws-setup.sh
```

### Deploy to Production
```bash
chmod +x deploy-logistics-module.sh
./deploy-logistics-module.sh
```

### Test Backend API
```bash
# Health check
curl http://localhost:3000/health

# Logistics workspace
curl http://localhost:3000/api/logistics/workspace

# Document extraction (requires file)
curl -X POST http://localhost:3000/api/logistics/documents/extract \
  -F "file=@your_document.pdf"
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/.env` | AWS credentials and config |
| `frontend/.env.development` | Frontend dev API URL |
| `frontend/src/utils/api.ts` | API utility functions |
| `frontend/src/services/logistics.api.ts` | Logistics API service |
| `backend/src/routes/logistics/documents.ts` | Document extraction endpoint |

---

## 🐛 Troubleshooting

### Text extractor not working?

1. **Check backend logs** - Look for AWS initialization errors
2. **Verify credentials** - Run `./check-aws-setup.sh`
3. **Test AWS directly:**
   ```bash
   aws textract detect-document-text --region eu-north-1 --help
   ```
4. **Check IAM permissions** - User needs Textract access

### Can't connect to backend?

1. **Backend running?** - Check Terminal 1
2. **Correct port?** - Should be `localhost:3000`
3. **Check .env** - Frontend should have `VITE_API_URL=http://localhost:3000`

### Document upload fails?

1. **File too large?** - Max 10MB
2. **Wrong format?** - Only PDF, JPG, PNG
3. **Backend error?** - Check backend terminal for errors

---

## 📚 Documentation

- **Complete Setup:** `LOGISTICS-TEXTRACT-SETUP.md`
- **Final Status:** `LOGISTICS-MODULE-FINAL-STATUS.md`
- **Deployment:** `deploy-logistics-module.sh`

---

## 🎉 What's Fixed

✅ Text extractor now works with AWS Textract  
✅ Proper API configuration with environment variables  
✅ Better error handling and user feedback  
✅ Type-safe API service layer  
✅ Comprehensive documentation  
✅ Deployment automation  

---

## 🔥 Production Deployment

### Option 1: Manual Deployment

```bash
# Build frontend
cd frontend
npm run build

# Upload to server
scp -r dist/ ec2-user@51.20.92.38:/opt/worldclass-erp/frontend/

# Update backend
scp -r backend/src backend/package.json ec2-user@51.20.92.38:/opt/worldclass-erp/backend/

# SSH and restart
ssh ec2-user@51.20.92.38
cd /opt/worldclass-erp/backend
npm install
npm run build
sudo systemctl restart worldclass-backend
sudo systemctl restart nginx
```

### Option 2: Automated Deployment

```bash
./deploy-logistics-module.sh
# Follow prompts
```

---

## 📊 Test with Sample Data

### Sample Load Confirmation Fields

A typical load confirmation document should contain:
- **Load Number:** TRP-2025-00125
- **Customer:** Massmart / Shoprite / Pick n Pay
- **Transporter:** Company name and VAT number
- **Driver:** Driver name
- **Vehicle:** Registration (ABC 123 GP)
- **Commodity:** General cargo / Steel / FMCG
- **Rate:** R 5,000 per load
- **Collection:** Johannesburg DC
- **Delivery:** Cape Town DC
- **Date:** 2025-11-25

The text extractor will automatically parse these fields and generate an invoice.

---

## ✨ Next Steps

1. Configure AWS credentials
2. Test with a real document
3. Review extracted data accuracy
4. Adjust parsing patterns if needed
5. Deploy to production
6. Train users on the system

---

**Need Help?** Check the detailed guides:
- `LOGISTICS-TEXTRACT-SETUP.md` - Complete setup guide
- `LOGISTICS-MODULE-FINAL-STATUS.md` - Full status report

**Status:** ✅ Ready to use!
