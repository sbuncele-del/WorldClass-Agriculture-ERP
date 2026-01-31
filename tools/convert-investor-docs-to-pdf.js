#!/usr/bin/env node

/**
 * Convert Investor Documents to PDF for WhatsApp sharing
 * Uses Puppeteer to generate clean, professional PDFs with cover pages
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Documents from PITCH-MATERIALS-INDEX.md (Jan 2, 2026) - Updated with Legal Templates
const INVESTOR_DOCUMENTS = [
  'docs/SIYABUSA-ERP-BUSINESS-PLAN-2026.md',
  'docs/INVESTOR-PITCH-DECK.md',
  'docs/INVESTOR-ONE-PAGER.md',
  'docs/INVESTOR-FAQ.md',
  'docs/FINANCIAL-MODEL-3-YEAR.md',
  'docs/PRICING-STRATEGY.md',
  'docs/TERM-SHEET-TEMPLATE.md',
  'docs/SHAREHOLDERS-AGREEMENT-TEMPLATE.md',
  'docs/SUBSCRIPTION-AGREEMENT-TEMPLATE.md',
  'docs/COMPANY-PROFILE.md',
  'docs/MONTHLY-OPERATING-BUDGET.md',
  'docs/SAFE-EXPLAINED-SIMPLE.md',
  'docs/SAFE-AGREEMENT-TEMPLATE.md',
  'docs/BETA-PARTNER-EXPRESSION-OF-INTEREST.md',
  'docs/BETA-PARTNER-REQUEST-LETTER.md',
  'docs/LINKEDIN-OUTREACH-TEMPLATES.md',
  'docs/MESSAGE-TO-FRIEND-TEMPLATE.md',
  'docs/ACTION-PLAN-AND-CHECKLIST.md',
  'docs/SIYABUSA-ERP-CONCEPT-DOCUMENT.md'
];

// Document Descriptions for Introductory Text
const DOCUMENT_DESCRIPTIONS = {
  'SIYABUSA-ERP-BUSINESS-PLAN-2026': {
    purpose: 'Complete Business Plan',
    background: 'A comprehensive, bankable business plan covering company overview, market analysis, financial projections, go-to-market strategy, and the path to JSE AltX listing.'
  },
  'INVESTOR-PITCH-DECK': {
    purpose: 'Investment Opportunity Overview',
    background: 'This document outlines the investment opportunity for SiyaBusa ERP, detailing the market gap, our solution, financial projections, and the path to JSE AltX listing.'
  },
  'INVESTOR-ONE-PAGER': {
    purpose: 'Executive Summary',
    background: 'A concise executive summary of the SiyaBusa ERP business case, designed for quick review by potential investors and partners.'
  },
  'INVESTOR-FAQ': {
    purpose: 'Anticipated Questions & Answers',
    background: 'A comprehensive collection of anticipated questions regarding the business model, technology stack, financial projections, and exit strategy.'
  },
  'FINANCIAL-MODEL-3-YEAR': {
    purpose: 'Detailed Financial Projections',
    background: 'A comprehensive 3-year financial model with monthly revenue build-up, unit economics, cash flow projections, and capitalization table evolution from seed to Series A.'
  },
  'TERM-SHEET-TEMPLATE': {
    purpose: 'Seed Investment Term Sheet',
    background: 'Non-binding term sheet for the R2M seed round at R10M pre-money valuation, outlining investment terms, investor rights, and governance structure.'
  },
  'SHAREHOLDERS-AGREEMENT-TEMPLATE': {
    purpose: 'Shareholders Agreement',
    background: 'Comprehensive shareholders agreement template governing the relationship between founders and investors, including transfer restrictions, reserved matters, and exit provisions.'
  },
  'SUBSCRIPTION-AGREEMENT-TEMPLATE': {
    purpose: 'Share Subscription Agreement',
    background: 'Legal agreement template for investors subscribing for ordinary shares, including payment terms, representations, warranties, and FICA compliance requirements.'
  },
  'COMPANY-PROFILE': {
    purpose: 'Corporate Profile',
    background: 'Comprehensive company profile for Masaphokati Technologies (Pty) Ltd, including business overview, share capital structure, market opportunity, and leadership.'
  },
  'MONTHLY-OPERATING-BUDGET': {
    purpose: 'Operational Cost Breakdown',
    background: 'A detailed breakdown of the operational costs required to run SiyaBusa ERP, including infrastructure, marketing, and team expenses.'
  },
  'SAFE-EXPLAINED-SIMPLE': {
    purpose: 'Investment Instrument Guide',
    background: 'A plain-English explanation of the Simple Agreement for Future Equity (SAFE) investment instrument used for this funding round.'
  },
  'SAFE-AGREEMENT-TEMPLATE': {
    purpose: 'Legal Agreement Template',
    background: 'The legal agreement template for the SAFE investment, outlining the terms and conditions for early-stage investors.'
  },
  'BETA-PARTNER-EXPRESSION-OF-INTEREST': {
    purpose: 'Beta Program Application',
    background: 'A formal document for potential beta partners to express their interest in piloting the SiyaBusa ERP system.'
  },
  'BETA-PARTNER-REQUEST-LETTER': {
    purpose: 'Beta Invitation Letter',
    background: 'A formal invitation letter addressed to potential beta partners, outlining the benefits and expectations of the pilot program.'
  },
  'LINKEDIN-OUTREACH-TEMPLATES': {
    purpose: 'Outreach Communication Strategy',
    background: 'A set of professional communication templates designed for LinkedIn outreach to potential investors and partners.'
  },
  'MESSAGE-TO-FRIEND-TEMPLATE': {
    purpose: 'Network Outreach Template',
    background: 'A template for personal network outreach to assist in recruiting support or making introductions.'
  },
  'ACTION-PLAN-AND-CHECKLIST': {
    purpose: 'Execution Roadmap',
    background: 'A step-by-step execution plan and checklist for the fundraising and launch phases of SiyaBusa ERP.'
  },
  'SIYABUSA-ERP-CONCEPT-DOCUMENT': {
    purpose: 'Product Vision & Architecture',
    background: 'The foundational document describing the SiyaBusa ERP vision, architecture, and feature set in detail.'
  },
  'PRICING-STRATEGY': {
    purpose: 'Pricing Model & Market Positioning',
    background: 'Comprehensive pricing strategy document outlining our "Everything Included" approach, competitive positioning in the ignored middle market, and detailed plan breakdowns.'
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
            margin-top: 40px;
            font-size: 24px;
        }
        
        /* Don't break before h1 elements - cover page handles the first break */
        h1:first-of-type {
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

        /* Cover Page Styling - Tech gradient */
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

        .cover-date {
            font-size: 14px;
            color: #93c5fd;
            margin-top: 30px;
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
    // Remove redundant "SIYABUSA ERP" prefix since logo already shows brand
    let title = filename.replace(/-/g, ' ').replace(/^SIYABUSA ERP\s*/i, '').trim();
    
    // Get document description for intro box
    const docDescription = DOCUMENT_DESCRIPTIONS[filename];
    
    // Create intro box HTML if description exists
    let introBoxHtml = '';
    if (docDescription) {
      introBoxHtml = `
      <div class="intro-box">
          <div class="intro-title">📋 ${docDescription.purpose}</div>
          <div class="intro-text">${docDescription.background}</div>
      </div>
      `;
    }
    
    // Create Cover Page HTML
    const coverPageHtml = `
    <div class="cover-page">
        <div class="cover-content">
            <div class="cover-logo">SiyaBusa ERP</div>
            <div class="cover-title">${title}</div>
            <div class="cover-subtitle">Investor & Partner Documentation</div>
            
            <div class="cover-meta">
                <strong>Masaphokati Technologies (Pty) Ltd</strong>
            </div>
            
            <div class="cover-info">
                <div class="info-row"><span class="info-label">Document Version:</span> <span class="info-value">1.0</span></div>
                <div class="info-row"><span class="info-label">Effective Date:</span> <span class="info-value">January 2026</span></div>
                <div class="info-row"><span class="info-label">Department:</span> <span class="info-value">Executive</span></div>
                <div class="info-row"><span class="info-label">Classification:</span> <span class="info-value">Confidential</span></div>
            </div>
            
            <div class="cover-tagline">We Rule. We Govern. We Empower.</div>
        </div>
    </div>
    `;

    // Build full HTML - Insert intro box before main content
    const html = HTML_TEMPLATE
      .replace('{{COVER_PAGE}}', coverPageHtml)
      .replace('{{CONTENT}}', introBoxHtml + htmlContent);
    
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
            <span>Masaphokati Technologies (Pty) Ltd - Confidential</span>
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
  console.log('\n📄 SiyaBusa ERP - Professional PDF Generator');
  console.log('============================================\n');
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'investor-pdfs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let success = 0;
  let failed = 0;
  
  // Convert each document
  for (const docPath of INVESTOR_DOCUMENTS) {
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
  console.log(`📁 Location: ./investor-pdfs/`);
  console.log('\n📤 Ready to share on WhatsApp!\n');
}

main().catch(console.error);
