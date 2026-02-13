/**
 * Google OAuth integration
 * 
 * Handles Google OAuth authentication and validates company domain
 */

import { OAuth2Client } from "google-auth-library";
import { config } from "../../config/config.js";;

// OAuth client will be initialized when config is available
let oauth2Client: OAuth2Client | null = null;

function getOAuthClient(): OAuth2Client {
  if (!oauth2Client) {
    const baseUrl = process.env.AUTH_BASE_URL || process.env.MCP_BASE_URL || "https://mcp.ustwo.com";
    oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID || "",
      process.env.GOOGLE_CLIENT_SECRET || "",
      `${baseUrl}/oauth/callback`
    );
  }
  return oauth2Client;
}

/**
 * Get Google OAuth authorization URL
 * 
 * @param state - OAuth state parameter for CSRF protection
 * @returns Authorization URL
 */
export function getAuthorizationUrl(
  state: string
): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    state,
    // Don't use PKCE with Google - we use client_secret instead
    // PKCE is only used between MCP client and our server
  });
}

/**
 * Exchange authorization code for tokens
 * 
 * @param code - Authorization code from Google
 * @returns Token response with access token and user info
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  userInfo: {
    email: string;
    name: string;
    picture?: string;
    domain?: string;
  };
}> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken({
    code,
    // No codeVerifier needed - we use client_secret instead of PKCE for Google
  });

  if (!tokens.access_token) {
    throw new Error("Failed to obtain access token");
  }

  // Verify ID token and get user info
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token || "",
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Failed to verify ID token");
  }

  // Extract company domain from email
  const email = payload.email || "";
  const domain = email.split("@")[1];

  // Verify company domain
  const requiredDomain = process.env.COMPANY_DOMAIN;
  if (requiredDomain && domain !== requiredDomain) {
    throw new Error(`Email domain ${domain} does not match required domain ${requiredDomain}`);
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? undefined,
    idToken: tokens.id_token ?? undefined,
    userInfo: {
      email,
      name: payload.name || email,
      picture: payload.picture ?? undefined,
      domain,
    },
  };
}

/**
 * Verify Google ID token
 * 
 * @param idToken - Google ID token
 * @returns Token payload if valid
 */
export async function verifyIdToken(idToken: string): Promise<{
  email: string;
  name: string;
  domain: string;
}> {
  const client = getOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid ID token");
  }

  const domain = payload.email.split("@")[1];
  const requiredDomain = process.env.COMPANY_DOMAIN;
  if (requiredDomain && domain !== requiredDomain) {
    throw new Error(`Email domain ${domain} does not match required domain ${requiredDomain}`);
  }

  return {
    email: payload.email,
    name: payload.name || payload.email,
    domain,
  };
}
