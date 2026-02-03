/**
 * Token storage service
 * 
 * Stores and retrieves OAuth tokens. In production, use a database.
 * This implementation uses in-memory storage for simplicity.
 */

import jwt from "jsonwebtoken";

/**
 * Token storage entry
 */
interface TokenEntry {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  companyDomain: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * In-memory token store
 * In production, replace with database (PostgreSQL, MongoDB, etc.)
 */
const tokenStore = new Map<string, TokenEntry>();

/**
 * Clean up expired tokens (run periodically)
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

/**
 * Get JWT secret from environment
 */
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return secret;
}

/**
 * Generate JWT token for MCP server
 * 
 * @param userId - User ID
 * @param email - User email
 * @param companyDomain - Company domain
 * @returns JWT token
 */
export function generateJWTToken(
  userId: string,
  email: string,
  companyDomain: string
): string {
  return jwt.sign(
    {
      user_id: userId,
      email,
      company_domain: companyDomain,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    },
    getJWTSecret(),
    {
      algorithm: "HS256",
    }
  );
}

/**
 * Store OAuth tokens
 * 
 * @param accessToken - OAuth access token
 * @param refreshToken - OAuth refresh token (optional)
 * @param userId - User ID
 * @param email - User email
 * @param companyDomain - Company domain
 * @param expiresIn - Token expiration in seconds (default: 1 hour)
 * @returns JWT token for MCP server
 */
export function storeTokens(
  accessToken: string,
  refreshToken: string | undefined,
  userId: string,
  email: string,
  companyDomain: string,
  expiresIn: number = 3600
): string {
  const jwtToken = generateJWTToken(userId, email, companyDomain);

  tokenStore.set(accessToken, {
    accessToken,
    refreshToken,
    userId,
    email,
    companyDomain,
    expiresAt: Date.now() + expiresIn * 1000,
    createdAt: Date.now(),
  });

  return jwtToken;
}

/**
 * Validate token and return user info
 * 
 * @param token - Access token or JWT token
 * @returns Token validation result
 */
export function validateToken(token: string): {
  valid: boolean;
  user_id?: string;
  email?: string;
  company_domain?: string;
  error?: string;
} {
  // Try JWT validation first
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as {
      user_id: string;
      email: string;
      company_domain: string;
      exp: number;
    };

    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return {
        valid: false,
        error: "Token expired",
      };
    }

    return {
      valid: true,
      user_id: decoded.user_id,
      email: decoded.email,
      company_domain: decoded.company_domain,
    };
  } catch (error) {
    // Not a JWT, try access token lookup
    const entry = tokenStore.get(token);
    if (!entry) {
      return {
        valid: false,
        error: "Token not found",
      };
    }

    if (entry.expiresAt < Date.now()) {
      tokenStore.delete(token);
      return {
        valid: false,
        error: "Token expired",
      };
    }

    return {
      valid: true,
      user_id: entry.userId,
      email: entry.email,
      company_domain: entry.companyDomain,
    };
  }
}

/**
 * Revoke token
 * 
 * @param token - Access token to revoke
 */
export function revokeToken(token: string): void {
  tokenStore.delete(token);
}
