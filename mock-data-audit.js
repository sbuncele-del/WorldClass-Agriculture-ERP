#!/usr/bin/env node
/**
 * Mock Data Audit Tool
 * Identifies all mock/hardcoded data in the frontend that should be replaced with API calls
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend/src');

// Patterns that indicate mock/hardcoded data
const MOCK_PATTERNS = [
  { pattern: /const\s+mock\w*\s*[=:]/gi, type: 'MOCK_VARIABLE', severity: 'HIGH' },
  { pattern: /let\s+mock\w*\s*[=:]/gi, type: 'MOCK_VARIABLE', severity: 'HIGH' },
  { pattern: /Mock\w*Data\s*[=:]/gi, type: 'MOCK_DATA', severity: 'HIGH' },
  { pattern: /MOCK_\w+\s*[=:]/gi, type: 'MOCK_CONSTANT', severity: 'HIGH' },
  { pattern: /demo\s*:\s*true/gi, type: 'DEMO_FLAG', severity: 'MEDIUM' },
  { pattern: /isDemo\s*[=:]\s*true/gi, type: 'DEMO_FLAG', severity: 'MEDIUM' },
  { pattern: /faker\./gi, type: 'FAKER_USAGE', severity: 'HIGH' },
  { pattern: /\[\s*\{[^}]*id:\s*['"]?\d+['"]?[^}]*name:\s*['"][^"']+['"][^}]*\}[^\]]*\]/gs, type: 'HARDCODED_ARRAY', severity: 'MEDIUM' },
  { pattern: /sampleData|testData|dummyData/gi, type: 'TEST_DATA', severity: 'HIGH' },
  { pattern: /placeholder\s*data/gi, type: 'PLACEHOLDER', severity: 'MEDIUM' },
  { pattern: /TODO:?\s*(replace|add|implement|connect).*api/gi, type: 'TODO_API', severity: 'HIGH' },
  { pattern: /\/\/\s*TODO:?\s*fetch/gi, type: 'TODO_FETCH', severity: 'HIGH' },
  { pattern: /hardcoded|hard-coded|hard coded/gi, type: 'HARDCODED_COMMENT', severity: 'MEDIUM' },
  { pattern: /useState\(\[\s*\{[^}]*id:\s*\d+/gs, type: 'HARDCODED_STATE', severity: 'HIGH' },
  { pattern: /initialData\s*=\s*\[/g, type: 'INITIAL_DATA', severity: 'MEDIUM' },
  { pattern: /const\s+\w+\s*=\s*\[\s*\{[^}]*['"]John|['"]Jane|['"]Test|['"]Demo/gs, type: 'FAKE_NAMES', severity: 'HIGH' },
  { pattern: /email:\s*['"][\w.]+@(example|test|demo)\./gi, type: 'FAKE_EMAIL', severity: 'MEDIUM' },
  { pattern: /phone:\s*['"][\d\s\-\(\)]{10,}/g, type: 'FAKE_PHONE', severity: 'LOW' },
];

// API endpoint mapping suggestions
const API_SUGGESTIONS = {
  'customers': '/api/customers',
  'clients': '/api/clients', 
  'products': '/api/inventory/products',
  'inventory': '/api/inventory',
  'employees': '/api/hr/employees',
  'users': '/api/users',
  'invoices': '/api/sales/invoices',
  'orders': '/api/sales/orders',
  'purchases': '/api/purchase/orders',
  'suppliers': '/api/purchase/suppliers',
  'assets': '/api/assets',
  'accounts': '/api/finance/accounts',
  'transactions': '/api/finance/transactions',
  'projects': '/api/projects',
  'tasks': '/api/projects/tasks',
  'warehouses': '/api/warehouse',
  'vehicles': '/api/logistics/vehicles',
  'payroll': '/api/hr/payroll',
  'departments': '/api/hr/departments',
  'leaves': '/api/hr/leave',
};

class MockDataAuditor {
  constructor() {
    this.results = [];
    this.fileCount = 0;
    this.issueCount = 0;
  }

  scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and build folders
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          this.scanDirectory(filePath);
        }
      } else if (this.isSourceFile(file)) {
        this.scanFile(filePath);
      }
    }
  }

  isSourceFile(filename) {
    return /\.(tsx?|jsx?|ts|js)$/.test(filename);
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(__dirname, filePath);
    const issues = [];

    for (const { pattern, type, severity } of MOCK_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Get line number
          const lines = content.split('\n');
          let lineNum = 1;
          let charCount = 0;
          const matchIndex = content.indexOf(match);
          
          for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1;
            if (charCount > matchIndex) {
              lineNum = i + 1;
              break;
            }
          }

          // Get context (the line containing the match)
          const contextLine = lines[lineNum - 1]?.trim().substring(0, 100);

          issues.push({
            type,
            severity,
            line: lineNum,
            match: match.substring(0, 80),
            context: contextLine,
            suggestedApi: this.suggestApi(content, match),
          });
        }
      }
    }

    if (issues.length > 0) {
      this.fileCount++;
      this.issueCount += issues.length;
      this.results.push({
        file: relativePath,
        issues: this.deduplicateIssues(issues),
      });
    }
  }

  deduplicateIssues(issues) {
    const seen = new Set();
    return issues.filter(issue => {
      const key = `${issue.line}-${issue.type}-${issue.match}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  suggestApi(content, match) {
    const lowerContent = (content + match).toLowerCase();
    
    for (const [keyword, api] of Object.entries(API_SUGGESTIONS)) {
      if (lowerContent.includes(keyword)) {
        return api;
      }
    }
    return 'Check context to determine appropriate API';
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MOCK DATA AUDIT REPORT');
    console.log('='.repeat(80));
    console.log(`\n📅 Generated: ${new Date().toISOString()}`);
    console.log(`📁 Files with mock data: ${this.fileCount}`);
    console.log(`⚠️  Total issues found: ${this.issueCount}`);

    // Group by severity
    const bySeverity = { HIGH: [], MEDIUM: [], LOW: [] };
    
    for (const result of this.results) {
      for (const issue of result.issues) {
        bySeverity[issue.severity].push({ file: result.file, ...issue });
      }
    }

    console.log('\n' + '-'.repeat(80));
    console.log('🔴 HIGH PRIORITY (Must Fix Before Production)');
    console.log('-'.repeat(80));
    
    if (bySeverity.HIGH.length === 0) {
      console.log('✅ No high priority issues!');
    } else {
      const highByFile = this.groupByFile(bySeverity.HIGH);
      for (const [file, issues] of Object.entries(highByFile)) {
        console.log(`\n📄 ${file}`);
        for (const issue of issues) {
          console.log(`   Line ${issue.line}: [${issue.type}]`);
          console.log(`   📝 ${issue.context?.substring(0, 70)}...`);
          console.log(`   💡 Suggested API: ${issue.suggestedApi}`);
        }
      }
    }

    console.log('\n' + '-'.repeat(80));
    console.log('🟡 MEDIUM PRIORITY');
    console.log('-'.repeat(80));
    
    if (bySeverity.MEDIUM.length === 0) {
      console.log('✅ No medium priority issues!');
    } else {
      const medByFile = this.groupByFile(bySeverity.MEDIUM);
      let count = 0;
      for (const [file, issues] of Object.entries(medByFile)) {
        if (count++ < 10) { // Limit output
          console.log(`\n📄 ${file} (${issues.length} issues)`);
          for (const issue of issues.slice(0, 3)) {
            console.log(`   Line ${issue.line}: [${issue.type}] ${issue.context?.substring(0, 50)}...`);
          }
          if (issues.length > 3) {
            console.log(`   ... and ${issues.length - 3} more`);
          }
        }
      }
      if (Object.keys(medByFile).length > 10) {
        console.log(`\n   ... and ${Object.keys(medByFile).length - 10} more files`);
      }
    }

    // Summary by file type/module
    console.log('\n' + '-'.repeat(80));
    console.log('📂 ISSUES BY MODULE');
    console.log('-'.repeat(80));
    
    const byModule = {};
    for (const result of this.results) {
      const module = this.getModule(result.file);
      byModule[module] = (byModule[module] || 0) + result.issues.length;
    }

    const sortedModules = Object.entries(byModule).sort((a, b) => b[1] - a[1]);
    for (const [module, count] of sortedModules) {
      const bar = '█'.repeat(Math.min(count, 30));
      console.log(`   ${module.padEnd(25)} ${String(count).padStart(3)} ${bar}`);
    }

    // Generate actionable summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 ACTION PLAN');
    console.log('='.repeat(80));
    
    console.log(`
1. HIGH PRIORITY FILES (${bySeverity.HIGH.length} issues):
   These files have mock variables or test data that MUST be replaced
   with real API calls before production.

2. RECOMMENDED APPROACH:
   a) For each HIGH priority file:
      - Identify the data structure being mocked
      - Find or create the corresponding API endpoint
      - Replace useState initialization with useEffect + API fetch
      - Add loading and error states

3. COMMON PATTERNS TO FIX:
   ${this.getCommonPatterns()}

4. NEXT STEPS:
   - Run: node mock-data-audit.js --fix-plan to generate fix templates
   - Start with contexts/ and hooks/ directories
   - Then fix page-level components
`);

    // Save detailed report to file
    this.saveDetailedReport();
  }

  getModule(filePath) {
    const parts = filePath.split('/');
    if (parts.includes('pages')) {
      const pageIndex = parts.indexOf('pages');
      return `pages/${parts[pageIndex + 1] || 'root'}`;
    }
    if (parts.includes('components')) return 'components';
    if (parts.includes('contexts')) return 'contexts';
    if (parts.includes('hooks')) return 'hooks';
    if (parts.includes('services')) return 'services';
    if (parts.includes('features')) {
      const featIndex = parts.indexOf('features');
      return `features/${parts[featIndex + 1] || 'root'}`;
    }
    return 'other';
  }

  groupByFile(issues) {
    const grouped = {};
    for (const issue of issues) {
      if (!grouped[issue.file]) grouped[issue.file] = [];
      grouped[issue.file].push(issue);
    }
    return grouped;
  }

  getCommonPatterns() {
    const patterns = new Set();
    for (const result of this.results) {
      for (const issue of result.issues) {
        patterns.add(issue.type);
      }
    }
    return Array.from(patterns).slice(0, 5).join(', ');
  }

  saveDetailedReport() {
    const reportPath = path.join(__dirname, 'MOCK-DATA-REPORT.json');
    const report = {
      generated: new Date().toISOString(),
      summary: {
        filesWithMockData: this.fileCount,
        totalIssues: this.issueCount,
      },
      files: this.results,
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: MOCK-DATA-REPORT.json`);

    // Also generate markdown report
    this.saveMarkdownReport();
  }

  saveMarkdownReport() {
    const mdPath = path.join(__dirname, 'MOCK-DATA-REPORT.md');
    let md = `# Mock Data Audit Report\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Summary\n`;
    md += `- Files with mock data: **${this.fileCount}**\n`;
    md += `- Total issues: **${this.issueCount}**\n\n`;
    
    md += `## High Priority Files\n\n`;
    md += `These must be fixed before production:\n\n`;
    
    for (const result of this.results) {
      const highIssues = result.issues.filter(i => i.severity === 'HIGH');
      if (highIssues.length > 0) {
        md += `### ${result.file}\n\n`;
        md += `| Line | Type | Suggested API |\n`;
        md += `|------|------|---------------|\n`;
        for (const issue of highIssues) {
          md += `| ${issue.line} | ${issue.type} | ${issue.suggestedApi} |\n`;
        }
        md += `\n`;
      }
    }

    fs.writeFileSync(mdPath, md);
    console.log(`📄 Markdown report saved to: MOCK-DATA-REPORT.md`);
  }

  run() {
    console.log('🔍 Scanning frontend for mock data...\n');
    
    if (!fs.existsSync(FRONTEND_DIR)) {
      console.error('❌ Frontend directory not found:', FRONTEND_DIR);
      process.exit(1);
    }

    this.scanDirectory(FRONTEND_DIR);
    this.generateReport();
  }
}

// Run the audit
const auditor = new MockDataAuditor();
auditor.run();
