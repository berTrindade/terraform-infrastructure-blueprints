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
        const awsPath = path.join(possiblePath, "aws");
        const azurePath = path.join(possiblePath, "azure");
        const gcpPath = path.join(possiblePath, "gcp");
        if (fs.existsSync(awsPath) && fs.existsSync(azurePath) && fs.existsSync(gcpPath)) {
            return possiblePath;
        }
    }

    return path.join(__dirname, "../..");
}

/**
 * Application configuration
 */
export const config = {
    server: {
        name: process.env.MCP_SERVER_NAME || "ustwo-infra-blueprints",
        version: process.env.MCP_SERVER_VERSION || "1.0.0",
    },
    github: {
        repo: process.env.GITHUB_REPO || "berTrindade/terraform-infrastructure-blueprints",
        timeout: Number.parseInt(process.env.GITHUB_TIMEOUT || "10000", 10),
    },
    workspace: {
        root: process.env.WORKSPACE_ROOT || getWorkspaceRoot(),
    },
    logging: {
        level: process.env.LOG_LEVEL || "info",
    },
} as const;
