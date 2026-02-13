/**
 * OAuth callback endpoint
 * 
 * GET /oauth/callback
 * 
 * Receives the authorization code from Google OAuth,
 * exchanges it for tokens immediately, generates our own
 * authorization code, and redirects to the MCP client.
 */

import { Request, Response } from "express";
import { exchangeCodeForTokens } from "../../services/oauth/google-oauth.js";
import {
  getPendingAuthorization,
  generateAuthorizationCode,
  storeAuthorizationCode,
} from "../../services/oauth/authorization-code-store.js";

/**
 * Handle OAuth callback from Google
 * 
 * Query parameters:
 * - code: Authorization code from Google
 * - state: OAuth state parameter (used to look up pending request)
 */
export async function handleCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query;
  
  // Validate required parameters
  if (!code || typeof code !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing code parameter",
    });
    return;
  }
  
  if (!state || typeof state !== "string") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing state parameter",
    });
    return;
  }
  
  try {
    // Get pending authorization data
    const pendingAuth = getPendingAuthorization(state);
    if (!pendingAuth) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid or expired state parameter. Please try again.",
      });
      return;
    }
    
    // Exchange Google's code for tokens immediately
    // No PKCE code_verifier needed for Google - we use client_secret
    const tokenData = await exchangeCodeForTokens(code);
    
    // Generate our own authorization code
    const ourCode = generateAuthorizationCode();
    
    // Store the token data with our authorization code
    storeAuthorizationCode(ourCode, {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      idToken: tokenData.idToken,
      userInfo: tokenData.userInfo,
      clientId: pendingAuth.clientId,
      redirectUri: pendingAuth.redirectUri,
      codeChallenge: pendingAuth.codeChallenge,
      codeChallengeMethod: pendingAuth.codeChallengeMethod,
      state,
    });
    
    // Redirect to the MCP client with our authorization code
    const redirectParams = new URLSearchParams({
      code: ourCode,
      state,
    });
    
    const redirectUrl = `${pendingAuth.redirectUri}?${redirectParams.toString()}`;
    
    console.log("OAuth callback successful:", {
      redirectUri: pendingAuth.redirectUri,
      userEmail: tokenData.userInfo.email,
    });
    
    res.redirect(redirectUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Token exchange failed";
    
    console.error("OAuth callback error:", {
      type: error instanceof Error ? error.name : "UnknownError",
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // If we have pending auth, redirect with error
    const pendingAuth = getPendingAuthorization(state);
    if (pendingAuth) {
      const errorParams = new URLSearchParams({
        error: "server_error",
        error_description: errorMessage,
        state,
      });
      res.redirect(`${pendingAuth.redirectUri}?${errorParams.toString()}`);
      return;
    }
    
    // Otherwise return JSON error
    res.status(500).json({
      error: "server_error",
      error_description: errorMessage,
    });
  }
}
