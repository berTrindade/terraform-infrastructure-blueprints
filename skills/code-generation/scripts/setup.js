#!/usr/bin/env node
/**
 * Setup script to verify code-generation environment
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the skill root directory (contains templates and scripts)
 * Works both from repo and from distributed skill directory
 */
function getSkillRoot() {
  let current = __dirname;
  while (current !== '/') {
    if (existsSync(join(current, 'templates')) && existsSync(join(current, 'scripts'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('Could not find skill root directory');
}


/**
 * Check Node.js version
 */
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  
  if (major < 22) {
    console.error(`❌ Node.js version ${version} is too old. Required: >= 22.0.0`);
    return false;
  }
  
  console.log(`✅ Node.js version: ${version}`);
  return true;
}

/**
 * Check if dependencies are installed
 */
function checkDependencies() {
  const skillRoot = getSkillRoot();
  const packageJsonPath = join(skillRoot, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const requiredDeps = ['js-yaml'];
  const requiredDevDeps = ['jest', 'jest-environment-node'];
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missing = [];
  
  [...requiredDeps, ...requiredDevDeps].forEach(dep => {
    if (!allDeps[dep]) {
      missing.push(dep);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Missing dependencies: ${missing.join(', ')}`);
    console.log('   Run: npm install');
    return false;
  }
  
  console.log('✅ Dependencies installed');
  return true;
}

/**
 * Check directory structure
 */
function checkDirectoryStructure() {
  const skillRoot = getSkillRoot();
  const requiredDirs = [
    join(skillRoot, 'templates'),
    join(skillRoot, 'scripts'),
    join(skillRoot, '__tests__'),
  ];
  const missing = requiredDirs.filter(dir => !existsSync(dir));
  if (missing.length > 0) {
    console.error(`❌ Missing directories:`);
    missing.forEach(dir => console.error(`   ${dir}`));
    return false;
  }
  console.log('✅ Directory structure valid');
  return true;
}

/**
 * Check template files
 */
function checkTemplates() {
  const skillRoot = getSkillRoot();
  const templatesDir = join(skillRoot, 'templates');
  
  if (!existsSync(templatesDir)) {
    console.error('❌ Templates directory not found');
    return false;
  }
  
  const files = readdirSync(templatesDir).filter(f => f.endsWith('.tftpl'));
  
  if (files.length === 0) {
    console.error('❌ No template files found');
    return false;
  }
  
  console.log(`✅ Found ${files.length} template files`);
  return true;
}

/**
 * Main setup check
 */
function main() {
  console.log('🔍 Checking code-generation setup...\n');
  
  const checks = [
    checkNodeVersion,
    checkDependencies,
    checkDirectoryStructure,
    checkTemplates,
  ];
  
  const results = checks.map(check => check());
  const allPassed = results.every(r => r === true);
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All checks passed! Setup is complete.');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();
