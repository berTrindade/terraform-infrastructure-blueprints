#!/usr/bin/env node
/**
 * Validate blueprint manifest YAML files
 * 
 * Usage:
 *   node validate-manifest.js <blueprint-name>  # Validate specific manifest
 *   node validate-manifest.js --all             # Validate all manifests
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';
import { normalizeManifest } from './parse-manifest.js';

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
 * Get manifest directory path. Prefers repo root blueprints/manifests (single source of truth).
 */
function getManifestDir() {
  const skillRoot = getSkillRoot();
  const repoManifests = resolve(skillRoot, '..', '..', 'blueprints', 'manifests');
  if (existsSync(repoManifests)) {
    return repoManifests;
  }
  const skillManifests = join(skillRoot, 'blueprints', 'manifests');
  if (existsSync(skillManifests)) {
    return skillManifests;
  }
  throw new Error('Manifests directory not found. Expected repo blueprints/manifests or skill blueprints/manifests.');
}

/**
 * Get templates directory path
 */
function getTemplatesDir() {
  const skillRoot = getSkillRoot();
  // Check if we're in a skill directory (templates in skill root)
  if (existsSync(join(skillRoot, 'templates'))) {
    return join(skillRoot, 'templates');
  }
  // Fallback to repo root structure
  return join(skillRoot, 'skills', 'infrastructure-code-generation', 'templates');
}

/**
 * Validate manifest structure
 */
function validateManifestStructure(manifest, manifestPath) {
  const errors = [];
  const warnings = [];
  
  // Required top-level fields
  if (!manifest.name) {
    errors.push('Missing required field: name');
  }
  
  if (!manifest.description) {
    errors.push('Missing required field: description');
  }
  
  if (!manifest.version) {
    errors.push('Missing required field: version');
  }
  
  if (!manifest.snippets) {
    errors.push('Missing required field: snippets');
    return { errors, warnings };
  }
  
  if (!Array.isArray(manifest.snippets)) {
    errors.push('Field "snippets" must be an array');
    return { errors, warnings };
  }
  
  // Validate each snippet
  manifest.snippets.forEach((snippet, index) => {
    const prefix = `snippets[${index}]`;
    
    if (!snippet.id) {
      errors.push(`${prefix}: Missing required field: id`);
    }
    
    if (!snippet.name) {
      errors.push(`${prefix}: Missing required field: name`);
    }
    
    if (!snippet.template) {
      errors.push(`${prefix}: Missing required field: template`);
    } else {
      // Check if template file exists
      const templatesDir = getTemplatesDir();
      const templatePath = join(templatesDir, snippet.template);
      
      if (!existsSync(templatePath)) {
        errors.push(`${prefix}: Template file not found: ${snippet.template}`);
      }
    }
    
    if (!snippet.output_file) {
      warnings.push(`${prefix}: Missing optional field: output_file`);
    }
    
    if (!snippet.variables || !Array.isArray(snippet.variables)) {
      warnings.push(`${prefix}: Missing or invalid variables array`);
    } else {
      // Validate variables
      snippet.variables.forEach((variable, varIndex) => {
        const varPrefix = `${prefix}.variables[${varIndex}]`;
        
        if (!variable.name) {
          errors.push(`${varPrefix}: Missing required field: name`);
        }
        
        if (!variable.type) {
          errors.push(`${varPrefix}: Missing required field: type`);
        } else {
          const validTypes = ['string', 'number', 'boolean'];
          if (!validTypes.includes(variable.type)) {
            errors.push(`${varPrefix}: Invalid type "${variable.type}". Must be one of: ${validTypes.join(', ')}`);
          }
        }
        
        // Validate enum values match type
        if (variable.enum && variable.type === 'number') {
          const invalidEnum = variable.enum.filter(v => typeof v !== 'number');
          if (invalidEnum.length > 0) {
            errors.push(`${varPrefix}: Enum values must be numbers, found: ${invalidEnum.join(', ')}`);
          }
        }
        
        if (variable.enum && variable.type === 'boolean') {
          errors.push(`${varPrefix}: Enum is not valid for boolean type`);
        }
      });
    }
  });
  
  return { errors, warnings };
}

/**
 * Validate a single manifest
 */
function validateManifest(blueprintName) {
  const manifestDir = getManifestDir();
  const manifestPath = join(manifestDir, `${blueprintName}.yaml`);
  
  if (!existsSync(manifestPath)) {
    console.error(`❌ Manifest not found: ${manifestPath}`);
    return false;
  }
  
  try {
    const content = readFileSync(manifestPath, 'utf-8');
    const raw = load(content);
    const manifest = normalizeManifest(raw);
    
    const { errors, warnings } = validateManifestStructure(manifest, manifestPath);
    
    if (errors.length > 0) {
      console.error(`\n❌ Validation errors in ${blueprintName}:`);
      errors.forEach(error => console.error(`   ${error}`));
    }
    
    if (warnings.length > 0) {
      console.warn(`\n⚠️  Warnings in ${blueprintName}:`);
      warnings.forEach(warning => console.warn(`   ${warning}`));
    }
    
    if (errors.length === 0) {
      console.log(`✅ ${blueprintName}: Valid`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Failed to parse ${blueprintName}: ${error.message}`);
    return false;
  }
}

/**
 * Validate all manifests
 */
function validateAllManifests() {
  const manifestDir = getManifestDir();
  
  if (!existsSync(manifestDir)) {
    console.error('❌ Manifests directory not found');
    return false;
  }
  
  const files = readdirSync(manifestDir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''));
  
  if (files.length === 0) {
    console.error('❌ No manifest files found');
    return false;
  }
  
  console.log(`🔍 Validating ${files.length} manifest(s)...\n`);
  
  const results = files.map(blueprint => ({
    name: blueprint,
    valid: validateManifest(blueprint),
  }));
  
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.length - validCount;
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Valid: ${validCount}`);
  console.log(`❌ Invalid: ${invalidCount}`);
  console.log(`📊 Total: ${results.length}`);
  
  return invalidCount === 0;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--all' || args[0] === '-a') {
    const success = validateAllManifests();
    process.exit(success ? 0 : 1);
  } else {
    const blueprintName = args[0];
    const success = validateManifest(blueprintName);
    process.exit(success ? 0 : 1);
  }
}

main();
