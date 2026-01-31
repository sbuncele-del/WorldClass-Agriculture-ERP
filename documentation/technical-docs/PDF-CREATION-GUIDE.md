# SiyaBusa ERP - PDF Creation Guide

## Brand-Compliant Document Production Standard

---

## Overview

This guide documents how to create professional PDFs for SiyaBusa ERP documentation to ensure brand consistency across all materials.

---

## 1. Brand Standards

### Color Palette

| Use | Color | Hex Code |
|:----|:------|:---------|
| Primary Gradient Start | Deep Navy | #1a0a2e |
| Primary Gradient End | Deep Purple | #16082a |
| Accent | Purple | #8b5cf6 |
| Accent Light | Violet | #a78bfa |
| Text Primary | White | #ffffff |
| Text Secondary | Gray | #94a3b8 |
| Links | Light Purple | #c4b5fd |

### Typography

| Element | Font | Weight | Size |
|:--------|:-----|:-------|:-----|
| Headings | Inter | Bold (700) | 32-48px |
| Subheadings | Inter | SemiBold (600) | 18-24px |
| Body Text | Inter | Regular (400) | 12-14px |
| Code | Fira Code | Regular (400) | 11px |

### Logo Usage

- Primary logo: White on dark backgrounds
- Minimum clear space: 20px on all sides
- Minimum size: 120px wide

---

## 2. PDF Generation Tool

### Location
```
/tools/convert-documentation-to-pdf.js
```

### Dependencies

```json
{
  "puppeteer": "^21.0.0",
  "marked": "^9.0.0"
}
```

### Installation

```bash
cd /workspaces/WorldClass-ERP
npm install puppeteer marked
```

---

## 3. Running the Converter

### Basic Usage

```bash
node tools/convert-documentation-to-pdf.js
```

### What It Does

1. Scans all markdown files in `/documentation/`
2. Converts each to branded PDF
3. Outputs to `/documentation/pdf-output/`
4. Creates zip packages per category

### Output Structure

```
documentation/
├── pdf-output/
│   ├── onboarding/
│   │   ├── GETTING-STARTED-GUIDE.pdf
│   │   ├── FIRST-DAY-CHECKLIST.pdf
│   │   └── ADMIN-SETUP-GUIDE.pdf
│   ├── training/
│   │   ├── TRAINING-OVERVIEW.pdf
│   │   ├── FINANCIAL-MODULE-TRAINING.pdf
│   │   └── ...
│   └── packages/
│       ├── onboarding-package.zip
│       ├── training-package.zip
│       └── ...
```

---

## 4. PDF Template Structure

### Cover Page

Every PDF starts with a branded cover page:

```html
<div class="cover-page">
  <div class="logo">SiyaBusa</div>
  <h1 class="title">{Document Title}</h1>
  <p class="subtitle">{Document Category}</p>
  <div class="meta">
    <p>Version 1.0</p>
    <p>{Current Date}</p>
  </div>
</div>
```

### Page Header

```html
<header>
  <span class="doc-title">{Document Title}</span>
  <span class="company">Masaphokati Technologies</span>
</header>
```

### Page Footer

```html
<footer>
  <span class="copyright">© 2026 Masaphokati Technologies (Pty) Ltd</span>
  <span class="page-number">Page {n} of {total}</span>
</footer>
```

---

## 5. Styling Reference

### Cover Page CSS

```css
.cover-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1a0a2e 0%, #16082a 100%);
  color: white;
  text-align: center;
  page-break-after: always;
}

.cover-page .logo {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 40px;
}

.cover-page .title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
}

.cover-page .subtitle {
  font-size: 18px;
  color: #94a3b8;
  margin-bottom: 60px;
}
```

### Content Styling

```css
body {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  line-height: 1.6;
  color: #1e293b;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a0a2e;
  border-bottom: 2px solid #8b5cf6;
  padding-bottom: 8px;
  margin-top: 24px;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a0a2e;
  margin-top: 20px;
}

h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

th {
  background: #f1f5f9;
  padding: 10px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #8b5cf6;
}

td {
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
}

code {
  font-family: 'Fira Code', monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}
```

---

## 6. Adding New Documents

### Step 1: Create Markdown File

Create your document in the appropriate folder:

```markdown
# Document Title

## Section 1

Content here...

### Subsection 1.1

More content...

| Column 1 | Column 2 |
|:---------|:---------|
| Data | Data |
```

### Step 2: Add to Converter

Edit `tools/convert-documentation-to-pdf.js`:

```javascript
const documents = [
  // ... existing documents
  {
    input: 'documentation/category/YOUR-NEW-DOC.md',
    output: 'documentation/pdf-output/category/YOUR-NEW-DOC.pdf',
    title: 'Your Document Title',
    category: 'Category Name'
  }
];
```

### Step 3: Run Converter

```bash
node tools/convert-documentation-to-pdf.js
```

### Step 4: Verify Output

Check the generated PDF for:
- ✓ Cover page renders correctly
- ✓ All content visible
- ✓ Tables formatted properly
- ✓ Code blocks styled
- ✓ Page numbers correct
- ✓ No content cutoff

---

## 7. Markdown Best Practices

### Use Proper Heading Hierarchy

```markdown
# Main Title (H1) - Only one per document

## Major Section (H2)

### Subsection (H3)

#### Minor Point (H4)
```

### Tables

Always include alignment markers:

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| Data | Data   | Data  |
```

### Code Blocks

Use fenced code blocks with language:

```markdown
```javascript
const example = 'code';
```
```

### Callout Boxes

Use blockquotes for tips/warnings:

```markdown
> **💡 Pro Tip:** This is a helpful hint.

> **⚠️ Warning:** This is important to note.
```

---

## 8. Quality Checklist

Before finalizing any PDF:

### Content Check
- [ ] Spelling and grammar correct
- [ ] All links working
- [ ] Information accurate and up-to-date
- [ ] No placeholder text remaining

### Brand Check
- [ ] Cover page present
- [ ] Correct logo usage
- [ ] Proper color scheme
- [ ] Consistent typography

### Technical Check
- [ ] All pages render correctly
- [ ] Tables fit within page margins
- [ ] Images display properly
- [ ] Code blocks readable

### Compliance Check
- [ ] Version number included
- [ ] Date included
- [ ] Copyright notice present
- [ ] Company name correct (Masaphokati Technologies)

---

## 9. Troubleshooting

### Common Issues

**Issue:** Tables overflow page margins
**Solution:** Reduce column widths or split table

**Issue:** Code blocks cut off
**Solution:** Wrap long lines or use smaller font

**Issue:** Page breaks in wrong places
**Solution:** Add manual breaks:
```markdown
<div style="page-break-after: always;"></div>
```

**Issue:** Fonts not loading
**Solution:** Ensure Puppeteer has network access to Google Fonts

---

## 10. Contact

For questions about documentation standards:

**Owner:** Marketing Team  
**Email:** marketing@masaphokati.co.za  
**Slack:** #documentation

---

**Document:** PDF Creation Guide v1.0  
**Last Updated:** January 2026  
**Owner:** Masaphokati Technologies (Pty) Ltd
