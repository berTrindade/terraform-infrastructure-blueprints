/**
 * OAuth token endpoint
 * 
 * POST /oauth/token
 * 
 * Exchanges authorization code for access token
 */

import { Request, Response } from "express";
import { exchangeCodeForTokens } from "../services/google-oauth.js";
import { verifyCodeVerifier } from "../services/pkce.js";
import { storeTokens } from "../services/token-store.js";
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
  } = req.body;

  // Validate grant type
  if (grant_type !== "authorization_code") {
    res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "grant_type must be 'authorization_code'",
    });
    return;
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
    res.status(400).json({
      error: "invalid_grant",
      error_description: error instanceof Error ? error.message : "Token exchange failed",
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

  const { validateToken } = await import("../services/token-store.js");
  const result = validateToken(token);

  if (!result.valid) {
    res.status(401).json(result);
    return;
  }

  res.json(result);
}
