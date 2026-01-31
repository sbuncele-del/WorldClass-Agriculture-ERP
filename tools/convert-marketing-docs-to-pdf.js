#!/usr/bin/env node

/**
 * Convert Marketing Documents to PDF for WhatsApp sharing
 * Uses Puppeteer to generate clean, professional PDFs with cover pages
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Marketing Documents
const MARKETING_DOCUMENTS = [
  'marketing/PRICE-LIST.md',
  'marketing/PRICING-PRESENTATION.md',
  'marketing/ONE-PAGER.md',
  'marketing/EXECUTIVE-SUMMARY.md',
  'marketing/FAQ.md',
  'marketing/FEATURE-COMPARISON.md',
  'marketing/SALES-PITCH-DECK.md',
  'marketing/PRODUCT-OVERVIEW.md',
  'marketing/CASE-STUDIES.md',
  'marketing/IMPLEMENTATION-GUIDE.md',
  'marketing/AI-AUTOMATION-FEATURES.md'
];

// Document Descriptions for Introductory Text
const MARKETING_DESCRIPTIONS = {
  'PRICE-LIST': {
    purpose: 'Pricing Structure',
    background: 'Detailed pricing tiers for SiyaBusa ERP, offering competitive rates at 40% of market competitors.'
  },
  'PRICING-PRESENTATION': {
    purpose: 'Pricing Strategy',
    background: 'A presentation overview of our pricing model and value proposition.'
  },
  'ONE-PAGER': {
    purpose: 'Marketing One-Pager',
    background: 'A high-level summary of SiyaBusa ERP features and benefits for prospective clients.'
  },
  'EXECUTIVE-SUMMARY': {
    purpose: 'Executive Overview',
    background: 'A comprehensive summary of the SiyaBusa ERP solution for decision makers.'
  },
  'FAQ': {
    purpose: 'Frequently Asked Questions',
    background: 'Common questions and answers regarding SiyaBusa ERP features, implementation, and support.'
  },
  'FEATURE-COMPARISON': {
    purpose: 'Competitive Analysis',
    background: 'A comparison of SiyaBusa ERP features against major competitors in the market.'
  },
  'SALES-PITCH-DECK': {
    purpose: 'Sales Presentation',
    background: 'The core sales presentation deck highlighting the problem, solution, and market opportunity.'
  },
  'PRODUCT-OVERVIEW': {
    purpose: 'Product Capabilities',
    background: 'An in-depth look at the modules and capabilities of the SiyaBusa ERP system.'
  },
  'CASE-STUDIES': {
    purpose: 'Success Stories',
    background: 'Real-world examples of how SiyaBusa ERP has transformed businesses.'
  },
  'IMPLEMENTATION-GUIDE': {
    purpose: 'Deployment Roadmap',
    background: 'A guide to the implementation process, timeline, and requirements for new clients.'
  },
  'AI-AUTOMATION-FEATURES': {
    purpose: 'AI Capabilities',
    background: 'Overview of the advanced AI and automation features integrated into SiyaBusa ERP.'
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
            margin: 20mm 20mm 25mm 20mm; /* Top, Right, Bottom, Left */
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #1f2937; /* Gray 800 */
            max-width: 100%;
            margin: 0;
            padding: 0;
        }

        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            color: #111827; /* Gray 900 */
            font-weight: 700;
            line-height: 1.3;
            page-break-after: avoid;
            break-after: avoid;
            page-break-inside: avoid;
        }
        
        h1 {
            color: #2563eb; /* Blue 600 */
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-top: 40px; /* Increased spacing */
            font-size: 24px;
            page-break-before: always; /* Force new page for major sections */
        }
        
        /* Don't break before the first h1 */
        h1:first-of-type {
            page-break-before: avoid;
            margin-top: 0;
        }
        
        h2 {
            color: #1e40af; /* Blue 800 */
            margin-top: 30px;
            font-size: 20px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 5px;
            page-break-after: avoid;
        }
        
        h3 {
            color: #374151; /* Gray 700 */
            margin-top: 20px;
            font-size: 16px;
        }

        p {
            text-align: justify;
            margin-bottom: 12px;
            font-size: 11pt;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10pt;
            page-break-inside: avoid;
            break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th {
            background-color: #2563eb;
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

        /* Code Blocks */
        code {
            background-color: #f3f4f6;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #dc2626; /* Red 600 */
        }
        
        pre {
            background-color: #1f2937;
            color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 15px 0;
            white-space: pre-wrap;       /* css-3 */
            white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
            white-space: -pre-wrap;      /* Opera 4-6 */
            white-space: -o-pre-wrap;    /* Opera 7 */
            word-wrap: break-word;       /* Internet Explorer 5.5+ */
            max-width: 100%;
        }
        
        pre code {
            background: none;
            color: inherit;
            padding: 0;
            color: #e5e7eb;
        }

        /* Blockquotes */
        blockquote {
            border-left: 4px solid #2563eb;
            background-color: #eff6ff; /* Blue 50 */
            margin: 20px 0;
            padding: 15px 20px;
            color: #1e40af;
            font-style: italic;
            border-radius: 0 4px 4px 0;
            page-break-inside: avoid;
            break-inside: avoid;
        }

        /* Lists */
        ul, ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        
        li {
            margin: 6px 0;
            text-align: justify;
        }

        /* Links */
        a {
            color: #2563eb;
            text-decoration: none;
        }

        /* Images */
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            page-break-inside: avoid;
        }

        /* Utilities */
        .page-break {
            page-break-after: always;
        }
        
        .intro-box {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin-bottom: 30px;
            margin-top: 20px;
            border-radius: 0 4px 4px 0;
        }
        
        .intro-title {
            font-weight: 700;
            color: #1e40af;
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

        /* Cover Page Styling */
        .cover-page {
            /* A4 Height is ~297mm. We subtract margins (45mm total vertical) = ~252mm */
            /* But we use negative margins to bleed. */
            /* Safer to use a fixed height that fits comfortably */
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
            margin: -20mm -20mm 0 -20mm; /* Pull to edges, but don't push bottom too hard */
            padding: 20mm;
            page-break-after: always;
            color: white;
            position: relative;
            overflow: hidden;
        }

        /* Add a subtle map-like grid overlay */
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
            background: rgba(15, 23, 42, 0.6); /* Darker, more contrast */
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
            font-size: 56px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 30px;
            letter-spacing: -1px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }

        .cover-title {
            font-size: 42px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 20px;
            line-height: 1.2;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .cover-subtitle {
            font-size: 24px;
            color: #e0f2fe;
            margin-bottom: 50px;
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

        .cover-tagline {
            font-size: 12px;
            color: #93c5fd;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
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
    // Read markdown
    let markdown = fs.readFileSync(mdPath, 'utf8');
    
    // Remove emojis/icons
    markdown = markdown.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{2B50}\u{1F900}-\u{1F9FF}]/gu, '');
    
    // Convert to HTML
    let htmlContent = marked.parse(markdown);
    
    // Get title from filename
    const filename = path.basename(mdPath, '.md');
    const title = filename.replace(/-/g, ' ');
    
    // Get description for intro box
    const docInfo = MARKETING_DESCRIPTIONS[path.basename(mdPath, '.md')] || { purpose: 'Marketing Document', background: 'Marketing documentation for SiyaBusa ERP.' };
    
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
    
    // Create Cover Page HTML
    const coverPageHtml = `
    <div class="cover-page">
        <div class="cover-content">
            <div class="cover-logo">SiyaBusa ERP</div>
            <div class="cover-title">${title}</div>
            <div class="cover-subtitle">Marketing & Sales</div>
            
            <div class="cover-meta">
                <strong>Masaphokati Technologies (Pty) Ltd</strong>
            </div>
            
            <div class="cover-info">
                <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
                <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
                <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">Marketing</span></div>
                <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Public</span></div>
            </div>
            
            <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
        </div>
    </div>
    `;

    // Build full HTML
    const html = HTML_TEMPLATE
      .replace('{{COVER_PAGE}}', coverPageHtml)
      .replace('{{CONTENT}}', htmlContent);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>', // Empty header
      footerTemplate: `
        <div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
            <span>Masaphokati Technologies (Pty) Ltd</span>
            <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '25mm', // Increased for footer
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
  console.log('\n📄 SiyaBusa ERP - Marketing PDF Generator');
  console.log('============================================\n');
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'marketing-pdfs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let success = 0;
  let failed = 0;
  
  // Convert each document
  for (const docPath of MARKETING_DOCUMENTS) {
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
  
  console.log('\n============================================');
  console.log('✨ PDF Generation Complete!');
  console.log('============================================');
  console.log(`✅ ${success} documents generated`);
  if (failed > 0) {
    console.log(`⚠️  ${failed} documents failed/skipped`);
  }
  console.log(`📁 Location: ./marketing-pdfs/`);
  console.log('\n📤 Ready to share on WhatsApp!\n');
}

main().catch(console.error);
