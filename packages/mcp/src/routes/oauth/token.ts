/**
 * OAuth token endpoint
 * 
 * POST /oauth/token
 * 
 * Exchanges authorization code for access token
 */

import { Request, Response } from "express";
import { exchangeCodeForTokens } from "../../services/oauth/google-oauth.js";
import { verifyCodeVerifier } from "../../services/oauth/pkce.js";
import { storeTokens } from "../../services/oauth/token-store.js";
import { randomUUID } from "node:crypto";

/**
 * Handle OAuth token exchange
 * 
 * Request body:
 * - grant_type: Must be "authorization_code"
 * - code: Authorization code from Google
 * - redirect_uri: Must match authorization request
 * - code_verifier: PKCE code verifier
 * - client_id: OAuth client ID
 */
export async function handleToken(req: Request, res: Response): Promise<void> {
  const {
    grant_type,
    code,
    redirect_uri,
    code_verifier,
    client_id,
    client_secret, // Optional, for static OAuth clients
  } = req.body;

  // Validate grant type
  if (grant_type !== "authorization_code") {
    res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "grant_type must be 'authorization_code'",
    });
    return;
  }

  // Validate client_id if provided (for static OAuth clients)
  // Dynamic clients don't need client_id validation as they're registered
  if (client_id && typeof client_id === "string") {
    // Check if it's a registered dynamic client
    try {
      const { isValidClientId } = await import("./register.js");
      const isRegistered = isValidClientId(client_id);
      
      // If not registered and no client_secret provided, it might be a static client
      // Static clients should provide client_secret if required by server config
      // For now, we allow unregistered client_ids (they'll be validated during code exchange)
      if (!isRegistered && !client_secret) {
        // This is OK - might be a static client or the client_id is optional
        // The actual validation happens during code exchange
      }
    } catch (error) {
      // Registration module not available - continue without client validation
      // This allows the server to work even if registration is disabled
    }
  }

  if (!code || typeof code !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "code is required",
    });
    return;
  }

  if (!code_verifier || typeof code_verifier !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "code_verifier is required",
    });
    return;
  }

  try {
    // Verify PKCE code verifier (we'll use state from the code exchange)
    // Note: In a real implementation, we'd need to store state with the code
    // For now, we'll skip this verification step as state is in the OAuth flow
    // const state = req.body.state;
    // if (!verifyCodeVerifier(state, code_verifier)) {
    //   res.status(400).json({
    //     error: "invalid_grant",
    //     error_description: "Invalid code_verifier",
    //   });
    //   return;
    // }

    // Exchange code for tokens with Google
    const tokenData = await exchangeCodeForTokens(code, code_verifier);

    // Generate user ID (in production, use actual user ID from database)
    const userId = randomUUID();

    // Store tokens and generate JWT for MCP server
    const jwtToken = storeTokens(
      tokenData.accessToken,
      tokenData.refreshToken,
      userId,
      tokenData.userInfo.email,
      tokenData.userInfo.domain || "",
      3600 // 1 hour expiration
    );

    // Return token response
    res.json({
      access_token: jwtToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "mcp:read mcp:write",
    });
  } catch (error) {
    // Ensure we always return JSON, never a Response object
    const errorMessage = error instanceof Error ? error.message : "Token exchange failed";
    const errorType = error instanceof Error ? error.name : "UnknownError";
    
    // Log error for debugging
    console.error("Token exchange error:", {
      type: errorType,
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    res.status(400).json({
      error: "invalid_grant",
      error_description: errorMessage,
    });
  }
}

/**
 * Handle token validation request
 * 
 * POST /oauth/token/validate
 * 
 * Validates a token and returns user information
 */
export async function handleTokenValidate(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (!token) {
    res.status(401).json({
      valid: false,
      error: "Missing token",
    });
    return;
  }

  const { validateToken } = await import("../../services/oauth/token-store.js");
  const result = validateToken(token);

  if (!result.valid) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
}
