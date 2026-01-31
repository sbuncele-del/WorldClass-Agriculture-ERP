#!/usr/bin/env node

/**
 * Masaphokati Technologies - Status Update PDF Converter
 * Uses the same template as convert-documentation-to-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

marked.setOptions({ gfm: true, breaks: true, headerIds: true });

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

        @page { size: A4; margin: 20mm 20mm 25mm 20mm; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        h1, h2, h3, h4 { color: #111827; font-weight: 700; line-height: 1.3; page-break-after: avoid; }
        h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-top: 40px; font-size: 24px; }
        h1:first-of-type { margin-top: 0; }
        h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; font-size: 20px; }
        h3 { color: #3730a3; margin-top: 25px; font-size: 16px; }
        p { margin-bottom: 16px; }

        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; page-break-inside: avoid; }
        th { background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%); color: white; padding: 12px 10px; text-align: left; font-weight: 600; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background-color: #f8fafc; }

        code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 13px; }
        pre { background-color: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; page-break-inside: avoid; }
        pre code { background: none; padding: 0; color: inherit; }

        blockquote { border-left: 4px solid #7c3aed; margin: 20px 0; padding: 15px 20px; background-color: #faf5ff; border-radius: 0 8px 8px 0; font-style: italic; }
        ul, ol { margin-bottom: 16px; padding-left: 25px; }
        li { margin-bottom: 8px; }
        hr { border: none; border-top: 2px solid #e5e7eb; margin: 30px 0; }
        strong { color: #1e3a8a; }

        .intro-box { background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%); border-left: 4px solid #1e3a8a; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0; }
        .intro-title { font-weight: 700; color: #1e3a8a; margin-bottom: 8px; font-size: 14px; text-transform: uppercase; }
        .intro-text { color: #4b5563; font-size: 14px; }

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

        .cover-page::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
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

        .cover-logo { font-size: 48px; font-weight: 800; color: #ffffff; margin-bottom: 30px; }
        .cover-title { font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 15px; }
        .cover-subtitle { font-size: 18px; color: #bfdbfe; margin-bottom: 40px; }
        .cover-meta { margin-top: 30px; font-size: 16px; color: #ffffff; font-weight: 600; }
        .cover-meta strong { color: #ffffff; }
        .cover-info { margin-top: 25px; padding: 20px 30px; background: rgba(255,255,255,0.1); border-radius: 10px; text-align: left; display: inline-block; }
        .cover-info .info-row { margin: 8px 0; font-size: 14px; color: #e0f2fe; }
        .cover-info .info-label { font-weight: 600; color: #93c5fd; }
        .cover-info .info-value { color: #ffffff; }
        .cover-tagline { margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 12px; color: #93c5fd; font-weight: 400; letter-spacing: 2px; text-transform: uppercase; }
    </style>
</head>
<body>
    {{COVER_PAGE}}
    <div class="content">{{CONTENT}}</div>
</body>
</html>
`;

async function convertToPdf() {
  console.log('\n📋 Masaphokati Technologies - Status Update PDF Generator');
  console.log('='.repeat(60));
  
  const inputPath = path.join(__dirname, '..', 'company-docs', 'MASAPHOKATI-STATUS-UPDATE-JAN-2026.md');
  const outputPath = path.join(__dirname, '..', 'company-docs', 'MASAPHOKATI-STATUS-UPDATE-JAN-2026.pdf');
  
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input file not found:', inputPath);
    process.exit(1);
  }
  
  console.log('📄 Reading markdown...');
  let markdown = fs.readFileSync(inputPath, 'utf8');
  markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/gu, '');
  
  console.log('🎨 Converting to HTML...');
  let htmlContent = marked.parse(markdown);
  
  const introHtml = `
  <div class="intro-box">
      <div class="intro-title">Company Status Report</div>
      <div class="intro-text">Comprehensive overview of Masaphokati Technologies operations, products, active initiatives, and 2026 roadmap.</div>
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
          <div class="cover-title">Company Status Update</div>
          <div class="cover-subtitle">January 2026</div>
          
          <div class="cover-meta">
              <strong>Masaphokati Technologies (Pty) Ltd</strong>
          </div>
          
          <div class="cover-info">
              <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
              <div class="info-row"><span class="info-label">Report Period:</span> <span class="info-value">January 2026</span></div>
              <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">Executive</span></div>
              <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Internal</span></div>
          </div>
          
          <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
      </div>
  </div>
  `;

  const html = HTML_TEMPLATE
    .replace('{{COVER_PAGE}}', coverPageHtml)
    .replace('{{CONTENT}}', htmlContent);
  
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  console.log('📑 Generating PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
          <span>Masaphokati Technologies (Pty) Ltd - Internal</span>
          <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: { top: '20mm', right: '20mm', bottom: '25mm', left: '20mm' }
  });
  
  await browser.close();
  
  const stats = fs.statSync(outputPath);
  console.log('\n✅ PDF generated:', outputPath);
  console.log('📊 Size:', (stats.size / 1024).toFixed(1), 'KB\n');
}

convertToPdf().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
