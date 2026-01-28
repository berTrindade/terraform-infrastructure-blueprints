/**
 * File service for reading blueprint files
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { promisify } from "node:util";
import type { FileContent } from "../config/types.js";
import { InvalidUriError, FileNotFoundError } from "../utils/errors.js";
import { resolveWorkspacePath, getMimeType } from "../utils/path-utils.js";
import { config } from "../config/config.js";
import { logger } from "../utils/logger.js";

const readFile = promisify(fs.readFile);

/**
 * Parses a blueprint URI into components
 *
 * @param uri - Blueprint URI (e.g., blueprints://aws/apigw-lambda-rds/README.md)
 * @returns Parsed URI components
 * @throws {InvalidUriError} If URI format is invalid
 */
function parseBlueprintUri(uri: string): { cloud: string; blueprintName: string; filePath: string } {
    const uriRegex = /^blueprints:\/\/([^/]+)\/([^/]+)\/(.+)$/;
    const match = uriRegex.exec(uri);
    if (!match) {
        throw new InvalidUriError(uri);
    }

    const [, cloud, blueprintName, filePath] = match;
    return { cloud, blueprintName, filePath };
}

/**
 * Reads a blueprint file from a resource URI
 *
 * @param uri - Blueprint URI
 * @returns File content and MIME type
 * @throws {InvalidUriError} If URI is invalid
 * @throws {FileNotFoundError} If file doesn't exist
 * @throws {SecurityError} If path is outside workspace
 *
 * @example
 * ```typescript
 * const { content, mimeType } = await readBlueprintFile("blueprints://aws/apigw-lambda-rds/README.md");
 * ```
 */
export async function readBlueprintFile(uri: string): Promise<FileContent> {
    try {
        const { cloud, blueprintName, filePath } = parseBlueprintUri(uri);
        const workspaceRoot = config.workspace.root;
        const fullPath = resolveWorkspacePath(path.join(cloud, blueprintName, filePath), workspaceRoot);

        const exists = await fs.promises.access(fullPath).then(() => true).catch(() => false);
        if (!exists) {
            throw new FileNotFoundError(uri);
        }

        const content = await readFile(fullPath, "utf-8");
        const mimeType = getMimeType(filePath);

        // File read success - log as info with context
        logger.info({
            operation: "read_blueprint_file",
            uri,
            file_size: content.length,
            mime_type: mimeType,
            outcome: "success",
        });

        return { content, mimeType };
    } catch (error) {
        if (error instanceof InvalidUriError || error instanceof FileNotFoundError) {
            throw error;
        }
        logger.error({
            operation: "read_blueprint_file",
            uri,
            outcome: "error",
            error: {
                type: error instanceof Error ? error.name : "UnknownError",
                message: error instanceof Error ? error.message : String(error),
            },
        });
        throw new FileNotFoundError(uri);
    }
}
