/**
 * Input validation utilities
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { ValidationError, SecurityError } from "./errors.js";

// Input size limits
export const MAX_INPUT_LENGTH = 1000;
export const MAX_PATH_LENGTH = 500;

/**
 * Validates input length
 */
export function validateInputLength(input: string, maxLength: number = MAX_INPUT_LENGTH): void {
  if (input.length > maxLength) {
    throw new ValidationError(`Input exceeds maximum length of ${maxLength} characters`);
  }
}

/**
 * Validates blueprint name format
 */
export function validateBlueprintName(name: string): asserts name is string {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Blueprint name must be a non-empty string");
  }
  
  validateInputLength(name, MAX_INPUT_LENGTH);
  
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new ValidationError("Blueprint name contains invalid characters. Only lowercase letters, numbers, and hyphens allowed");
  }
}

/**
 * Validates cloud provider
 */
export function validateCloudProvider(provider: string): asserts provider is "aws" | "azure" | "gcp" {
  if (!["aws", "azure", "gcp"].includes(provider.toLowerCase())) {
    throw new ValidationError(`Invalid cloud provider: ${provider}. Must be aws, azure, or gcp`);
  }
}

/**
 * Validates file path for security
 * Handles URL encoding, symlinks, null bytes, and cross-platform paths
 */
export function validateFilePath(filePath: string, workspaceRoot: string): void {
  if (!filePath || typeof filePath !== "string") {
    throw new ValidationError("File path must be a non-empty string");
  }

  // Check input length
  validateInputLength(filePath, MAX_PATH_LENGTH);

  // Check for null bytes (path injection)
  if (filePath.includes("\0")) {
    throw new SecurityError("Invalid path pattern detected");
  }

  // Decode URL-encoded paths and check for traversal
  const decoded = decodeURIComponent(filePath);
  if (decoded !== filePath) {
    // Path was URL-encoded, check decoded version for traversal
    if (decoded.includes("..") || decoded.includes("~") || decoded.startsWith("/")) {
      throw new SecurityError("Invalid path pattern detected");
    }
  }

  // Check for dangerous patterns in original path
  if (filePath.includes("..") || filePath.includes("~") || filePath.startsWith("/")) {
    throw new SecurityError("Invalid path pattern detected");
  }

  // Check for Windows path traversal patterns
  if (filePath.includes("..\\") || filePath.includes("..\\\\")) {
    throw new SecurityError("Invalid path pattern detected");
  }

  // Ensure path is within workspace
  const resolved = path.resolve(workspaceRoot, filePath);
  const normalized = path.normalize(resolved);
  const resolvedWorkspace = path.resolve(workspaceRoot);

  if (!normalized.startsWith(resolvedWorkspace)) {
    throw new SecurityError("Path traversal detected");
  }

  // Resolve symlinks to prevent symlink traversal attacks
  try {
    const realResolved = fs.realpathSync.native(normalized);
    const realWorkspace = fs.realpathSync.native(resolvedWorkspace);
    
    if (!realResolved.startsWith(realWorkspace)) {
      throw new SecurityError("Path traversal detected");
    }
  } catch (error) {
    // If realpathSync fails, the path might not exist yet, but we've already validated
    // the normalized path is within workspace, so this is acceptable
    // Only throw if it's a security-related error
    if (error instanceof SecurityError) {
      throw error;
    }
  }
}
