#!/usr/bin/env node

/**
 * SiyaBusa ERP - Dependency Checker
 * Verifies all dependencies are properly locked
 */

const fs = require('fs');
const path = require('path');

const PACKAGE_FILES = [
  { path: '/workspaces/WorldClass-ERP/package.json', name: 'Root' },
  { path: '/workspaces/WorldClass-ERP/backend/package.json', name: 'Backend' },
  { path: '/workspaces/WorldClass-ERP/frontend/package.json', name: 'Frontend' }
];

function checkDependencies(file) {
  console.log(`\n📦 Checking: ${file.name}`);
  
  if (!fs.existsSync(file.path)) {
    console.log(`   ⚠️  File not found`);
    return { unlocked: [], missing: true };
  }

  const packageJson = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
  const unlocked = [];

  ['dependencies', 'devDependencies'].forEach(depType => {
    if (packageJson[depType]) {
      Object.entries(packageJson[depType]).forEach(([pkg, version]) => {
        // Check for version ranges
        if (version.match(/^[\^~]/) || version.includes('||') || version.includes(' - ')) {
          unlocked.push({ pkg, version, type: depType });
        }
      });
    }
  });

  if (unlocked.length === 0) {
    console.log(`   ✅ All dependencies locked!`);
  } else {
    console.log(`   ⚠️  Found ${unlocked.length} unlocked dependencies:`);
    unlocked.forEach(({ pkg, version, type }) => {
      console.log(`      - ${pkg}: ${version} (${type})`);
    });
  }

  return { unlocked, missing: false };
}

function checkLockFiles() {
  console.log('\n🔐 Checking lock files...\n');
  
  const rootLockFile = '/workspaces/WorldClass-ERP/package-lock.json';

  if (fs.existsSync(rootLockFile)) {
    const stats = fs.statSync(rootLockFile);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ✅ Root lock file exists (${sizeKB} KB)`);
    console.log(`   ℹ️  Using npm workspaces - root lock file covers all workspaces`);
    return true;
  } else {
    console.log(`   ❌ Root lock file MISSING!`);
    return false;
  }
}

function checkNpmrc() {
  console.log('\n⚙️  Checking .npmrc configuration...\n');
  
  const npmrcPath = '/workspaces/WorldClass-ERP/.npmrc';
  
  if (fs.existsSync(npmrcPath)) {
    const content = fs.readFileSync(npmrcPath, 'utf-8');
    console.log(`   ✅ .npmrc exists`);
    
    // Check for important settings
    const hasExactVersions = content.includes('save-exact=true');
    const hasEngineStrict = content.includes('engine-strict=true');
    
    if (hasExactVersions) {
      console.log(`   ✅ save-exact=true configured`);
    } else {
      console.log(`   ⚠️  save-exact=true not set`);
    }
    
    if (hasEngineStrict) {
      console.log(`   ✅ engine-strict=true configured`);
    } else {
      console.log(`   ⚠️  engine-strict=true not set`);
    }
  } else {
    console.log(`   ❌ .npmrc not found`);
    return false;
  }
  
  return true;
}

function main() {
  console.log('\n🔍 SiyaBusa ERP - Dependency Security Checker');
  console.log('='.repeat(60));

  // Check package.json files
  const results = PACKAGE_FILES.map(checkDependencies);
  
  // Check lock files
  const lockFilesExist = checkLockFiles();
  
  // Check npmrc
  const npmrcConfigured = checkNpmrc();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  const totalUnlocked = results.reduce((sum, r) => sum + r.unlocked.length, 0);
  const allLocked = totalUnlocked === 0;

  if (allLocked && lockFilesExist && npmrcConfigured) {
    console.log('\n✅ EXCELLENT! All dependencies are properly locked!');
    console.log('\n🎉 Your system is production-ready with stable dependencies.');
  } else {
    console.log('\n⚠️  ISSUES FOUND:');
    
    if (!allLocked) {
      console.log(`   - ${totalUnlocked} dependencies have version ranges`);
      console.log(`     👉 Run: node tools/lock-dependencies.js`);
    }
    
    if (!lockFilesExist) {
      console.log(`   - Missing lock files`);
      console.log(`     👉 Run: npm install`);
    }
    
    if (!npmrcConfigured) {
      console.log(`   - .npmrc not properly configured`);
      console.log(`     👉 Check docs/DEPENDENCY-LOCKING-STRATEGY.md`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('');

  // Exit code
  process.exit(allLocked && lockFilesExist ? 0 : 1);
}

main();
