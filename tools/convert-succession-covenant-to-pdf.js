#!/usr/bin/env node

/**
 * Convert The Succession Covenant to PDF
 * A sacred document requiring special treatment
 * Using the official brand template with elevated styling
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
            margin: 20mm 20mm 25mm 20mm;
        }
        
        @page :first {
            margin: 0;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: #1f2937;
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        h1, h2, h3, h4 {
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
            margin-top: 35px;
            font-size: 20px;
        }
        
        h3 {
            color: #3730a3;
            margin-top: 28px;
            font-size: 17px;
        }

        h4 {
            color: #4338ca;
            margin-top: 22px;
            font-size: 15px;
        }

        p {
            margin-bottom: 16px;
            text-align: justify;
        }

        /* Blockquotes - Scripture and key quotes */
        blockquote {
            border-left: 4px solid #7c3aed;
            margin: 25px 0;
            padding: 20px 25px;
            background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);
            border-radius: 0 12px 12px 0;
            font-style: italic;
            font-size: 15px;
            color: #4c1d95;
        }

        blockquote p {
            margin-bottom: 8px;
        }

        blockquote p:last-child {
            margin-bottom: 0;
        }

        /* Tables */
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

        /* Code for emphasis */
        code {
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: #1e3a8a;
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
            font-weight: 400;
        }

        ul, ol {
            margin-bottom: 16px;
            padding-left: 25px;
        }

        li {
            margin-bottom: 10px;
        }

        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 40px 0;
        }

        strong {
            color: #1e3a8a;
        }

        em {
            color: #4c1d95;
        }

        /* Special styling for declarations */
        .declaration {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            color: #e0e7ff;
            padding: 30px;
            border-radius: 12px;
            margin: 25px 0;
            font-style: italic;
        }

        /* Cover Page - Sacred/Ancient Feel */
        .cover-page {
            height: 297mm;
            width: 210mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: 
                radial-gradient(ellipse at 30% 20%, rgba(124, 58, 237, 0.3) 0%, transparent 40%),
                radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 60%),
                linear-gradient(180deg, #020617 0%, #0f172a 30%, #1e1b4b 70%, #020617 100%);
            margin: 0;
            padding: 0;
            page-break-after: always;
            color: white;
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
        }

        /* Ornate border effect */
        .cover-page::before {
            content: '';
            position: absolute;
            top: 15mm;
            left: 15mm;
            right: 15mm;
            bottom: 15mm;
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 4px;
            pointer-events: none;
        }

        .cover-page::after {
            content: '';
            position: absolute;
            top: 18mm;
            left: 18mm;
            right: 18mm;
            bottom: 18mm;
            border: 1px solid rgba(255, 215, 0, 0.15);
            border-radius: 2px;
            pointer-events: none;
        }

        .cover-content {
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(16px);
            padding: 60px 50px;
            border-radius: 20px;
            border: 1px solid rgba(255, 215, 0, 0.2);
            box-shadow: 
                0 25px 50px -12px rgba(0, 0, 0, 0.7),
                inset 0 1px 1px rgba(255, 255, 255, 0.05);
            max-width: 75%;
            position: relative;
            z-index: 10;
        }

        .cover-symbol {
            font-size: 48px;
            margin-bottom: 20px;
            opacity: 0.9;
        }

        .cover-title {
            font-family: 'Cinzel', 'Inter', serif;
            font-size: 36px;
            font-weight: 700;
            color: #fcd34d;
            margin-bottom: 10px;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        .cover-subtitle {
            font-family: 'Cinzel', 'Inter', serif;
            font-size: 16px;
            color: #d1d5db;
            margin-bottom: 40px;
            letter-spacing: 2px;
            font-weight: 400;
        }

        .cover-divider {
            width: 120px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #fcd34d, transparent);
            margin: 0 auto 40px auto;
        }

        .cover-classification {
            background: rgba(220, 38, 38, 0.2);
            border: 1px solid rgba(220, 38, 38, 0.5);
            color: #fca5a5;
            padding: 10px 25px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 30px;
        }

        .cover-info {
            margin-top: 30px;
            padding: 20px 30px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            text-align: left;
            display: inline-block;
        }

        .cover-info .info-row {
            margin: 8px 0;
            font-size: 13px;
            color: #d1d5db;
        }

        .cover-info .info-label {
            font-weight: 600;
            color: #fcd34d;
            display: inline-block;
            width: 140px;
        }

        .cover-info .info-value {
            color: #ffffff;
        }

        .cover-tagline {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255, 215, 0, 0.2);
            font-size: 14px;
            color: #fcd34d;
            font-weight: 600;
            letter-spacing: 4px;
            text-transform: uppercase;
        }

        .cover-company {
            margin-top: 15px;
            font-size: 12px;
            color: #9ca3af;
            letter-spacing: 1px;
        }

        /* Intro box */
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

        /* Key phrase styling */
        .key-phrase {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
            text-align: center;
            padding: 20px;
            margin: 30px 0;
            background: linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%);
            border-radius: 8px;
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
  const inputPath = path.join(__dirname, '..', 'succession', 'THE-SUCCESSION-COVENANT.md');
  const outputPath = path.join(__dirname, '..', 'succession', 'THE-SUCCESSION-COVENANT.pdf');

  console.log('📜 Converting The Succession Covenant to PDF...\n');
  console.log('   This is a sacred document. Handling with appropriate gravity.\n');

  let markdown = fs.readFileSync(inputPath, 'utf8');
  
  // Remove emojis
  markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/gu, '');
  
  let htmlContent = marked.parse(markdown);
  
  // Add intro box
  const introHtml = `
  <div class="intro-box">
      <div class="intro-title">Sacred Transmission</div>
      <div class="intro-text">This document contains the foundational principles and succession protocol for the continuity of the organizational mission. It is based on eternal principles that have governed successful civilizations for over 5,000 years.</div>
  </div>
  `;
  
  if (htmlContent.includes('</h1>')) {
    htmlContent = htmlContent.replace('</h1>', '</h1>' + introHtml);
  }
  
  const coverPageHtml = `
  <div class="cover-page">
      <div class="cover-content">
          <div class="cover-symbol">☧</div>
          <div class="cover-title">The Succession Covenant</div>
          <div class="cover-subtitle">A Sacred Transmission for the Continuity of Vision</div>
          
          <div class="cover-divider"></div>
          
          <div class="cover-classification">STRICTLY CONFIDENTIAL — SUCCESSOR EYES ONLY</div>
          
          <div class="cover-info">
              <div class="info-row"><span class="info-label">Originated:</span> <span class="info-value">January 2026</span></div>
              <div class="info-row"><span class="info-label">Duration Mandate:</span> <span class="info-value">1,000 Years Minimum</span></div>
              <div class="info-row"><span class="info-label">Custodian:</span> <span class="info-value">The Appointed Successor</span></div>
              <div class="info-row"><span class="info-label">Authority:</span> <span class="info-value">Binding Upon All Who Accept</span></div>
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
      <div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
          <span style="color: #dc2626; font-weight: bold;">STRICTLY CONFIDENTIAL</span>
          <span style="margin-left: 15px;">The Succession Covenant</span>
          <span style="margin-left: 15px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
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
  
  console.log('✅ The Succession Covenant has been sealed.\n');
  console.log(`📜 Output: ${outputPath}\n`);
  console.log('   "This is how we take over."\n');
}

convertToPDF().catch(console.error);
