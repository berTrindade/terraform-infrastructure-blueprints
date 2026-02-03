#!/usr/bin/env node
/**
 * Render Terraform template with parameter substitution
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the skill root directory (where manifests and templates are located)
 * Works both from repo root and from distributed skill directory
 */
function getSkillRoot() {
  let current = __dirname;
  while (current !== '/') {
    // Check if we're in a skill directory (has blueprints/manifests and templates)
    if (existsSync(join(current, 'blueprints', 'manifests')) && 
        existsSync(join(current, 'templates'))) {
      return current;
    }
    // Also check repo root structure (for development)
    if (existsSync(join(current, 'blueprints', 'manifests')) && 
        existsSync(join(current, 'skills', 'blueprint-template-generator', 'templates'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('Could not find skill root directory');
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
  return join(skillRoot, 'skills', 'blueprint-template-generator', 'templates');
}

/**
 * Escape special characters for Terraform/HCL
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeHcl(value) {
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // For strings, escape quotes and backslashes
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Render template with parameter substitution
 * @param {string} templateName - Name of the template file
 * @param {object} params - Parameters to substitute
 * @returns {string} Rendered template
 */
export function renderTemplate(templateName, params) {
  const templatesDir = getTemplatesDir();
  const templatePath = join(templatesDir, templateName);
  
  try {
    let template = readFileSync(templatePath, 'utf-8');
    
    // Replace placeholders {{variable_name}} with values
    // Support both {{var}} and {{ var }} formats
    template = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, varName) => {
      if (!(varName in params)) {
        throw new Error(`Missing parameter '${varName}' for template '${templateName}'`);
      }
      
      const value = params[varName];
      
      // For boolean and number, use as-is
      if (typeof value === 'boolean' || typeof value === 'number') {
        return value.toString();
      }
      
      // For strings, use as-is (already in HCL format)
      return String(value);
    });
    
    return template;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Template not found: ${templatePath}`);
    }
    throw error;
  }
}
