/**
 * Authorization Code Store
 * 
 * Stores authorization codes that map to exchanged Google tokens.
 * When Google redirects back with a code, we immediately exchange it
 * for tokens and store them with our own authorization code. When the
 * MCP client exchanges our code, we return the stored tokens.
 * 
 * In production, use a database or Redis for distributed systems.
 */

import { randomBytes, createHash } from "node:crypto";

/**
 * Stored authorization data
 */
interface AuthorizationCodeEntry {
  /** Google access token (already exchanged) */
  accessToken: string;
  /** Google refresh token (optional) */
  refreshToken?: string;
  /** Google ID token (optional) */
  idToken?: string;
  /** User information from Google */
  userInfo: {
    email: string;
    name: string;
    picture?: string;
    domain?: string;
  };
  /** Client ID that initiated the flow */
  clientId: string;
  /** Redirect URI for this authorization */
  redirectUri: string;
  /** PKCE code challenge from original authorization request */
  codeChallenge: string;
  /** PKCE challenge method (S256) */
  codeChallengeMethod: string;
  /** Original state parameter */
  state: string;
  /** Expiration timestamp */
  expiresAt: number;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Pending authorization request data
 * Stored when client calls /authorize, retrieved when Google calls back
 */
interface PendingAuthorizationEntry {
  /** Client ID */
  clientId: string;
  /** Redirect URI */
  redirectUri: string;
  /** PKCE code challenge */
  codeChallenge: string;
  /** PKCE challenge method */
  codeChallengeMethod: string;
  /** Expiration timestamp */
  expiresAt: number;
}

/**
 * In-memory authorization code store
 * Maps our authorization code -> stored Google tokens
 */
const authorizationCodeStore = new Map<string, AuthorizationCodeEntry>();

/**
 * Pending authorization requests store
 * Maps state -> pending authorization data
 */
const pendingAuthorizationStore = new Map<string, PendingAuthorizationEntry>();

/**
 * Clean up expired entries (run periodically)
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  for (const [key, value] of authorizationCodeStore.entries()) {
    if (value.expiresAt < now) {
      authorizationCodeStore.delete(key);
    }
  }
  
  for (const [key, value] of pendingAuthorizationStore.entries()) {
    if (value.expiresAt < now) {
      pendingAuthorizationStore.delete(key);
    }
  }
}

// Clean up every minute
setInterval(cleanupExpiredEntries, 60 * 1000);

/**
 * Generate a cryptographically secure authorization code
 * 
 * @returns 32-character hex string
 */
export function generateAuthorizationCode(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Store pending authorization request
 * Called when client calls /authorize, before redirecting to Google
 * 
 * @param state - OAuth state parameter (used as key)
 * @param clientId - Client ID from authorization request
 * @param redirectUri - Redirect URI from authorization request
 * @param codeChallenge - PKCE code challenge
 * @param codeChallengeMethod - PKCE challenge method
 * @param ttlSeconds - Time to live in seconds (default: 10 minutes)
 */
export function storePendingAuthorization(
  state: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  ttlSeconds: number = 600
): void {
  pendingAuthorizationStore.set(state, {
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Get and remove pending authorization
 * Called when Google redirects back to verify the flow
 * 
 * @param state - OAuth state parameter
 * @returns Pending authorization data or undefined if not found/expired
 */
export function getPendingAuthorization(state: string): PendingAuthorizationEntry | undefined {
  const entry = pendingAuthorizationStore.get(state);
  
  if (!entry) {
    return undefined;
  }
  
  // Check expiration
  if (entry.expiresAt < Date.now()) {
    pendingAuthorizationStore.delete(state);
    return undefined;
  }
  
  // Remove after retrieval (one-time use)
  pendingAuthorizationStore.delete(state);
  
  return entry;
}

/**
 * Store authorization code with exchanged tokens
 * Called after successfully exchanging Google's code for tokens
 * 
 * @param code - Our generated authorization code
 * @param data - Authorization data with tokens and user info
 * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
export function storeAuthorizationCode(
  code: string,
  data: Omit<AuthorizationCodeEntry, "expiresAt" | "createdAt">,
  ttlSeconds: number = 300
): void {
  authorizationCodeStore.set(code, {
    ...data,
    expiresAt: Date.now() + ttlSeconds * 1000,
    createdAt: Date.now(),
  });
}

/**
 * Exchange authorization code for stored tokens
 * Called when client POSTs to /oauth/token
 * 
 * @param code - Authorization code from client
 * @param codeVerifier - PKCE code verifier from client
 * @returns Stored authorization data or undefined if invalid
 */
export function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string
): AuthorizationCodeEntry | undefined {
  const entry = authorizationCodeStore.get(code);
  
  if (!entry) {
    return undefined;
  }
  
  // Check expiration
  if (entry.expiresAt < Date.now()) {
    authorizationCodeStore.delete(code);
    return undefined;
  }
  
  // Verify PKCE code verifier
  if (!verifyCodeVerifier(codeVerifier, entry.codeChallenge, entry.codeChallengeMethod)) {
    // Invalid code verifier - don't delete the entry yet
    // (could be a retry with correct verifier)
    return undefined;
  }
  
  // Remove after successful exchange (one-time use)
  authorizationCodeStore.delete(code);
  
  return entry;
}

/**
 * Verify PKCE code verifier against stored challenge
 * 
 * @param codeVerifier - Plain text code verifier from client
 * @param codeChallenge - Stored code challenge (base64url SHA256)
 * @param codeChallengeMethod - Challenge method (must be S256)
 * @returns True if verifier matches challenge
 */
function verifyCodeVerifier(
  codeVerifier: string,
  codeChallenge: string,
  codeChallengeMethod: string
): boolean {
  if (codeChallengeMethod !== "S256") {
    return false;
  }
  
  // Compute SHA256 hash of code verifier
  const hash = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  
  return hash === codeChallenge;
}

/**
 * Check if an authorization code exists (for debugging)
 * 
 * @param code - Authorization code
 * @returns True if code exists and is not expired
 */
export function hasAuthorizationCode(code: string): boolean {
  const entry = authorizationCodeStore.get(code);
  if (!entry) {
    return false;
  }
  return entry.expiresAt >= Date.now();
}
