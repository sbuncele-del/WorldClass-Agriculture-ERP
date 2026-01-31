# SiyaBusa ERP Brand Style Guide

## 1. Introduction

This Brand Style Guide establishes the visual and written standards for all SiyaBusa ERP documentation. Adherence to these guidelines ensures consistency, professionalism, and brand recognition across all communications.

> **📋 PDF DOCUMENT STANDARD:** All PDF documents MUST comply with the official [PDF Document Design Standard](policies/PDF-DOCUMENT-DESIGN-STANDARD.md). This standard is MANDATORY and non-negotiable.

### 1.1 Purpose

- Maintain consistent brand identity across all documents
- Ensure professional presentation to clients, investors, and partners
- Provide clear standards for internal and external communications
- Streamline document creation process

### 1.2 Scope

This guide applies to:
- Marketing materials
- Technical documentation
- Legal documents
- Investor communications
- Training materials
- Internal documents
- Email communications

---

## 2. Brand Identity

### 2.1 Company Information

| Field | Value |
|-------|-------|
| **Legal Name** | Masaphokati Technologies (Pty) Ltd |
| **Product Name** | SiyaBusa ERP |
| **Tagline** | "We Rule. We Govern. We Empower." |
| **Industry** | Enterprise Software / ERP |

### 2.2 Brand Values

1. **Excellence** — Delivering world-class enterprise solutions
2. **Innovation** — AI-powered, modern technology stack
3. **Trust** — POPIA compliant, SOC 2 Type II certified
4. **Empowerment** — Enabling African businesses to thrive

---

## 3. Color Palette

> **⚠️ IMPORTANT:** For PDF document colors, refer to the official [PDF Document Design Standard](policies/PDF-DOCUMENT-DESIGN-STANDARD.md)

### 3.1 Primary Colors (PDF Documents)

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Deep Navy** | `#1e3a8a` | 30, 58, 138 | Headers, H1, primary borders |
| **Midnight Blue** | `#020617` | 2, 6, 23 | Cover gradient start |
| **Navy 50** | `#172554` | 23, 37, 84 | Cover gradient end |
| **Royal Blue** | `#1e40af` | 30, 64, 175 | H2 headings |
| **Purple Accent** | `#3730a3` | 55, 48, 163 | H3, table headers |

### 3.2 Secondary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Blue Glow** | `rgba(59, 130, 246, 0.4)` | - | Cover page radial gradient |
| **Purple Glow** | `rgba(147, 51, 234, 0.4)` | - | Cover page radial gradient |
| **Success Green** | `#10b981` | 16, 185, 129 | Success states, checkmarks |
| **Slate Gray** | `#64748b` | 100, 116, 139 | Body text, secondary info |
| **Light Gray** | `#f8fafc` | 248, 250, 252 | Backgrounds, table rows |

### 3.3 Text Colors

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **Primary Text** | `#1f2937` | Main body text |
| **Secondary Text** | `#4b5563` | Intro box text, captions |
| **Muted Text** | `#9ca3af` | Footer text, hints |
| **White Text** | `#ffffff` | Cover page, dark backgrounds |
| **Light Blue** | `#bfdbfe` | Cover subtitle text |
| **Sky Blue** | `#93c5fd` | Cover info labels, tagline |

### 3.4 Gradient Specifications (OFFICIAL)

**Cover Page Gradient (MANDATORY):**
```css
background: 
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 20%),
    radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.4) 0%, transparent 20%),
    linear-gradient(135deg, #020617 0%, #1e3a8a 50%, #172554 100%);
```

**Frosted Glass Box:**
```css
background: rgba(15, 23, 42, 0.6);
backdrop-filter: blur(12px);
border-radius: 24px;
```

**Table Header Gradient:**
```css
background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
```

**Intro Box Gradient:**
```css
background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
```

---

## 4. Typography

> **⚠️ IMPORTANT:** For PDF typography specifications, refer to [PDF Document Design Standard](policies/PDF-DOCUMENT-DESIGN-STANDARD.md)

### 4.1 Font Families

| Usage | Primary Font | Fallback |
|-------|-------------|----------|
| **All Documents (PDF)** | Inter | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |
| **Code/Technical** | Consolas | Courier New, monospace |

**Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
```

### 4.2 Font Weights (Inter)

| Weight | Value | Usage |
|--------|-------|-------|
| **Light** | 300 | Subtle text, captions |
| **Regular** | 400 | Body text, paragraphs |
| **Semi-Bold** | 600 | Subheadings, emphasis |
| **Bold** | 700 | Headings, titles |
| **Extra Bold** | 800 | Logo on cover page |

### 4.3 Font Sizes (PDF Documents)

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| **Cover Logo** | 48px | 800 | #ffffff |
| **Cover Title** | 32px | 700 | #ffffff |
| **Cover Subtitle** | 18px | 400 | #bfdbfe |
| **H1 Heading** | 24px | 700 | #1e3a8a |
| **H2 Heading** | 20px | 700 | #1e40af |
| **H3 Heading** | 16px | 700 | #3730a3 |
| **Body Text** | 14px | 400 | #1f2937 |
| **Table Text** | 13px | 400 | #1f2937 |
| **Code** | 13px | 400 | monospace |
| **Footer** | 9px | 400 | #9ca3af |
| **Tagline** | 12px | 400 | #93c5fd |

### 4.3 Text Formatting Rules

- **Bold**: Use for emphasis, key terms, and headings
- **Italic**: Use for technical terms first mention, quotes, citations
- **UPPERCASE**: Limit to acronyms and short headings only
- **Underline**: Avoid; use for hyperlinks only

---

## 5. Document Structure

### 5.1 Cover Page Elements

Every formal document MUST include:

1. **Product Logo/Name** — "SiyaBusa ERP" prominently displayed
2. **Document Title** — Clear, descriptive title
3. **Document Category** — Type of document (e.g., Technical Documentation)
4. **Company Name** — "Masaphokati Technologies (Pty) Ltd"
5. **Document Metadata Box:**
   - Document Version
   - Effective Date
   - Classification
   - Compliance (where applicable)
6. **Tagline** — "We Rule. We Govern. We Empower."

### 5.2 Document Classifications

| Classification | Description | Usage |
|---------------|-------------|-------|
| **Public** | Can be freely distributed | Marketing materials, public website content |
| **Internal** | For company use only | Internal guides, processes |
| **Confidential** | Restricted distribution | Client data, financial reports |
| **Strictly Confidential** | Need-to-know basis | Strategic plans, security docs |

### 5.3 Classification by Document Type

| Document Type | Default Classification |
|---------------|----------------------|
| Marketing Materials | Public |
| Product Brochures | Public |
| Pricing Guides | Confidential |
| Technical Documentation | Internal |
| API Documentation | Confidential |
| Legal Agreements | Confidential |
| Investor Documents | Confidential |
| Training Materials | Internal |
| Security Whitepapers | Confidential |
| Case Studies | Public |

---

## 6. Page Layout

### 6.1 Margins

| Document Type | Top | Bottom | Left | Right |
|--------------|-----|--------|------|-------|
| **Standard A4** | 25mm | 25mm | 20mm | 20mm |
| **Formal/Legal** | 30mm | 30mm | 25mm | 25mm |
| **Presentation** | 15mm | 15mm | 15mm | 15mm |

### 6.2 Headers & Footers

**Header (optional):**
- Company name or document title (left aligned)
- Section name (right aligned)
- Height: 15mm

**Footer (required):**
- Company confidentiality notice (center)
- Page number (right aligned)
- Format: "Page X of Y"

### 6.3 Page Numbering

- Cover page: No number displayed
- Table of Contents: Roman numerals (i, ii, iii)
- Main content: Arabic numerals (1, 2, 3)

---

## 7. Visual Elements

### 7.1 Tables

**Styling:**
- Header row: Primary Blue background (#1e3a5f), white text
- Alternating rows: White / Light Gray (#f8fafc)
- Borders: 1px solid #e2e8f0
- Border radius: 8px (rounded corners)
- Padding: 12px horizontal, 10px vertical

### 7.2 Callout Boxes

| Type | Border Color | Background | Icon |
|------|-------------|------------|------|
| **Information** | #3b82f6 | #eff6ff | ℹ️ |
| **Success** | #10b981 | #ecfdf5 | ✓ |
| **Warning** | #f59e0b | #fffbeb | ⚠️ |
| **Important** | #ef4444 | #fef2f2 | ❗ |

### 7.3 Badges & Status Indicators

**Production Badges:**
```
✓ Production Ready  |  ✓ POPIA Compliant  |  ✓ SOC 2 Type II
```

**Status Colors:**
- Complete: Green (#10b981)
- In Progress: Amber (#f59e0b)  
- Planned: Blue (#3b82f6)
- Critical: Red (#ef4444)

---

## 8. Writing Standards

### 8.1 Tone of Voice

- **Professional** — Authoritative but approachable
- **Clear** — Avoid jargon; explain technical terms
- **Concise** — Get to the point; respect reader's time
- **Confident** — State facts directly; avoid hedging language

### 8.2 Grammar & Style

- Use active voice (preferred over passive)
- Write in present tense for current features
- Use Oxford comma in lists
- Spell out numbers one through nine; use numerals for 10+
- Use sentence case for headings (not Title Case)
- Avoid contractions in formal documents

### 8.3 Terminology

| Use This | Not This |
|----------|----------|
| SiyaBusa ERP | Siyabusa, SIYABUSA, Siya Busa |
| Masaphokati Technologies | Masaphokati Tech, the company |
| multi-tenant | multi tenant, multitenant |
| real-time | realtime, real time |
| AI-powered | AI powered, ai-powered |

---

## 9. Compliance Badges

### 9.1 Standard Compliance Indicators

Always include relevant compliance badges:

| Badge | When to Include |
|-------|-----------------|
| **POPIA Compliant** | All documents handling personal data |
| **SOC 2 Type II** | Security-related documents |
| **ISO 27001** | Information security documents |
| **GDPR Ready** | Documents for EU clients |

### 9.2 Badge Format

Display as rounded pills with checkmark:
```
✓ POPIA Compliant  |  ✓ SOC 2 Type II
```

---

## 10. File Naming Convention

### 10.1 Standard Format

```
[TYPE]-[DOCUMENT-NAME]-v[VERSION].[EXT]
```

**Examples:**
- `LEGAL-NDA-TEMPLATE-v1.0.pdf`
- `MARKETING-PRODUCT-OVERVIEW-v2.1.pdf`
- `TECH-API-DOCUMENTATION-v1.0.pdf`

### 10.2 Type Prefixes

| Prefix | Document Type |
|--------|---------------|
| LEGAL | Legal documents |
| MARKETING | Marketing materials |
| TECH | Technical documentation |
| TRAINING | Training materials |
| INVESTOR | Investor documents |
| INTERNAL | Internal documents |

---

## 11. Version Control

### 11.1 Version Numbering

Use semantic versioning: **MAJOR.MINOR**

- **MAJOR** (1.0, 2.0): Significant content changes
- **MINOR** (1.1, 1.2): Minor updates, corrections

### 11.2 Document History Table

Include in formal documents:

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | Document Team | Initial release |
| 1.1 | 2026-02-01 | Document Team | Updated pricing section |

---

## 12. Templates

### 12.1 Available Templates

| Template | Format | Usage |
|----------|--------|-------|
| Cover Page | HTML/Word | Standard document cover |
| Technical Doc | Markdown | Technical documentation |
| Legal Agreement | Word | Contracts, agreements |
| Proposal | HTML | Client proposals |
| One-Pager | Word/PDF | Executive summaries |

### 12.2 Template Location

```
/documentation/templates/
├── cover-page-template.html
├── technical-doc-template.md
├── legal-agreement-template.docx
├── proposal-template.html
└── one-pager-template.docx
```

---

## 13. Quality Checklist

Before publishing any document, verify:

- [ ] Correct company name used throughout
- [ ] Document version and date included
- [ ] Appropriate classification assigned
- [ ] Consistent font usage
- [ ] Color palette adhered to
- [ ] Spelling and grammar checked
- [ ] All links functional
- [ ] Page numbers present
- [ ] Footer with confidentiality notice
- [ ] File named according to convention

---

## 14. Contact

For questions about brand guidelines or document standards:

**Masaphokati Technologies (Pty) Ltd**  
Documentation Team  
Website: [siyabusa.co.za](https://siyabusa.co.za)

---

*This document is the property of Masaphokati Technologies (Pty) Ltd and is intended for internal use.*

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Classification:** Internal
