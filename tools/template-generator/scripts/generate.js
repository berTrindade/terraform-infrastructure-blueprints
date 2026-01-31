#!/usr/bin/env node
/**
 * Main script to generate Terraform code from templates
 * 
 * Usage:
 *   echo '{"blueprint":"apigw-lambda-rds","snippet":"rds-module","params":{...}}' | node generate.js
 *   node generate.js < payload.json
 */

import { readFileSync } from 'node:fs';
import { stdin } from 'node:process';
import { loadManifest, findSnippet, validateParams } from './parse-manifest.js';
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
    if (!payload.blueprint) {
      throw new Error('Missing required field: blueprint');
    }
    if (!payload.snippet) {
      throw new Error('Missing required field: snippet');
    }
    if (!payload.params || typeof payload.params !== 'object') {
      throw new Error('Missing or invalid field: params');
    }
    
    // Load manifest
    const manifest = loadManifest(payload.blueprint);
    
    // Find snippet
    const snippet = findSnippet(manifest, payload.snippet);
    
    // Validate parameters
    const validatedParams = validateParams(snippet, payload.params);
    
    // Render template
    const rendered = renderTemplate(snippet.template, validatedParams);
    
    // Output generated code
    console.log(rendered);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
main();
