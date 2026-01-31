#!/usr/bin/env node

/**
 * Convert Succession Covenant Implementation Guide to PDF
 * Practical manual for daily leadership practices
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true
});

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

        @page {
            size: A4;
            margin: 18mm 18mm 22mm 18mm;
        }
        
        @page :first {
            margin: 0;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.65;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
            font-size: 11pt;
        }

        h1, h2, h3, h4 {
            font-weight: 700;
            line-height: 1.3;
            page-break-after: avoid;
        }
        
        h1 {
            color: #1e3a8a;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 8px;
            margin-top: 35px;
            font-size: 22px;
        }
        
        h1:first-of-type {
            margin-top: 0;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            margin-top: 30px;
            font-size: 18px;
        }
        
        h3 {
            color: #3730a3;
            margin-top: 24px;
            font-size: 15px;
        }

        h4 {
            color: #4338ca;
            margin-top: 18px;
            font-size: 13px;
        }

        p {
            margin-bottom: 14px;
        }

        /* Blockquotes - Scripture and key quotes */
        blockquote {
            border-left: 4px solid #7c3aed;
            margin: 20px 0;
            padding: 15px 20px;
            background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
            border-radius: 0 10px 10px 0;
            font-style: italic;
            font-size: 13px;
            color: #4c1d95;
        }

        blockquote p {
            margin-bottom: 6px;
        }

        blockquote p:last-child {
            margin-bottom: 0;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 11px;
            page-break-inside: avoid;
        }

        th {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Code/emphasis */
        code {
            background-color: #f1f5f9;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 600;
            color: #1e3a8a;
        }

        pre {
            background-color: #1e293b;
            color: #e2e8f0;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 11px;
            line-height: 1.5;
            page-break-inside: avoid;
        }

        pre code {
            background: none;
            padding: 0;
            color: inherit;
            font-weight: 400;
        }

        ul, ol {
            margin-bottom: 14px;
            padding-left: 22px;
        }

        li {
            margin-bottom: 8px;
        }

        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 35px 0;
        }

        strong {
            color: #1e3a8a;
        }

        em {
            color: #4c1d95;
        }

        /* Checkbox lists */
        li:has(input[type="checkbox"]) {
            list-style: none;
            margin-left: -20px;
        }

        /* Cover Page */
        .cover-page {
            height: 297mm;
            width: 210mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: 
                radial-gradient(ellipse at 30% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 40%),
                radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.25) 0%, transparent 40%),
                linear-gradient(180deg, #020617 0%, #0f172a 40%, #1e3a8a 100%);
            margin: 0;
            padding: 0;
            page-break-after: always;
            color: white;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
        }

        .cover-page::before {
            content: '';
            position: absolute;
            top: 15mm;
            left: 15mm;
            right: 15mm;
            bottom: 15mm;
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 4px;
            pointer-events: none;
        }

        .cover-content {
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(16px);
            padding: 50px 45px;
            border-radius: 20px;
            border: 1px solid rgba(16, 185, 129, 0.25);
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.7);
            max-width: 75%;
            position: relative;
            z-index: 10;
        }

        .cover-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 6px 20px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 25px;
            display: inline-block;
        }

        .cover-title {
            font-family: 'Cinzel', 'Inter', serif;
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: 2px;
        }

        .cover-subtitle {
            font-family: 'Cinzel', 'Inter', serif;
            font-size: 18px;
            color: #10b981;
            margin-bottom: 30px;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .cover-description {
            font-size: 13px;
            color: #d1d5db;
            margin-bottom: 30px;
            line-height: 1.6;
            max-width: 90%;
            margin-left: auto;
            margin-right: auto;
        }

        .cover-divider {
            width: 100px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #10b981, transparent);
            margin: 0 auto 30px auto;
        }

        .cover-info {
            margin-top: 20px;
            padding: 15px 25px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            text-align: left;
            display: inline-block;
        }

        .cover-info .info-row {
            margin: 6px 0;
            font-size: 12px;
            color: #d1d5db;
        }

        .cover-info .info-label {
            font-weight: 600;
            color: #10b981;
            display: inline-block;
            width: 120px;
        }

        .cover-tagline {
            margin-top: 35px;
            padding-top: 20px;
            border-top: 1px solid rgba(16, 185, 129, 0.2);
            font-size: 13px;
            color: #10b981;
            font-weight: 600;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .cover-company {
            margin-top: 12px;
            font-size: 11px;
            color: #9ca3af;
            letter-spacing: 1px;
        }

        /* Intro box */
        .intro-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
            border-left: 4px solid #10b981;
            padding: 18px;
            margin-bottom: 25px;
            border-radius: 0 8px 8px 0;
        }

        .intro-title {
            font-weight: 700;
            color: #047857;
            margin-bottom: 6px;
            font-size: 13px;
            text-transform: uppercase;
        }

        .intro-text {
            color: #065f46;
            font-size: 13px;
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

async function convertToPDF() {
  const inputPath = path.join(__dirname, '..', 'succession', 'SUCCESSION-COVENANT-IMPLEMENTATION-GUIDE.md');
  const outputPath = path.join(__dirname, '..', 'succession', 'SUCCESSION-COVENANT-IMPLEMENTATION-GUIDE.pdf');

  console.log('📘 Converting Implementation Guide to PDF...\n');
  console.log('   This is the practical manual for daily leadership.\n');

  let markdown = fs.readFileSync(inputPath, 'utf8');
  
  // Remove emojis
  markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/gu, '');
  
  // Convert checkbox syntax to HTML
  markdown = markdown.replace(/- \[ \]/g, '- ☐');
  markdown = markdown.replace(/- \[x\]/g, '- ☑');
  
  let htmlContent = marked.parse(markdown);
  
  // Add intro box
  const introHtml = `
  <div class="intro-box">
      <div class="intro-title">Practical Operations Manual</div>
      <div class="intro-text">This guide transforms the foundational Succession Covenant from philosophy into practice. It contains daily, weekly, monthly, quarterly, and annual practices — step-by-step instructions with no ambiguity.</div>
  </div>
  `;
  
  if (htmlContent.includes('</h1>')) {
    htmlContent = htmlContent.replace('</h1>', '</h1>' + introHtml);
  }
  
  const coverPageHtml = `
  <div class="cover-page">
      <div class="cover-content">
          <div class="cover-badge">Practical Manual</div>
          <div class="cover-title">Implementation Guide</div>
          <div class="cover-subtitle">The Succession Covenant</div>
          
          <div class="cover-divider"></div>
          
          <div class="cover-description">
              Daily practices, weekly rhythms, monthly evaluations, quarterly retreats,<br>
              annual pilgrimages, and special protocols for succession and governance.
          </div>
          
          <div class="cover-info">
              <div class="info-row"><span class="info-label">Document Type:</span> <span class="info-value">Daily Operations Manual</span></div>
              <div class="info-row"><span class="info-label">Companion To:</span> <span class="info-value">The Succession Covenant</span></div>
              <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
              <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Leadership Eyes Only</span></div>
          </div>
          
          <div class="cover-tagline">This Is How We Take Over</div>
          <div class="cover-company">Masaphokati Technologies (Pty) Ltd</div>
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
      <div style="font-size: 8px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 8px; font-family: sans-serif;">
          <span style="color: #10b981; font-weight: bold;">IMPLEMENTATION GUIDE</span>
          <span style="margin-left: 12px;">The Succession Covenant</span>
          <span style="margin-left: 12px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '18mm',
      right: '18mm',
      bottom: '22mm',
      left: '18mm'
    }
  });
  
  await browser.close();
  
  console.log('✅ Implementation Guide has been created.\n');
  console.log(`📘 Output: ${outputPath}\n`);
  console.log('   "The principles only work if you work them."\n');
}

convertToPDF().catch(console.error);
