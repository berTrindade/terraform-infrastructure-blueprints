/**
 * Structured logging utility
 */

import { config } from "../config/config.js";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
    [key: string]: unknown;
}

/**
 * Simple structured logger
 * In production, replace with pino or winston
 */
class Logger {
    private readonly logLevel: LogLevel;

    constructor() {
        this.logLevel = (config.logging.level as LogLevel) || "info";
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ["debug", "info", "warn", "error"];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : "";
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    debug(message: string, context?: LogContext): void {
        if (this.shouldLog("debug")) {
            console.debug(this.formatMessage("debug", message, context));
        }
    }

    info(message: string, context?: LogContext): void {
        if (this.shouldLog("info")) {
            console.info(this.formatMessage("info", message, context));
        }
    }

    warn(message: string, context?: LogContext): void {
        if (this.shouldLog("warn")) {
            console.warn(this.formatMessage("warn", message, context));
        }
    }

    error(message: string, error?: Error, context?: LogContext): void {
        if (this.shouldLog("error")) {
            const errorContext = error instanceof Error
                ? { ...context, error: error.message, stack: error.stack }
                : { ...context, error: String(error) };
            console.error(this.formatMessage("error", message, errorContext));
        }
    }
}

export const logger = new Logger();
