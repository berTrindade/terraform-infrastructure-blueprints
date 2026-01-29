/**
 * Custom error classes
 */

/**
 * Sanitizes file paths in error messages to prevent information disclosure
 * Shows only the last 3 path segments to avoid exposing full filesystem structure
 *
 * @param path - File path to sanitize
 * @returns Sanitized path showing only last 3 segments
 */
export function sanitizeErrorPath(path: string): string {
  if (!path || typeof path !== "string") {
    return "[invalid path]";
  }
  
  // Remove absolute paths, show only relative portion
  const parts = path.split(/[/\\]/).filter(p => p.length > 0);
  
  // Show only last 3 segments to avoid exposing full structure
  if (parts.length <= 3) {
    return parts.join("/");
  }
  
  return "..." + parts.slice(-3).join("/");
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
        // Sanitize URI to prevent exposing full paths
        const sanitizedUri = sanitizeErrorPath(uri);
        super(`File not found: ${sanitizedUri}`, "FILE_NOT_FOUND");
    }
}

/**
 * Invalid URI error
 */
export class InvalidUriError extends BlueprintError {
    constructor(uri: string) {
        // Sanitize URI to prevent exposing full paths
        const sanitizedUri = sanitizeErrorPath(uri);
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
