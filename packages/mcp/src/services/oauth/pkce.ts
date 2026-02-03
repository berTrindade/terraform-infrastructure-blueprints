/**
 * PKCE (Proof Key for Code Exchange) validation
 * 
 * Validates code challenges and verifiers according to RFC 7636
 */

import { createHash } from "node:crypto";

/**
 * Store for PKCE code challenges
 * In production, use a database or Redis for distributed systems
 */
const codeChallengeStore = new Map<string, {
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: number;
}>();

/**
 * Clean up expired challenges (run periodically)
 */
function cleanupExpiredChallenges(): void {
  const now = Date.now();
  for (const [key, value] of codeChallengeStore.entries()) {
    if (value.expiresAt < now) {
      codeChallengeStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupExpiredChallenges, 5 * 60 * 1000);

/**
 * Store PKCE code challenge
 * 
 * @param state - OAuth state parameter (used as key)
 * @param codeChallenge - Base64URL-encoded SHA256 hash of code verifier
 * @param codeChallengeMethod - Challenge method (should be "S256")
 * @param ttlSeconds - Time to live in seconds (default: 10 minutes)
 */
export function storeCodeChallenge(
  state: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  ttlSeconds: number = 600
): void {
  codeChallengeStore.set(state, {
    codeChallenge,
    codeChallengeMethod,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Verify PKCE code verifier against stored challenge
 * 
 * @param state - OAuth state parameter
 * @param codeVerifier - Plain text code verifier
 * @returns True if verifier matches challenge, false otherwise
 */
export function verifyCodeVerifier(state: string, codeVerifier: string): boolean {
  const stored = codeChallengeStore.get(state);
  if (!stored) {
    return false;
  }

  // Check expiration
  if (stored.expiresAt < Date.now()) {
    codeChallengeStore.delete(state);
    return false;
  }

  // Verify code challenge method
  if (stored.codeChallengeMethod !== "S256") {
    return false;
  }

  // Compute SHA256 hash of code verifier
  const hash = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // Compare with stored challenge
  const isValid = hash === stored.codeChallenge;

  // Remove challenge after verification (one-time use)
  if (isValid) {
    codeChallengeStore.delete(state);
  }

  return isValid;
}

/**
 * Remove stored code challenge (cleanup)
 * 
 * @param state - OAuth state parameter
 */
export function removeCodeChallenge(state: string): void {
  codeChallengeStore.delete(state);
}
