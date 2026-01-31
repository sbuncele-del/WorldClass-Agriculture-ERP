#!/usr/bin/env node

/**
 * National Development Bank of South Sudan - Business Plan PDF Converter
 * 
 * Converts NDB proposal markdown to professionally styled PDF
 * with executive-grade presentation
 * 
 * Usage: node tools/convert-ndb-proposal-to-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// NDB Brand Colors (Professional Finance)
const NDB_COLORS = {
  primary: '#0a2463',      // Deep navy blue
  secondary: '#1e5f74',    // Teal blue
  accent: '#c9a227',       // Gold accent
  dark: '#051937',         // Dark navy
  light: '#e8f1f8',        // Light blue tint
  success: '#28a745',      // Green
  text: '#1a1a1a',
  white: '#ffffff'
};

// Document metadata
const DOC_METADATA = {
  title: 'National Development Bank',
  subtitle: 'Investment & Development Finance Business Plan',
  company: 'National Development Bank of South Sudan',
  recipient: 'Strategic Investment Partners',
  version: '1.0',
  date: 'January 2026',
  classification: 'Confidential',
  department: 'Strategic Planning',
  documentId: 'NDB-SS-2026-001'
};

// Get professional CSS styling
function getStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap');
    
    :root {
      --ndb-primary: ${NDB_COLORS.primary};
      --ndb-secondary: ${NDB_COLORS.secondary};
      --ndb-accent: ${NDB_COLORS.accent};
      --ndb-dark: ${NDB_COLORS.dark};
      --ndb-light: ${NDB_COLORS.light};
      --ndb-text: ${NDB_COLORS.text};
      --ndb-white: ${NDB_COLORS.white};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 20mm 20mm 25mm 20mm;
    }
    
    @page :first {
      margin: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10pt;
      line-height: 1.65;
      color: var(--ndb-text);
      background: white;
    }
    
    /* ========== COVER PAGE ========== */
    .cover-page {
      width: 210mm;
      height: 297mm;
      position: relative;
      background: linear-gradient(145deg, 
        ${NDB_COLORS.dark} 0%, 
        ${NDB_COLORS.primary} 40%, 
        ${NDB_COLORS.secondary} 70%,
        ${NDB_COLORS.primary} 100%);
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
    
    /* Abstract pattern */
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
      width: 140px;
      height: 140px;
      margin: 0 auto 40px;
      background: linear-gradient(135deg, var(--ndb-accent) 0%, #d4af37 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    
    .cover-logo::before {
      content: 'NDB';
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: var(--ndb-dark);
      letter-spacing: 2px;
    }
    
    .cover-title {
      font-family: 'Playfair Display', serif;
      font-size: 38pt;
      font-weight: 700;
      color: var(--ndb-white);
      margin-bottom: 5px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      line-height: 1.2;
      display: block !important;
      border: none !important;
      padding: 0 !important;
    }
    
    .cover-title-country {
      font-family: 'Playfair Display', serif;
      font-size: 30pt;
      font-weight: 600;
      color: var(--ndb-accent);
      margin-bottom: 25px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: block !important;
      border: none !important;
      padding: 0 !important;
    }
    
    .cover-subtitle {
      font-size: 14pt;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 40px;
      letter-spacing: 1px;
      text-align: center;
      display: block;
      width: 100%;
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
      color: var(--ndb-white);
      font-weight: 600;
    }
    
    .cover-highlight {
      background: rgba(201, 162, 39, 0.2);
      border: 1px solid rgba(201, 162, 39, 0.4);
      border-radius: 12px;
      padding: 20px 30px;
      margin: 30px auto;
      max-width: 450px;
    }
    
    .cover-highlight-text {
      color: var(--ndb-accent);
      font-size: 24pt;
      font-weight: 700;
    }
    
    .cover-highlight-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: 10pt;
      margin-top: 5px;
    }
    
    /* Seed capital box */
    .cover-seed-box {
      background: linear-gradient(135deg, rgba(201, 162, 39, 0.3) 0%, rgba(201, 162, 39, 0.15) 100%);
      border: 2px solid var(--ndb-accent);
      border-radius: 16px;
      padding: 25px 40px;
      margin: 35px auto;
      max-width: 420px;
    }
    
    .cover-seed-label {
      color: rgba(255, 255, 255, 0.9);
      font-size: 10pt;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    
    .cover-seed-amount {
      color: var(--ndb-accent);
      font-family: 'Playfair Display', serif;
      font-size: 32pt;
      font-weight: 700;
      line-height: 1.2;
    }
    
    .cover-seed-note {
      color: rgba(255, 255, 255, 0.8);
      font-size: 11pt;
      margin-top: 8px;
      font-style: italic;
    }
    
    /* Logo text style */
    .cover-logo-text {
      font-family: 'Playfair Display', serif;
      font-size: 28pt;
      font-weight: 700;
      color: var(--ndb-accent);
      background: linear-gradient(135deg, var(--ndb-accent) 0%, #d4af37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 30px;
      letter-spacing: 4px;
    }
    
    .cover-meta {
      margin-top: 40px;
    }
    
    .cover-meta strong {
      font-size: 12pt;
      font-weight: 600;
      color: var(--ndb-white);
      display: block;
      margin-bottom: 8px;
    }
    
    .cover-tagline {
      font-size: 11pt;
      color: rgba(255, 255, 255, 0.7);
      font-style: italic;
      letter-spacing: 1px;
    }
    
    /* Classification badge */
    .cover-classification {
      position: absolute;
      top: 30px;
      right: 30px;
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 9pt;
      font-weight: 600;
      color: var(--ndb-white);
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    /* Document ID */
    .cover-doc-id {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9pt;
      color: rgba(255, 255, 255, 0.5);
      letter-spacing: 1px;
    }
    
    /* ========== CONTENT STYLES ========== */
    .content {
      padding: 0;
    }
    
    /* Hide the main H1 title (shown on cover) */
    .content > h1:first-of-type {
      display: none;
    }
    
    /* Document subtitle - centered */
    .content > h2:first-of-type {
      font-family: 'Playfair Display', serif;
      font-size: 14pt;
      font-weight: 600;
      color: var(--ndb-primary);
      text-align: center;
      margin: 0 0 30px 0;
      padding-bottom: 15px;
      border-bottom: 2px solid var(--ndb-secondary);
    }
    
    h1 {
      font-family: 'Playfair Display', serif;
      font-size: 22pt;
      font-weight: 700;
      color: var(--ndb-primary);
      margin: 0 0 25px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid var(--ndb-accent);
      display: none; /* Hide main title in content */
    }
    
    h2 {
      font-family: 'Playfair Display', serif;
      font-size: 16pt;
      font-weight: 700;
      color: var(--ndb-primary);
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--ndb-secondary);
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 12pt;
      font-weight: 600;
      color: var(--ndb-secondary);
      margin: 25px 0 12px 0;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 11pt;
      font-weight: 600;
      color: var(--ndb-text);
      margin: 18px 0 10px 0;
    }
    
    p {
      margin: 0 0 12px 0;
      text-align: justify;
    }
    
    strong {
      font-weight: 600;
      color: var(--ndb-text);
    }
    
    /* Lists */
    ul, ol {
      margin: 0 0 15px 0;
      padding-left: 25px;
    }
    
    li {
      margin-bottom: 6px;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    
    thead {
      background: linear-gradient(135deg, var(--ndb-primary) 0%, var(--ndb-secondary) 100%);
    }
    
    th {
      padding: 12px 14px;
      text-align: left;
      font-weight: 600;
      color: white;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
    }
    
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    tr:hover {
      background-color: var(--ndb-light);
    }
    
    /* Blockquotes */
    blockquote {
      margin: 20px 0;
      padding: 18px 25px;
      background: linear-gradient(135deg, var(--ndb-light) 0%, #f0f7ff 100%);
      border-left: 4px solid var(--ndb-accent);
      border-radius: 0 8px 8px 0;
      font-style: italic;
      color: var(--ndb-primary);
    }
    
    /* Code blocks for diagrams */
    pre {
      background: #f4f6f8;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      line-height: 1.5;
      margin: 15px 0;
      border: 1px solid #e0e0e0;
    }
    
    code {
      font-family: 'Courier New', monospace;
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9pt;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    /* Horizontal rules */
    hr {
      border: none;
      height: 2px;
      background: linear-gradient(90deg, var(--ndb-primary) 0%, var(--ndb-secondary) 50%, transparent 100%);
      margin: 30px 0;
    }
    
    /* Page breaks */
    .page-break {
      page-break-before: always;
    }
    
    /* Highlight boxes */
    .highlight-box {
      background: linear-gradient(135deg, var(--ndb-light) 0%, #e3f2fd 100%);
      border: 1px solid var(--ndb-secondary);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    /* Print optimizations */
    @media print {
      .cover-page {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      thead {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      h2, h3, h4 {
        page-break-after: avoid;
      }
      
      table, figure, blockquote {
        page-break-inside: avoid;
      }
    }
  `;
}

// Generate professional cover page
function generateCoverPage() {
  return `
    <div class="cover-page">
      <div class="cover-decoration"></div>
      <div class="cover-classification">${DOC_METADATA.classification}</div>
      
      <div class="cover-content">
        <div class="cover-logo-text">NDB-SS</div>
        
        <h1 class="cover-title">National Development Bank</h1>
        <h2 class="cover-title-country">of South Sudan</h2>
        <p class="cover-subtitle">${DOC_METADATA.subtitle}</p>
        
        <div class="cover-seed-box">
          <div class="cover-seed-label">SEED CAPITAL REQUEST</div>
          <div class="cover-seed-amount">USD 10 Million</div>
          <div class="cover-seed-note">To mobilize USD 2 Billion in Year 1</div>
        </div>
        
        <div class="cover-info-box">
          <div class="cover-info-row">
            <span class="cover-info-label">Presented To</span>
            <span class="cover-info-value">${DOC_METADATA.recipient}</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Prepared By</span>
            <span class="cover-info-value">ATG Holdings</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Date</span>
            <span class="cover-info-value">${DOC_METADATA.date}</span>
          </div>
          <div class="cover-info-row">
            <span class="cover-info-label">Version</span>
            <span class="cover-info-value">${DOC_METADATA.version}</span>
          </div>
        </div>
        
        <div class="cover-meta">
          <span class="cover-tagline">Infrastructure • Development Finance • Economic Growth</span>
        </div>
      </div>
      
      <div class="cover-doc-id">${DOC_METADATA.documentId}</div>
    </div>
  `;
}

// Convert markdown to styled HTML
function convertMarkdownToHtml(markdown) {
  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true
  });
  
  // Convert markdown to HTML
  let html = marked.parse(markdown);
  
  // Handle page breaks
  html = html.replace(/<div style="page-break-before: always;"><\/div>/g, '<div class="page-break"></div>');
  
  return html;
}

// Main conversion function
async function convertToPdf() {
  console.log('\n🏦 NDB South Sudan - Business Plan PDF Generator');
  console.log('='.repeat(55));
  
  const inputPath = path.join(__dirname, '..', 'ndb-proposals', 'SOUTH-SUDAN-NDB-PROPOSAL.md');
  const outputPath = path.join(__dirname, '..', 'ndb-proposals', 'SOUTH-SUDAN-NDB-PROPOSAL.pdf');
  
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
      <div style="width: 100%; font-size: 7pt; padding: 0 22mm; display: flex; justify-content: space-between; align-items: center; color: #555; font-family: Arial, sans-serif;">
        <span>NDB-SS</span>
        <span>${DOC_METADATA.documentId}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '22mm',
      left: '20mm'
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
  console.log('\n🎉 NDB Business Plan ready for investor presentation!\n');
}

// Run the conversion
convertToPdf().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
