/**
 * OAuth 2.0 Authorization Server Metadata
 * 
 * Provides OAuth metadata for MCP server to declare authentication requirements.
 * Cursor automatically detects this and shows a "Connect" button.
 */

import { config } from "../config/config.js";

/**
 * OAuth 2.0 Authorization Server Metadata
 * 
 * Based on MCP OAuth 2.0 specification, this metadata enables Cursor to:
 * 1. Detect authentication is required
 * 2. Show "Connect" button in UI
 * 3. Handle OAuth flow with PKCE
 * 4. Store tokens automatically
 */
export interface OAuthAuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  scopes_supported: string[];
  response_types_supported: string[];
  code_challenge_methods_supported: string[];
  grant_types_supported: string[];
}

/**
 * Get OAuth authorization server metadata
 * 
 * @returns OAuth metadata configuration
 */
export function getOAuthMetadata(): OAuthAuthorizationServerMetadata | null {
  const authServerUrl = config.oauth?.authServerUrl;
  
  if (!authServerUrl) {
    // OAuth not configured - return null to indicate no auth required
    return null;
  }

  return {
    issuer: authServerUrl,
    authorization_endpoint: `${authServerUrl}/oauth/authorize`,
    token_endpoint: `${authServerUrl}/oauth/token`,
    scopes_supported: ["mcp:read", "mcp:write"],
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code"],
  };
}
