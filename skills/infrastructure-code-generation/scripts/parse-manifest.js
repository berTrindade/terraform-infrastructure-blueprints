#!/usr/bin/env node
/**
 * Parse and validate blueprint manifest YAML files
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'js-yaml';

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
 * Normalize manifest so both flat and evolved (metadata/spec) schemas are accepted.
 * @param {object} raw - Raw parsed YAML (flat or evolved)
 * @returns {object} Normalized { name, description, version, snippets }
 */
export function normalizeManifest(raw) {
  return {
    name: raw.metadata?.name ?? raw.name,
    description: raw.metadata?.description ?? raw.description,
    version: raw.metadata?.version ?? raw.version,
    snippets: raw.spec?.snippets ?? raw.snippets ?? [],
  };
}

/**
 * Load and parse a blueprint manifest
 * @param {string} blueprintName - Name of the blueprint (e.g., 'apigw-lambda-rds')
 * @returns {object} Parsed manifest object (normalized)
 */
export function loadManifest(blueprintName) {
  const manifestDir = getManifestDir();
  const manifestPath = join(manifestDir, `${blueprintName}.yaml`);
  
  try {
    const content = readFileSync(manifestPath, 'utf-8');
    const raw = load(content);
    const manifest = normalizeManifest(raw);
    
    if (!manifest.name || manifest.snippets === undefined) {
      throw new Error(`Invalid manifest: missing required fields`);
    }
    
    return manifest;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }
    throw new Error(`Failed to parse manifest: ${error.message}`);
  }
}

/**
 * Find a snippet by ID in a manifest
 * @param {object} manifest - Parsed manifest object
 * @param {string} snippetId - Snippet ID to find
 * @returns {object} Snippet object or null
 */
export function findSnippet(manifest, snippetId) {
  const snippet = manifest.snippets.find(s => s.id === snippetId);
  if (!snippet) {
    throw new Error(
      `Snippet '${snippetId}' not found in blueprint '${manifest.name}'. ` +
      `Available snippets: ${manifest.snippets.map(s => s.id).join(', ')}`
    );
  }
  return snippet;
}

/**
 * Validate parameters against snippet variable definitions
 * @param {object} snippet - Snippet object from manifest
 * @param {object} params - Parameters to validate
 * @returns {object} Validated and normalized parameters
 */
export function validateParams(snippet, params) {
  const validated = {};
  const errors = [];
  
  for (const variable of snippet.variables || []) {
    const value = params[variable.name];
    
    // Check required
    if (variable.required && (value === undefined || value === null)) {
      errors.push(`Required parameter '${variable.name}' is missing`);
      continue;
    }
    
    // Use default if not provided
    if (value === undefined || value === null) {
      if (variable.default !== undefined) {
        validated[variable.name] = variable.default;
      }
      continue;
    }
    
    // Type validation
    if (variable.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter '${variable.name}' must be a number, got ${typeof value}`);
      continue;
    }
    
    if (variable.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`Parameter '${variable.name}' must be a boolean, got ${typeof value}`);
      continue;
    }
    
    if (variable.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter '${variable.name}' must be a string, got ${typeof value}`);
      continue;
    }
    
    // Pattern validation
    if (variable.pattern && variable.type === 'string') {
      const regex = new RegExp(variable.pattern);
      if (!regex.test(value)) {
        errors.push(`Parameter '${variable.name}' does not match pattern: ${variable.pattern}`);
        continue;
      }
    }
    
    // Enum validation
    if (variable.enum && !variable.enum.includes(value)) {
      errors.push(
        `Parameter '${variable.name}' must be one of: ${variable.enum.join(', ')}, got: ${value}`
      );
      continue;
    }
    
    validated[variable.name] = value;
  }
  
  // Check for unknown parameters
  const knownNames = new Set(snippet.variables?.map(v => v.name) || []);
  for (const paramName of Object.keys(params)) {
    if (!knownNames.has(paramName)) {
      console.warn(`Warning: Unknown parameter '${paramName}' will be ignored`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.join('\n')}`);
  }
  
  return validated;
}
