#!/usr/bin/env node

/**
 * ATG Holdings - Investment Proposal PDF Converter
 * 
 * Converts ATG proposal markdown to professionally styled PDF
 * with tech gradient cover page and executive presentation
 * 
 * Usage: node tools/convert-atg-proposal-to-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// ATG Brand Colors
const ATG_COLORS = {
  primary: '#1a5f2a',      // Forest green (agriculture)
  secondary: '#2d8a3e',    // Bright green
  accent: '#c9a227',       // Gold accent
  dark: '#0d2818',         // Dark forest
  light: '#e8f5e9',        // Light green tint
  text: '#1a1a1a',
  white: '#ffffff'
};

// Document metadata
const DOC_METADATA = {
  title: 'Investment Proposal',
  subtitle: 'High-Value Agriculture & Agro-Processing Initiative',
  company: 'Alex Tsela Global (ATG) Holdings',
  recipient: 'Public Service Pensions Fund (PSPF)',
  version: '1.0',
  date: 'January 2026',
  classification: 'Confidential',
  department: 'Business Development',
  documentId: 'ATG-PSPF-2026-001'
};

// Get professional CSS styling
function getStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
    
    :root {
      --atg-primary: ${ATG_COLORS.primary};
      --atg-secondary: ${ATG_COLORS.secondary};
      --atg-accent: ${ATG_COLORS.accent};
      --atg-dark: ${ATG_COLORS.dark};
      --atg-light: ${ATG_COLORS.light};
      --atg-text: ${ATG_COLORS.text};
      --atg-white: ${ATG_COLORS.white};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 25mm 22mm 30mm 22mm;
    }
    
    @page :first {
      margin: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10pt;
      line-height: 1.65;
      color: var(--atg-text);
      background: white;
    }
    
    /* ========== COVER PAGE ========== */
    .cover-page {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: linear-gradient(145deg, 
        ${ATG_COLORS.dark} 0%, 
        ${ATG_COLORS.primary} 40%, 
        ${ATG_COLORS.secondary} 70%,
        ${ATG_COLORS.primary} 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      page-break-after: always;
      overflow: hidden;
    }
    
    /* Decorative elements */
    .cover-page::before {
      content: '';
      position: absolute;
      top: -150px;
      right: -150px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(201, 162, 39, 0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    .cover-page::after {
      content: '';
      position: absolute;
      bottom: -100px;
      left: -100px;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    /* Coffee plant decorative pattern */
    .cover-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M50 30c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 35c-8.3 0-15-6.7-15-15s6.7-15 15-15 15 6.7 15 15-6.7 15-15 15z' fill='%23ffffff'/%3E%3C/svg%3E");
      background-size: 80px 80px;
    }
    
    .cover-content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 0 50px;
      max-width: 90%;
    }
    
    /* Logo placeholder */
    .cover-logo {
      width: 120px;
      height: 120px;
      margin: 0 auto 40px;
      background: linear-gradient(135deg, var(--atg-accent) 0%, #d4af37 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    
    .cover-logo::before {
      content: 'ATG';
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: var(--atg-dark);
      letter-spacing: 2px;
    }
    
    .cover-title {
      font-family: 'Playfair Display', serif;
      font-size: 42pt;
      font-weight: 700;
      color: var(--atg-white);
      margin-bottom: 20px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      line-height: 1.2;
    }
    
    .cover-subtitle {
      font-size: 16pt;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 50px;
      letter-spacing: 1px;
    }
    
    /* Info box with glassmorphism */
    .cover-info-box {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 30px 45px;
      margin: 30px auto;
      max-width: 500px;
    }
    
    .cover-info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 11pt;
    }
    
    .cover-info-row:last-child {
      border-bottom: none;
    }
    
    .cover-info-label {
      color: rgba(255, 255, 255, 0.7);
      font-weight: 400;
    }
    
    .cover-info-value {
      color: var(--atg-white);
      font-weight: 600;
    }
    
    .cover-meta {
      margin-top: 50px;
    }
    
    .cover-meta strong {
      font-size: 14pt;
      font-weight: 600;
      color: var(--atg-white);
      display: block;
      margin-bottom: 8px;
    }
    
    .cover-tagline {
      font-size: 11pt;
      color: var(--atg-accent);
      font-style: italic;
      letter-spacing: 1px;
    }
    
    /* Classification badge */
    .cover-classification {
      position: absolute;
      top: 30px;
      right: 30px;
      background: rgba(201, 162, 39, 0.9);
      color: var(--atg-dark);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Footer stripe */
    .cover-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, 
        var(--atg-accent) 0%, 
        var(--atg-accent) 30%,
        var(--atg-white) 30%,
        var(--atg-white) 70%,
        var(--atg-secondary) 70%,
        var(--atg-secondary) 100%);
    }
    
    /* ========== CONTENT PAGES ========== */
    .content {
      padding: 0;
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
    
    /* Page header for content pages */
    .page-header {
      display: none;
    }
    
    /* Headings */
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 22pt;
      font-weight: 700;
      color: var(--atg-primary);
      margin: 0 0 18px 0;
      padding-top: 10px;
      padding-bottom: 12px;
      border-bottom: 3px solid var(--atg-accent);
      page-break-before: always;
      page-break-after: avoid;
    }
    
    h1:first-of-type {
      margin-top: 0;
      page-break-before: avoid;
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 16pt;
      font-weight: 600;
      color: var(--atg-primary);
      margin: 25px 0 14px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--atg-light);
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: 700;
      color: var(--atg-secondary);
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 10.5pt;
      font-weight: 600;
      color: var(--atg-text);
      margin: 16px 0 8px 0;
      page-break-after: avoid;
    }
    
    /* Paragraphs */
    p {
      margin-bottom: 10px;
      text-align: left;
    }
    
    /* Executive summary styling */
    .exec-summary {
      background: linear-gradient(135deg, var(--atg-light) 0%, #f1f8e9 100%);
      padding: 18px 22px;
      border-radius: 8px;
      border-left: 4px solid var(--atg-primary);
      font-size: 10pt;
      margin-bottom: 18px;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    
    thead {
      background: linear-gradient(135deg, var(--atg-primary) 0%, var(--atg-secondary) 100%);
    }
    
    th {
      color: white;
      font-weight: 600;
      padding: 10px 12px;
      text-align: left;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 9px 12px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
    }
    
    tr:nth-child(even) {
      background-color: #f8faf8;
    }
    
    tr:hover {
      background-color: var(--atg-light);
    }
    
    /* Highlight important rows */
    tr:has(td:contains("TOTAL")),
    tr:has(td:contains("Total")),
    tr:has(td strong) {
      background: linear-gradient(135deg, var(--atg-light) 0%, #e8f5e9 100%);
      font-weight: 600;
    }
    
    /* Lists */
    ul, ol {
      margin: 10px 0 10px 22px;
      padding: 0;
    }
    
    li {
      margin-bottom: 6px;
      padding-left: 4px;
    }
    
    li::marker {
      color: var(--atg-primary);
      font-weight: bold;
    }
    
    /* Blockquotes */
    blockquote {
      background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
      border-left: 4px solid var(--atg-accent);
      padding: 14px 20px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: #5d4e37;
    }
    
    blockquote p {
      margin: 0;
    }
    
    /* Strong and emphasis */
    strong {
      font-weight: 700;
      color: var(--atg-primary);
    }
    
    em {
      font-style: italic;
      color: #555;
    }
    
    /* Code/highlight */
    code {
      background: var(--atg-light);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Inter', monospace;
      font-size: 8.5pt;
      color: var(--atg-primary);
    }
    
    /* Horizontal rules */
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, var(--atg-primary) 0%, var(--atg-accent) 50%, var(--atg-secondary) 100%);
      margin: 25px 0;
      border-radius: 2px;
      page-break-after: always;
    }
    
    /* Page breaks for major sections */
    h1[id*="company"],
    h1[id*="market"],
    h1[id*="project"],
    h1[id*="strategic"],
    h1[id*="investment"],
    h1[id*="financial"],
    h1[id*="risk"],
    h1[id*="implementation"],
    h1[id*="social"],
    h1[id*="governance"],
    h1[id*="conclusion"],
    h1[id*="appendices"] {
      page-break-before: always;
    }
    
    /* Print optimizations */
    @media print {
      .cover-page {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      thead {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      tr:nth-child(even) {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    /* Ensure page breaks work properly */
    h1, h2, h3 {
      page-break-after: avoid;
      orphans: 3;
      widows: 3;
    }
    
    table, figure, blockquote {
      page-break-inside: avoid;
    }
    
    p {
      orphans: 3;
      widows: 3;
    }
    
    /* Section spacing */
    section {
      page-break-inside: avoid;
    }
    
    /* Ensure no overflow */
    * {
      max-width: 100%;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
  `;
}

// Generate cover page HTML
function generateCoverPage() {
  return `
    <div class="cover-page">
      <div class="cover-decoration"></div>
      <div class="cover-classification">${DOC_METADATA.classification}</div>
      
      <div class="cover-content">
        <div class="cover-logo"></div>
        
        <h1 class="cover-title">${DOC_METADATA.title}</h1>
        <p class="cover-subtitle">${DOC_METADATA.subtitle}</p>
        
        <div class="cover-info-box">
          <div class="cover-info-row">
            <span class="cover-info-label">Submitted To</span>
            <span class="cover-info-value">${DOC_METADATA.recipient}</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Submitted By</span>
            <span class="cover-info-value">${DOC_METADATA.company}</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Date</span>
            <span class="cover-info-value">${DOC_METADATA.date}</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Document ID</span>
            <span class="cover-info-value">${DOC_METADATA.documentId}</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Version</span>
            <span class="cover-info-value">${DOC_METADATA.version}</span>
          </div>
        </div>
        
        <div class="cover-meta">
          <strong>${DOC_METADATA.company}</strong>
          <span class="cover-tagline">Sustainable Agriculture • Economic Growth • Community Impact</span>
        </div>
      </div>
      
      <div class="cover-footer"></div>
    </div>
  `;
}

// Convert markdown to HTML
function convertMarkdownToHtml(markdown) {
  // Configure marked options
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
  });
  
  // Remove the first few lines (title, subtitle, metadata) as they go on cover page
  const lines = markdown.split('\n');
  let startIndex = 0;
  
  // Find where the actual content starts (after the first ---)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---' && i > 5) {
      startIndex = i + 1;
      break;
    }
  }
  
  const contentMarkdown = lines.slice(startIndex).join('\n');
  return marked.parse(contentMarkdown);
}

// Main conversion function
async function convertToPdf() {
  console.log('\n🌿 ATG Holdings - Investment Proposal PDF Generator');
  console.log('=' .repeat(55));
  
  const inputPath = path.join(__dirname, '../atg-proposals/ATG-PSPF-INVESTMENT-PROPOSAL.md');
  const outputPath = path.join(__dirname, '../atg-proposals/ATG-PSPF-INVESTMENT-PROPOSAL.pdf');
  
  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Input file not found:', inputPath);
    process.exit(1);
  }
  
  console.log('📄 Reading markdown file...');
  const markdown = fs.readFileSync(inputPath, 'utf8');
  
  console.log('🎨 Converting to styled HTML...');
  const contentHtml = convertMarkdownToHtml(markdown);
  
  // Build complete HTML document
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${DOC_METADATA.title} - ${DOC_METADATA.company}</title>
      <style>${getStyles()}</style>
    </head>
    <body>
      ${generateCoverPage()}
      <div class="content">
        ${contentHtml}
      </div>
    </body>
    </html>
  `;
  
  // Save HTML for debugging
  const htmlPath = outputPath.replace('.pdf', '.html');
  fs.writeFileSync(htmlPath, fullHtml);
  console.log('💾 HTML saved:', path.basename(htmlPath));
  
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  
  console.log('📑 Generating PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 8pt; padding: 0 50px; display: flex; justify-content: space-between; color: #666; font-family: Inter, sans-serif;">
        <span style="flex: 1;">${DOC_METADATA.company}</span>
        <span style="flex: 1; text-align: center;">${DOC_METADATA.documentId}</span>
        <span style="flex: 1; text-align: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '25mm',
      right: '22mm',
      bottom: '28mm',
      left: '22mm'
    },
    preferCSSPageSize: false
  });
  
  await browser.close();
  
  // Get file size
  const stats = fs.statSync(outputPath);
  const fileSizeKB = (stats.size / 1024).toFixed(1);
  
  console.log('\n✅ PDF generated successfully!');
  console.log('📁 Output:', outputPath);
  console.log('📊 Size:', fileSizeKB, 'KB');
  console.log('\n🎉 Investment proposal ready for PSPF submission!\n');
}

// Run the conversion
convertToPdf().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
