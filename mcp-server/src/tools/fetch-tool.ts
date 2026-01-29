/**
 * Fetch blueprint file tool handler
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { readBlueprintFile } from "../services/file-service.js";
import { getBlueprint, findBlueprint } from "../services/blueprint-service.js";
import { getCloudProvider } from "../utils/cloud-provider.js";
import { BLUEPRINTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { sanitizeErrorMessage } from "../utils/errors.js";

/**
 * Fetch blueprint file tool schema
 */
export const fetchBlueprintFileSchema = {
  description: "Fetch a specific file from a blueprint. Returns the file content directly. Example: fetch_blueprint_file(blueprint: 'apigw-lambda-rds', path: 'modules/data/main.tf')",
  inputSchema: {
    blueprint: z.string().describe("Blueprint name (e.g., 'apigw-lambda-rds')"),
    path: z.string().describe("File path relative to blueprint root (e.g., 'README.md', 'modules/data/main.tf', 'environments/dev/main.tf')"),
  },
};

/**
 * Fetch blueprint file tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleFetchBlueprintFile(args: { blueprint: string; path: string }) {
  const startTime = Date.now();
  const requestId = randomUUID();
  const wideEvent: Record<string, unknown> = {
    tool: "fetch_blueprint_file",
    request_id: requestId,
    blueprint: args.blueprint,
    path: args.path,
  };

  try {
    const blueprintData = findBlueprint(args.blueprint);

    if (!blueprintData) {
      const available = BLUEPRINTS.map(b => b.name).join(", ");
      wideEvent.status_code = 404;
      wideEvent.outcome = "not_found";
      wideEvent.duration_ms = Date.now() - startTime;
      logger.info(wideEvent);

      return {
        content: [{
          type: "text" as const,
          text: `Blueprint "${args.blueprint}" not found.\n\nAvailable blueprints: ${available}`
        }]
      };
    }

    const cloudProvider = getCloudProvider(args.blueprint) || "aws";
    const uri = `blueprints://${cloudProvider}/${args.blueprint}/${args.path}`;
    wideEvent.cloud_provider = cloudProvider;
    wideEvent.uri = uri;

    const { content, mimeType } = await readBlueprintFile(uri);
    wideEvent.file_size = content.length;
    wideEvent.mime_type = mimeType;

    let codeLang = "text";
    if (mimeType.includes("hcl")) {
      codeLang = "hcl";
    } else if (mimeType.includes("markdown")) {
      codeLang = "markdown";
    }

    wideEvent.status_code = 200;
    wideEvent.outcome = "success";
    wideEvent.duration_ms = Date.now() - startTime;
    logger.info(wideEvent);

    return {
      content: [{
        type: "text" as const,
        text: `# ${args.blueprint}/${args.path}\n\n\`\`\`${codeLang}\n${content}\n\`\`\``
      }]
    };
  } catch (error) {
    // Sanitize error message to prevent information disclosure
    const sanitizedMessage = sanitizeErrorMessage(error);
    wideEvent.status_code = 500;
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.name : "UnknownError",
      message: sanitizedMessage,
    };
    wideEvent.duration_ms = Date.now() - startTime;
    logger.error(wideEvent);

    return {
      content: [{
        type: "text" as const,
        text: `Error fetching file: ${sanitizedMessage}\n\nMake sure the path is correct. Common paths:\n- README.md\n- environments/dev/main.tf\n- modules/data/main.tf\n- modules/vpc/main.tf`
      }]
    };
  }
}
