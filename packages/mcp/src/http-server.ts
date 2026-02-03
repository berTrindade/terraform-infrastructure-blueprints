#!/usr/bin/env node

/**
 * HTTP MCP Server for ustwo Infrastructure Blueprints
 *
 * Provides HTTP-based access to MCP server with integrated OAuth 2.0.
 * Accessible at https://mcp.ustwo.com/mcp
 */

import express, { Request, Response, NextFunction } from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { createServer } from "./index.js";
import { logger } from "./utils/logger.js";
import { validateToken as validateTokenFromStore } from "./services/oauth/token-store.js";

// OAuth routes
import { handleAuthorize } from "./routes/oauth/authorize.js";
import { handleToken, handleTokenValidate } from "./routes/oauth/token.js";
import { handleMetadata } from "./routes/oauth/metadata.js";

// MCP transport
import { handleSSEConnection, handleMCPMessage } from "./transports/http-sse.js";

/**
 * Get server configuration
 */
function getServerConfig() {
  const port = parseInt(process.env.PORT || "3000", 10);
  const baseUrl = process.env.AUTH_BASE_URL || process.env.MCP_BASE_URL || "https://mcp.ustwo.com";
  
  return {
    port,
    baseUrl,
  };
}

/**
 * Create Express app with MCP and OAuth routes
 */
function createApp() {
  const app = express();
  const config = getServerConfig();

  // HTTP logger
  const httpLogger = pino({
    level: process.env.LOG_LEVEL || "info",
  });

  // Middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(pinoHttp({ logger: httpLogger }));

  // CORS configuration for MCP clients
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Connection-ID");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    
    next();
  });

  // OAuth metadata endpoint
  app.get("/.well-known/mcp-oauth-authorization-server", handleMetadata);

  // OAuth endpoints
  app.get("/oauth/authorize", handleAuthorize);
  app.post("/oauth/token", handleToken);
  app.post("/oauth/token/validate", handleTokenValidate);

  // OAuth callback (handled by Google redirect)
  app.get("/oauth/callback", (req: Request, res: Response) => {
    // Google OAuth callback - redirect back to Cursor
    const { code, state } = req.query;
    if (code && state) {
      // Redirect to Cursor protocol
      res.redirect(`cursor://anysphere.cursor-mcp/oauth/callback?code=${code}&state=${state}`);
    } else {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Missing code or state parameter",
      });
    }
  });

  // MCP endpoint - SSE connection
  app.get("/mcp", async (req: Request, res: Response) => {
    try {
      // Validate authentication if OAuth is configured
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

      if (process.env.GOOGLE_CLIENT_ID) {
        // OAuth is configured - validate token
        if (!token) {
          res.status(401).json({
            error: "unauthorized",
            error_description: "Authentication required",
          });
          return;
        }
        const validation = validateTokenFromStore(token);
        if (!validation.valid) {
          res.status(401).json({
            error: "unauthorized",
            error_description: validation.error || "Authentication required",
          });
          return;
        }
      }

      // Create MCP server instance for this connection
      const server = createServer();
      await handleSSEConnection(req, res, server);
    } catch (error) {
      httpLogger.error({
        error: {
          type: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        },
        path: req.path,
      });
      res.status(500).json({
        error: "internal_server_error",
        error_description: "Failed to establish MCP connection",
      });
    }
  });

  // MCP endpoint - POST messages
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      // Validate authentication if OAuth is configured
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

      if (process.env.GOOGLE_CLIENT_ID) {
        // OAuth is configured - validate token
        if (!token) {
          res.status(401).json({
            error: "unauthorized",
            error_description: "Authentication required",
          });
          return;
        }
        const validation = validateTokenFromStore(token);
        if (!validation.valid) {
          res.status(401).json({
            error: "unauthorized",
            error_description: validation.error || "Authentication required",
          });
          return;
        }
      }

      await handleMCPMessage(req, res);
    } catch (error) {
      httpLogger.error({
        error: {
          type: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        },
        path: req.path,
      });
      res.status(500).json({
        error: "internal_server_error",
        error_description: error instanceof Error ? error.message : "Internal error",
      });
    }
  });

  // Health check
  app.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      server: "mcp-http-server",
    });
  });

  // Error handling
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    httpLogger.error({
      error: {
        type: err.name,
        message: err.message,
        stack: err.stack,
      },
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      error: "internal_server_error",
      error_description: "An internal error occurred",
    });
  });

  return app;
}

/**
 * Main server startup function
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  const requestId = randomUUID();
  const config = getServerConfig();

  const wideEvent: Record<string, unknown> = {
    operation: "http_server_startup",
    request_id: requestId,
    port: config.port,
    base_url: config.baseUrl,
  };

  try {
    const app = createApp();

    const server = app.listen(config.port, () => {
      wideEvent.status_code = 200;
      wideEvent.outcome = "success";
      wideEvent.duration_ms = Date.now() - startTime;
      logger.info(wideEvent);

      console.log(`HTTP MCP Server started on port ${config.port}`);
      console.log(`MCP endpoint: ${config.baseUrl}/mcp`);
      console.log(`OAuth metadata: ${config.baseUrl}/.well-known/mcp-oauth-authorization-server`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    wideEvent.status_code = 500;
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    wideEvent.duration_ms = Date.now() - startTime;
    logger.error(wideEvent);
    process.exit(1);
  }
}

// Start server with top-level await
try {
  await main();
} catch (error) {
  const wideEvent: Record<string, unknown> = {
    operation: "http_server_startup",
    status_code: 500,
    outcome: "error",
    error: {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  };
  logger.error(wideEvent);
  process.exit(1);
}
