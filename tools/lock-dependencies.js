#!/usr/bin/env node

/**
 * SiyaBusa ERP - Dependency Locker
 * Removes all version ranges (^ and ~) and pins exact versions
 */

const fs = require('fs');
const path = require('path');

const PACKAGE_FILES = [
  '/workspaces/WorldClass-ERP/package.json',
  '/workspaces/WorldClass-ERP/backend/package.json',
  '/workspaces/WorldClass-ERP/frontend/package.json'
];

function lockDependencies(packageJsonPath) {
  console.log(`\n📦 Processing: ${packageJsonPath}`);
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   ⚠️  File not found, skipping...`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  let changesCount = 0;

  // Process dependencies
  ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].forEach(depType => {
    if (packageJson[depType]) {
      Object.keys(packageJson[depType]).forEach(pkg => {
        const version = packageJson[depType][pkg];
        
        // Skip if already exact version or special cases
        if (version.startsWith('file:') || 
            version.startsWith('git+') || 
            version.startsWith('http') ||
            version.startsWith('./') ||
            version.startsWith('../') ||
            !version.match(/[\^~]/)) {
          return;
        }

        // Remove ^ and ~
        const exactVersion = version.replace(/^[\^~]/, '');
        
        if (exactVersion !== version) {
          console.log(`   📌 ${pkg}: ${version} → ${exactVersion}`);
          packageJson[depType][pkg] = exactVersion;
          changesCount++;
        }
      });
    }
  });

  // Add engines for Node.js version locking
  if (!packageJson.engines) {
    packageJson.engines = {
      "node": ">=18.0.0 <19.0.0",
      "npm": ">=9.0.0 <10.0.0"
    };
    console.log(`   ⚙️  Added engine constraints`);
    changesCount++;
  }

  if (changesCount > 0) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`   ✅ Saved ${changesCount} changes`);
  } else {
    console.log(`   ✅ Already locked (no changes needed)`);
  }
}

function main() {
  console.log('\n🔒 SiyaBusa ERP - Dependency Locker');
  console.log('=' .repeat(50));
  console.log('\nLocking all dependencies to exact versions...\n');

  PACKAGE_FILES.forEach(lockDependencies);

  console.log('\n' + '='.repeat(50));
  console.log('✅ Dependency locking complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review the changes above');
  console.log('   2. Run: npm install');
  console.log('   3. Commit: git add package*.json && git commit -m "Lock dependencies"');
  console.log('   4. Always use: npm ci (not npm install) in production');
  console.log('');
}

main();
