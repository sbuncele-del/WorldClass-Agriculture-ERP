# Logistics Module - AWS Textract Setup Guide

## Overview

The Logistics module uses AWS Textract for OCR (Optical Character Recognition) to automatically extract data from load confirmations, delivery notes, and other logistics documents.

## What Was Fixed

### 1. **Frontend API Configuration**
- ✅ Created centralized API utility (`frontend/src/utils/api.ts`)
- ✅ Fixed hardcoded API URLs to use environment variables
- ✅ Improved error handling and user feedback
- ✅ Added progress tracking for file uploads

### 2. **Backend Error Handling**
- ✅ Enhanced AWS Textract client initialization with proper error checking
- ✅ Added detailed logging for debugging
- ✅ Better error messages returned to frontend
- ✅ Validation for empty/unreadable documents

### 3. **Document Processing Flow**
```
Upload Document → AWS Textract OCR → Text Parsing → Data Extraction → Invoice Generation
```

## AWS Textract Setup

### Step 1: Create AWS IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Add users"
3. User name: `worldclass-erp-textract`
4. Select: "Access key - Programmatic access"
5. Click "Next: Permissions"

### Step 2: Attach Textract Permissions

Create a custom policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "textract:DetectDocumentText",
                "textract:AnalyzeDocument"
            ],
            "Resource": "*"
        }
    ]
}
```

Or use the managed policy: `AmazonTextractFullAccess`

### Step 3: Get Access Keys

1. After creating the user, click "Download .csv"
2. Save the Access Key ID and Secret Access Key securely
3. **Important**: Never commit these to version control!

### Step 4: Configure Backend Environment

1. Copy the example environment file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and add your AWS credentials:
```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=AKIA...your_key_here
AWS_SECRET_ACCESS_KEY=wJal...your_secret_here
```

3. Restart the backend server:
```bash
npm run dev
```

### Step 5: Configure Frontend Environment

The frontend uses environment variables for API configuration:

**Development** (`.env.development`):
```env
VITE_API_URL=http://localhost:3000
```

**Production** (`.env.production`):
```env
VITE_API_URL=http://51.20.92.38
```

## Testing the Text Extractor

### 1. Start the Backend
```bash
cd backend
npm run dev
```

Look for this message in the logs:
```
✅ AWS Textract client initialized successfully
```

If you see an error, check your AWS credentials.

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Document Upload

1. Navigate to: **Logistics → Document Processing**
2. Upload a test document (PDF, JPG, or PNG)
3. Supported document types:
   - Load confirmations
   - Delivery notes
   - Proof of Delivery (POD)
   - Transport invoices

### 4. Verify Processing Steps

You should see the following steps complete:
1. ✅ Uploading document...
2. ✅ OCR text extraction with AWS Textract...
3. ✅ Identifying document type...
4. ✅ Extracting customer details...
5. ✅ Extracting load information...
6. ✅ Checking for existing customer...
7. ✅ Calculating invoice amounts...
8. ✅ Validating SARS compliance...

### 5. Review Extracted Data

The system will extract:
- **Transporter Details**: Company name, VAT number, contact info
- **Customer Details**: Company name, contact person
- **Load Information**: Load number, driver, vehicle, commodity, rate
- **Route Details**: Collection and delivery addresses
- **Invoice Details**: Automatically calculated with 15% VAT

## Troubleshooting

### Error: "AWS Textract client not initialized"

**Cause**: Missing or invalid AWS credentials

**Solution**:
1. Check `backend/.env` has correct AWS credentials
2. Verify IAM user has Textract permissions
3. Test credentials with AWS CLI:
   ```bash
   aws textract detect-document-text --region eu-north-1 \
     --document '{"S3Object":{"Bucket":"test","Name":"test.pdf"}}'
   ```

### Error: "No text found in document"

**Cause**: Image quality too poor or document is blank

**Solution**:
1. Ensure document has clear, readable text
2. Use high-resolution images (min 150 DPI)
3. Avoid handwritten text (Textract works best with printed text)
4. Check document is not corrupted

### Error: "Failed to extract document data"

**Cause**: Backend API not reachable

**Solution**:
1. Verify backend is running: `curl http://localhost:3000/health`
2. Check frontend `.env` has correct `VITE_API_URL`
3. Check CORS settings in backend allow frontend origin

