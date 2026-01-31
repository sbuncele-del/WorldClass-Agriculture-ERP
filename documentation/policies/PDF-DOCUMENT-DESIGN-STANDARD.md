# PDF Document Design Standard

## OFFICIAL POLICY - MASAPHOKATI TECHNOLOGIES (PTY) LTD

**Policy Number:** DOC-STD-001  
**Effective Date:** January 2026  
**Classification:** Internal - Mandatory  
**Approved By:** Executive Management  
**Review Cycle:** Annual

---

## 1. Purpose & Scope

This document establishes the **MANDATORY** design standard for all PDF documents produced by Masaphokati Technologies (Pty) Ltd. This standard applies to:

- Marketing materials and proposals
- Legal documents and agreements
- Technical documentation
- Training materials
- Internal documents
- Investor communications
- Client-facing documents

**Non-compliance with this standard is not permitted.**

---

## 2. Master Template Reference

**The authoritative implementation of this standard exists in:**

```
/tools/convert-documentation-to-pdf.js
```

All new PDF converters MUST inherit from or exactly replicate the styling defined in this master template. Any modifications require approval from the Documentation Standards Committee.

---

## 3. Page Configuration

### 3.1 Page Size & Margins

| Property | Value |
|----------|-------|
| **Page Size** | A4 (210mm × 297mm) |
| **Top Margin** | 20mm |
| **Right Margin** | 20mm |
| **Bottom Margin** | 25mm |
| **Left Margin** | 20mm |

### 3.2 Print Settings

```javascript
{
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true
}
```

---

## 4. Typography

### 4.1 Primary Font Family

