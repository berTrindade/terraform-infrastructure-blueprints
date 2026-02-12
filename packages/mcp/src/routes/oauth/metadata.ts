/**
 * OAuth authorization server metadata endpoint
 * 
 * GET /.well-known/mcp-oauth-authorization-server
 * 
 * Returns OAuth 2.0 authorization server metadata for MCP
 */

import { Request, Response } from "express";

/**
 * Handle OAuth metadata request
 * 
 * Returns authorization server metadata per MCP OAuth 2.0 specification
 */
export function handleMetadata(req: Request, res: Response): void {
  const baseUrl = process.env.AUTH_BASE_URL || process.env.MCP_BASE_URL || "https://mcp.ustwo.com";
  
  // Return OAuth 2.0 Authorization Server Metadata (RFC 8414)
  // This metadata is used by MCP clients to discover OAuth capabilities
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`, // RFC 7591 Dynamic Client Registration
    scopes_supported: ["mcp:read", "mcp:write"],
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none"], // PKCE doesn't require client secret
    // Additional MCP-specific metadata
    mcp_version: "2024-11-05",
  });
}
