/**
 * Structured logging utility
 * Implements wide events pattern: one context-rich event per operation
 */

import { config } from "../config/config.js";
import { sanitizeErrorPath } from "./errors.js";

type LogLevel = "info" | "error";

interface WideEvent {
    [key: string]: unknown;
}

/**
 * Redacts sensitive data from log events
 * Removes or sanitizes paths, URIs, and other potentially sensitive information
 *
 * @param event - Log event to redact
 * @returns Redacted event
 */
function redactSensitiveData(event: WideEvent): WideEvent {
    const redacted = { ...event };
    
    // Sanitize URI fields
    if (redacted.uri && typeof redacted.uri === "string") {
        redacted.uri = sanitizeErrorPath(redacted.uri);
    }
    
    // Sanitize path fields
    if (redacted.path && typeof redacted.path === "string") {
        redacted.path = sanitizeErrorPath(redacted.path);
    }
    
    // Remove potential secrets from error messages
    if (redacted.error && typeof redacted.error === "object" && redacted.error !== null) {
        const errorObj = redacted.error as Record<string, unknown>;
        if (errorObj.message && typeof errorObj.message === "string") {
            // Remove absolute paths from error messages
            errorObj.message = errorObj.message.replace(/\/[^\s]+/g, (match) => {
                return sanitizeErrorPath(match);
            });
        }
    }
    
    return redacted;
}

/**
 * Environment context captured once at startup
 * Automatically included in all wide events
 */
const envContext: WideEvent = {
    service: config.server.name,
    version: config.server.version,
    commit_hash: process.env.COMMIT_SHA || process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    deployment_id: process.env.DEPLOYMENT_ID || process.env.VERCEL_DEPLOYMENT_ID,
    deploy_time: process.env.DEPLOY_TIMESTAMP || process.env.VERCEL_DEPLOYMENT_CREATED_AT,
    region: process.env.AWS_REGION || process.env.REGION || process.env.VERCEL_REGION || "local",
    environment: process.env.NODE_ENV || process.env.ENVIRONMENT || "development",
    node_version: process.version,
    runtime: process.env.AWS_EXECUTION_ENV || "node",
    memory_limit_mb: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
};

/**
 * Structured logger implementing wide events pattern
 * Emits pure JSON logs with environment context automatically included
 */
class Logger {
    private readonly logLevel: LogLevel;

    constructor() {
        // Only support info and error levels per best practices
        this.logLevel = (config.logging.level === "error" ? "error" : "info");
    }

    /**
     * Emit a wide event as pure JSON
     * Environment context is automatically merged into every event
     * Sensitive data is redacted before logging
     */
    private emit(level: LogLevel, event: WideEvent): void {
        if (level === "error" || this.logLevel === "info") {
            // Redact sensitive data before logging
            const redactedEvent = redactSensitiveData(event);
            
            const wideEvent: WideEvent = {
                timestamp: new Date().toISOString(),
                level,
                ...envContext,
                ...redactedEvent,
            };

            // Emit as single-line JSON (no formatting)
            const output = JSON.stringify(wideEvent);
            if (level === "error") {
                console.error(output);
            } else {
                console.info(output);
            }
        }
    }

    /**
     * Log an info-level wide event
     * All context should be included in the event object
     */
    info(event: WideEvent): void {
        this.emit("info", event);
    }

    /**
     * Log an error-level wide event
     * Error details should be included in the event object
     */
    error(event: WideEvent): void {
        this.emit("error", event);
    }
}

export const logger = new Logger();
