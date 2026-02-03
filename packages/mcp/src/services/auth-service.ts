/**
 * Authentication service for MCP server
 * 
 * Validates OAuth tokens from the authorization server and verifies
 * company domain requirements.
 */

import { config } from "../config/config.js";
import { logger } from "../utils/logger.js";

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  companyDomain?: string;
  error?: string;
}

/**
 * Validate OAuth token from MCP request
 * 
 * Extracts token from request headers, validates signature/format,
 * checks expiration, and verifies company domain from token claims.
 * 
 * @param token - OAuth access token from request
 * @returns Token validation result with user information
 */
export async function validateToken(token: string | undefined): Promise<TokenValidationResult> {
  if (!config.oauth) {
    // OAuth not configured - allow unauthenticated access
    return { valid: true };
  }

  if (!token) {
    return {
      valid: false,
      error: "Missing authorization token",
    };
  }

  try {
    // Extract token (handle "Bearer <token>" format)
    const accessToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    // Validate token with authorization server
    const authServerUrl = config.oauth.authServerUrl;
    const validationUrl = `${authServerUrl}/oauth/token/validate`;

    const response = await fetch(validationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: accessToken }),
    });

    if (!response.ok) {
      logger.error({
        operation: "token_validation",
        status_code: response.status,
        error: "Token validation failed",
      });

      return {
        valid: false,
        error: "Invalid or expired token",
      };
    }

    const tokenData = await response.json() as {
      valid: boolean;
      user_id?: string;
      email?: string;
      company_domain?: string;
      error?: string;
    };

    if (!tokenData.valid) {
      return {
        valid: false,
        error: tokenData.error || "Token validation failed",
      };
    }

    // Verify company domain if required
    const requiredDomain = process.env.COMPANY_DOMAIN;
    if (requiredDomain && tokenData.company_domain !== requiredDomain) {
      logger.error({
        operation: "token_validation",
        error: "Company domain mismatch",
        required_domain: requiredDomain,
        token_domain: tokenData.company_domain,
      });

      return {
        valid: false,
        error: "Company domain not authorized",
      };
    }

    return {
      valid: true,
      userId: tokenData.user_id,
      email: tokenData.email,
      companyDomain: tokenData.company_domain,
    };
  } catch (error) {
    logger.error({
      operation: "token_validation",
      error: {
        type: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      valid: false,
      error: "Token validation error",
    };
  }
}

/**
 * Extract token from MCP request headers
 * 
 * MCP requests may include authorization in headers or context.
 * This function extracts the token from common locations.
 * 
 * @param headers - Request headers
 * @returns Token if found, undefined otherwise
 */
export function extractTokenFromHeaders(headers: Record<string, string | string[] | undefined>): string | undefined {
  // Check Authorization header
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader) {
    const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    return token.startsWith("Bearer ") ? token.slice(7) : token;
  }

  // Check X-Access-Token header (alternative)
  const accessToken = headers["x-access-token"] || headers["X-Access-Token"];
  if (accessToken) {
    return Array.isArray(accessToken) ? accessToken[0] : accessToken;
  }

  return undefined;
}
