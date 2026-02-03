/**
 * Application configuration for OAuth authorization server
 */

import { z } from "zod";

/**
 * Environment variable schema with Zod validation
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  AUTH_BASE_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  COMPANY_DOMAIN: z.string(),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["info", "error"]).default("info"),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

/**
 * Application configuration
 */
export const config = {
  server: {
    port: env.PORT,
    baseUrl: env.AUTH_BASE_URL,
  },
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  company: {
    domain: env.COMPANY_DOMAIN,
  },
  jwt: {
    secret: env.JWT_SECRET,
  },
  database: {
    url: env.DATABASE_URL,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;
