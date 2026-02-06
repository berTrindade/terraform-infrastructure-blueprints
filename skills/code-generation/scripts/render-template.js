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
 * Get templates directory path
 */
function getTemplatesDir() {
  const skillRoot = getSkillRoot();
  // Check if we're in a skill directory (templates in skill root)
  if (existsSync(join(skillRoot, 'templates'))) {
    return join(skillRoot, 'templates');
  }
  // Fallback to repo root structure
  return join(skillRoot, 'skills', 'code-generation', 'templates');
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
    
    // Replace Terraform-style placeholders ${variable_name} (simple identifiers only)
    // Does not match Terraform literals like "${var.db_identifier}-final" (contains a dot)
    // Negative lookahead (?!\.) avoids substituting ${var} when followed by .identifier
    const placeholderRegex = /\$\{\s*([a-zA-Z0-9_]+)\s*\}(?!\.)/g;
    template = template.replace(placeholderRegex, (match, varName) => {
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
