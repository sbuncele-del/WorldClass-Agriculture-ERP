#!/usr/bin/env node

/**
 * Convert HTML Templates to Word Documents (.docx)
 * Uses html-docx-js for conversion
 */

const fs = require('fs');
const path = require('path');
const HTMLtoDOCX = require('html-to-docx');

const TEMPLATES_DIR = './documentation/templates';
const OUTPUT_DIR = './documentation/templates/word';

async function convertHTMLtoWord(htmlPath, outputPath) {
  try {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Convert to DOCX
    const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      font: 'Segoe UI',
      fontSize: 22, // in half-points (11pt)
      margins: {
        top: 1440, // 1 inch in twips
        right: 1440,
        bottom: 1440,
        left: 1440
      }
    });
    
    fs.writeFileSync(outputPath, docxBuffer);
    console.log(`   ✅ Created: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📄 HTML to Word Converter');
  console.log('='.repeat(40));
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Get all HTML files in templates directory
  const htmlFiles = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found in templates directory.');
    return;
  }
  
  console.log(`\n📁 Found ${htmlFiles.length} HTML templates\n`);
  
  let success = 0;
  let failed = 0;
  
  for (const file of htmlFiles) {
    const inputPath = path.join(TEMPLATES_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file.replace('.html', '.docx'));
    
    console.log(`📝 Converting: ${file}...`);
    const result = await convertHTMLtoWord(inputPath, outputPath);
    
    if (result) success++;
    else failed++;
  }
  
  console.log('\n' + '='.repeat(40));
  console.log(`✨ Conversion Complete!`);
  console.log(`   ✅ Success: ${success}`);
  if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Output: ${OUTPUT_DIR}/`);
}

main().catch(console.error);