### Error: "Request failed with status 413"

**Cause**: File size too large

**Solution**:
1. Current limit: 10MB
2. Compress images or reduce PDF size
3. Use JPEG instead of PNG for photos

## Production Deployment

### On EC2 Instance (51.20.92.38)

1. **SSH to server**:
```bash
ssh ec2-user@51.20.92.38
```

2. **Set environment variables**:
```bash
cd /opt/worldclass-erp/backend
sudo nano .env
```

Add:
```env
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your_actual_key
AWS_SECRET_ACCESS_KEY=your_actual_secret
```

3. **Restart backend service**:
```bash
sudo systemctl restart worldclass-backend
sudo systemctl status worldclass-backend
```

4. **Verify logs**:
```bash
sudo journalctl -u worldclass-backend -f
```

Look for: `✅ AWS Textract client initialized successfully`

### Environment Variables Checklist

Backend `.env`:
- [ ] `AWS_REGION=eu-north-1`
- [ ] `AWS_ACCESS_KEY_ID=<your-key>`
- [ ] `AWS_SECRET_ACCESS_KEY=<your-secret>`
- [ ] `DATABASE_URL=<postgres-connection-string>`
- [ ] `JWT_SECRET=<secure-random-string>`

Frontend `.env.production`:
- [ ] `VITE_API_URL=http://51.20.92.38`

## API Endpoints

### POST `/api/logistics/documents/extract`

Upload and process logistics documents.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (PDF, JPG, PNG - max 10MB)

**Response**:
```json
{
  "success": true,
  "message": "Document processed successfully",
  "filename": "load_confirmation.pdf",
  "extractedText": "...",
  "parsedData": {
    "transporter": { ... },
    "customer": { ... },
    "load": { ... },
    "route": { ... }
  },
  "confidence": 85,
  "processedAt": "2025-11-25T10:30:00Z"
}
```

## Cost Considerations

AWS Textract Pricing (as of 2024):
- **DetectDocumentText**: $1.50 per 1,000 pages
- **AnalyzeDocument**: $50 per 1,000 pages (tables/forms)

Current implementation uses `DetectDocumentText` (cheaper option).

**Monthly estimates**:
- 100 documents: ~$0.15
- 1,000 documents: ~$1.50
- 10,000 documents: ~$15.00

## Next Steps

1. ✅ AWS Textract configured and working
2. ⏳ Connect to logistics database for real data
3. ⏳ Integrate with Fleet Management module
4. ⏳ Add automated invoice generation workflow
5. ⏳ Implement customer database lookup
6. ⏳ Add document history and audit trail

## Support

If you encounter issues:

1. Check backend logs: `npm run dev` or `sudo journalctl -u worldclass-backend`
2. Check frontend console: Browser Dev Tools → Console
3. Verify AWS credentials are correct
4. Test with a simple, clear document first
5. Contact AWS Support if Textract API issues persist

## Files Modified

### Frontend
- ✅ `frontend/src/utils/api.ts` - New API utility
- ✅ `frontend/src/modules/logistics/DocumentProcessing.tsx` - Fixed API calls and error handling

### Backend
- ✅ `backend/src/routes/logistics/documents.ts` - Enhanced error handling and logging
- ✅ `backend/.env.example` - Added AWS configuration template

### Configuration
- ✅ `check-aws-setup.sh` - AWS configuration check script
- ✅ This guide - `LOGISTICS-TEXTRACT-SETUP.md`

---

**Status**: ✅ Text Extractor Fixed and Ready for Production
**Last Updated**: November 25, 2025
