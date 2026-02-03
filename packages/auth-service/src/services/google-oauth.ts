/**
 * Google OAuth integration
 * 
 * Handles Google OAuth authentication and validates company domain
 */

import { OAuth2Client } from "google-auth-library";
import { config } from "../config.js";

const oauth2Client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  `${config.server.baseUrl}/oauth/callback`
);

/**
 * Get Google OAuth authorization URL
 * 
 * @param state - OAuth state parameter for CSRF protection
 * @param codeChallenge - PKCE code challenge
 * @param codeChallengeMethod - PKCE challenge method (S256)
 * @returns Authorization URL
 */
export function getAuthorizationUrl(
  state: string,
  codeChallenge: string,
  codeChallengeMethod: string
): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
  });
}

/**
 * Exchange authorization code for tokens
 * 
 * @param code - Authorization code from Google
 * @param codeVerifier - PKCE code verifier
 * @returns Token response with access token and user info
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
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
  const { tokens } = await oauth2Client.getToken({
    code,
    code_verifier: codeVerifier,
  });

  if (!tokens.access_token) {
    throw new Error("Failed to obtain access token");
  }

  // Verify ID token and get user info
  const ticket = await oauth2Client.verifyIdToken({
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
  if (domain !== config.company.domain) {
    throw new Error(`Email domain ${domain} does not match required domain ${config.company.domain}`);
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    userInfo: {
      email,
      name: payload.name || email,
      picture: payload.picture,
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
  const ticket = await oauth2Client.verifyIdToken({
    idToken,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Invalid ID token");
  }

  const domain = payload.email.split("@")[1];
  if (domain !== config.company.domain) {
    throw new Error(`Email domain ${domain} does not match required domain ${config.company.domain}`);
  }

  return {
    email: payload.email,
    name: payload.name || payload.email,
    domain,
  };
}
