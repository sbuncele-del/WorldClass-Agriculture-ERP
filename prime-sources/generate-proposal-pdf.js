const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Prime Sources Color Scheme - Professional Green & Gold
const COLORS = {
    primary: '#2E7D32',      // Forest Green
    secondary: '#8D6E63',    // Earth Brown
    accent: '#FFB300',       // Golden Yellow
    dark: '#1B5E20',         // Dark Green
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
    phone: '+268 7836 6815'
};

function generatePDF() {
    const inputFile = path.join(__dirname, '..', 'prime-sources', 'CHURCH-AGRICULTURAL-PROPOSAL.md');
    const outputDir = path.join(__dirname, '..', 'prime-sources', 'pdf');
    const outputFile = path.join(outputDir, 'CHURCH-AGRICULTURAL-PROPOSAL.pdf');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read markdown content
    const markdown = fs.readFileSync(inputFile, 'utf8');

    // Convert markdown to HTML with Prime Sources styling
    const html = convertToStyledHTML(markdown);

    // Write HTML file temporarily
    const tempHtml = path.join(outputDir, 'temp-proposal.html');
    fs.writeFileSync(tempHtml, html);

    // Try to convert to PDF using available tools
    try {
        // Try using Chrome/Chromium headless
        try {
            execSync(`chromium --headless --disable-gpu --print-to-pdf="${outputFile}" --no-margins "${tempHtml}" 2>/dev/null || google-chrome --headless --disable-gpu --print-to-pdf="${outputFile}" --no-margins "${tempHtml}" 2>/dev/null`, { stdio: 'pipe' });
            console.log(`✅ PDF generated: ${outputFile}`);
        } catch (e) {
            // Try wkhtmltopdf
            try {
                execSync(`wkhtmltopdf --enable-local-file-access "${tempHtml}" "${outputFile}"`, { stdio: 'pipe' });
                console.log(`✅ PDF generated: ${outputFile}`);
            } catch (e2) {
                // Keep HTML as fallback
                const finalHtml = path.join(outputDir, 'CHURCH-AGRICULTURAL-PROPOSAL.html');
                fs.renameSync(tempHtml, finalHtml);
                console.log(`📄 HTML generated (can be printed to PDF): ${finalHtml}`);
                return finalHtml;
            }
        }
        
        // Clean up temp file
        if (fs.existsSync(tempHtml)) {
            fs.unlinkSync(tempHtml);
        }
        
        return outputFile;
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        return null;
    }
}

