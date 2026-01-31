const fs = require('fs');
const { marked } = require('marked');
const path = require('path');

// Read the markdown file
const mdContent = fs.readFileSync(path.join(__dirname, 'SIYABUSA-ERP-CONCEPT-DOCUMENT.md'), 'utf8');

// Convert to HTML
const htmlContent = marked(mdContent);

// Create full HTML document with PREMIUM professional styling
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiyaBusa ERP - Strategic Concept Document</title>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #6366F1;
            --primary-light: #818CF8;
            --primary-dark: #4F46E5;
            --accent: #F59E0B;
            --accent-light: #FBBF24;
            --accent-dark: #D97706;
            --dark: #0F172A;
            --darker: #020617;
            --mid: #334155;
            --light: #F8FAFC;
            --gray: #64748B;
            --success: #10B981;
            --info: #3B82F6;
            --gradient-primary: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
            --gradient-gold: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            --gradient-dark: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 0;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.8;
            color: var(--dark);
            background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 1200px;
            margin: 40px auto;
            background: white;
            box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.3), 0 30px 60px -30px rgba(0, 0, 0, 0.2);
            border-radius: 20px;
            overflow: hidden;
        }

        /* COVER PAGE - Premium Design */
        .container > h1:first-of-type {
            font-family: 'Playfair Display', serif;
            font-size: 5rem;
            font-weight: 900;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-align: center;
            margin: 0;
            padding: 120px 60px 40px;
            letter-spacing: -2px;
            line-height: 1.1;
        }

        .container > h1:first-of-type + h3 {
            text-align: center;
            font-size: 1.5rem;
            font-weight: 400;
            color: var(--gray);
            margin: 0;
            padding: 0 60px 80px;
            font-family: 'Space Grotesk', sans-serif;
            letter-spacing: 2px;
        }

        .container > h1:first-of-type + h3 + hr {
            display: none;
        }

        /* Section Headers */
        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 3.5rem;
            font-weight: 800;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 80px 0 30px;
            padding: 0 60px;
            letter-spacing: -1px;
            line-height: 1.2;
        }

        h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.2rem;
            font-weight: 700;
            color: var(--dark);
            margin: 60px 60px 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid transparent;
            border-image: var(--gradient-primary) 1;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.6rem;
            font-weight: 600;
            color: var(--dark);
            margin: 50px 60px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        h4 {
            font-family: 'Inter', sans-serif;
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--mid);
            margin: 40px 60px 15px;
        }

        p {
            margin: 20px 60px;
            color: var(--mid);
            font-size: 1.05rem;
            line-height: 1.9;
        }

        /* Blockquotes - Premium Cards */
        blockquote {
            background: var(--gradient-dark);
            color: white;
            padding: 40px 50px;
            margin: 40px 60px;
            border-radius: 16px;
            font-size: 1.3rem;
            font-weight: 500;
            font-style: italic;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            border-left: 6px solid var(--accent);
            position: relative;
            overflow: hidden;
        }

        blockquote::before {
            content: '"';
            position: absolute;
            top: -20px;
            left: 30px;
            font-size: 120px;
            color: rgba(255, 255, 255, 0.1);
            font-family: Georgia, serif;
        }

        blockquote p {
            color: white;
            margin: 0;
            padding: 0;
            position: relative;
            z-index: 1;
        }

        /* Tables - Modern Cards */
        table {
            width: calc(100% - 120px);
            margin: 40px 60px;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 1rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            overflow: hidden;
            background: white;
        }

        thead {
            background: var(--gradient-primary);
        }

        thead tr {
            background: transparent;
        }

        th {
            padding: 20px 25px;
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            color: white;
            font-family: 'Space Grotesk', sans-serif;
        }

        td {
            padding: 20px 25px;
            border-bottom: 1px solid #E2E8F0;
            color: var(--mid);
            font-size: 0.98rem;
            vertical-align: top;
        }

        tbody tr {
            transition: all 0.3s ease;
        }

        tbody tr:nth-child(even) {
            background: #F8FAFC;
        }

        tbody tr:hover {
            background: #EEF2FF;
            transform: scale(1.01);
            box-shadow: 0 5px 20px rgba(99, 102, 241, 0.1);
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        /* Code Blocks - Premium Dark Theme */
        pre {
            background: var(--gradient-dark);
            color: #E2E8F0;
            padding: 40px;
            margin: 40px 60px;
            border-radius: 16px;
            overflow-x: auto;
            font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
            font-size: 0.8rem;
            line-height: 1.6;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
        }

        pre::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: rgba(0, 0, 0, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        code {
            font-family: 'JetBrains Mono', 'SF Mono', monospace;
            background: #EEF2FF;
            color: var(--primary);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
        }

        pre code {
            background: none;
            color: inherit;
            padding: 0;
            font-weight: 400;
        }

        /* Lists - Better Spacing */
        ul, ol {
            margin: 20px 60px 20px 100px;
        }

        li {
            margin: 12px 0;
            color: var(--mid);
            font-size: 1.05rem;
        }

        /* Strong - Highlighted */
        strong {
            font-weight: 700;
            color: var(--dark);
            background: linear-gradient(to right, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%);
            padding: 2px 4px;
        }

        /* Links */
        a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
        }

        a:hover {
            border-bottom-color: var(--primary);
            color: var(--primary-dark);
        }

        /* Dividers */
        hr {
            border: none;
            height: 3px;
            background: var(--gradient-primary);
            margin: 80px 60px;
            border-radius: 3px;
            opacity: 0.3;
        }

        /* Centered Content - Hero Sections */
        div[align="center"] {
            text-align: center;
            padding: 60px;
            background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%);
            margin: 60px 0;
        }

        /* Special Styling for Version Info */
        p:has(em) {
            text-align: center;
            font-style: italic;
            color: var(--gray);
            font-size: 0.95rem;
        }

        /* Print Optimization */
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
                margin: 0;
                border-radius: 0;
            }
            
            h1, h2, h3, h4 {
                page-break-after: avoid;
            }
            
            table, pre, blockquote {
                page-break-inside: avoid;
            }
            
            tbody tr:hover {
                transform: none;
                box-shadow: none;
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .container > h1:first-of-type {
                font-size: 3rem;
                padding: 60px 30px 20px;
            }
            
            h1 { font-size: 2.5rem; padding: 0 30px; }
            h2 { font-size: 1.8rem; margin: 40px 30px 20px; }
            h3 { font-size: 1.4rem; margin: 30px 30px 15px; }
            
            p, blockquote, pre { margin-left: 30px; margin-right: 30px; padding: 30px; }
            
            table {
                width: calc(100% - 60px);
                margin: 30px;
                font-size: 0.9rem;
            }
            
            th, td { padding: 15px; }
            
            ul, ol { margin-left: 60px; margin-right: 30px; }
        }

        /* Smooth Animations */
        h1, h2, h3, table, blockquote, pre {
            animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Status Badges in Tables */
        td:contains("✅") { color: var(--success); font-weight: 600; }
        td:contains("❌") { color: #EF4444; font-weight: 600; }
        td:contains("⚠️") { color: var(--accent); font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
    
    <script>
        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('h2, h3, table, blockquote').forEach(el => {
            observer.observe(el);
        });
    </script>
</body>
</html>`;

// Write the HTML file
fs.writeFileSync(path.join(__dirname, 'SIYABUSA-ERP-CONCEPT-DOCUMENT.html'), fullHtml);

console.log('✅ HTML file created: SIYABUSA-ERP-CONCEPT-DOCUMENT.html');
