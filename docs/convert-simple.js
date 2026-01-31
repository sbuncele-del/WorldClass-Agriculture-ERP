// Simple, clean HTML converter for SiyaBusa ERP Concept Document
// This version matches the user's preferred styling

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Read the markdown file
const mdPath = path.join(__dirname, 'SIYABUSA-ERP-CONCEPT-DOCUMENT.md');
const markdown = fs.readFileSync(mdPath, 'utf8');

// Configure marked for better output
marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false
});

// Convert markdown to HTML
const htmlContent = marked.parse(markdown);

// Simple, clean HTML template (matching user's preferred style)
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiyaBusa ERP - Concept Document</title>
    <style>
        /* Reset and Base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.7;
            color: #333;
            background: #fff;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 60px;
        }

        /* Typography */
        h1 {
            font-size: 2.2rem;
            font-weight: 700;
            color: #1a1a1a;
            margin: 2rem 0 1rem 0;
            border-bottom: 2px solid #5B21B6;
            padding-bottom: 0.5rem;
        }

        h2 {
            font-size: 1.6rem;
            font-weight: 600;
            color: #2d2d2d;
            margin: 1.8rem 0 0.8rem 0;
        }

        h3 {
            font-size: 1.3rem;
            font-weight: 600;
            color: #3d3d3d;
            margin: 1.5rem 0 0.6rem 0;
        }

        p {
            margin: 0.8rem 0;
            color: #444;
        }

        strong {
            color: #1a1a1a;
        }

        em {
            color: #555;
        }

        /* Links */
        a {
            color: #5B21B6;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        /* Lists */
        ul, ol {
            margin: 0.8rem 0;
            padding-left: 2rem;
        }

        li {
            margin: 0.4rem 0;
            color: #444;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5rem 0;
            font-size: 0.95rem;
        }

        th {
            background: #5B21B6;
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
        }

        td {
            padding: 10px 15px;
            border-bottom: 1px solid #e5e5e5;
        }

        tr:nth-child(even) {
            background: #f9f9f9;
        }

        tr:hover {
            background: #f0f0f0;
        }

        /* Blockquotes */
        blockquote {
            border-left: 4px solid #5B21B6;
            padding: 0.5rem 1.5rem;
            margin: 1.5rem 0;
            background: #f8f5ff;
            color: #4a4a4a;
            font-style: italic;
        }

        blockquote p {
            margin: 0;
        }

        /* Code blocks (for ASCII diagrams) */
        pre {
            background: #1a1a2e;
            color: #e0e0e0;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.85rem;
            line-height: 1.5;
            margin: 1.5rem 0;
        }

        code {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
        }

        /* Inline code */
        p code, li code, td code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            color: #5B21B6;
        }

        /* Horizontal rules */
        hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 2rem 0;
        }

        /* Center aligned divs */
        div[align="center"] {
            text-align: center;
        }

        div[align="center"] h1,
        div[align="center"] h2,
        div[align="center"] h3 {
            border-bottom: none;
        }

        /* Document title styling */
        body > h1:first-of-type {
            font-size: 2.8rem;
            text-align: center;
            border-bottom: none;
            margin-bottom: 0.5rem;
        }

        /* Print styles */
        @media print {
            body {
                padding: 20px;
                font-size: 11pt;
            }

            pre {
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            table {
                page-break-inside: avoid;
            }

            h1, h2, h3 {
                page-break-after: avoid;
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            body {
                padding: 20px;
            }

            h1 {
                font-size: 1.8rem;
            }

            h2 {
                font-size: 1.4rem;
            }

            table {
                font-size: 0.85rem;
            }

            th, td {
                padding: 8px 10px;
            }

            pre {
                font-size: 0.75rem;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

// Write the HTML file
const outputPath = path.join(__dirname, '..', 'frontend', 'public', 'concept-document.html');
fs.writeFileSync(outputPath, fullHtml);

console.log('✅ Simple HTML document created!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📊 Size: ${(fullHtml.length / 1024).toFixed(1)} KB`);
