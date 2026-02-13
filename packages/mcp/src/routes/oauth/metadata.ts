/**
 * OAuth metadata endpoints
 * 
 * GET /.well-known/oauth-authorization-server
 *   Returns OAuth 2.0 authorization server metadata (RFC 8414)
 * 
 * GET /.well-known/oauth-protected-resource/*
 *   Returns OAuth 2.0 protected resource metadata (RFC 9728)
 */

import { Request, Response } from "express";

/**
 * Handle OAuth metadata request
 * 
 * Returns either authorization server metadata or protected resource metadata
 * depending on the requested path
 */
export function handleMetadata(req: Request, res: Response): void {
  const baseUrl = process.env.AUTH_BASE_URL || process.env.MCP_BASE_URL || "https://mcp.ustwo.com";
  
  // Check if this is a protected resource metadata request
  if (req.path.includes("oauth-protected-resource")) {
    // Extract the resource path (e.g., /sse from /.well-known/oauth-protected-resource/sse)
    const resourcePath = req.path.replace("/.well-known/oauth-protected-resource", "") || "/";
    
    // Return OAuth 2.0 Protected Resource Metadata (RFC 9728)
    // This tells the client which authorization server protects this resource
    res.json({
      resource: `${baseUrl}${resourcePath}`,
      authorization_servers: [baseUrl],
    });
    return;
  }
  
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
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"], // PKCE doesn't require client secret
    // Additional MCP-specific metadata
    mcp_version: "2024-11-05",
  });
}
