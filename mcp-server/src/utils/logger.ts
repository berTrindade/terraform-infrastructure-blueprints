/**
 * Structured logging utility using pino
 * Implements wide events pattern: one context-rich event per operation
 */

import pino from "pino";
import { config } from "../config/config.js";
import { sanitizeErrorPath } from "./errors.js";

interface WideEvent {
    [key: string]: unknown;
}

/**
 * Custom serializer for sanitizing sensitive fields
 * Uses pino's serializer API to automatically sanitize paths and URIs
 */
const customSerializers = {
    uri: (uri: unknown) => {
        if (typeof uri === "string") {
            return sanitizeErrorPath(uri);
        }
        return uri;
    },
    path: (path: unknown) => {
        if (typeof path === "string") {
            return sanitizeErrorPath(path);
        }
        return path;
    },
    error: (error: unknown) => {
        if (error && typeof error === "object" && error !== null) {
            const errorObj = error as Record<string, unknown>;
            const sanitized = { ...errorObj };

            // Sanitize error message paths
            if (typeof sanitized.message === "string") {
                // Use replace with regex (replaceAll doesn't support regex patterns)
                // eslint-disable-next-line unicorn/prefer-string-replace-all
                sanitized.message = sanitized.message.replace(/\/[^\s]+/g, (match) => {
                    return sanitizeErrorPath(match);
                });
            }

            return sanitized;
        }
        return error;
    },
};

/**
 * Environment context captured once at startup
 * Automatically included in all wide events
 */
const envContext = {
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
 * Create pino logger with base context and custom serializers
 * Configured for wide events pattern with automatic environment context
 * Uses pino's built-in serializer API for automatic sanitization
 */
const pinoLogger = pino({
    level: config.logging.level === "error" ? "error" : "info",
    base: envContext,
    formatters: {
        level: (label) => ({ level: label }),
    },
    serializers: {
        ...pino.stdSerializers,
        ...customSerializers,
    },
    // Pino outputs JSON to stdout/stderr by default
    // Serializers automatically sanitize sensitive fields
});

/**
 * Logger wrapper that maintains the same API as the custom logger
 * Uses pino's built-in serializers for automatic sanitization
 */
class Logger {
    /**
     * Log an info-level wide event
     * All context should be included in the event object
     * Sensitive data is automatically sanitized via pino serializers
     */
    info(event: WideEvent): void {
        // Pino serializers automatically sanitize uri, path, and error fields
        pinoLogger.info(event);
    }

    /**
     * Log an error-level wide event
     * Error details should be included in the event object
     * Sensitive data is automatically sanitized via pino serializers
     */
    error(event: WideEvent): void {
        // Pino serializers automatically sanitize uri, path, and error fields
        pinoLogger.error(event);
    }
}

export const logger = new Logger();
