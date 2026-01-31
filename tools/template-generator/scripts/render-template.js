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
 * Get the root directory of the repository
 */
function getRepoRoot() {
  let current = __dirname;
  while (current !== '/') {
    // Look for blueprints directory which is at the repo root
    if (existsSync(join(current, 'blueprints'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error('Could not find repository root');
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
  const repoRoot = getRepoRoot();
  const templatePath = join(
    repoRoot,
    'tools',
    'template-generator',
    'templates',
    templateName
  );
  
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
