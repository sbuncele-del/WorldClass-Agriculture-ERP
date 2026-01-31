#!/usr/bin/env python3
"""Convert NDB Proposal Markdown to professional PDF"""

import markdown
from weasyprint import HTML, CSS
from pathlib import Path

# Read markdown file
md_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.md')
md_content = md_file.read_text()

# Convert markdown to HTML
md_converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc'])
html_body = md_converter.convert(md_content)

# Professional CSS styling
css_style = """
@page {
    size: A4;
    margin: 2cm 2.5cm;
    @top-center {
        content: "National Development Bank of South Sudan - Investment Memorandum";
        font-size: 9pt;
        color: #666;
    }
    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #666;
    }
    @bottom-right {
        content: "Confidential";
        font-size: 9pt;
        color: #999;
    }
}

@page:first {
    @top-center { content: none; }
}

body {
    font-family: 'Segoe UI', Calibri, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #333;
    max-width: 100%;
}

h1 {
    color: #1a4480;
    font-size: 28pt;
    font-weight: 700;
    border-bottom: 3px solid #1a4480;
    padding-bottom: 10px;
    margin-top: 40px;
    margin-bottom: 20px;
    page-break-after: avoid;
}

h2 {
    color: #1a4480;
    font-size: 18pt;
    font-weight: 600;
    margin-top: 35px;
    margin-bottom: 15px;
    border-bottom: 2px solid #ddd;
    padding-bottom: 8px;
    page-break-after: avoid;
}

h3 {
    color: #2c5aa0;
    font-size: 14pt;
    font-weight: 600;
    margin-top: 25px;
    margin-bottom: 10px;
    page-break-after: avoid;
}

h4 {
    color: #333;
    font-size: 12pt;
    font-weight: 600;
    margin-top: 20px;
    margin-bottom: 8px;
}

p {
    margin-bottom: 12px;
    text-align: justify;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 10pt;
    page-break-inside: avoid;
}

th {
    background-color: #1a4480;
    color: white;
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
    border: 1px solid #1a4480;
}

td {
    padding: 10px;
    border: 1px solid #ddd;
    vertical-align: top;
}

tr:nth-child(even) {
    background-color: #f8f9fa;
}

tr:hover {
    background-color: #e8f4f8;
}

/* Highlight key metrics */
strong {
    color: #1a4480;
}

code {
    background-color: #f4f4f4;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Consolas', monospace;
    font-size: 10pt;
}

pre {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #ddd;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.4;
    page-break-inside: avoid;
}

pre code {
    background-color: transparent;
    padding: 0;
}

ul, ol {
    margin-bottom: 15px;
    padding-left: 25px;
}

li {
    margin-bottom: 6px;
}

blockquote {
    border-left: 4px solid #1a4480;
    padding-left: 20px;
    margin: 20px 0;
    color: #555;
    font-style: italic;
}

/* Cover page styling */
h1:first-of-type {
    text-align: center;
    font-size: 32pt;
    margin-top: 100px;
    border-bottom: none;
}

h2:first-of-type {
    text-align: center;
    font-size: 16pt;
    color: #666;
    border-bottom: none;
    margin-bottom: 60px;
}

/* Checkmark styling */
p:has(✅), li:has(✅) {
    color: #28a745;
}

/* Page breaks */
.page-break {
    page-break-before: always;
}

/* Executive summary box */
.highlight-box {
    background-color: #e8f4f8;
    border: 2px solid #1a4480;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

/* Investment highlights table special styling */
table:first-of-type {
    margin-top: 30px;
}

/* Footer info */
.confidential {
    color: #999;
    font-size: 9pt;
    text-align: center;
}
"""

# Full HTML document
full_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>National Development Bank of South Sudan - Investment Memorandum</title>
</head>
<body>
{html_body}
</body>
</html>
"""

# Save HTML (for reference)
html_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.html')
html_file.write_text(full_html)
print(f"✓ HTML saved to: {html_file}")

# Convert to PDF
pdf_file = Path('/workspaces/WorldClass-ERP/ndb-proposals/SOUTH-SUDAN-NDB-PROPOSAL.pdf')
HTML(string=full_html).write_pdf(
    pdf_file,
    stylesheets=[CSS(string=css_style)]
)
print(f"✓ PDF saved to: {pdf_file}")
print(f"\n📄 PDF generated successfully!")
