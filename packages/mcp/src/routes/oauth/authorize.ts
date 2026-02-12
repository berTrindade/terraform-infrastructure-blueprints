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

  // Validate redirect URI (must be Cursor protocol)
  const validRedirectUris = [
    "cursor://anysphere.cursor-mcp/oauth/callback",
    "http://localhost:3000/oauth/callback", // For development
  ];

  if (!redirect_uri || !validRedirectUris.includes(redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid redirect_uri",
    });
    return;
  }

  // Store PKCE code challenge
  storeCodeChallenge(
    state as string,
    code_challenge as string,
    code_challenge_method as string
  );

  // Generate Google OAuth authorization URL
  const authUrl = getAuthorizationUrl(
    state as string,
    code_challenge as string,
    code_challenge_method as string
  );

  // Check if client expects JSON (e.g., programmatic OAuth flow)
  const acceptHeader = req.headers.accept || "";
  if (acceptHeader.includes("application/json")) {
    // Return JSON response with authorization URL for programmatic clients
    res.json({
      authorization_url: authUrl,
      redirect_required: true,
    });
    return;
  }

  // Redirect to Google OAuth (for browser-based flows)
  res.redirect(authUrl);
}
