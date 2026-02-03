/**
 * OAuth authorization server metadata endpoint
 * 
 * GET /.well-known/mcp-oauth-authorization-server
 * 
 * Returns OAuth 2.0 authorization server metadata for MCP
 */

import { Request, Response } from "express";
import { config } from "../config.js";

/**
 * Handle OAuth metadata request
 * 
 * Returns authorization server metadata per MCP OAuth 2.0 specification
 */
export function handleMetadata(req: Request, res: Response): void {
  res.json({
    issuer: config.server.baseUrl,
    authorization_endpoint: `${config.server.baseUrl}/oauth/authorize`,
    token_endpoint: `${config.server.baseUrl}/oauth/token`,
    scopes_supported: ["mcp:read", "mcp:write"],
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code"],
  });
}
