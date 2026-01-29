/**
 * Path utility functions
 */

import * as path from "node:path";
import * as fs from "node:fs";
import mimeTypes from "mime-types";
import { config } from "../config/config.js";
import { SecurityError } from "./errors.js";
import { validateFilePath } from "./validation.js";

/**
 * Validates and resolves a file path within the workspace
 *
 * @param filePath - Relative file path
 * @param workspaceRoot - Workspace root directory
 * @returns Resolved absolute path
 * @throws {SecurityError} If path is outside workspace
 */
export function resolveWorkspacePath(filePath: string, workspaceRoot: string = config.workspace.root): string {
  validateFilePath(filePath, workspaceRoot);

  const fullPath = path.join(workspaceRoot, filePath);
  const resolvedPath = path.resolve(fullPath);
  const resolvedWorkspace = path.resolve(workspaceRoot);

  if (!resolvedPath.startsWith(resolvedWorkspace)) {
    throw new SecurityError(`Path outside workspace: ${filePath}`);
  }

  return resolvedPath;
}

/**
 * Gets MIME type based on file extension using mime-types library
 * Falls back to custom types for Terraform-specific extensions
 *
 * @param filename - File name or path
 * @returns MIME type string
 */
export function getMimeType(filename: string): string {
  // Use mime-types library for standard MIME types
  const mimeType = mimeTypes.lookup(filename);
  
  if (mimeType) {
    return mimeType;
  }
  
  // Fallback for Terraform-specific extensions not in mime-types
  const ext = path.extname(filename).toLowerCase();
  const customTypes: Record<string, string> = {
    ".tf": "text/x-hcl",
    ".hcl": "text/x-hcl",
  };
  
  return customTypes[ext] || "text/plain";
}

/**
 * Checks if a file exists (async)
 *
 * @param filePath - File path to check
 * @returns Promise resolving to boolean
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes a resource name for MCP registration
 *
 * @param name - Resource name to sanitize
 * @returns Sanitized name
 */
export function sanitizeResourceName(name: string): string {
  return name.replaceAll(/[^a-zA-Z0-9-]/g, "-");
}
