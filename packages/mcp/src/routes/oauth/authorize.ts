/**
 * OAuth authorization endpoint
 * 
 * GET /oauth/authorize
 * 
 * Handles OAuth authorization request with PKCE
 */

import { Request, Response } from "express";
import { getAuthorizationUrl } from "../../services/oauth/google-oauth.js";
import { storeCodeChallenge } from "../../services/oauth/pkce.js";
import { storePendingAuthorization } from "../../services/oauth/authorization-code-store.js";

/**
 * Handle OAuth authorization request
 * 
 * Query parameters:
 * - response_type: Must be "code"
 * - client_id: OAuth client ID
 * - redirect_uri: Callback URI (must be cursor://anysphere.cursor-mcp/oauth/callback)
 * - scope: Requested scopes
 * - state: CSRF protection state
 * - code_challenge: PKCE code challenge (base64url-encoded SHA256)
 * - code_challenge_method: PKCE method (must be "S256")
 */
export async function handleAuthorize(req: Request, res: Response): Promise<void> {
  try {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope,
      state,
      code_challenge,
      code_challenge_method,
    } = req.query;

  // Validate required parameters
  if (response_type !== "code") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "response_type must be 'code'",
    });
    return;
  }

  if (!code_challenge || typeof code_challenge !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "code_challenge is required",
    });
    return;
  }

  if (code_challenge_method !== "S256") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "code_challenge_method must be 'S256'",
    });
    return;
  }

  if (!state || typeof state !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "state is required",
    });
    return;
  }

  // Validate redirect URI - support all MCP clients
  // Accept any valid redirect URI pattern (validated during registration)
  const validRedirectUriPatterns = [
    /^cursor:\/\/anysphere\.cursor-mcp\/oauth\/callback$/,
    /^claude:\/\/oauth\/callback$/,
    /^http:\/\/localhost:\d+\/oauth\/callback$/,
    /^http:\/\/127\.0\.0\.1:\d+\/oauth\/callback$/,
  ];

  if (!redirect_uri || typeof redirect_uri !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "redirect_uri is required",
    });
    return;
  }

  const isValidRedirectUri = validRedirectUriPatterns.some(pattern => pattern.test(redirect_uri as string));
  if (!isValidRedirectUri) {
    res.status(400).json({
      error: "invalid_request",
      error_description: `Invalid redirect_uri: ${redirect_uri}. Supported formats: cursor://anysphere.cursor-mcp/oauth/callback, claude://oauth/callback, or http://localhost:PORT/oauth/callback`,
    });
    return;
  }

  // Store PKCE code challenge
  storeCodeChallenge(
    state as string,
    code_challenge as string,
    code_challenge_method as string
  );

  // Store pending authorization request for callback retrieval
  // This allows us to verify the flow when Google redirects back
  storePendingAuthorization(
    state as string,
    client_id as string || "unknown",
    redirect_uri as string,
    code_challenge as string,
    code_challenge_method as string
  );

  // Generate Google OAuth authorization URL
  // Note: We don't pass PKCE to Google - we use client_secret for Google
  // PKCE is only used between MCP client (Cursor) and our server
  const authUrl = getAuthorizationUrl(
    state as string
  );

  // Always use 302 redirect for OAuth authorization (standard OAuth behavior)
  // Cursor and other MCP clients will intercept the redirect and open the browser
  // Note: Previously tried returning JSON for cursor:// clients, but Cursor's MCP SDK
  // expects standard OAuth 302 redirects
  res.redirect(authUrl);
  } catch (error) {
    // Ensure we always return JSON, never a Response object
    const errorMessage = error instanceof Error ? error.message : "Authorization failed";
    const errorType = error instanceof Error ? error.name : "UnknownError";
    
    // Log error for debugging
    console.error("Authorization error:", {
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
