#!/usr/bin/env node
/**
 * SiyaBusa ERP System Audit Tool
 * Scans the codebase for production readiness issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_SRC = path.join(__dirname, '../frontend/src');
const BACKEND_SRC = path.join(__dirname, '../backend/src');

const report = {
  timestamp: new Date().toISOString(),
  summary: {},
  issues: {
    critical: [],
    high: [],
    medium: [],
    low: []
  },
  buttons: {
    total: 0,
    functional: 0,
    nonFunctional: [],
    suspicious: []
  },
  fakeData: [],
  apis: {
    total: 0,
    endpoints: [],
    untested: []
  },
  deadCode: [],
  consoleLogs: [],
  todoFixme: [],
  hardcodedStrings: []
};

// Patterns that indicate fake/demo data
const FAKE_DATA_PATTERNS = [
  /ABC\s*Trading/gi,
  /Demo\s*Company/gi,
  /Test\s*Corp/gi,
  /R\s*47\.8M/gi,
  /\$\d+\.\d+M\s*revenue/gi,
  /john@example\.com/gi,
  /jane@example\.com/gi,
  /Lorem\s*ipsum/gi,
  /placeholder/gi,
  /dummy/gi,
  /fake\s*data/gi,
  /mock\s*data/gi,
  /sample\s*data/gi,
  /'Company Name Here'/gi,
  /ACME/gi,
  /Stark Industries/gi,
  /Wayne Enterprises/gi
];

// Button patterns that suggest non-functionality
const SUSPICIOUS_BUTTON_PATTERNS = [
  /onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/,  // Empty onClick
  /onClick=\{\s*\(\)\s*=>\s*null\s*\}/,      // Returns null
  /onClick=\{\s*\(\)\s*=>\s*undefined\s*\}/, // Returns undefined
  /onClick=\{\s*console\.log/,               // Just logs
  /onClick=\{\s*alert\(/,                    // Just alerts
  /disabled.*true/,                          // Disabled buttons
  /Coming\s*Soon/gi,                         // Coming soon text
  /Not\s*Implemented/gi,
  /TODO/gi
];

// Hardcoded values that shouldn't be in production
const HARDCODED_PATTERNS = [
  /localhost:\d+/g,
  /127\.0\.0\.1/g,
  /password\s*[:=]\s*['"][^'"]+['"]/gi,
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
  /secret\s*[:=]\s*['"][^'"]+['"]/gi,
  /token\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/gi
];

function getAllFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function scanForFakeData(content, filePath) {
  const issues = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    FAKE_DATA_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          content: line.trim().substring(0, 100),
          pattern: pattern.toString()
        });
      }
    });
  });
  
  return issues;
}

function scanForButtons(content, filePath) {
  const buttonMatches = [];
  const lines = content.split('\n');
  
  // Find all button-like elements
  const buttonRegex = /<(Button|button|IconButton)[^>]*>/gi;
  const onClickRegex = /onClick\s*=\s*\{([^}]+)\}/;
  
  let match;
  lines.forEach((line, index) => {
    if (/<(Button|button|IconButton)/i.test(line)) {
      report.buttons.total++;
      
      // Check if onClick is defined
      const hasOnClick = /onClick/i.test(line);
      
      if (!hasOnClick) {
        // Check surrounding lines for onClick
        const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 5)).join('\n');
        if (!/onClick/i.test(context)) {
          report.buttons.nonFunctional.push({
            file: filePath,
            line: index + 1,
            content: line.trim().substring(0, 100),
            reason: 'No onClick handler found'
          });
        }
      } else {
        // Check for suspicious onClick patterns
        SUSPICIOUS_BUTTON_PATTERNS.forEach(pattern => {
          if (pattern.test(line)) {
            report.buttons.suspicious.push({
              file: filePath,
              line: index + 1,
              content: line.trim().substring(0, 100),
              pattern: pattern.toString()
            });
          }
        });
        report.buttons.functional++;
      }
    }
  });
}

function scanForConsoleLogs(content, filePath) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (/console\.(log|warn|error|info|debug)\(/i.test(line) && 
        !/\/\//.test(line.split('console')[0])) { // Not commented out
      report.consoleLogs.push({
        file: filePath,
        line: index + 1,
        content: line.trim().substring(0, 100)
      });
    }
  });
}

function scanForTodoFixme(content, filePath) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)/i.test(line)) {
      report.todoFixme.push({
        file: filePath,
        line: index + 1,
        content: line.trim().substring(0, 100)
      });
    }
  });
}

function scanForHardcodedValues(content, filePath) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    HARDCODED_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        report.hardcodedStrings.push({
          file: filePath,
          line: index + 1,
          content: line.trim().substring(0, 100),
          pattern: pattern.toString()
        });
      }
    });
  });
}

function findApiEndpoints() {
  const backendFiles = getAllFiles(BACKEND_SRC);
  const endpoints = [];
  
  backendFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf-8');
    
    // Match Express route definitions
    const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    const appRouteRegex = /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file: file
      });
    }
    while ((match = appRouteRegex.exec(content)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        file: file
      });
    }
  });
  
  report.apis.endpoints = endpoints;
  report.apis.total = endpoints.length;
}

function categorizeIssues() {
  // Critical: Hardcoded secrets, fake data in production components
  report.hardcodedStrings.filter(h => /password|secret|key|token/i.test(h.content))
    .forEach(i => report.issues.critical.push({
      type: 'hardcoded-secret',
      ...i
    }));
  
  // High: Non-functional buttons, fake data
  report.buttons.nonFunctional.forEach(b => report.issues.high.push({
    type: 'non-functional-button',
    ...b
  }));
  
  report.fakeData.forEach(f => report.issues.high.push({
    type: 'fake-data',
    ...f
  }));
  
  // Medium: Suspicious buttons, console logs
  report.buttons.suspicious.forEach(b => report.issues.medium.push({
    type: 'suspicious-button',
    ...b
  }));
  
  report.consoleLogs.slice(0, 50).forEach(c => report.issues.medium.push({
    type: 'console-log',
    ...c
  }));
  
  // Low: TODO/FIXME comments
  report.todoFixme.forEach(t => report.issues.low.push({
    type: 'todo-fixme',
    ...t
  }));
}

function generateSummary() {
  report.summary = {
    totalFilesScanned: 0,
    criticalIssues: report.issues.critical.length,
    highIssues: report.issues.high.length,
    mediumIssues: report.issues.medium.length,
    lowIssues: report.issues.low.length,
    totalButtons: report.buttons.total,
    functionalButtons: report.buttons.functional,
    nonFunctionalButtons: report.buttons.nonFunctional.length,
    suspiciousButtons: report.buttons.suspicious.length,
    fakeDataInstances: report.fakeData.length,
    consoleLogs: report.consoleLogs.length,
    todoFixme: report.todoFixme.length,
    apiEndpoints: report.apis.total
  };
  
  // Calculate production readiness score
  const deductions = 
    (report.issues.critical.length * 20) +
    (report.issues.high.length * 5) +
    (report.issues.medium.length * 2) +
    (report.issues.low.length * 0.5);
  
  report.summary.productionReadinessScore = Math.max(0, Math.round(100 - deductions));
}

function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SIYABUSA ERP SYSTEM AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`📅 Generated: ${report.timestamp}`);
  console.log('');
  
  // Production Readiness Score
  const score = report.summary.productionReadinessScore;
  const scoreColor = score >= 80 ? '\x1b[32m' : score >= 50 ? '\x1b[33m' : '\x1b[31m';
  console.log(`🎯 PRODUCTION READINESS SCORE: ${scoreColor}${score}/100\x1b[0m`);
  console.log('');
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('-'.repeat(40));
  console.log(`   🔴 Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`   🟠 High Issues: ${report.summary.highIssues}`);
  console.log(`   🟡 Medium Issues: ${report.summary.mediumIssues}`);
  console.log(`   🔵 Low Issues: ${report.summary.lowIssues}`);
  console.log('');
  
  // Buttons Analysis
  console.log('🔘 BUTTON ANALYSIS');
  console.log('-'.repeat(40));
  console.log(`   Total Buttons Found: ${report.summary.totalButtons}`);
  console.log(`   ✅ Functional: ${report.summary.functionalButtons}`);
  console.log(`   ❌ Non-Functional: ${report.summary.nonFunctionalButtons}`);
  console.log(`   ⚠️  Suspicious: ${report.summary.suspiciousButtons}`);
  console.log('');
  
  // API Endpoints
  console.log('🌐 API ENDPOINTS');
  console.log('-'.repeat(40));
  console.log(`   Total Endpoints: ${report.summary.apiEndpoints}`);
  console.log('');
  
  // Critical Issues Detail
  if (report.issues.critical.length > 0) {
    console.log('\x1b[31m🚨 CRITICAL ISSUES (Fix Immediately)\x1b[0m');
    console.log('-'.repeat(40));
    report.issues.critical.slice(0, 10).forEach((issue, i) => {
      console.log(`   ${i + 1}. [${issue.type}] ${issue.file.split('/').pop()}:${issue.line}`);
      console.log(`      ${issue.content}`);
    });
    console.log('');
  }
  
  // High Priority Issues
  if (report.issues.high.length > 0) {
    console.log('\x1b[33m⚠️  HIGH PRIORITY ISSUES (Top 20)\x1b[0m');
    console.log('-'.repeat(40));
    report.issues.high.slice(0, 20).forEach((issue, i) => {
      const fileName = issue.file.replace(/.*\/src\//, 'src/');
      console.log(`   ${i + 1}. [${issue.type}] ${fileName}:${issue.line}`);
      if (issue.reason) console.log(`      Reason: ${issue.reason}`);
    });
    console.log('');
  }
  
  // Fake Data Found
  if (report.fakeData.length > 0) {
    console.log('\x1b[35m🎭 FAKE/DEMO DATA FOUND (Top 20)\x1b[0m');
    console.log('-'.repeat(40));
    report.fakeData.slice(0, 20).forEach((item, i) => {
      const fileName = item.file.replace(/.*\/src\//, 'src/');
      console.log(`   ${i + 1}. ${fileName}:${item.line}`);
      console.log(`      "${item.content}"`);
    });
    console.log('');
  }
  
  // Console Logs
  if (report.consoleLogs.length > 0) {
    console.log(`📝 Console Logs Found: ${report.consoleLogs.length} (should be removed for production)`);
  }
  
  // TODOs
  if (report.todoFixme.length > 0) {
    console.log(`📌 TODO/FIXME Comments: ${report.todoFixme.length}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('💡 RECOMMENDATIONS:');
  console.log('-'.repeat(40));
  
  if (report.summary.nonFunctionalButtons > 0) {
    console.log('   1. Add onClick handlers to all buttons');
  }
  if (report.fakeData.length > 0) {
    console.log('   2. Replace hardcoded demo data with dynamic data from API');
  }
  if (report.consoleLogs.length > 10) {
    console.log('   3. Remove console.log statements before production');
  }
  if (report.issues.critical.length > 0) {
    console.log('   4. URGENT: Address critical security issues');
  }
  
  console.log('');
  console.log('📁 Full report saved to: ./audit-report.json');
  console.log('='.repeat(80) + '\n');
}

// Main execution
console.log('🔍 Starting SiyaBusa ERP System Audit...\n');

const frontendFiles = getAllFiles(FRONTEND_SRC);
report.summary.totalFilesScanned = frontendFiles.length;

console.log(`📂 Scanning ${frontendFiles.length} frontend files...`);

frontendFiles.forEach((file, index) => {
  process.stdout.write(`\r   Progress: ${index + 1}/${frontendFiles.length}`);
  
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = file.replace(FRONTEND_SRC, 'src');
    
    // Run all scans
    const fakeDataIssues = scanForFakeData(content, relativePath);
    report.fakeData.push(...fakeDataIssues);
    
    scanForButtons(content, relativePath);
    scanForConsoleLogs(content, relativePath);
    scanForTodoFixme(content, relativePath);
    scanForHardcodedValues(content, relativePath);
  } catch (e) {
    // Skip unreadable files
  }
});

console.log('\n📂 Scanning backend for API endpoints...');
findApiEndpoints();

console.log('📊 Categorizing issues...');
categorizeIssues();
generateSummary();

// Save full report
const reportPath = path.join(__dirname, 'audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Print summary
printReport();
