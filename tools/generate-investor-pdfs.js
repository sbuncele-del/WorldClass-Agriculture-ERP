#!/usr/bin/env node

/**
 * WorldClass ERP - Professional PDF Documentation Generator
 * Converts markdown documentation to investor-ready PDFs using Puppeteer
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Key documents organized by category - Updated Jan 28, 2026
const DOCUMENT_CATEGORIES = {
  // NEW: January 2026 Investor Documents (Priority)
  'Investment-Brief-Jan2026': [
    'investor-docs/INVESTMENT-BRIEF-JAN-2026.md'
  ],
  'Market-Strategy-Pricing-2026': [
    'investor-docs/MARKET-STRATEGY-AND-PRICING-2026.md'
  ],
  'Use-of-Funds-4Month': [
    'investor-docs/USE-OF-FUNDS-4-MONTH-RUNWAY.md'
  ],
  // Existing documents
  'Executive-Summary': [
    'STATUS-UPDATE-DEC30-2025.md',
    'PRODUCTION-READINESS-ASSESSMENT.md',
    'BACKEND_API_COMPLETE.md'
  ],
  'Launch-Plan': [
    'docs/ACTION-PLAN-AND-CHECKLIST.md'
  ],
  'Technical-Implementation': [
    'AWS-DEPLOYMENT-STATUS.md',
    'FRONTEND-BACKEND-INTEGRATION.md',
    'DATABASE-MIGRATION-SUCCESS.md'
  ],
  'Business-Modules': [
    'CASH-MANAGEMENT-COMPLETE.md',
    'COMPLIANCE-MODULE-COMPLETE.md',
    'ASSET-MANAGEMENT-COMPLETE-WORKING.md'
  ],
  'AI-Capabilities': [
    'AI-ASSISTANT-ENHANCEMENT.md',
    'AI-AGENTS-QUICK-START.md'
  ]
};

// Professional HTML template with styling
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }
        
        /* ===== 6.2 COVER PAGE BACKGROUND CSS (EXACT SPECIFICATION) ===== */
        .cover-page {
            height: 250mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
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
        
        /* ===== 6.3 GRID OVERLAY CSS (EXACT SPECIFICATION) ===== */
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
        
        /* ===== 6.4 FROSTED GLASS CONTENT BOX CSS (EXACT SPECIFICATION) ===== */
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
        
        /* ===== 6.5 COVER TYPOGRAPHY (EXACT SPECIFICATION) ===== */
        /* Logo: 48px, weight 800, #ffffff */
        .cover-logo {
            font-size: 48px;
            font-weight: 800;
            color: #ffffff;
        }
        
        /* Title: 32px, weight 700, #ffffff */
        .cover-title {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
        }
        
        /* Subtitle: 18px, weight 400, #bfdbfe, margin-bottom: 40px */
        .cover-subtitle {
            font-size: 18px;
            font-weight: 400;
            color: #bfdbfe;
            margin-bottom: 40px;
        }
        
        /* Company Name: 16px, weight 600, #ffffff */
        .cover-company {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
        }
        
        /* ===== 6.6 COVER METADATA BOX CSS (EXACT SPECIFICATION) ===== */
        .cover-info {
            margin-top: 25px;
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            text-align: left;
            display: inline-block;
        }
        
        .cover-info .info-row {
            margin: 8px 0;
            font-size: 14px;
            color: #e0f2fe;
        }
        
        /* Info Label: 14px, weight 600, #93c5fd */
        .cover-info .info-label {
            font-weight: 600;
            color: #93c5fd;
        }
        
        /* Info Value: 14px, weight 400, #ffffff */
        .cover-info .info-value {
            color: #ffffff;
        }
        
        /* ===== 6.7 TAGLINE CSS (EXACT SPECIFICATION) ===== */
        /* Tagline: 12px, weight 400, #93c5fd, letter-spacing: 2px, UPPERCASE */
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
        
        /* ===== TABLE OF CONTENTS ===== */
        .toc-page {
            page-break-after: always;
            padding: 40px 0;
        }
        
        .toc-title {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 30px;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 15px;
        }
        
        .toc-list {
            list-style: none;
            padding: 0;
        }
        
        .toc-item {
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
        }
        
        .toc-number {
            color: #0ea5e9;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .content-section {
            page-break-before: always;
            padding: 20px 0;
        }
        
        /* ===== 7.1 INTRO BOX (EXACT SPECIFICATION) ===== */
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
        
        /* ===== 4.3 HEADING SPECIFICATIONS (EXACT) ===== */
        h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-top: 40px;
            font-size: 24px;
            font-weight: 700;
            page-break-after: avoid;
            page-break-inside: avoid;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 30px;
            font-size: 20px;
            font-weight: 700;
            page-break-after: avoid;
            page-break-inside: avoid;
        }
        
        h3 {
            color: #3730a3;
            margin-top: 25px;
            font-size: 16px;
            font-weight: 700;
            page-break-after: avoid;
            page-break-inside: avoid;
        }
        
        h4 {
            color: #475569;
            font-size: 15px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            page-break-after: avoid;
            page-break-inside: avoid;
        }
        
        p {
            margin: 12px 0;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }
        
        ul, ol {
            margin: 15px 0;
            padding-left: 30px;
            page-break-inside: avoid;
        }
        
        li {
            margin: 8px 0;
            page-break-inside: avoid;
        }
        
        /* ===== 7.3 CODE BLOCK STYLING (EXACT SPECIFICATION) ===== */
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
        
        /* ===== 7.4 BLOCKQUOTE STYLING (EXACT SPECIFICATION) ===== */
        blockquote {
            border-left: 4px solid #7c3aed;
            margin: 20px 0;
            padding: 15px 20px;
            background-color: #faf5ff;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }
        
        /* ===== 7.2 TABLE STYLING (EXACT SPECIFICATION) ===== */
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
        
        /* ===== 7.5 HORIZONTAL RULE (EXACT SPECIFICATION) ===== */
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 30px 0;
        }
        
        /* ===== 7.6 STRONG/BOLD TEXT (EXACT SPECIFICATION) ===== */
        strong {
            color: #1e3a8a;
        }
        
        .header-footer {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-top: 1px solid #e2e8f0;
            margin-top: 30px;
            font-size: 10px;
            color: #64748b;
        }
        
        .page-header {
            position: running(header);
            text-align: center;
            font-size: 10px;
            color: #64748b;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .page-footer {
            position: running(footer);
            text-align: center;
            font-size: 10px;
            color: #64748b;
            padding: 10px 0;
            border-top: 1px solid #e2e8f0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin: 5px 5px 5px 0;
        }
        
        .status-complete {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-progress {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-planned {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .highlight-box {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .warning-box {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .success-box {
            background: #dcfce7;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        a {
            color: #0ea5e9;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    {{CONTENT}}
</body>
</html>
`;

class InvestorPDFGenerator {
  constructor(outputDir = './investor-docs') {
    this.outputDir = outputDir;
    this.rootDir = '/workspaces/WorldClass-ERP';
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  generateCoverPage(category) {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Exact specification from PDF-DOCUMENT-DESIGN-STANDARD.md
    return `
      <div class="cover-page">
        <div class="cover-content">
          <div class="cover-logo">SiyaBusa ERP</div>
          <div class="cover-title">${category.replace(/-/g, ' ')}</div>
          <div class="cover-subtitle">Investor Documentation</div>
          <div class="cover-company">Masaphokati Technologies (Pty) Ltd</div>
          
          <div class="cover-info">
            <div class="info-row">
              <span class="info-label">Document Version:</span>
              <span class="info-value"> 1.0</span>
            </div>
            <div class="info-row">
              <span class="info-label">Effective Date:</span>
              <span class="info-value"> ${date}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Department:</span>
              <span class="info-value"> Executive</span>
            </div>
            <div class="info-row">
              <span class="info-label">Classification:</span>
              <span class="info-value"> Confidential</span>
            </div>
          </div>
          
          <div class="cover-tagline">WE RULE. WE GOVERN. WE EMPOWER.</div>
        </div>
      </div>
    `;
  }

  generateTableOfContents(files) {
    const items = files.map((file, i) => {
      const title = file.replace('.md', '').replace(/-/g, ' ');
      return `<li class="toc-item"><span class="toc-number">${i + 1}.</span> ${title}</li>`;
    }).join('');

    return `
      <div class="toc-page">
        <h1 class="toc-title">Table of Contents</h1>
        <ul class="toc-list">
          ${items}
        </ul>
      </div>
    `;
  }

  processMarkdown(content) {
    // Pre-process content to fix [object Object] issues
    content = content.replace(/\[object Object\]/g, '');
    
    // Simple marked parse for v17+ API
    try {
      // Create custom renderer for v17+
      const renderer = {
        listitem(token) {
          let text = token.text || '';
          // Handle checkboxes
          if (/^\[x\]\s/.test(text)) {
            return '<li style="list-style: none; margin-left: -20px;">✅ ' + text.replace(/^\[x\]\s/, '') + '</li>\n';
          } else if (/^\[ \]\s/.test(text)) {
            return '<li style="list-style: none; margin-left: -20px;">⬜ ' + text.replace(/^\[ \]\s/, '') + '</li>\n';
          }
          return '<li>' + text + '</li>\n';
        }
      };

      marked.use({ renderer });
      return marked.parse(content);
    } catch (err) {
      // Fallback to basic parsing
      console.log('   ⚠️  Using basic markdown parsing');
      return marked.parse(content);
    }
  }

  async generatePDF(category, files) {
    console.log(`\n📄 Generating: ${category}`);
    
    let htmlContent = this.generateCoverPage(category);
    htmlContent += this.generateTableOfContents(files);

    // Process each file
    for (const file of files) {
      const filePath = path.join(this.rootDir, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`   ✓ Processing ${file}`);
        const markdown = fs.readFileSync(filePath, 'utf-8');
        const html = this.processMarkdown(markdown);
        const title = file.replace('.md', '').replace(/-/g, ' ');
        
        htmlContent += `
          <div class="content-section">
            <h1>${title}</h1>
            ${html}
          </div>
        `;
      } else {
        console.log(`   ⚠️  File not found: ${file}`);
      }
    }

    // Generate final HTML
    const finalHTML = HTML_TEMPLATE
      .replace(/{{TITLE}}/g, `SiyaBusa ERP - ${category.replace(/-/g, ' ')}`)
      .replace(/{{CATEGORY}}/g, category.replace(/-/g, ' '))
      .replace('{{CONTENT}}', htmlContent);

    // Save HTML for debugging
    const htmlPath = path.join(this.outputDir, `${category}.html`);
    fs.writeFileSync(htmlPath, finalHTML);

    // Generate PDF
    const pdfPath = path.join(this.outputDir, `${category}.pdf`);
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
        <span>Masaphokati Technologies (Pty) Ltd - Confidential</span>
        <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm'
      }
    });

    await browser.close();
    
    console.log(`   ✅ Generated: ${pdfPath}`);
    return pdfPath;
  }

  async generateAll() {
    console.log('\n🚀 WorldClass ERP - Investor PDF Generator');
    console.log('===========================================\n');
    console.log(`📁 Output Directory: ${this.outputDir}\n`);

    const results = [];

    for (const [category, files] of Object.entries(DOCUMENT_CATEGORIES)) {
      try {
        const pdfPath = await this.generatePDF(category, files);
        results.push({ category, path: pdfPath, success: true });
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({ category, error: error.message, success: false });
      }
    }

    // Generate master index
    await this.generateIndexPDF(results);

    return results;
  }

  async generateIndexPDF(results) {
    console.log('\n📑 Generating master index...');

    const successList = results
      .filter(r => r.success)
      .map((r, i) => `
        <li class="toc-item">
          <span class="toc-number">${i + 1}.</span>
          <strong>${r.category.replace(/-/g, ' ')}</strong>
          <br><span style="color: #64748b; font-size: 12px; margin-left: 30px;">
            📄 ${path.basename(r.path)}
          </span>
        </li>
      `).join('');

    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <div class="cover-page">
        <div class="cover-logo">SiyaBusa ERP</div>
        <div class="cover-subtitle">Complete Documentation Package</div>
        <div class="cover-badges">
          <span class="badge">${results.filter(r => r.success).length} Documents</span>
          <span class="badge">Investor Ready</span>
          <span class="badge">Professional Format</span>
        </div>
        <div class="cover-date">Generated: ${date}</div>
      </div>
      
      <div class="toc-page">
        <h1 class="toc-title">Documentation Index</h1>
        <ul class="toc-list">
          ${successList}
        </ul>
        
        <div class="highlight-box" style="margin-top: 40px;">
          <h3 style="margin-top: 0;">📤 How to Use These Documents</h3>
          <ul>
            <li>Each PDF contains related documentation organized by topic</li>
            <li>Documents are professionally formatted for stakeholder presentations</li>
            <li>Share directly via WhatsApp, email, or cloud storage</li>
            <li>All content is investor and board-ready</li>
            <li>PDFs are optimized for both digital viewing and printing</li>
          </ul>
        </div>
        
        <div class="success-box" style="margin-top: 30px;">
          <h3 style="margin-top: 0;">✨ About SiyaBusa ERP</h3>
          <p>
            SiyaBusa ERP is a comprehensive, production-ready Enterprise Resource Planning system
            built with modern technologies. The system features 25+ integrated modules, 400+ REST APIs,
            multi-tenant architecture, and AI-powered assistance.
          </p>
          <p style="margin-bottom: 0;">
            <strong>Technology Stack:</strong> Node.js, TypeScript, React, PostgreSQL, Redis, AWS Cloud
          </p>
        </div>
      </div>
    `;

    const finalHTML = HTML_TEMPLATE
      .replace(/{{TITLE}}/g, 'SiyaBusa ERP - Documentation Index')
      .replace(/{{CATEGORY}}/g, 'Master Index')
      .replace('{{CONTENT}}', htmlContent);

    const pdfPath = path.join(this.outputDir, '00-INDEX.pdf');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(finalHTML, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
        <span>Masaphokati Technologies (Pty) Ltd - Confidential</span>
        <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm'
      }
    });

    await browser.close();
    
    console.log(`   ✅ Generated: ${pdfPath}`);
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new InvestorPDFGenerator();
  
  generator.generateAll()
    .then((results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log('\n');
      console.log('===========================================');
      console.log('✨ PDF Generation Complete!');
      console.log('===========================================');
      console.log(`✅ ${successful} documents generated successfully`);
      if (failed > 0) {
        console.log(`⚠️  ${failed} documents failed`);
      }
      console.log(`📁 Location: ${generator.outputDir}`);
      console.log('\n📤 Ready to share on WhatsApp, email, or any platform!');
      console.log('');
    })
    .catch((error) => {
      console.error('\n❌ Generation failed:', error);
      process.exit(1);
    });
}

module.exports = InvestorPDFGenerator;
