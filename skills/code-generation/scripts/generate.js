#!/usr/bin/env node
/**
 * Main script to generate Terraform code from templates
 * 
 * Usage:
 *   echo '{"template":"rds-module.tftpl","params":{...}}' | node generate.js
 *   node generate.js < payload.json
 * 
 * The template name should match a file in templates/ directory.
 * Parameters are substituted directly into the template using ${variable} placeholders.
 * 
 * For parameter definitions, refer to the source blueprint's variables.tf file.
 */

import { stdin } from 'node:process';
import { renderTemplate } from './render-template.js';

/**
 * Read JSON from stdin or file
 */
async function readInput() {
  return new Promise((resolve, reject) => {
    let data = '';
    
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => {
      data += chunk;
    });
    
    stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error(`Invalid JSON input: ${error.message}`));
      }
    });
    
    stdin.on('error', reject);
  });
}

/**
 * Main generation function
 */
async function main() {
  try {
    // Read JSON payload from stdin
    const payload = await readInput();
    
    // Validate payload structure
    if (!payload.template) {
      throw new Error('Missing required field: template (e.g., "rds-module.tftpl")');
    }
    if (!payload.params || typeof payload.params !== 'object') {
      throw new Error('Missing or invalid field: params');
    }
    
    // Render template directly with provided parameters
    // No validation - Terraform will catch type/pattern errors at plan time
    const rendered = renderTemplate(payload.template, payload.params);
    
    // Output generated code
    console.log(rendered);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
main();