function convertToStyledHTML(markdown) {
    // Convert markdown to HTML
    let html = markdown;

    // Convert headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Convert unordered lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Convert numbered lists
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Convert tables
    html = convertTables(html);

    // Convert line breaks to paragraphs
    html = html.split('\n\n').map(para => {
        if (para.startsWith('<') || para.trim() === '') return para;
        return `<p>${para}</p>`;
    }).join('\n');

    // Wrap in styled HTML document
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${COMPANY.name} - Church Agricultural Proposal</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Open Sans', Arial, sans-serif;
            line-height: 1.7;
            color: ${COLORS.text};
            background: ${COLORS.white};
        }
        
        .cover-page {
            height: 100vh;
            background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.dark} 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            color: ${COLORS.white};
            page-break-after: always;
            position: relative;
            overflow: hidden;
        }
        
        .cover-page::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 0 L100 50 L50 100 L0 50Z' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E") repeat;
            background-size: 60px 60px;
            animation: none;
        }
        
        .cover-logo {
            width: 150px;
            height: 150px;
            background: ${COLORS.white};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .cover-logo-inner {
            font-size: 60px;
        }
        
        .cover-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 3.5em;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }
        
        .cover-tagline {
            font-size: 1.4em;
            font-weight: 300;
            margin-bottom: 50px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .cover-document-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.8em;
            background: ${COLORS.accent};
            color: ${COLORS.dark};
            padding: 20px 50px;
            border-radius: 50px;
            font-weight: 600;
            margin-bottom: 40px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        
        .cover-location {
            font-size: 1.1em;
            opacity: 0.8;
            position: relative;
            z-index: 1;
        }
        
        .cover-footer {
            position: absolute;
            bottom: 40px;
            font-size: 0.9em;
            opacity: 0.7;
        }
        
        .content {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 50px;
        }
        
        h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 2.2em;
            color: ${COLORS.primary};
            margin: 40px 0 20px 0;
            padding-bottom: 15px;
            border-bottom: 3px solid ${COLORS.accent};
        }
        
        h2 {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.6em;
            color: ${COLORS.dark};
            margin: 35px 0 15px 0;
            padding-left: 15px;
            border-left: 4px solid ${COLORS.accent};
        }
        
        h3 {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.3em;
            color: ${COLORS.secondary};
            margin: 25px 0 10px 0;
        }
        
        p {
            margin: 15px 0;
            text-align: justify;
        }
        
        ul, ol {
            margin: 15px 0 15px 30px;
        }
        
        li {
            margin: 8px 0;
        }
        
        hr {
            border: none;
            height: 2px;
            background: linear-gradient(to right, ${COLORS.primary}, ${COLORS.accent}, ${COLORS.primary});
            margin: 30px 0;
        }
        
        strong {
            color: ${COLORS.dark};
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        th {
            background: ${COLORS.primary};
            color: ${COLORS.white};
            padding: 15px;
            text-align: left;
            font-family: 'Montserrat', sans-serif;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        tr:nth-child(even) {
            background: ${COLORS.light};
        }
        
        .highlight-box {
            background: linear-gradient(135deg, ${COLORS.light} 0%, #fff 100%);
            border-left: 5px solid ${COLORS.accent};
            padding: 25px;
            margin: 25px 0;
            border-radius: 0 10px 10px 0;
        }
        
        .contact-box {
            background: ${COLORS.primary};
            color: ${COLORS.white};
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            margin: 40px 0;
        }
        
        .contact-box h2 {
            color: ${COLORS.white};
            border: none;
            padding: 0;
        }
        
        .contact-box p {
            text-align: center;
        }
        
        .scripture {
            font-style: italic;
            text-align: center;
            font-size: 1.2em;
            color: ${COLORS.dark};
            margin: 30px 0;
            padding: 20px;
            background: ${COLORS.light};
            border-radius: 10px;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            background: ${COLORS.dark};
            color: ${COLORS.white};
            margin-top: 50px;
        }
        
        @media print {
            .cover-page {
                height: 100vh;
                page-break-after: always;
            }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <div class="cover-logo">
            <span class="cover-logo-inner">🌾</span>
        </div>
        <h1 class="cover-title">${COMPANY.name}</h1>
        <p class="cover-tagline">${COMPANY.tagline}</p>
        <div class="cover-document-title">Church Agricultural Project Proposal</div>
        <p class="cover-location">📍 ${COMPANY.location}</p>
        <div class="cover-footer">
            <p>Growing Prosperity, Harvesting Hope</p>
        </div>
    </div>
    
    <!-- Content -->
    <div class="content">
        ${html}
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <p><strong>${COMPANY.name}</strong> | ${COMPANY.tagline}</p>
        <p>📍 ${COMPANY.location} | 📞 ${COMPANY.phone}</p>
        <p style="margin-top: 10px; opacity: 0.7;">© 2026 ${COMPANY.name} - All Rights Reserved</p>
    </div>
</body>
</html>`;
}

function convertTables(html) {
    const tableRegex = /\|(.+)\|\n\|[-\s|]+\|\n((?:\|.+\|\n?)+)/g;
    
    return html.replace(tableRegex, (match, headerRow, bodyRows) => {
        const headers = headerRow.split('|').filter(h => h.trim());
        const rows = bodyRows.trim().split('\n').map(row => 
            row.split('|').filter(cell => cell.trim())
        );
        
        let table = '<table><thead><tr>';
        headers.forEach(h => table += `<th>${h.trim()}</th>`);
        table += '</tr></thead><tbody>';
        rows.forEach(row => {
            table += '<tr>';
            row.forEach(cell => table += `<td>${cell.trim()}</td>`);
            table += '</tr>';
        });
        table += '</tbody></table>';
        
        return table;
    });
}

// Run the generator
console.log('🌾 Prime Sources PDF Generator');
console.log('================================\n');
const result = generatePDF();
if (result) {
    console.log('\n✅ Document generation complete!');
    console.log(`📄 Output: ${result}`);
}
