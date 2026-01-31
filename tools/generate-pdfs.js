#!/usr/bin/env node

/**
 * WorldClass ERP - Professional PDF Documentation Generator
 * Converts markdown documentation to investor-ready PDFs
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { marked } = require('marked');

// Professional color scheme
const COLORS = {
  primary: '#1e40af', // Professional blue
  secondary: '#64748b', // Slate gray
  accent: '#0ea5e9', // Sky blue
  success: '#10b981', // Green
  text: '#1e293b', // Dark slate
  lightBg: '#f8fafc', // Light background
  border: '#e2e8f0' // Border gray
};

// Key documents to convert (organized by category)
const DOCUMENTS = {
  'Executive Overview': [
    'COMPLETE-SYSTEM-STATUS-NOV-2024.md',
    'PRODUCTION-READINESS-ASSESSMENT.md',
    'STATUS-UPDATE-DEC30-2025.md',
    'BACKEND_API_COMPLETE.md'
  ],
  'Technical Documentation': [
    'AWS-DEPLOYMENT-STATUS.md',
    'API-MODULE-DIAGNOSTIC-TRACKER.md',
    'FRONTEND-BACKEND-INTEGRATION.md',
    'DATABASE-MIGRATION-SUCCESS.md'
  ],
  'Module Implementation': [
    'CASH-MANAGEMENT-COMPLETE.md',
    'COMPLIANCE-MODULE-COMPLETE.md',
    'ASSET-MANAGEMENT-COMPLETE-WORKING.md',
    'LOGISTICS-ENTERPRISE-IMPLEMENTATION-STATUS.md'
  ],
  'AI & Innovation': [
    'AI-ASSISTANT-ENHANCEMENT.md',
    'AI-AGENTS-QUICK-START.md',
    'backend/AI-AGENTS-DOCUMENTATION.md'
  ],
  'Deployment & Operations': [
    'DEPLOYMENT-CHECKLIST.md',
    'MASTER-DEPLOYMENT-PLAN.md',
    'READY-TO-DEPLOY.md',
    'PRODUCTION-READINESS-PLAN.md'
  ]
};

class ProfessionalPDFGenerator {
  constructor(outputDir = './investor-docs') {
    this.outputDir = outputDir;
    this.pageMargin = 50;
    this.contentWidth = 500;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  async generateCategoryPDF(category, files) {
    const outputPath = path.join(this.outputDir, `${category.replace(/\s+/g, '-')}.pdf`);
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: this.pageMargin,
        bottom: this.pageMargin,
        left: this.pageMargin,
        right: this.pageMargin
      },
      info: {
        Title: `WorldClass ERP - ${category}`,
        Author: 'WorldClass ERP',
        Subject: category,
        Keywords: 'ERP, Enterprise, Software, Business Management'
      }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Add cover page
    this.addCoverPage(doc, category);

    // Add table of contents
    doc.addPage();
    this.addTableOfContents(doc, files);

    // Process each file
    for (const file of files) {
      const filePath = path.join('/workspaces/WorldClass-ERP', file);
      if (fs.existsSync(filePath)) {
        doc.addPage();
        await this.processMarkdownFile(doc, filePath, file);
      } else {
        console.log(`⚠️  File not found: ${file}`);
      }
    }

    // Add footer to all pages
    this.addFooter(doc);

    doc.end();

    return new Promise((resolve) => {
      stream.on('finish', () => {
        console.log(`✅ Generated: ${outputPath}`);
        resolve(outputPath);
      });
    });
  }

  addCoverPage(doc, category) {
    // Header bar
    doc.rect(0, 0, doc.page.width, 120)
       .fill(COLORS.primary);

    // Logo/Title area
    doc.fillColor('#ffffff')
       .fontSize(36)
       .font('Helvetica-Bold')
       .text('WorldClass ERP', this.pageMargin, 30);

    doc.fontSize(18)
       .font('Helvetica')
       .text('Enterprise Resource Planning System', this.pageMargin, 75);

    // Category title
    doc.fillColor(COLORS.text)
       .fontSize(32)
       .font('Helvetica-Bold')
       .text(category, this.pageMargin, 200, {
         width: this.contentWidth,
         align: 'left'
       });

    // Subtitle
    doc.fontSize(14)
       .fillColor(COLORS.secondary)
       .font('Helvetica')
       .text('Comprehensive Documentation Package', this.pageMargin, 250);

    // Status badges
    const badgeY = 320;
    this.addBadge(doc, 'Production Ready', this.pageMargin, badgeY, COLORS.success);
    this.addBadge(doc, '25+ Modules', this.pageMargin + 140, badgeY, COLORS.accent);
    this.addBadge(doc, 'AWS Deployed', this.pageMargin + 270, badgeY, COLORS.primary);

    // Key features
    doc.fontSize(12)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text('Key Features:', this.pageMargin, 400);

    const features = [
      '✓ Multi-tenant Architecture',
      '✓ 400+ REST API Endpoints',
      '✓ Advanced Financial Modules',
      '✓ AI-Powered Assistant',
      '✓ Industry-Specific Solutions',
      '✓ Real-time Analytics'
    ];

    doc.font('Helvetica').fontSize(11);
    features.forEach((feature, i) => {
      doc.fillColor(COLORS.text)
         .text(feature, this.pageMargin + 20, 425 + (i * 20));
    });

    // Footer
    doc.fontSize(10)
       .fillColor(COLORS.secondary)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric' 
       })}`, 
       this.pageMargin, 
       doc.page.height - 80,
       { align: 'center', width: this.contentWidth });
  }

  addBadge(doc, text, x, y, color) {
    doc.roundedRect(x, y, 120, 30, 5)
       .fill(color);
    
    doc.fillColor('#ffffff')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(text, x, y + 9, {
         width: 120,
         align: 'center'
       });
  }

  addTableOfContents(doc, files) {
    doc.fillColor(COLORS.primary)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('Table of Contents', this.pageMargin, this.pageMargin);

    doc.moveTo(this.pageMargin, this.pageMargin + 35)
       .lineTo(this.pageMargin + 200, this.pageMargin + 35)
       .strokeColor(COLORS.accent)
       .lineWidth(2)
       .stroke();

    let y = this.pageMargin + 60;
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(COLORS.text);

    files.forEach((file, i) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = this.pageMargin;
      }

      const title = file.replace('.md', '').replace(/-/g, ' ');
      doc.text(`${i + 1}. ${title}`, this.pageMargin + 10, y);
      y += 25;
    });
  }

  async processMarkdownFile(doc, filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = fileName.replace('.md', '').replace(/-/g, ' ');

    // Document header
    doc.fillColor(COLORS.primary)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text(title, this.pageMargin, this.pageMargin);

    doc.moveTo(this.pageMargin, this.pageMargin + 30)
       .lineTo(doc.page.width - this.pageMargin, this.pageMargin + 30)
       .strokeColor(COLORS.border)
       .lineWidth(1)
       .stroke();

    let y = this.pageMargin + 50;

    // Parse and render markdown
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = this.pageMargin;
      }

      // Headers
      if (line.startsWith('# ')) {
        y += 10;
        doc.fillColor(COLORS.primary)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(line.replace('# ', ''), this.pageMargin, y);
        y += 25;
      } else if (line.startsWith('## ')) {
        y += 8;
        doc.fillColor(COLORS.primary)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text(line.replace('## ', ''), this.pageMargin, y);
        y += 20;
      } else if (line.startsWith('### ')) {
        doc.fillColor(COLORS.text)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(line.replace('### ', ''), this.pageMargin, y);
        y += 18;
      }
      // Lists
      else if (line.match(/^[\*\-\+]\s/)) {
        doc.fillColor(COLORS.text)
           .fontSize(10)
           .font('Helvetica')
           .text('•  ' + line.replace(/^[\*\-\+]\s/, ''), this.pageMargin + 15, y, {
             width: this.contentWidth - 15
           });
        y += 16;
      }
      // Numbered lists
      else if (line.match(/^\d+\.\s/)) {
        doc.fillColor(COLORS.text)
           .fontSize(10)
           .font('Helvetica')
           .text(line, this.pageMargin + 15, y, {
             width: this.contentWidth - 15
           });
        y += 16;
      }
      // Code blocks
      else if (line.startsWith('```')) {
        y += 5;
        // Skip rendering code blocks for now (just add spacing)
        y += 10;
      }
      // Checkboxes
      else if (line.includes('- [ ]') || line.includes('- [x]')) {
        const checked = line.includes('- [x]');
        const text = line.replace(/- \[[x ]\]\s*/, '');
        doc.fillColor(checked ? COLORS.success : COLORS.secondary)
           .fontSize(10)
           .text(checked ? '✓ ' : '○ ', this.pageMargin + 15, y);
        doc.fillColor(COLORS.text)
           .text(text, this.pageMargin + 30, y, {
             width: this.contentWidth - 30
           });
        y += 16;
      }
      // Regular text
      else if (line.trim()) {
        doc.fillColor(COLORS.text)
           .fontSize(10)
           .font('Helvetica')
           .text(line, this.pageMargin, y, {
             width: this.contentWidth,
             align: 'left'
           });
        y += 16;
      }
      // Empty line
      else {
        y += 8;
      }
    }
  }

  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(this.pageMargin, doc.page.height - 50)
         .lineTo(doc.page.width - this.pageMargin, doc.page.height - 50)
         .strokeColor(COLORS.border)
         .lineWidth(0.5)
         .stroke();

      // Footer text
      doc.fillColor(COLORS.secondary)
         .fontSize(8)
         .font('Helvetica')
         .text(
           'WorldClass ERP | Confidential & Proprietary',
           this.pageMargin,
           doc.page.height - 35,
           {
             width: this.contentWidth,
             align: 'center'
           }
         );

      // Page number
      doc.text(
        `Page ${i + 1}`,
        doc.page.width - this.pageMargin - 50,
        doc.page.height - 35,
        {
          width: 50,
          align: 'right'
        }
      );
    }
  }

  async generateAllPDFs() {
    console.log('🚀 WorldClass ERP PDF Generator\n');
    console.log('📁 Output directory:', this.outputDir);
    console.log('');

    const results = [];

    for (const [category, files] of Object.entries(DOCUMENTS)) {
      console.log(`📄 Generating: ${category}...`);
      try {
        const pdfPath = await this.generateCategoryPDF(category, files);
        results.push({ category, path: pdfPath, success: true });
      } catch (error) {
        console.error(`❌ Error generating ${category}:`, error.message);
        results.push({ category, error: error.message, success: false });
      }
    }

    // Generate index/master document
    await this.generateIndexPDF(results);

    return results;
  }

  async generateIndexPDF(results) {
    const outputPath = path.join(this.outputDir, '00-INDEX.pdf');
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: this.pageMargin, bottom: this.pageMargin, left: this.pageMargin, right: this.pageMargin }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Cover page
    doc.rect(0, 0, doc.page.width, 150).fill(COLORS.primary);
    
    doc.fillColor('#ffffff')
       .fontSize(42)
       .font('Helvetica-Bold')
       .text('WorldClass ERP', this.pageMargin, 40);

    doc.fontSize(20)
       .font('Helvetica')
       .text('Complete Documentation Package', this.pageMargin, 95);

    // Summary
    doc.fillColor(COLORS.text)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Documentation Index', this.pageMargin, 200);

    let y = 240;
    doc.fontSize(11).font('Helvetica');

    results.forEach((result, i) => {
      if (result.success) {
        doc.fillColor(COLORS.text)
           .text(`${i + 1}. ${result.category}`, this.pageMargin + 20, y);
        
        const fileName = path.basename(result.path);
        doc.fillColor(COLORS.secondary)
           .fontSize(9)
           .text(`   📁 ${fileName}`, this.pageMargin + 30, y + 15);
        
        y += 40;
      }
    });

    // Instructions
    y += 30;
    doc.fillColor(COLORS.primary)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('How to Use These Documents', this.pageMargin, y);

    y += 30;
    doc.fillColor(COLORS.text)
       .fontSize(10)
       .font('Helvetica')
       .text('• Each PDF contains related documentation organized by topic', this.pageMargin + 20, y);
    y += 20;
    doc.text('• Documents are formatted for professional presentation', this.pageMargin + 20, y);
    y += 20;
    doc.text('• Share directly via email, WhatsApp, or other platforms', this.pageMargin + 20, y);
    y += 20;
    doc.text('• All documents are investor and stakeholder ready', this.pageMargin + 20, y);

    doc.end();

    return new Promise((resolve) => {
      stream.on('finish', () => {
        console.log(`✅ Generated master index: ${outputPath}`);
        resolve(outputPath);
      });
    });
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new ProfessionalPDFGenerator();
  generator.generateAllPDFs()
    .then((results) => {
      console.log('\n✨ PDF Generation Complete!\n');
      console.log('📦 Summary:');
      const successful = results.filter(r => r.success).length;
      console.log(`   ✅ ${successful} documents generated`);
      console.log(`   📁 Location: ${generator.outputDir}`);
      console.log('\n📤 Ready to share on WhatsApp, email, or any platform!');
    })
    .catch((error) => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
}

module.exports = ProfessionalPDFGenerator;
