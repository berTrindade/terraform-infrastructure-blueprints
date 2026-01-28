/**
 * Input validation utilities
 */

import { ValidationError } from "./errors.js";

/**
 * Validates blueprint name format
 */
export function validateBlueprintName(name: string): asserts name is string {
  if (!name || typeof name !== "string") {
    throw new ValidationError("Blueprint name must be a non-empty string");
  }
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
 */
import * as path from "node:path";

export function validateFilePath(filePath: string, workspaceRoot: string): void {
  if (!filePath || typeof filePath !== "string") {
    throw new ValidationError("File path must be a non-empty string");
  }

  // Check for dangerous patterns
  if (filePath.includes("..") || filePath.includes("~") || filePath.startsWith("/")) {
    throw new ValidationError("Invalid path pattern detected");
  }

  // Ensure path is within workspace
  const resolved = path.resolve(workspaceRoot, filePath);
  const normalized = path.normalize(resolved);
  const resolvedWorkspace = path.resolve(workspaceRoot);

  if (!normalized.startsWith(resolvedWorkspace)) {
    throw new ValidationError("Path traversal detected");
  }
}
