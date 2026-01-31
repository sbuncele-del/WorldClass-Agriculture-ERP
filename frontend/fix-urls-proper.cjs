/**
 * Fix all hardcoded localhost URLs to use centralized API service
 * This replaces the duplicated VITE_API_URL patterns with imports from api.service.ts
 */
const fs = require('fs');
const path = require('path');

function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && item !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = findTsFiles('./src');
let fixedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Skip the api.service.ts itself
  if (file.includes('api.service.ts')) {
    continue;
  }
  
  // Replace various patterns with import from API_BASE_URL
  
  // Pattern 1: Remove inline VITE_API_URL definitions and use import
  // const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  content = content.replace(
    /const\s+API_BASE_URL\s*=\s*import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"];?\n?/g,
    ''
  );
  
  // Pattern 2: Replace inline ${import.meta.env.VITE_API_URL || 'http://localhost:3000'} with ${API_BASE_URL}
  content = content.replace(
    /\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"]\}/g,
    '${API_BASE_URL}'
  );
  
  // Pattern 3: Replace (import.meta.env.VITE_API_URL || 'http://localhost:3000') with API_BASE_URL
  content = content.replace(
    /\(import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"]\)/g,
    'API_BASE_URL'
  );
  
  // Pattern 4: const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  content = content.replace(
    /const\s+apiUrl\s*=\s*import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"];?\n?/g,
    ''
  );
  
  // Pattern 5: Replace ${apiUrl} with ${API_BASE_URL} 
  content = content.replace(/\$\{apiUrl\}/g, '${API_BASE_URL}');
  
  // Pattern 6: const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  content = content.replace(
    /const\s+API_URL\s*=\s*import\.meta\.env\.VITE_API_URL\s*\|\|\s*['"]http:\/\/localhost:3000['"];?\n?/g,
    ''
  );
  
  // Pattern 7: Replace ${API_URL} with ${API_BASE_URL}
  content = content.replace(/\$\{API_URL\}/g, '${API_BASE_URL}');
  
  // Check if we need to add the import
  if (content !== original) {
    // Check if API_BASE_URL is now used but not imported
    if (content.includes('API_BASE_URL') && !content.includes("from '@/services/api.service'") && !content.includes("from '../services/api.service'") && !content.includes("from '../../services/api.service'")) {
      
      // Calculate relative path from file to api.service.ts
      const fileDir = path.dirname(file);
      const apiServicePath = './src/services/api.service';
      let relativePath = path.relative(fileDir, apiServicePath);
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      // Convert to proper import path (no .ts extension)
      relativePath = relativePath.replace(/\\/g, '/');
      
      // Add import at the top, after existing imports
      const importStatement = `import { API_BASE_URL } from '${relativePath}';\n`;
      
      // Find where to insert - after the last import statement
      const importRegex = /^import .+ from .+;?\n/gm;
      let lastImportMatch = null;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportMatch = match;
      }
      
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
      } else {
        // No imports found, add at the very beginning
        content = importStatement + content;
      }
    }
    
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
}

console.log(`\nTotal: ${fixedCount} files updated to use centralized API_BASE_URL`);
