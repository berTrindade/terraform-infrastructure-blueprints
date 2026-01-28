/**
 * Fetch blueprint file tool handler
 */

import { z } from "zod";
import { readBlueprintFile } from "../services/file-service.js";
import { getBlueprint, findBlueprint } from "../services/blueprint-service.js";
import { getCloudProvider } from "../utils/cloud-provider.js";
import { BLUEPRINTS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

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
  logger.info("Fetching blueprint file", { blueprint: args.blueprint, path: args.path });

  const blueprintData = findBlueprint(args.blueprint);

  if (!blueprintData) {
    const available = BLUEPRINTS.map(b => b.name).join(", ");
    return {
      content: [{
        type: "text" as const,
        text: `Blueprint "${args.blueprint}" not found.\n\nAvailable blueprints: ${available}`
      }]
    };
  }

  const cloudProvider = getCloudProvider(args.blueprint) || "aws";
  const uri = `blueprints://${cloudProvider}/${args.blueprint}/${args.path}`;

  try {
    const { content, mimeType } = await readBlueprintFile(uri);
    let codeLang = "text";
    if (mimeType.includes("hcl")) {
      codeLang = "hcl";
    } else if (mimeType.includes("markdown")) {
      codeLang = "markdown";
    }
    return {
      content: [{
        type: "text" as const,
        text: `# ${args.blueprint}/${args.path}\n\n\`\`\`${codeLang}\n${content}\n\`\`\``
      }]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to fetch blueprint file", error, { blueprint: args.blueprint, path: args.path });
    return {
      content: [{
        type: "text" as const,
        text: `Error fetching file: ${errorMessage}\n\nMake sure the path is correct. Common paths:\n- README.md\n- environments/dev/main.tf\n- modules/data/main.tf\n- modules/vpc/main.tf`
      }]
    };
  }
}
