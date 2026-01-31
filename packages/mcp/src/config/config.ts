/**
 * Application configuration
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get the workspace root directory
 */
function getWorkspaceRoot(): string {
    const possiblePaths = [
        path.join(__dirname, "../.."),
        path.join(__dirname, "../../.."),
        process.cwd(),
    ];

    for (const possiblePath of possiblePaths) {
        const awsPath = path.join(possiblePath, "blueprints", "aws");
        const azurePath = path.join(possiblePath, "blueprints", "azure");
        const gcpPath = path.join(possiblePath, "blueprints", "gcp");
        if (fs.existsSync(awsPath) && fs.existsSync(azurePath) && fs.existsSync(gcpPath)) {
            return possiblePath;
        }
    }

    return path.join(__dirname, "../..");
}

/**
 * Application configuration
 * Uses Node.js native --env-file support (v20.6.0+) + Zod for type-safe validation
 * 
 * Usage: node --env-file=.env dist/index.js
 */

import { z } from "zod";

/**
 * Environment variable schema with Zod validation
 * Provides type safety and automatic coercion
 */
const envSchema = z.object({
    MCP_SERVER_NAME: z.string().default("ustwo-infra-blueprints"),
    MCP_SERVER_VERSION: z.string().default("1.0.0"),
    GITHUB_REPO: z.string().default("berTrindade/terraform-infrastructure-blueprints"),
    GITHUB_TIMEOUT: z.coerce.number().default(10000),
    WORKSPACE_ROOT: z.string().optional(),
    LOG_LEVEL: z.enum(["info", "error"]).default("info"),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

/**
 * Application configuration
 */
export const config = {
    server: {
        name: env.MCP_SERVER_NAME,
        version: env.MCP_SERVER_VERSION,
    },
    github: {
        repo: env.GITHUB_REPO,
        timeout: env.GITHUB_TIMEOUT,
    },
    workspace: {
        root: env.WORKSPACE_ROOT || getWorkspaceRoot(),
    },
    logging: {
        level: env.LOG_LEVEL,
    },
} as const;
