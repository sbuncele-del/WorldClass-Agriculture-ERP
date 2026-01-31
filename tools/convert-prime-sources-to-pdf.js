#!/usr/bin/env node

/**
 * Convert Prime Sources Proposal to PDF
 * Professional PDF with branded styling
 * Uses Puppeteer with Prime Sources branding
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Prime Sources Color Scheme
const COLORS = {
    primary: '#2E7D32',      // Forest Green
    primaryDark: '#1B5E20',  // Dark Green
    accent: '#FFB300',       // Golden Yellow
    secondary: '#8D6E63',    // Earth Brown
    light: '#E8F5E9',        // Light Green
    text: '#2C3E50',         // Dark text
    white: '#FFFFFF'
};

// Company Information
const COMPANY = {
    name: 'Prime Sources',
    tagline: 'Agricultural Consulting & Project Management',
    location: 'Mankayane, Manzini, Kingdom of eSwatini',
    consultant: 'Sibusiso Dlamini',
    phone: '+268 7836 6815',
    motto: 'Growing Prosperity, Harvesting Hope'
};

// Configure marked
marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true
});

// Professional PDF styling for Prime Sources
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap');

        @page {
            size: A4;
            margin: 20mm 20mm 25mm 20mm;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.7;
            color: ${COLORS.text};
            max-width: 100%;
            margin: 0;
            padding: 0;
            background: white;
        }

        /* Cover Page */
        .cover-page {
            page-break-after: always;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
            color: white;
            padding: 60px 40px;
            position: relative;
            overflow: hidden;
        }
        
        .cover-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='2'/%3E%3C/svg%3E") repeat;
            background-size: 100px 100px;
        }
        
        .cover-logo {
            width: 140px;
            height: 140px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 35px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .cover-logo-emoji {
            font-size: 70px;
        }
        
        .cover-company {
            font-family: 'Montserrat', sans-serif;
            font-size: 52px;
            font-weight: 800;
            margin-bottom: 10px;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
            letter-spacing: -1px;
        }
        
        .cover-tagline {
            font-size: 20px;
            font-weight: 300;
            margin-bottom: 50px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .cover-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 26px;
            background: ${COLORS.accent};
            color: ${COLORS.primaryDark};
            padding: 18px 45px;
            border-radius: 50px;
            font-weight: 700;
            margin-bottom: 40px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        
        .cover-location {
            font-size: 16px;
            opacity: 0.85;
            position: relative;
            z-index: 1;
            margin-bottom: 15px;
        }
        
        .cover-date {
            font-size: 14px;
            opacity: 0.7;
            position: relative;
            z-index: 1;
        }
        
        .cover-footer {
            position: absolute;
            bottom: 40px;
            font-size: 14px;
            font-style: italic;
            opacity: 0.8;
        }
        
        .cover-accent-bar {
            width: 80px;
            height: 4px;
            background: ${COLORS.accent};
            margin: 20px auto;
            border-radius: 2px;
        }

        /* Content Styling */
        .content {
            padding: 40px 20px;
        }

        h1 {
            font-family: 'Montserrat', sans-serif;
            color: ${COLORS.primary};
            font-size: 28px;
            font-weight: 700;
            margin: 40px 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 3px solid ${COLORS.accent};
            page-break-after: avoid;
        }

        h2 {
            font-family: 'Montserrat', sans-serif;
            color: ${COLORS.primaryDark};
            font-size: 22px;
            font-weight: 600;
            margin: 35px 0 15px 0;
            padding-left: 15px;
            border-left: 4px solid ${COLORS.accent};
            page-break-after: avoid;
        }

        h3 {
            font-family: 'Montserrat', sans-serif;
            color: ${COLORS.secondary};
            font-size: 18px;
            font-weight: 600;
            margin: 25px 0 12px 0;
            page-break-after: avoid;
        }

        p {
            margin: 12px 0;
            text-align: justify;
        }

        ul, ol {
            margin: 15px 0;
            padding-left: 25px;
        }

        li {
            margin: 8px 0;
        }

        strong {
            color: ${COLORS.primaryDark};
            font-weight: 600;
        }

        em {
            color: ${COLORS.secondary};
        }

        hr {
            border: none;
            height: 2px;
            background: linear-gradient(to right, ${COLORS.primary}, ${COLORS.accent}, ${COLORS.primary});
            margin: 30px 0;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 14px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.08);
            border-radius: 8px;
            overflow: hidden;
        }

        thead {
            background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
            color: white;
        }

        th {
            padding: 14px 16px;
            text-align: left;
            font-family: 'Montserrat', sans-serif;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
        }

        tr:nth-child(even) {
            background: ${COLORS.light};
        }

        tr:last-child td {
            border-bottom: none;
        }

        /* Blockquotes for scripture/quotes */
        blockquote {
            background: linear-gradient(135deg, ${COLORS.light} 0%, #fff 100%);
            border-left: 4px solid ${COLORS.accent};
            padding: 20px 25px;
            margin: 25px 0;
            font-style: italic;
            border-radius: 0 8px 8px 0;
        }

        blockquote p {
            margin: 0;
            text-align: center;
            font-size: 16px;
        }

        /* Code blocks for emphasis */
        code {
            background: ${COLORS.light};
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 14px;
            color: ${COLORS.primaryDark};
        }

        /* Contact Section Special Styling */
        .contact-section {
            background: ${COLORS.primary};
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 40px 0;
        }

        /* Page Footer */
        .page-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20mm;
            background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20mm;
            font-size: 11px;
        }

        .page-footer-left {
            font-weight: 600;
        }

        .page-footer-right {
            opacity: 0.8;
        }

        /* Header */
        .page-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 15mm;
            background: white;
            border-bottom: 2px solid ${COLORS.accent};
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20mm;
            font-size: 11px;
            color: ${COLORS.text};
        }

        .page-header-left {
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            color: ${COLORS.primary};
        }

        .page-header-right {
            opacity: 0.6;
        }

        /* Print settings */
        @media print {
            .cover-page {
                page-break-after: always;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            table, blockquote {
                page-break-inside: avoid;
            }
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

function generateCoverPage(docTitle, docPurpose) {
    return `
    <div class="cover-page">
        <div class="cover-logo">
            <span class="cover-logo-emoji">🌾</span>
        </div>
        <h1 class="cover-company">${COMPANY.name}</h1>
        <p class="cover-tagline">${COMPANY.tagline}</p>
        <div class="cover-accent-bar"></div>
        <div class="cover-title">${docTitle}</div>
        <p class="cover-location">📍 ${COMPANY.location}</p>
        <p class="cover-date">January 2026</p>
        <div class="cover-footer">${COMPANY.motto}</div>
    </div>
    `;
}

async function convertToPDF() {
    const inputFile = path.join(__dirname, '..', 'prime-sources', 'CHURCH-AGRICULTURAL-PROPOSAL.md');
    const outputDir = path.join(__dirname, '..', 'prime-sources', 'pdf');
    const outputFile = path.join(outputDir, 'CHURCH-AGRICULTURAL-PROPOSAL.pdf');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('🌾 Prime Sources PDF Generator');
    console.log('================================\n');

    // Read and convert markdown
    console.log('📖 Reading proposal document...');
    const markdown = fs.readFileSync(inputFile, 'utf8');
    const htmlContent = marked(markdown);

    // Generate cover page
    const coverPage = generateCoverPage(
        'Church Agricultural Project Proposal',
        'Sustainable Income Solutions for Churches'
    );

    // Build complete HTML
    const fullHtml = HTML_TEMPLATE
        .replace('{{COVER_PAGE}}', coverPage)
        .replace('{{CONTENT}}', htmlContent);

    // Launch Puppeteer
    console.log('🚀 Launching PDF generator...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // Generate PDF
    console.log('📄 Generating PDF...');
    await page.pdf({
        path: outputFile,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '25mm',
            left: '20mm'
        }
    });

    await browser.close();

    // Get file size
    const stats = fs.statSync(outputFile);
    const fileSizeKB = Math.round(stats.size / 1024);

    console.log('\n✅ PDF Generated Successfully!');
    console.log(`📄 File: ${outputFile}`);
    console.log(`📊 Size: ${fileSizeKB} KB`);
    
    return outputFile;
}

// Run the converter
convertToPDF()
    .then(file => {
        console.log('\n🎉 Done! Your professional proposal is ready.');
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
