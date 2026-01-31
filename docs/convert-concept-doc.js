const fs = require('fs');
const { marked } = require('marked');
const path = require('path');

// Read the markdown file
const mdContent = fs.readFileSync(path.join(__dirname, 'SIYABUSA-ERP-CONCEPT-DOCUMENT.md'), 'utf8');

// Convert to HTML
const htmlContent = marked(mdContent);

// Create ELEGANT professional document with proper cover page
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiyaBusa ERP - Concept Document | Stakeholder Presentation</title>
    <meta name="description" content="SiyaBusa ERP Concept Document - Comprehensive overview for stakeholders, investors, and strategic partners.">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary: #5B21B6;
            --primary-light: #7C3AED;
            --primary-dark: #4C1D95;
            --accent: #F59E0B;
            --accent-light: #FBBF24;
            --dark: #1E1E2E;
            --darker: #13131A;
            --text: #2D2D3A;
            --text-light: #6B7280;
            --light: #FAFAFA;
            --border: #E5E7EB;
            --success: #059669;
            --card-bg: #FFFFFF;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #F8FAFC 100%);
            color: var(--text);
            line-height: 1.8;
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
        }

        /* Main Container */
        .document {
            max-width: 1100px;
            margin: 0 auto;
            background: var(--card-bg);
            box-shadow: 0 0 100px rgba(91, 33, 182, 0.08);
            min-height: 100vh;
        }

        /* Cover Section */
        .cover {
            background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%);
            color: white;
            padding: 100px 80px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .cover::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
            opacity: 0.5;
        }

        .cover-content {
            position: relative;
            z-index: 1;
        }

        .cover-badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 24px;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 40px;
        }

        .cover h1 {
            font-family: 'Crimson Pro', Georgia, serif;
            font-size: 5rem;
            font-weight: 700;
            margin-bottom: 20px;
            letter-spacing: -2px;
            line-height: 1.1;
        }

        .cover-acronym {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.1rem;
            font-weight: 400;
            opacity: 0.9;
            letter-spacing: 1px;
            margin-bottom: 30px;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }

        .cover-tagline {
            font-family: 'Crimson Pro', Georgia, serif;
            font-size: 1.6rem;
            font-style: italic;
            color: var(--accent-light);
            margin-bottom: 60px;
        }

        .cover-meta {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .cover-meta strong {
            display: block;
            font-size: 1rem;
            margin-bottom: 5px;
        }

        /* Content Area */
        .content {
            padding: 80px;
        }

        /* Typography */
        h1 {
            font-family: 'Crimson Pro', Georgia, serif;
            font-size: 2.8rem;
            font-weight: 700;
            color: var(--primary-dark);
            margin: 70px 0 25px;
            padding-bottom: 18px;
            border-bottom: 3px solid var(--accent);
            letter-spacing: -1px;
            line-height: 1.2;
        }

        h1:first-child {
            margin-top: 0;
        }

        h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.6rem;
            font-weight: 600;
            color: var(--primary);
            margin: 50px 0 20px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--border);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--dark);
            margin: 40px 0 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        h4 {
            font-family: 'Inter', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-light);
            margin: 30px 0 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        p {
            margin: 18px 0;
            color: var(--text);
            font-size: 1.02rem;
            line-height: 1.85;
        }

        /* Blockquotes - Elegant Callouts */
        blockquote {
            background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
            color: white;
            padding: 30px 40px;
            margin: 35px 0;
            border-radius: 10px;
            font-size: 1.1rem;
            font-style: italic;
            position: relative;
            box-shadow: 0 8px 30px rgba(91, 33, 182, 0.2);
        }

        blockquote::before {
            content: '"';
            position: absolute;
            top: 10px;
            left: 20px;
            font-family: Georgia, serif;
            font-size: 3.5rem;
            color: rgba(255,255,255,0.2);
            line-height: 1;
        }

        blockquote p {
            color: white;
            margin: 0;
            padding-left: 25px;
        }

        /* Tables - Professional & Clean */
        table {
            width: 100%;
            margin: 30px 0;
            border-collapse: collapse;
            font-size: 0.92rem;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 3px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--border);
        }

        thead {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        }

        th {
            padding: 15px 20px;
            text-align: left;
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: white;
            font-family: 'Space Grotesk', sans-serif;
        }

        td {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
            color: var(--text);
            vertical-align: top;
            line-height: 1.6;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        tbody tr:nth-child(even) {
            background: #F9FAFB;
        }

        tbody tr:hover {
            background: #F3F4F6;
        }

        /* Code Blocks - For Diagrams */
        pre {
            background: var(--darker);
            color: #E2E8F0;
            padding: 30px;
            margin: 30px 0;
            border-radius: 10px;
            overflow-x: auto;
            font-family: 'JetBrains Mono', 'SF Mono', monospace;
            font-size: 0.72rem;
            line-height: 1.45;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            border: 1px solid rgba(255,255,255,0.08);
        }

        code {
            font-family: 'JetBrains Mono', 'SF Mono', monospace;
            background: #EEF2FF;
            color: var(--primary);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.88rem;
            font-weight: 500;
        }

        pre code {
            background: transparent;
            color: inherit;
            padding: 0;
            font-weight: 400;
        }

        /* Lists */
        ul, ol {
            margin: 18px 0 18px 28px;
        }

        li {
            margin: 10px 0;
            color: var(--text);
            font-size: 1.02rem;
            line-height: 1.7;
        }

        /* Strong Text */
        strong {
            font-weight: 600;
            color: var(--dark);
        }

        /* Links */
        a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
            border-bottom: 1px solid transparent;
            transition: all 0.2s ease;
        }

        a:hover {
            border-bottom-color: var(--primary);
        }

        /* Horizontal Rules */
        hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border), transparent);
            margin: 50px 0;
        }

        /* Centered Content */
        div[align="center"] {
            text-align: center;
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
            }
            
            .document {
                box-shadow: none;
                max-width: 100%;
            }
            
            .cover {
                padding: 50px 30px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .content {
                padding: 30px;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            table, pre, blockquote {
                page-break-inside: avoid;
            }

            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
            }
        }

        /* Responsive */
        @media (max-width: 900px) {
            .cover {
                padding: 60px 40px;
            }

            .cover h1 {
                font-size: 3rem;
            }

            .content {
                padding: 40px;
            }

            h1 { font-size: 2rem; }
            h2 { font-size: 1.4rem; }
            h3 { font-size: 1.15rem; }

            table {
                font-size: 0.85rem;
            }

            th, td {
                padding: 12px 14px;
            }

            pre {
                font-size: 0.65rem;
                padding: 22px;
            }
        }

        @media (max-width: 600px) {
            .cover {
                padding: 40px 25px;
            }

            .cover h1 {
                font-size: 2.2rem;
            }

            .content {
                padding: 25px;
            }

            pre {
                font-size: 0.58rem;
                padding: 18px;
                margin-left: -25px;
                margin-right: -25px;
                border-radius: 0;
            }

            table {
                display: block;
                overflow-x: auto;
            }
        }

        /* Smooth Fade In */
        .document {
            animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Cover Page -->
        <div class="cover">
            <div class="cover-content">
                <div class="cover-badge">Concept Document</div>
                <h1>SiyaBusa ERP</h1>
                <p class="cover-acronym">
                    <strong>S</strong>eamlessly <strong>I</strong>ntegrated <strong>Y</strong>ielding <strong>A</strong>ccountability for <strong>B</strong>usinesses with <strong>U</strong>nified <strong>S</strong>ystems & <strong>A</strong>utomation
                </p>
                <p class="cover-tagline">"We Rule. We Govern. We Empower."</p>
                <div class="cover-meta">
                    <strong>Version 1.0 | December 2025</strong>
                    Prepared for Stakeholders, Investors & Strategic Partners
                </div>
            </div>
        </div>

        <!-- Document Content -->
        <div class="content">
            ${htmlContent}
        </div>
    </div>

    <script>
        // Smooth scroll for any internal links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    </script>
</body>
</html>`;

// Write the HTML file
const outputPath = path.join(__dirname, 'SIYABUSA-CONCEPT-DOCUMENT.html');
fs.writeFileSync(outputPath, fullHtml);

console.log('✅ Concept Document HTML created: SIYABUSA-CONCEPT-DOCUMENT.html');
console.log('   - With elegant cover page');
console.log('   - All content preserved');
console.log('   - Professional styling');
console.log('   - Print-ready');
