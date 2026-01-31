#!/usr/bin/env node

/**
 * Convert Professional Documentation to PDF
 * Uses the beautiful SiyaBusa theme with gradient covers and glassmorphism
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Documentation structure
const DOCUMENTATION = {
  'legal': {
    title: 'Legal Documents',
    folder: 'documentation/legal',
    files: [
      'TERMS-OF-SERVICE.md',
      'PRIVACY-POLICY.md',
      'SERVICE-LEVEL-AGREEMENT.md',
      'MASTER-SERVICES-AGREEMENT.md',
      'DATA-PROCESSING-AGREEMENT.md',
      'ACCEPTABLE-USE-POLICY.md',
      'END-USER-LICENSE-AGREEMENT.md'
    ]
  },
  'sales': {
    title: 'Sales Enablement',
    folder: 'documentation/sales',
    files: [
      'PRICING-GUIDE.md',
      'SOW-TEMPLATE.md',
      'ROI-CALCULATOR.md',
      'IMPLEMENTATION-PROJECT-PLAN.md'
    ]
  },
  'technical': {
    title: 'Technical Documentation',
    folder: 'documentation/technical',
    files: [
      'API-DOCUMENTATION.md',
      'SYSTEM-REQUIREMENTS.md',
      'SECURITY-WHITEPAPER.md',
      'SUPPORT-ESCALATION-MATRIX.md'
    ]
  },
  'customer-success': {
    title: 'Customer Success',
    folder: 'documentation/customer-success',
    files: [
      'CUSTOMER-SUCCESS-PLAYBOOK.md',
      'CASE-STUDY-TEMPLATES.md',
      'COMPETITIVE-BATTLE-CARDS.md',
      'QBR-TEMPLATE.md'
    ]
  },
  'operations': {
    title: 'Operations',
    folder: 'documentation/operations',
    files: [
      'INCIDENT-POST-MORTEM-TEMPLATE.md'
    ]
  }
};

// Document metadata for cover pages
const DOC_METADATA = {
  'TERMS-OF-SERVICE': {
    purpose: 'Legal Agreement',
    background: 'Terms and conditions governing the use of SiyaBusa ERP services.',
    classification: 'Public',
    department: 'Legal'
  },
  'PRIVACY-POLICY': {
    purpose: 'Privacy & Data Protection',
    background: 'POPIA-compliant privacy policy describing how we collect, use, and protect personal information.',
    classification: 'Public',
    department: 'Legal'
  },
  'SERVICE-LEVEL-AGREEMENT': {
    purpose: 'Service Commitments',
    background: 'Service level agreement defining availability, support tiers, and performance standards.',
    classification: 'Confidential',
    department: 'Legal'
  },
  'MASTER-SERVICES-AGREEMENT': {
    purpose: 'Enterprise Contract',
    background: 'Comprehensive master services agreement template for enterprise customers.',
    classification: 'Confidential',
    department: 'Legal'
  },
  'DATA-PROCESSING-AGREEMENT': {
    purpose: 'Data Protection',
    background: 'POPIA-compliant data processing agreement for customer data handling.',
    classification: 'Confidential',
    department: 'Legal'
  },
  'ACCEPTABLE-USE-POLICY': {
    purpose: 'Usage Guidelines',
    background: 'Policy defining acceptable and prohibited uses of SiyaBusa ERP services.',
    classification: 'Public',
    department: 'Legal'
  },
  'END-USER-LICENSE-AGREEMENT': {
    purpose: 'Software License',
    background: 'End user license agreement for SiyaBusa ERP software.',
    classification: 'Public',
    department: 'Legal'
  },
  'PRICING-GUIDE': {
    purpose: 'Sales Reference',
    background: 'Comprehensive pricing information for all plans, modules, and services.',
    classification: 'Confidential',
    department: 'Sales'
  },
  'SOW-TEMPLATE': {
    purpose: 'Contract Template',
    background: 'Statement of work template for implementation projects.',
    classification: 'Confidential',
    department: 'Sales'
  },
  'ROI-CALCULATOR': {
    purpose: 'Business Case Tool',
    background: 'Guide and worksheet for calculating return on investment.',
    classification: 'Internal',
    department: 'Sales'
  },
  'IMPLEMENTATION-PROJECT-PLAN': {
    purpose: 'Project Management',
    background: 'Standard implementation project plan template with phases and tasks.',
    classification: 'Internal',
    department: 'Professional Services'
  },
  'API-DOCUMENTATION': {
    purpose: 'Developer Reference',
    background: 'Complete REST API documentation with authentication, endpoints, and examples.',
    classification: 'Confidential',
    department: 'Engineering'
  },
  'SYSTEM-REQUIREMENTS': {
    purpose: 'Technical Prerequisites',
    background: 'Browser, network, and system requirements for SiyaBusa ERP.',
    classification: 'Public',
    department: 'Engineering'
  },
  'SECURITY-WHITEPAPER': {
    purpose: 'Security Overview',
    background: 'Comprehensive security architecture, compliance, and data protection information.',
    classification: 'Confidential',
    department: 'Security'
  },
  'SUPPORT-ESCALATION-MATRIX': {
    purpose: 'Support Operations',
    background: 'Support tiers, SLAs, and escalation procedures.',
    classification: 'Internal',
    department: 'Support'
  },
  'CUSTOMER-SUCCESS-PLAYBOOK': {
    purpose: 'CSM Guide',
    background: 'Comprehensive Customer Success Manager playbook with methodologies and best practices.',
    classification: 'Internal',
    department: 'Customer Success'
  },
  'CASE-STUDY-TEMPLATES': {
    purpose: 'Marketing Asset',
    background: 'Industry-specific templates for documenting customer success stories.',
    classification: 'Public',
    department: 'Marketing'
  },
  'COMPETITIVE-BATTLE-CARDS': {
    purpose: 'Competitive Intelligence',
    background: 'Battle cards for positioning against major ERP competitors.',
    classification: 'Strictly Confidential',
    department: 'Sales'
  },
  'QBR-TEMPLATE': {
    purpose: 'Customer Engagement',
    background: 'Quarterly Business Review presentation template.',
    classification: 'Internal',
    department: 'Customer Success'
  },
  'INCIDENT-POST-MORTEM-TEMPLATE': {
    purpose: 'Operations',
    background: 'Template for documenting and learning from incidents using blameless methodology.',
    classification: 'Internal',
    department: 'Operations'
  }
};

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true
});

// Beautiful Professional PDF styling - matching the original theme
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

        h4 {
            color: #4338ca;
            margin-top: 20px;
            font-size: 14px;
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

        /* Cover Page - Beautiful Tech Gradient with Glassmorphism */
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
    
    const docInfo = DOC_METADATA[filename] || { 
      purpose: category, 
      background: 'SiyaBusa ERP documentation.',
      classification: 'Internal'
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
    
    // Beautiful cover page with glassmorphism
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
                <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">${docInfo.department || 'Documentation'}</span></div>
                <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">${docInfo.classification}</span></div>
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
    
    const stats = fs.statSync(outputPath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`   ✅ ${path.basename(outputPath)} (${sizeKB}KB)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  SiyaBusa ERP - Professional Documentation PDF Generator');
  console.log('  Beautiful Theme with Gradient Covers');
  console.log('========================================\n');
  
  const baseDir = path.join(__dirname, '..');
  const outputDir = path.join(baseDir, 'documentation', 'pdf');
  
  // Create main output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let totalFiles = 0;
  let successCount = 0;
  
  // Process each category
  for (const [category, info] of Object.entries(DOCUMENTATION)) {
    const categoryDir = path.join(baseDir, info.folder);
    const categoryOutputDir = path.join(outputDir, category);
    
    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️  Skipping ${category} - directory not found`);
      continue;
    }
    
    // Create category output directory
    if (!fs.existsSync(categoryOutputDir)) {
      fs.mkdirSync(categoryOutputDir, { recursive: true });
    }
    
    console.log(`📁 ${info.title}`);
    
    for (const file of info.files) {
      const inputPath = path.join(categoryDir, file);
      const outputPath = path.join(categoryOutputDir, file.replace('.md', '.pdf'));
      
      if (!fs.existsSync(inputPath)) {
        console.log(`   ⚠️  File not found: ${file}`);
        continue;
      }
      
      totalFiles++;
      
      const success = await convertToPDF(inputPath, outputPath, info.title);
      if (success) successCount++;
    }
    
    console.log('');
  }
  
  console.log('========================================');
  console.log(`  Conversion Complete: ${successCount}/${totalFiles} files`);
  console.log(`  Output: ${outputDir}`);
  console.log('========================================\n');
}

main().catch(console.error);
