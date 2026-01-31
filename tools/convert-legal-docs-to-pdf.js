#!/usr/bin/env node

/**
 * Convert Legal Documents to PDF
 * Uses Puppeteer to generate clean, professional PDFs with cover pages
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Legal Documents
const LEGAL_DOCUMENTS = [
  'legal/NDA-TEMPLATE.md',
  'legal/IP-TRADEMARK-STRATEGY.md',
  'legal/TM-APPLICATION-SIYABUSA.md',
  'legal/TM-APPLICATION-SARS-SENTINEL.md',
  'legal/TM-APPLICATION-TAGLINE.md',
  'legal/TM-APPLICATION-AUDIT-SHIELD.md',
  'legal/IP-ASSIGNMENT-AGREEMENT.md'
];

// Document Descriptions for Introductory Text
const LEGAL_DESCRIPTIONS = {
  'NDA-TEMPLATE': {
    purpose: 'Confidentiality Agreement',
    background: 'Standard Non-Disclosure Agreement for use in business engagements, compliant with South African law including POPIA.'
  },
  'IP-TRADEMARK-STRATEGY': {
    purpose: 'Intellectual Property Strategy',
    background: 'Comprehensive IP and trademark strategy document outlining unique features, registration process, and protection measures.'
  },
  'TM-APPLICATION-SIYABUSA': {
    purpose: 'Trademark Application',
    background: 'CIPC Form TM1 application for the SIYABUSA word mark across Classes 9, 35, and 42.'
  },
  'TM-APPLICATION-SARS-SENTINEL': {
    purpose: 'Trademark Application',
    background: 'CIPC Form TM1 application for the SARS SENTINEL word mark for tax compliance software.'
  },
  'TM-APPLICATION-TAGLINE': {
    purpose: 'Trademark Application',
    background: 'CIPC Form TM1 application for the tagline: We Rule. We Govern. We Empower.'
  },
  'TM-APPLICATION-AUDIT-SHIELD': {
    purpose: 'Trademark Application',
    background: 'CIPC Form TM1 application for the AUDIT SHIELD word mark for preventive audit management software.'
  },
  'IP-ASSIGNMENT-AGREEMENT': {
    purpose: 'IP Assignment Agreement',
    background: 'Standard agreement for employees and contractors to assign intellectual property rights to Masaphokati Technologies.'
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        h1, h2, h3, h4, h5, h6 {
            color: #111827;
            font-weight: 700;
            line-height: 1.3;
            page-break-after: avoid;
            break-after: avoid;
            page-break-inside: avoid;
        }
        
        h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-top: 40px;
            font-size: 24px;
        }
        
        h1:first-of-type {
            page-break-before: avoid;
            margin-top: 0;
        }
        
        h2 {
            color: #1e40af;
            margin-top: 30px;
            font-size: 18px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
            page-break-after: avoid;
        }
        
        h3 {
            color: #374151;
            margin-top: 20px;
            font-size: 14px;
        }

        p {
            text-align: justify;
            margin-bottom: 12px;
            font-size: 11pt;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        th {
            background-color: #1e3a8a;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            font-size: 10pt;
        }
        
        td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }

        code {
            background-color: #f3f4f6;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        blockquote {
            border-left: 4px solid #1e3a8a;
            background-color: #f0f9ff;
            margin: 20px 0;
            padding: 15px 20px;
            color: #1e40af;
            font-style: italic;
            border-radius: 0 4px 4px 0;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        ul, ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        
        li {
            margin: 6px 0;
            text-align: justify;
        }

        a {
            color: #1e3a8a;
            text-decoration: none;
        }

        hr {
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
        }

        .page-break {
            page-break-after: always;
        }
        
        .intro-box {
            background-color: #f0f9ff;
            border-left: 4px solid #1e3a8a;
            padding: 20px;
            margin-bottom: 30px;
            margin-top: 20px;
            border-radius: 0 4px 4px 0;
        }
        
        .intro-title {
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 8px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .intro-text {
            color: #4b5563;
            font-size: 14px;
            line-height: 1.6;
        }

        /* Cover Page Styling - Professional Tech Style */
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
            letter-spacing: -1px;
        }

        .cover-title {
            font-size: 36px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 20px;
            line-height: 1.2;
        }

        .cover-subtitle {
            font-size: 20px;
            color: #bfdbfe;
            margin-bottom: 40px;
            font-weight: 400;
        }

        .cover-date {
            font-size: 16px;
            color: #93c5fd;
            margin-top: 40px;
            border-top: 1px solid rgba(255,255,255,0.3);
            padding-top: 20px;
            display: inline-block;
            width: 200px;
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

        .cover-legal {
            margin-top: 20px;
            font-size: 12px;
            color: #93c5fd;
            font-style: italic;
        }

        .cover-tagline {
            margin-top: 30px;
            padding-top: 20px;
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

async function convertToPDF(mdPath, outputPath) {
  try {
    let markdown = fs.readFileSync(mdPath, 'utf8');
    
    // Remove emojis
    markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{2B50}\u{1F900}-\u{1F9FF}]/gu, '');
    
    // Convert checkboxes to proper characters
    markdown = markdown.replace(/☐/g, '☐');
    
    let htmlContent = marked.parse(markdown);
    
    const filename = path.basename(mdPath, '.md');
    const title = filename.replace(/-/g, ' ');
    
    const docInfo = LEGAL_DESCRIPTIONS[path.basename(mdPath, '.md')] || { purpose: 'Legal Document', background: 'Confidential legal documentation.' };
    
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
            <div class="cover-title">${title.replace('TEMPLATE', '').trim()}</div>
            <div class="cover-subtitle">Legal Documentation</div>
            
            <div class="cover-meta">
                <strong>Masaphokati Technologies (Pty) Ltd</strong>
            </div>
            
            <div class="cover-info">
                <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
                <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
                <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">Legal</span></div>
                <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Confidential</span></div>
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
    
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📄 SiyaBusa ERP - Legal PDF Generator');
  console.log('======================================\n');
  
  const outputDir = path.join(process.cwd(), 'legal-pdfs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let success = 0;
  let failed = 0;
  
  for (const docPath of LEGAL_DOCUMENTS) {
    const fullPath = path.join(process.cwd(), docPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Skipping ${docPath} (not found)`);
      failed++;
      continue;
    }
    
    const filename = path.basename(docPath, '.md');
    const outputPath = path.join(outputDir, `${filename}.pdf`);
    
    console.log(`📝 Processing: ${filename}...`);
    const result = await convertToPDF(fullPath, outputPath);
    
    if (result) {
      console.log(`   ✅ Created: ${filename}.pdf\n`);
      success++;
    } else {
      failed++;
    }
  }
  
  console.log('\n======================================');
  console.log('✨ PDF Generation Complete!');
  console.log('======================================');
  console.log(`✅ ${success} documents generated`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} documents failed/skipped`);
  }
  console.log(`📁 Location: ./legal-pdfs/`);
  console.log('\n📤 Ready for use!\n');
}

main().catch(console.error);
