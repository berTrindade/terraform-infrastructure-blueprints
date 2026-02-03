/**
 * OAuth 2.0 Authorization Server
 * 
 * Express server that handles OAuth 2.0 flow with PKCE for MCP authentication
 */

import express from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import { handleAuthorize } from "./routes/authorize.js";
import { handleToken, handleTokenValidate } from "./routes/token.js";
import { handleMetadata } from "./routes/metadata.js";

const logger = pino({
  level: config.logging.level,
});

const app = express();

// Middleware
app.use(express.json());
app.use(pinoHttp({ logger }));

// Routes
app.get("/.well-known/mcp-oauth-authorization-server", handleMetadata);
app.get("/oauth/authorize", handleAuthorize);
app.post("/oauth/token", handleToken);
app.post("/oauth/token/validate", handleTokenValidate);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({
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

// Start server
const server = app.listen(config.server.port, () => {
  logger.info({
    message: "OAuth authorization server started",
    port: config.server.port,
    baseUrl: config.server.baseUrl,
  });
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
