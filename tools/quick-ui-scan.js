#!/usr/bin/env node
/**
 * Quick UI Scan - Find non-functional UI elements
 * Scans for buttons, links, and forms that may not work
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = path.join(__dirname, '../frontend/src');

const issues = {
  emptyHandlers: [],
  disabledButtons: [],
  comingSoon: [],
  placeholders: [],
  hardcodedDemoData: []
};

// Demo data patterns
const DEMO_PATTERNS = [
  { pattern: /ABC\s*Trading/g, description: 'ABC Trading company name' },
  { pattern: /R\s*47[,.]?8M/g, description: 'R47.8M revenue figure' },
  { pattern: /R\s*12[,.]?3M/g, description: 'R12.3M figure' },
  { pattern: /John\s*Doe/gi, description: 'John Doe placeholder' },
  { pattern: /Jane\s*Doe/gi, description: 'Jane Doe placeholder' },
  { pattern: /example\.com/gi, description: 'example.com domain' },
  { pattern: /test@/gi, description: 'test@ email prefix' },
  { pattern: /Demo\s*(Company|Account|User)/gi, description: 'Demo placeholder' },
  { pattern: /Sample\s*(Data|Item|Product)/gi, description: 'Sample placeholder' },
  { pattern: /\+27\s*12\s*345/g, description: 'Placeholder phone number' },
  { pattern: /123\s*Main\s*Street/gi, description: 'Placeholder address' },
  { pattern: /Acme/gi, description: 'ACME placeholder company' },
];

function getAllFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !['node_modules', 'dist'].includes(item)) {
      files.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(FRONTEND_SRC, 'src');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Empty onClick handlers
    if (/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(line) ||
        /onClick=\{\s*\(\)\s*=>\s*null\s*\}/.test(line) ||
        /onClick=\{\s*\(\)\s*=>\s*undefined\s*\}/.test(line)) {
      issues.emptyHandlers.push({
        file: relativePath,
        line: lineNum,
        code: line.trim().substring(0, 80)
      });
    }
    
    // Disabled buttons
    if (/disabled=\{true\}/.test(line) || /disabled\s+(?!={)/.test(line)) {
      issues.disabledButtons.push({
        file: relativePath,
        line: lineNum,
        code: line.trim().substring(0, 80)
      });
    }
    
    // Coming Soon / Not Implemented
    if (/Coming\s*Soon/i.test(line) || /Not\s*Implemented/i.test(line) || /Under\s*Construction/i.test(line)) {
      issues.comingSoon.push({
        file: relativePath,
        line: lineNum,
        code: line.trim().substring(0, 80)
      });
    }
    
    // Demo data patterns
    DEMO_PATTERNS.forEach(({ pattern, description }) => {
      if (pattern.test(line)) {
        // Reset regex
        pattern.lastIndex = 0;
        issues.hardcodedDemoData.push({
          file: relativePath,
          line: lineNum,
          type: description,
          code: line.trim().substring(0, 80)
        });
      }
    });
  });
}

// Main
console.log('\n🔍 QUICK UI SCAN - Finding UI Issues\n');
console.log('='.repeat(60));

const files = getAllFiles(FRONTEND_SRC);
console.log(`Scanning ${files.length} files...\n`);

files.forEach(file => scanFile(file));

// Report
console.log('📊 SCAN RESULTS');
console.log('='.repeat(60));

console.log(`\n❌ Empty Click Handlers: ${issues.emptyHandlers.length}`);
if (issues.emptyHandlers.length > 0) {
  issues.emptyHandlers.slice(0, 10).forEach(i => {
    console.log(`   ${i.file}:${i.line}`);
  });
  if (issues.emptyHandlers.length > 10) {
    console.log(`   ... and ${issues.emptyHandlers.length - 10} more`);
  }
}

console.log(`\n⏸️  Disabled Buttons: ${issues.disabledButtons.length}`);
if (issues.disabledButtons.length > 0) {
  issues.disabledButtons.slice(0, 5).forEach(i => {
    console.log(`   ${i.file}:${i.line}`);
  });
}

console.log(`\n🚧 "Coming Soon" / Not Implemented: ${issues.comingSoon.length}`);
if (issues.comingSoon.length > 0) {
  issues.comingSoon.slice(0, 10).forEach(i => {
    console.log(`   ${i.file}:${i.line} - "${i.code.substring(0, 50)}..."`);
  });
}

console.log(`\n🎭 Hardcoded Demo/Fake Data: ${issues.hardcodedDemoData.length}`);
if (issues.hardcodedDemoData.length > 0) {
  // Group by type
  const byType = {};
  issues.hardcodedDemoData.forEach(i => {
    byType[i.type] = byType[i.type] || [];
    byType[i.type].push(i);
  });
  
  Object.entries(byType).forEach(([type, items]) => {
    console.log(`\n   📌 ${type}: ${items.length} occurrences`);
    items.slice(0, 3).forEach(i => {
      console.log(`      ${i.file}:${i.line}`);
    });
    if (items.length > 3) {
      console.log(`      ... and ${items.length - 3} more`);
    }
  });
}

const total = issues.emptyHandlers.length + issues.disabledButtons.length + 
              issues.comingSoon.length + issues.hardcodedDemoData.length;

console.log('\n' + '='.repeat(60));
console.log(`\n📈 TOTAL ISSUES FOUND: ${total}`);

if (total === 0) {
  console.log('\n✅ No major UI issues found!');
} else {
  console.log('\n💡 Priority fixes:');
  if (issues.hardcodedDemoData.length > 0) {
    console.log('   1. Replace hardcoded demo data with API data');
  }
  if (issues.emptyHandlers.length > 0) {
    console.log('   2. Implement onClick handlers for buttons');
  }
  if (issues.comingSoon.length > 0) {
    console.log('   3. Complete "Coming Soon" features or hide them');
  }
}

console.log('\n');

// Save report
fs.writeFileSync(
  path.join(__dirname, 'ui-scan-report.json'),
  JSON.stringify(issues, null, 2)
);
console.log('📁 Report saved to: ./ui-scan-report.json\n');