**Font:** Inter (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 4.2 Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Subtle text, captions |
| Regular | 400 | Body text, paragraphs |
| Semi-Bold | 600 | Subheadings, emphasis |
| Bold | 700 | Headings, titles |
| Extra Bold | 800 | Logo, cover title |

### 4.3 Heading Specifications

| Element | Size | Weight | Color | Additional |
|---------|------|--------|-------|------------|
| **H1** | 24px | 700 | #1e3a8a | 2px bottom border (#1e3a8a) |
| **H2** | 20px | 700 | #1e40af | 1px bottom border (#e5e7eb) |
| **H3** | 16px | 700 | #3730a3 | No border |
| **Body** | 14px | 400 | #1f2937 | line-height: 1.6 |

### 4.4 Heading CSS

```css
h1 {
    color: #1e3a8a;
    border-bottom: 2px solid #1e3a8a;
    padding-bottom: 10px;
    margin-top: 40px;
    font-size: 24px;
    font-weight: 700;
}

h2 {
    color: #1e40af;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 8px;
    margin-top: 30px;
    font-size: 20px;
    font-weight: 700;
}

h3 {
    color: #3730a3;
    margin-top: 25px;
    font-size: 16px;
    font-weight: 700;
}
```

---

## 5. Color Palette (MANDATORY)

### 5.1 Primary Colors

| Name | Hex Code | RGB | CSS Variable | Usage |
|------|----------|-----|--------------|-------|
| **Deep Navy** | `#1e3a8a` | 30, 58, 138 | `--primary-navy` | Headers, H1, borders |
| **Midnight Blue** | `#020617` | 2, 6, 23 | `--midnight-blue` | Cover gradient start |
| **Navy 50** | `#172554` | 23, 37, 84 | `--navy-50` | Cover gradient end |
| **Royal Blue** | `#1e40af` | 30, 64, 175 | `--royal-blue` | H2 headings |
| **Purple Accent** | `#3730a3` | 55, 48, 163 | `--purple-accent` | H3, table headers |

### 5.2 Accent Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Blue Glow** | `rgba(59, 130, 246, 0.4)` | Cover page radial gradient |
| **Purple Glow** | `rgba(147, 51, 234, 0.4)` | Cover page radial gradient |
| **Light Blue** | `#bfdbfe` | Cover subtitle text |
| **Sky Blue** | `#93c5fd` | Cover info labels, tagline |

### 5.3 Text Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Primary Text** | `#1f2937` | Body text |
| **Secondary Text** | `#4b5563` | Intro box text |
| **Muted Text** | `#9ca3af` | Footer text |
| **White** | `#ffffff` | Cover page text |

### 5.4 Background Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Light Gray** | `#f8fafc` | Table alternate rows |
| **Code Background** | `#f1f5f9` | Inline code |
| **Code Block** | `#1e293b` | Code blocks |
| **Intro Box Start** | `#eff6ff` | Intro gradient start |
| **Intro Box End** | `#f5f3ff` | Intro gradient end |

---

## 6. Cover Page Design (MANDATORY)

### 6.1 Cover Page Structure

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                  [GRADIENT BACKGROUND]                  │
│                    with grid overlay                    │
│                                                         │
│         ┌─────────────────────────────────────┐        │
│         │                                     │        │
│         │     [FROSTED GLASS CONTENT BOX]     │        │
│         │                                     │        │
│         │         SiyaBusa ERP                │        │
│         │         (48px, weight 800)          │        │
│         │                                     │        │
│         │       [Document Title]              │        │
│         │       (32px, weight 700)            │        │
│         │                                     │        │
│         │       [Document Category]           │        │
│         │       (18px, light blue)            │        │
│         │                                     │        │
│         │   Masaphokati Technologies (Pty) Ltd│        │
│         │                                     │        │
│         │   ┌────────────────────────────┐   │        │
│         │   │ Document Version: X.X      │   │        │
│         │   │ Effective Date: XXX        │   │        │
│         │   │ Department: XXX            │   │        │
│         │   │ Classification: XXX        │   │        │
│         │   └────────────────────────────┘   │        │
│         │                                     │        │
│         │   ──────────────────────────────   │        │
│         │   WE RULE. WE GOVERN. WE EMPOWER.  │        │
│         │                                     │        │
│         └─────────────────────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Cover Background CSS (EXACT SPECIFICATION)

```css
.cover-page {
    height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
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
```

### 6.3 Grid Overlay CSS (EXACT SPECIFICATION)

```css
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
```

### 6.4 Frosted Glass Content Box CSS (EXACT SPECIFICATION)

```css
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
```

### 6.5 Cover Typography

| Element | Size | Weight | Color | Additional |
|---------|------|--------|-------|------------|
| **Logo** | 48px | 800 | #ffffff | - |
| **Title** | 32px | 700 | #ffffff | - |
| **Subtitle** | 18px | 400 | #bfdbfe | margin-bottom: 40px |
| **Company Name** | 16px | 600 | #ffffff | - |
| **Info Label** | 14px | 600 | #93c5fd | - |
| **Info Value** | 14px | 400 | #ffffff | - |
| **Tagline** | 12px | 400 | #93c5fd | letter-spacing: 2px; UPPERCASE |

### 6.6 Cover Metadata Box CSS

```css
.cover-info {
    margin-top: 25px;
    padding: 20px 30px;
    background: rgba(255, 255, 255, 0.1);
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
```

### 6.7 Tagline CSS

```css
.cover-tagline {
    margin-top: 40px;
    padding-top: 25px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 12px;
    color: #93c5fd;
    font-weight: 400;
    letter-spacing: 2px;
    text-transform: uppercase;
}
```

---

## 7. Content Page Elements

### 7.1 Intro Box (After First H1)

Every document MUST include an intro box immediately after the first H1 heading.

```css
.intro-box {
    background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
    border-left: 4px solid #1e3a8a;
    padding: 20px;
    margin-bottom: 30px;
    border-radius: 0 8px 8px 0;
}

.intro-title {
    font-weight: 700;
    color: #1e3a8a;
    margin-bottom: 8px;
    font-size: 14px;
    text-transform: uppercase;
}

.intro-text {
    color: #4b5563;
    font-size: 14px;
}
```

### 7.2 Table Styling (MANDATORY)

```css
table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 13px;
    page-break-inside: avoid;
}

th {
    background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
    color: white;
    padding: 12px 10px;
    text-align: left;
    font-weight: 600;
}

td {
    padding: 10px;
    border-bottom: 1px solid #e5e7eb;
}

tr:nth-child(even) {
    background-color: #f8fafc;
}
```

### 7.3 Code Block Styling

```css
code {
    background-color: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', monospace;
    font-size: 13px;
}

pre {
    background-color: #1e293b;
    color: #e2e8f0;
    padding: 20px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
    page-break-inside: avoid;
}

pre code {
    background: none;
    padding: 0;
    color: inherit;
}
```

### 7.4 Blockquote Styling

```css
blockquote {
    border-left: 4px solid #7c3aed;
    margin: 20px 0;
    padding: 15px 20px;
    background-color: #faf5ff;
    border-radius: 0 8px 8px 0;
    font-style: italic;
}
```

### 7.5 Horizontal Rule

```css
hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 30px 0;
}
```

### 7.6 Strong/Bold Text

```css
strong {
    color: #1e3a8a;
}
```

---

## 8. Footer Specification (MANDATORY)

### 8.1 Footer Template

```html
<div style="font-size: 9px; color: #9ca3af; width: 100%; text-align: center; padding-bottom: 10px; font-family: sans-serif;">
    <span>Masaphokati Technologies (Pty) Ltd - Confidential</span>
    <span style="margin-left: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>
```

### 8.2 Footer Rules

- Font size: 9px
- Color: #9ca3af (muted gray)
- Position: Center aligned
- Content: Company name, confidentiality notice, page numbers
- Format: "Masaphokati Technologies (Pty) Ltd - Confidential | Page X of Y"

---

## 9. Document Metadata (MANDATORY)

### 9.1 Required Metadata Fields

Every document MUST include these fields on the cover page:

| Field | Description | Example |
|-------|-------------|---------|
| **Document Version** | Semantic version (MAJOR.MINOR) | 1.0, 2.1 |
| **Effective Date** | Month Year format | January 2026 |
| **Department** | Responsible department | Training & Development |
| **Classification** | Security classification | Internal, Confidential |

### 9.2 Classification Levels

| Level | Description | Distribution |
|-------|-------------|--------------|
| **Public** | Can be freely shared | Marketing, website |
| **Internal** | Company use only | Policies, training |
| **Confidential** | Restricted access | Contracts, pricing |
| **Strictly Confidential** | Need-to-know only | Security, strategy |

---

## 10. Company Information

### 10.1 Official Company Name

**ALWAYS USE:** Masaphokati Technologies (Pty) Ltd

**NEVER USE:**
- Masaphokati (without Technologies)
- Masaphokati Tech
- The company
- MT
- MasTech

### 10.2 Product Name

**ALWAYS USE:** SiyaBusa ERP

**NEVER USE:**
- Siyabusa
- SIYABUSA
- Siya Busa
- SiyaBusa (without ERP in full references)

### 10.3 Official Tagline

**EXACT TEXT:** "We Rule. We Govern. We Empower."

- Must be in title case with periods
- Must appear on all cover pages
- Font: 12px, letter-spacing: 2px, uppercase

### 10.4 Contact Information

| Field | Value |
|-------|-------|
| Website | www.siyabusa.co.za |
| Partner Email | partners@siyabusa.co.za |
| General Email | info@siyabusa.co.za |

---

## 11. Page Break Rules

### 11.1 Mandatory Page Breaks

Use `page-break-before: always` for:
- Cover page (automatic via `page-break-after: always`)
- Major sections (Schedules, Appendices)
- Legal signature pages
- Individual forms within a document

### 11.2 Avoid Page Breaks

Use `page-break-inside: avoid` for:
- Tables
- Code blocks
- Headings (use `page-break-after: avoid`)
- Lists (when practical)

### 11.3 HTML for Page Breaks

```html
<div style="page-break-before: always;"></div>
```

---

## 12. Implementation Checklist

Before generating any PDF, verify:

- [ ] Master template CSS is unchanged from `/tools/convert-documentation-to-pdf.js`
- [ ] Cover page uses exact gradient specification
- [ ] Grid overlay is present
- [ ] Frosted glass box styling matches specification
- [ ] Inter font family is loaded from Google Fonts
- [ ] All required metadata fields are present
- [ ] Company name is "Masaphokati Technologies (Pty) Ltd"
- [ ] Product name is "SiyaBusa ERP"
- [ ] Tagline is exactly "We Rule. We Govern. We Empower."
- [ ] Footer includes company name, confidentiality, page numbers
- [ ] Tables use gradient header specification
- [ ] Intro box appears after first H1
- [ ] Colors match exact hex values in this document

---

## 13. Non-Compliance Consequences

Failure to adhere to this standard will result in:

1. **Document Rejection** - Non-compliant documents will not be approved
2. **Mandatory Revision** - Documents must be regenerated using correct template
3. **Quality Review** - Repeated violations trigger documentation audit

---

## 14. Template Maintenance

### 14.1 Master Template Location

```
/tools/convert-documentation-to-pdf.js
```

### 14.2 Authorized Modifications

Changes to this standard require:
1. Written proposal with justification
2. Review by Documentation Standards Committee
3. Executive approval
4. Version update to this policy document
5. Update to master template

### 14.3 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Documentation Team | Initial release - locked design standard |

---

## 15. Quick Reference Card

### Colors
- Primary Navy: `#1e3a8a`
- Midnight: `#020617`
- Purple Accent: `#3730a3`
- Text: `#1f2937`

### Fonts
- Family: Inter (Google Fonts)
- Weights: 300, 400, 600, 700, 800

### Cover Gradient
```css
background: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 20%),
    radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.4) 0%, transparent 20%),
    linear-gradient(135deg, #020617 0%, #1e3a8a 50%, #172554 100%);
```

### Frosted Glass
```css
background: rgba(15, 23, 42, 0.6);
backdrop-filter: blur(12px);
border-radius: 24px;
```

### Table Header
```css
background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
```

---

*This document is the official design standard for Masaphokati Technologies (Pty) Ltd. Compliance is mandatory for all documentation.*

**Policy Number:** DOC-STD-001  
**Document Version:** 1.0  
**Effective Date:** January 2026  
**Classification:** Internal - Mandatory

---

**© 2026 Masaphokati Technologies (Pty) Ltd. All rights reserved.**
