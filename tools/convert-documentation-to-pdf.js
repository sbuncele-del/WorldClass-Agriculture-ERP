#!/usr/bin/env node

/**
 * Convert All Documentation to PDF
 * Professional PDFs for all documentation categories
 * Uses Puppeteer with branded styling
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Documentation categories and their files
const DOCUMENTATION = {
  'onboarding': {
    title: 'Onboarding & Setup',
    files: [
      'GETTING-STARTED-GUIDE.md',
      'FIRST-DAY-CHECKLIST.md',
      'ADMIN-SETUP-GUIDE.md',
      'DOCUMENT-INDUCTION-GUIDE.md'
    ]
  },
  'training': {
    title: 'Training Materials',
    files: [
      'TRAINING-OVERVIEW.md',
      'FINANCIAL-MODULE-TRAINING.md',
      'HR-PAYROLL-MODULE-TRAINING.md',
      'INVENTORY-MODULE-TRAINING.md',
      'SALES-CRM-MODULE-TRAINING.md',
      'COMPLIANCE-MODULE-TRAINING.md'
    ]
  },
  'email-templates': {
    title: 'Email Templates',
    files: [
      'ONBOARDING-EMAIL-SEQUENCE.md'
    ]
  },
  'sales-enablement': {
    title: 'Sales Enablement',
    files: [
      'SALES-PLAYBOOK.md'
    ]
  },
  'video-scripts': {
    title: 'Video Production',
    files: [
      'VIDEO-SCRIPTS-LIBRARY.md'
    ]
  },
  'social-media': {
    title: 'Social Media',
    files: [
      'SOCIAL-MEDIA-CONTENT-LIBRARY.md'
    ]
  }
};

// Document classification by category
const CLASSIFICATION_CONFIG = {
  'training': 'Internal',
  'onboarding': 'Internal', 
  'email-templates': 'Internal',
  'sales-enablement': 'Confidential',
  'video-scripts': 'Public',
  'social-media': 'Public'
};

// Department by category
const DEPARTMENT_CONFIG = {
  'training': 'Training & Development',
  'onboarding': 'Customer Success',
  'email-templates': 'Marketing',
  'sales-enablement': 'Sales',
  'video-scripts': 'Marketing',
  'social-media': 'Marketing'
};

// Document descriptions for cover pages
const DOC_DESCRIPTIONS = {
  'GETTING-STARTED-GUIDE': {
    purpose: 'New User Orientation',
    background: 'Complete guide for new users to get started with SiyaBusa ERP, including login, navigation, and first tasks.'
  },
  'FIRST-DAY-CHECKLIST': {
    purpose: 'Quick Reference Checklist',
    background: 'Printable checklist for new employees to complete on their first day with SiyaBusa ERP.'
  },
  'ADMIN-SETUP-GUIDE': {
    purpose: 'Administrator Guide',
    background: 'Comprehensive setup guide for system administrators to configure SiyaBusa ERP for their organization.'
  },
  'DOCUMENT-INDUCTION-GUIDE': {
    purpose: 'Documentation Orientation',
    background: 'Complete guide to navigating the Masaphokati Technologies documentation ecosystem for employees, contractors, and investors.'
  },
  'TRAINING-OVERVIEW': {
    purpose: 'Training Program Guide',
    background: 'Overview of all training paths, certifications, and learning resources available for SiyaBusa ERP.'
  },
  'FINANCIAL-MODULE-TRAINING': {
    purpose: 'Financial Module Training',
    background: 'Complete training guide for finance teams covering Chart of Accounts, General Ledger, AP, AR, Bank Reconciliation, and Financial Reports.'
  },
  'HR-PAYROLL-MODULE-TRAINING': {
    purpose: 'HR & Payroll Training',
    background: 'Comprehensive HR and Payroll training covering Employee Management, Leave Administration, Payroll Processing, SARS Submissions, and HR Reports.'
  },
  'INVENTORY-MODULE-TRAINING': {
    purpose: 'Inventory Module Training',
    background: 'Complete inventory training including Product Management, Warehouse Management, Stock Movements, Stock Takes, and Inventory Reports.'
  },
  'SALES-CRM-MODULE-TRAINING': {
    purpose: 'Sales & CRM Training',
    background: 'Sales team training covering Customer Management, Price Lists, Quotations, Sales Orders, Invoicing, and Sales Pipeline Management.'
  },
  'COMPLIANCE-MODULE-TRAINING': {
    purpose: 'Compliance Module Training',
    background: 'Compliance training for SARS Sentinel (VAT, PAYE, EMP201/EMP501) and Audit Shield (audit trails, compliance controls, and reporting).'
  },
  'ONBOARDING-EMAIL-SEQUENCE': {
    purpose: 'Automated Email Templates',
    background: '7-email automated drip campaign for new user onboarding with SendGrid/Mailchimp integration, webhooks, and automation configs.'
  },
  'SALES-PLAYBOOK': {
    purpose: 'Sales Team Resource',
    background: 'Complete sales playbook including value propositions, objection handling, pricing guidelines, and competitive positioning.'
  },
  'VIDEO-SCRIPTS-LIBRARY': {
    purpose: 'Video Production Scripts',
    background: 'Complete library of video scripts for explainer videos, feature spotlights, testimonials, and social media shorts.'
  },
  'SOCIAL-MEDIA-CONTENT-LIBRARY': {
    purpose: 'Social Media Content',
    background: 'Ready-to-use social media posts, content calendar templates, and hashtag strategies for LinkedIn, Twitter, and Instagram.'
  },
  'DOCUMENTATION-INDEX': {
    purpose: 'Master Index',
    background: 'Complete index of all SiyaBusa ERP documentation with status tracking and organization structure.'
  }
};

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true
});

// Professional PDF styling
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

        @page {
            size: A4;
            margin: 20mm 20mm 25mm 20mm;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        h1, h2, h3, h4 {
            color: #111827;
            font-weight: 700;
            line-height: 1.3;
            page-break-after: avoid;
        }
        
        h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-top: 40px;
            font-size: 24px;
        }
        
        h1:first-of-type {
            margin-top: 0;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 30px;
            font-size: 20px;
        }
        
        h3 {
            color: #3730a3;
            margin-top: 25px;
            font-size: 16px;
        }

        p {
            margin-bottom: 16px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
            page-break-inside: avoid;
        }

        th {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        code {
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', monospace;
            font-size: 13px;
        }

        pre {
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
            page-break-inside: avoid;
        }

        pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        blockquote {
            border-left: 4px solid #7c3aed;
            margin: 20px 0;
            padding: 15px 20px;
            background-color: #faf5ff;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }

        ul, ol {
            margin-bottom: 16px;
            padding-left: 25px;
        }

        li {
            margin-bottom: 8px;
        }

        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 30px 0;
        }

        strong {
            color: #1e3a8a;
        }

        .intro-box {
            background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
            border-left: 4px solid #1e3a8a;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 0 8px 8px 0;
        }

        .intro-title {
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
        }

        .intro-text {
            color: #4b5563;
            font-size: 14px;
        }

        /* Cover Page */
        .cover-page {
            height: 250mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            /* Deep Blue Tech Background with "Lights" effect */
            background: 
                radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 20%),
                radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.4) 0%, transparent 20%),
                linear-gradient(135deg, #020617 0%, #1e3a8a 50%, #172554 100%);
            margin: -20mm -20mm 0 -20mm;
            padding: 20mm;
            page-break-after: always;
            color: white;
            position: relative;
            overflow: hidden;
        }

        /* Add a subtle grid overlay */
        .cover-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
        }

        .cover-content {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(12px);
            padding: 60px;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 80%;
            position: relative;
            z-index: 10;
        }

        .cover-logo {
            font-size: 48px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 30px;
        }

        .cover-title {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 15px;
        }

        .cover-subtitle {
            font-size: 18px;
            color: #bfdbfe;
            margin-bottom: 40px;
        }

        .cover-meta {
            margin-top: 30px;
            font-size: 16px;
            color: #ffffff;
            font-weight: 600;
        }

        .cover-meta strong {
            color: #ffffff;
        }

        .cover-info {
            margin-top: 25px;
            padding: 20px 30px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            text-align: left;
            display: inline-block;
        }

        .cover-info .info-row {
            margin: 8px 0;
            font-size: 14px;
            color: #e0f2fe;
        }

        .cover-info .info-label {
            font-weight: 600;
            color: #93c5fd;
        }

        .cover-info .info-value {
            color: #ffffff;
        }

        .cover-date {
            font-size: 16px;
            color: #93c5fd;
            margin-top: 40px;
            border-top: 1px solid rgba(255,255,255,0.3);
            padding-top: 20px;
        }

        .cover-tagline {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 12px;
            color: #93c5fd;
            font-weight: 400;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

    </style>
</head>
<body>
    {{COVER_PAGE}}
    <div class="content">
        {{CONTENT}}
    </div>
</body>
</html>
`;

async function convertToPDF(mdPath, outputPath, category) {
  try {
    let markdown = fs.readFileSync(mdPath, 'utf8');
    
    // Remove emojis for cleaner PDFs
    markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/gu, '');
    
    let htmlContent = marked.parse(markdown);
    
    const filename = path.basename(mdPath, '.md');
    const title = filename.replace(/-/g, ' ');
    
    const docInfo = DOC_DESCRIPTIONS[filename] || { 
      purpose: category, 
      background: 'SiyaBusa ERP documentation.' 
    };
    
    // Add intro box explaining document purpose
    const introHtml = `
    <div class="intro-box">
        <div class="intro-title">${docInfo.purpose}</div>
        <div class="intro-text">${docInfo.background}</div>
    </div>
    `;
    
    if (htmlContent.includes('</h1>')) {
      htmlContent = htmlContent.replace('</h1>', '</h1>' + introHtml);
    } else {
      htmlContent = introHtml + htmlContent;
    }
    
    // Get classification based on category
    const categoryKey = Object.keys(DOCUMENTATION).find(key => DOCUMENTATION[key].title === category) || 'training';
    const classification = CLASSIFICATION_CONFIG[categoryKey] || 'Internal';
    const department = DEPARTMENT_CONFIG[categoryKey] || 'Documentation';
    
    const coverPageHtml = `
    <div class="cover-page">
        <div class="cover-content">
            <div class="cover-logo">SiyaBusa ERP</div>
            <div class="cover-title">${title}</div>
            <div class="cover-subtitle">${category}</div>
            
            <div class="cover-meta">
                <strong>Masaphokati Technologies (Pty) Ltd</strong>
            </div>
            
            <div class="cover-info">
                <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
                <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
                <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">${department}</span></div>
                <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">${classification}</span></div>
            </div>
            
            <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
        </div>
    </div>
    `;

    const html = HTML_TEMPLATE
      .replace('{{COVER_PAGE}}', coverPageHtml)
      .replace('{{CONTENT}}', htmlContent);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
            <span>Masaphokati Technologies (Pty) Ltd - Confidential</span>
            <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    console.log(`   ✅ Created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📄 SiyaBusa ERP - Documentation PDF Generator');
  console.log('==============================================\n');
  
  const baseDir = path.join(__dirname, '..', 'documentation');
  const outputDir = path.join(__dirname, '..', 'documentation-pdfs');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let totalFiles = 0;
  let successCount = 0;
  
  // Process each category
  for (const [category, info] of Object.entries(DOCUMENTATION)) {
    const categoryDir = path.join(baseDir, category);
    const categoryOutputDir = path.join(outputDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️  Skipping ${category} - directory not found`);
      continue;
    }
    
    // Create category output directory
    if (!fs.existsSync(categoryOutputDir)) {
      fs.mkdirSync(categoryOutputDir, { recursive: true });
    }
    
    console.log(`📁 Processing: ${info.title}`);
    
    for (const file of info.files) {
      const inputPath = path.join(categoryDir, file);
      const outputPath = path.join(categoryOutputDir, file.replace('.md', '.pdf'));
      
      if (!fs.existsSync(inputPath)) {
        console.log(`   ⚠️  File not found: ${file}`);
        continue;
      }
      
      totalFiles++;
      console.log(`📝 Converting: ${file}...`);
      
      const success = await convertToPDF(inputPath, outputPath, info.title);
      if (success) successCount++;
    }
    
    console.log('');
  }
  
  // Also convert the main index
  const indexPath = path.join(baseDir, 'DOCUMENTATION-INDEX.md');
  if (fs.existsSync(indexPath)) {
    console.log('📝 Converting: DOCUMENTATION-INDEX.md...');
    totalFiles++;
    const success = await convertToPDF(
      indexPath, 
      path.join(outputDir, 'DOCUMENTATION-INDEX.pdf'),
      'Master Index'
    );
    if (success) successCount++;
  }
  
  console.log('\n==============================================');
  console.log('✨ PDF Generation Complete!');
  console.log('==============================================');
  console.log(`✅ ${successCount} of ${totalFiles} documents generated`);
  console.log(`📁 Location: ./documentation-pdfs/\n`);
}

main().catch(console.error);
