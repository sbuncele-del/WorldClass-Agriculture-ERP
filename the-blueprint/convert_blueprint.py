#!/usr/bin/env python3
"""
The Blueprint - PDF Converter
A clean, human, intimate document for Sibusiso Mavuso
"""

import markdown
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
import os

def create_blueprint_pdf():
    """Generate a clean PDF from The Blueprint markdown"""
    
    # Read the markdown file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    md_file = os.path.join(script_dir, "THE-BLUEPRINT-SIBUSISO-MAVUSO.md")
    
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    md = markdown.Markdown(extensions=['tables', 'toc', 'meta'])
    html_body = md.convert(md_content)
    
    # Clean, human styling with simple cover
    css_styles = """
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Open+Sans:wght@400;600&display=swap');
    
    @page {
        size: A4;
        margin: 2.5cm 2.5cm;
        
        @bottom-center {
            content: counter(page);
            font-family: 'Open Sans', sans-serif;
            font-size: 9pt;
            color: #888;
        }
    }
    
    @page:first {
        margin: 0;
        @bottom-center {
            content: none;
        }
    }
    
    body {
        font-family: 'Merriweather', Georgia, serif;
        font-size: 11pt;
        line-height: 1.9;
        color: #333;
        background: white;
    }
    
    /* Cover Page */
    .cover {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: white;
        color: #222;
        page-break-after: always;
        padding: 60px;
    }
    
    .cover-small {
        font-family: 'Merriweather', serif;
        font-size: 10pt;
        font-style: italic;
        color: #666;
        letter-spacing: 2px;
        margin-bottom: 15px;
    }
    
    .cover-name {
        font-family: 'Merriweather', serif;
        font-size: 14pt;
        font-weight: 400;
        letter-spacing: 4px;
        text-transform: uppercase;
        color: #333;
    }
    
    .cover-line {
        width: 40px;
        height: 1px;
        background: #333;
        margin: 50px 0;
    }
    
    .cover-title {
        font-family: 'Merriweather', serif;
        font-size: 36pt;
        font-weight: 700;
        letter-spacing: 2px;
        color: #111;
    }
    
    /* Main Content */
    .content {
        padding-top: 40px;
    }
    
    /* Main Title - hide in content since we have cover */
    .content h1:first-child {
        display: none;
    }
    
    /* Section Headers */
    h2 {
        font-family: 'Merriweather', serif;
        font-size: 14pt;
        font-weight: 700;
        color: #222;
        margin-top: 45px;
        margin-bottom: 20px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ddd;
        page-break-after: avoid;
    }
    
    /* Paragraphs - natural flow */
    p {
        margin-bottom: 16px;
        text-align: left;
    }
    
    /* Italics for quotes and emphasis */
    em {
        font-style: italic;
        color: #444;
    }
    
    /* Bold */
    strong {
        font-weight: 700;
        color: #222;
    }
    
    /* Lists - simple */
    ul, ol {
        margin: 20px 0;
        padding-left: 25px;
    }
    
    li {
        margin-bottom: 8px;
        line-height: 1.7;
    }
    
    /* Horizontal Rules - subtle */
    hr {
        border: none;
        height: 1px;
        background: #ddd;
        margin: 35px 0;
    }
    
    /* Links */
    a {
        color: #333;
        text-decoration: none;
    }
    """
    
    # Cover page HTML - simple, clean
    cover_html = """
    <div class="cover">
        <div class="cover-small">a story by</div>
        <div class="cover-name">Sibusiso Mavuso</div>
        <div class="cover-line"></div>
        <div class="cover-title">The Blueprint</div>
    </div>
    """
    
    # Full HTML document with clean cover
    full_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>The Blueprint - Sibusiso Mavuso</title>
    </head>
    <body>
        {cover_html}
        <div class="content">
            {html_body}
        </div>
    </body>
    </html>
    """
    
    # Configure fonts
    font_config = FontConfiguration()
    
    # Generate PDF
    output_file = os.path.join(script_dir, "THE-BLUEPRINT-SIBUSISO-MAVUSO.pdf")
    
    html = HTML(string=full_html)
    css = CSS(string=css_styles, font_config=font_config)
    
    html.write_pdf(output_file, stylesheets=[css], font_config=font_config)
    
    file_size = os.path.getsize(output_file) / 1024
    print(f"Done: {output_file} ({file_size:.1f} KB)")

if __name__ == "__main__":
    create_blueprint_pdf()
