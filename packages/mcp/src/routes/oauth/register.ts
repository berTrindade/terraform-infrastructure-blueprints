/**
 * OAuth 2.0 Dynamic Client Registration endpoint (RFC 7591)
 * 
 * POST /oauth/register
 * 
 * Allows clients to dynamically register themselves with the authorization server
 */

import { Request, Response } from "express";
import { randomUUID } from "node:crypto";

// In-memory client store (in production, use a database)
const registeredClients = new Map<string, {
  client_id: string;
  client_secret?: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  created_at: number;
}>();

/**
 * Handle OAuth client registration request
 * 
 * Request body (RFC 7591):
 * - redirect_uris: Array of redirect URIs
 * - token_endpoint_auth_method: Authentication method (default: "none" for PKCE)
 * - grant_types: Array of grant types (default: ["authorization_code"])
 * - response_types: Array of response types (default: ["code"])
 * - client_name: Optional client name
 * - scope: Optional scopes
 * 
 * Returns:
 * - client_id: Registered client identifier
 * - client_secret: Optional client secret (not used with PKCE)
 * - client_id_issued_at: Timestamp when client_id was issued
 * - redirect_uris: Registered redirect URIs
 */
export function handleRegister(req: Request, res: Response): void {
  try {
    // Log incoming request body for debugging
    console.log("OAuth register request body:", JSON.stringify(req.body, null, 2));
    
    const {
      redirect_uris,
      token_endpoint_auth_method = "none", // PKCE doesn't require client secret
      grant_types = ["authorization_code"],
      response_types = ["code"],
      client_name,
      scope,
    } = req.body;

  // Validate redirect URIs
  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    console.log("OAuth register failed: missing redirect_uris", { redirect_uris });
    res.status(400).json({
      error: "invalid_redirect_uri",
      error_description: "redirect_uris is required and must be a non-empty array",
    });
    return;
  }

  // Validate redirect URI format - support all MCP clients
  // More flexible patterns to support various client implementations
  const validRedirectUriPatterns = [
    // Cursor - various formats
    /^cursor:\/\/.*\/oauth\/callback/,
    /^vscode:\/\/.*\/oauth\/callback/,
    // Claude Desktop
    /^claude:\/\/.*\/callback/,
    // Localhost - any port
    /^http:\/\/localhost(:\d+)?\/.*callback/,
    /^http:\/\/127\.0\.0\.1(:\d+)?\/.*callback/,
    // HTTPS localhost
    /^https:\/\/localhost(:\d+)?\/.*callback/,
    /^https:\/\/127\.0\.0\.1(:\d+)?\/.*callback/,
  ];

  for (const uri of redirect_uris) {
    if (typeof uri !== "string") {
      console.log("OAuth register failed: redirect_uri not a string", { uri });
      res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: "All redirect_uris must be strings",
      });
      return;
    }

    const isValid = validRedirectUriPatterns.some(pattern => pattern.test(uri));
    if (!isValid) {
      console.log("OAuth register failed: invalid redirect_uri", { uri, patterns: validRedirectUriPatterns.map(p => p.toString()) });
      res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: `Invalid redirect_uri: ${uri}. Supported: cursor://, claude://, vscode://, http(s)://localhost[:port]/...callback`,
      });
      return;
    }
  }

  // Validate grant types
  const validGrantTypes = ["authorization_code"];
  const invalidGrantTypes = grant_types.filter((gt: string) => !validGrantTypes.includes(gt));
  if (invalidGrantTypes.length > 0) {
    res.status(400).json({
      error: "invalid_client_metadata",
      error_description: `Unsupported grant_types: ${invalidGrantTypes.join(", ")}`,
    });
    return;
  }

  // Validate response types
  const validResponseTypes = ["code"];
  const invalidResponseTypes = response_types.filter((rt: string) => !validResponseTypes.includes(rt));
  if (invalidResponseTypes.length > 0) {
    res.status(400).json({
      error: "invalid_client_metadata",
      error_description: `Unsupported response_types: ${invalidResponseTypes.join(", ")}`,
    });
    return;
  }

  // Generate client ID
  const clientId = randomUUID();

  // Store client registration
  const clientData = {
    client_id: clientId,
    redirect_uris,
    grant_types,
    response_types,
    token_endpoint_auth_method,
    created_at: Math.floor(Date.now() / 1000),
  };

  registeredClients.set(clientId, clientData);

  // Return registration response (RFC 7591)
  res.status(201).json({
    client_id: clientId,
    // client_secret omitted for PKCE (token_endpoint_auth_method: "none")
    client_id_issued_at: clientData.created_at,
    redirect_uris,
    grant_types,
    response_types,
    token_endpoint_auth_method,
    ...(client_name && { client_name }),
    ...(scope && { scope }),
  });
  } catch (error) {
    // Ensure we always return JSON, never a Response object
    const errorMessage = error instanceof Error ? error.message : "Registration failed";
    const errorType = error instanceof Error ? error.name : "UnknownError";
    
    // Log error for debugging
    console.error("Registration error:", {
      type: errorType,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    res.status(500).json({
      error: "server_error",
      error_description: errorMessage,
    });
  }
}

/**
 * Get registered client by ID
 */
export function getRegisteredClient(clientId: string): {
  client_id: string;
  client_secret?: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
  created_at: number;
} | undefined {
  return registeredClients.get(clientId);
}

/**
 * Validate client ID exists
 */
export function isValidClientId(clientId: string): boolean {
  return registeredClients.has(clientId);
}
