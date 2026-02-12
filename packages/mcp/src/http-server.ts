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
  app.use((pinoHttp as unknown as (opts: { logger: pino.Logger }) => express.RequestHandler)({ logger: httpLogger }));

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

  // OAuth metadata endpoints (support both MCP-specific and standard OAuth discovery)
  app.get("/.well-known/mcp-oauth-authorization-server", handleMetadata);
  app.get("/.well-known/oauth-authorization-server", handleMetadata);
  app.get("/.well-known/oauth-protected-resource", handleMetadata);
  app.get("/.well-known/oauth-protected-resource/sse", handleMetadata);

  // OAuth endpoints
  // Dynamic client registration (RFC 7591) - load dynamically to handle missing file
  app.post("/oauth/register", async (req: Request, res: Response) => {
    try {
      const { handleRegister } = await import("./routes/oauth/register.js");
      // Ensure handleRegister is called and errors are caught
      handleRegister(req, res);
    } catch (error) {
      // Log error for debugging
      httpLogger.error({
        error: {
          type: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        path: "/oauth/register",
      });
      
      // Return proper JSON error response
      res.status(500).json({
        error: "registration_not_available",
        error_description: error instanceof Error ? error.message : "Dynamic client registration is not available",
      });
    }
  });
  app.get("/oauth/authorize", handleAuthorize);
  app.post("/oauth/token", handleToken);
  app.post("/oauth/token/validate", handleTokenValidate);

  // OAuth callback (handled by Google redirect)
  // This endpoint receives the callback from Google OAuth and redirects to the appropriate client
  app.get("/oauth/callback", (req: Request, res: Response) => {
    const { code, state, redirect_uri } = req.query;
    
    if (!code || !state) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Missing code or state parameter",
      });
      return;
    }

    // Determine redirect URI from state or query parameter
    // In a production system, you'd store the redirect_uri with the state during authorization
    // For now, we'll try to extract it from state or use a default
    let clientRedirectUri = redirect_uri as string | undefined;
    
    // If no redirect_uri provided, try to determine from state or use common defaults
    if (!clientRedirectUri) {
      // Try to extract from state (if encoded) or use Cursor as default
      // In production, you should store redirect_uri with state during authorization
      clientRedirectUri = "cursor://anysphere.cursor-mcp/oauth/callback";
    }

    // Validate redirect URI before redirecting
    const validRedirectUriPatterns = [
      /^cursor:\/\/anysphere\.cursor-mcp\/oauth\/callback$/,
      /^claude:\/\/oauth\/callback$/,
      /^http:\/\/localhost:\d+\/oauth\/callback$/,
      /^http:\/\/127\.0\.0\.1:\d+\/oauth\/callback$/,
    ];

    const isValid = validRedirectUriPatterns.some(pattern => pattern.test(clientRedirectUri!));
    
    if (!isValid) {
      res.status(400).json({
        error: "invalid_request",
        error_description: `Invalid redirect_uri: ${clientRedirectUri}`,
      });
      return;
    }

    // Redirect to the client's callback URL with code and state
    // Build query string properly
    const params = new URLSearchParams({
      code: code as string,
      state: state as string,
    });
    
    // Handle different redirect URI formats
    if (clientRedirectUri.includes("://")) {
      // Custom protocol (cursor://, claude://)
      const redirectUrl = `${clientRedirectUri}?${params.toString()}`;
      res.redirect(redirectUrl);
    } else {
      // HTTP URL
      const redirectUrl = `${clientRedirectUri}?${params.toString()}`;
      res.redirect(redirectUrl);
    }
  });

  // MCP endpoint handler - SSE connection
  const handleMCPSSE = async (req: Request, res: Response) => {
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
  };

  // MCP endpoints - SSE connection (both /mcp and /sse for compatibility)
  app.get("/mcp", handleMCPSSE);
  app.get("/sse", handleMCPSSE);

  // MCP endpoint handler - POST messages
  const handleMCPPost = async (req: Request, res: Response) => {
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
  };

  // MCP endpoints - POST messages (both /mcp and /sse for compatibility)
  app.post("/mcp", handleMCPPost);
  app.post("/sse", handleMCPPost);

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
      logger.info({ message: "SIGTERM received, shutting down gracefully" });
      server.close(() => {
        logger.info({ message: "Server closed" });
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info({ message: "SIGINT received, shutting down gracefully" });
      server.close(() => {
        logger.info({ message: "Server closed" });
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
