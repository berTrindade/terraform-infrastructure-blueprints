/**
 * Custom error classes
 */

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
        super(`File not found: ${uri}`, "FILE_NOT_FOUND");
    }
}

/**
 * Invalid URI error
 */
export class InvalidUriError extends BlueprintError {
    constructor(uri: string) {
        super(`Invalid blueprint URI: ${uri}`, "INVALID_URI");
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
