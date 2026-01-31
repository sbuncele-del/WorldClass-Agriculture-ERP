#!/usr/bin/env node

/**
 * Convert Brand Documents to PDF
 * Brand Identity Guide, Style Guide, and Policies
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Brand documents to convert
const BRAND_DOCUMENTS = [
  { file: 'BRAND-IDENTITY-GUIDE.md', title: 'Brand Identity Guide', classification: 'Internal' },
  { file: 'BRAND-STYLE-GUIDE.md', title: 'Brand Style Guide', classification: 'Internal' }
];

const POLICY_DOCUMENTS = [
  { file: 'policies/EMAIL-COMMUNICATION-POLICY.md', title: 'Email Communication Policy', classification: 'Internal' }
];

// Document metadata for intro boxes
const DOC_METADATA = {
  'BRAND-IDENTITY-GUIDE': {
    purpose: 'Brand Foundation',
    background: 'Comprehensive guide to SiyaBusa ERP brand identity, voice, values, and visual standards.',
    department: 'Marketing'
  },
  'BRAND-STYLE-GUIDE': {
    purpose: 'Design Standards',
    background: 'Visual and written standards for all SiyaBusa ERP documentation and communications.',
    department: 'Marketing'
  },
  'EMAIL-COMMUNICATION-POLICY': {
    purpose: 'Communication Policy',
    background: 'Standards for professional email communications on behalf of Masaphokati Technologies.',
    department: 'Operations'
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
            margin: 30px 0 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .cover-subtitle {
            font-size: 18px;
            color: #93c5fd;
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

        /* Content */
        .content {
            padding: 20px 0;
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

        h1 {
            color: #1e40af;
            font-size: 24px;
            font-weight: 700;
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 3px solid #1e40af;
            page-break-after: avoid;
        }
        
        h2 {
            color: #1e40af;
            font-size: 18px;
            font-weight: 600;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
            page-break-after: avoid;
        }
        
        h3 {
            color: #334155;
            font-size: 15px;
            font-weight: 600;
            margin: 25px 0 12px 0;
            page-break-after: avoid;
        }

        h4 {
            color: #475569;
            font-size: 13px;
            font-weight: 600;
            margin: 20px 0 10px 0;
        }
        
        p {
            margin: 12px 0;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        
        li {
            margin: 8px 0;
        }

        blockquote {
            border-left: 4px solid #2563eb;
            margin: 20px 0;
            padding: 15px 20px;
            background: #eff6ff;
            font-style: italic;
            color: #1e40af;
        }

        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
        }

        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 15px 0;
            font-size: 11px;
        }

        pre code {
            background: none;
            color: inherit;
            padding: 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }
        
        th {
            background: #1e40af;
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
        }
        
        tr:nth-child(even) {
            background: #f8fafc;
        }

        hr {
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 30px 0;
        }

        strong {
            color: #1e40af;
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

async function convertToPDF(mdPath, outputPath, title, classification) {
  try {
    let markdown = fs.readFileSync(mdPath, 'utf8');
    
    // Remove emojis for cleaner PDFs
    markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/gu, '');
    
    let htmlContent = marked.parse(markdown);
    
    // Get document metadata for intro box
    const filename = path.basename(mdPath, '.md');
    const docInfo = DOC_METADATA[filename] || { 
      purpose: 'Documentation', 
      background: 'SiyaBusa ERP documentation.',
      department: 'Documentation'
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
    
    const coverPageHtml = `
    <div class="cover-page">
        <div class="cover-content">
            <div class="cover-logo">SiyaBusa ERP</div>
            <div class="cover-title">${title}</div>
            <div class="cover-subtitle">Brand & Corporate Documentation</div>
            
            <div class="cover-meta">
                <strong>Masaphokati Technologies (Pty) Ltd</strong>
            </div>
            
            <div class="cover-info">
                <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
                <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
                <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">${docInfo.department}</span></div>
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
            <span>Masaphokati Technologies (Pty) Ltd - ${classification}</span>
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
  console.log('\n📄 SiyaBusa ERP - Brand Document PDF Generator');
  console.log('='.repeat(50));
  
  const outputDir = './documentation/pdf/brand';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let success = 0;
  let failed = 0;
  
  // Convert brand documents
  console.log('\n📁 Brand Documents');
  for (const doc of BRAND_DOCUMENTS) {
    const inputPath = `./documentation/${doc.file}`;
    const outputPath = path.join(outputDir, doc.file.replace('.md', '.pdf'));
    
    console.log(`📝 Converting: ${doc.title}...`);
    const result = await convertToPDF(inputPath, outputPath, doc.title, doc.classification);
    if (result) success++;
    else failed++;
  }
  
  // Convert policy documents
  console.log('\n📁 Policy Documents');
  for (const doc of POLICY_DOCUMENTS) {
    const inputPath = `./documentation/${doc.file}`;
    const outputPath = path.join(outputDir, path.basename(doc.file).replace('.md', '.pdf'));
    
    console.log(`📝 Converting: ${doc.title}...`);
    const result = await convertToPDF(inputPath, outputPath, doc.title, doc.classification);
    if (result) success++;
    else failed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Conversion Complete!`);
  console.log(`   ✅ Success: ${success}`);
  if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Output: ${outputDir}/`);
}

main().catch(console.error);
