/**
 * Custom error classes
 */

/**
 * Sanitizes file paths in error messages to prevent information disclosure
 * Shows only the last 3 path segments to avoid exposing full filesystem structure
 * Removes sensitive information like usernames and system directories
 *
 * @param path - File path to sanitize
 * @returns Sanitized path showing only last 3 segments
 */
export function sanitizeErrorPath(path: string): string {
  if (!path || typeof path !== "string") {
    return "[invalid path]";
  }
  
  // Remove absolute paths, show only relative portion
  let sanitized = path;
  
  // Remove leading slashes and backslashes
  sanitized = sanitized.replace(/^[/\\]+/, "");
  
  // Split into parts
  const parts = sanitized.split(/[/\\]/).filter(p => p.length > 0);
  
  // Show only last 3 segments to avoid exposing full structure
  if (parts.length <= 3) {
    // Still need to sanitize sensitive parts even in short paths
    const sanitizedParts = parts.map(part => {
      // Replace system directory names
      if (/^(etc|var|System32|Windows|Users|home)$/i.test(part)) {
        return "...";
      }
      // Only replace if it looks like a username (common patterns)
      // Don't replace common directory names or descriptive words
      const commonDirs = ["aws", "azure", "gcp", "modules", "environments", "src", "lib", "test", "app", "config", "sensitive", "secret", "private", "public"];
      if (!commonDirs.includes(part.toLowerCase()) && /^[a-zA-Z0-9_-]+$/.test(part)) {
        // Check if it's in a user directory context (Users/username, home/username, etc.)
        const partIndex = parts.indexOf(part);
        const prevPart = partIndex > 0 ? parts[partIndex - 1] : "";
        if ((prevPart.toLowerCase() === "users" || prevPart.toLowerCase() === "home") && part.length > 2 && part.length < 20) {
          return "...";
        }
      }
      return part;
    });
    return sanitizedParts.join("/");
  }
  
  const lastThree = parts.slice(-3);
  
  // Check if any of the last 3 parts contain sensitive information
  const sanitizedLastThree = lastThree.map((part, index) => {
    // Replace system directory names
    if (/^(etc|var|System32|Windows|Users|home)$/i.test(part)) {
      return "...";
    }
    // Only replace usernames in user directory contexts
    const partIndex = parts.length - 3 + index;
    const prevPart = partIndex > 0 ? parts[partIndex - 1] : "";
    if ((prevPart.toLowerCase() === "users" || prevPart.toLowerCase() === "home") && /^[a-zA-Z0-9_-]+$/.test(part) && part.length > 2 && part.length < 20) {
      return "...";
    }
    return part;
  });
  
  return "..." + sanitizedLastThree.join("/");
}

/**
 * Sanitizes error messages to remove sensitive information
 * Removes stack traces, full paths, and internal details
 *
 * @param error - Error object or message string
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose stack traces to clients
    let message = error.message;
    
    // Remove absolute paths
    message = message.replace(/\/[^\s]+/g, (match) => {
      return sanitizeErrorPath(match);
    });
    
    return message;
  }
  
  return String(error);
}

/**
 * Base error class for blueprint-related errors
 */
export class BlueprintError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Blueprint not found error
 */
export class BlueprintNotFoundError extends BlueprintError {
    constructor(blueprint: string) {
        super(`Blueprint "${blueprint}" not found`, "BLUEPRINT_NOT_FOUND");
    }
}

/**
 * Project not found error
 */
export class ProjectNotFoundError extends BlueprintError {
    constructor(project: string) {
        super(`Project "${project}" not found`, "PROJECT_NOT_FOUND");
    }
}

/**
 * File not found error
 */
export class FileNotFoundError extends BlueprintError {
    constructor(uri: string) {
        // Don't sanitize blueprint URIs (blueprints://...), only sanitize file system paths
        const sanitizedUri = uri.startsWith("blueprints://") ? uri : sanitizeErrorPath(uri);
        super(`File not found: ${sanitizedUri}`, "FILE_NOT_FOUND");
    }
}

/**
 * Invalid URI error
 */
export class InvalidUriError extends BlueprintError {
    constructor(uri: string) {
        // Don't sanitize URIs that look like URIs (have ://), only sanitize file system paths
        const sanitizedUri = uri.includes("://") ? uri : sanitizeErrorPath(uri);
        super(`Invalid blueprint URI: ${sanitizedUri}`, "INVALID_URI");
    }
}

/**
 * Security error (path traversal, etc.)
 */
export class SecurityError extends BlueprintError {
    constructor(message: string) {
        super(message, "SECURITY_ERROR");
    }
}

/**
 * Validation error
 */
export class ValidationError extends BlueprintError {
    constructor(message: string) {
        super(message, "VALIDATION_ERROR");
    }
}
