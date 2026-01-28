/**
 * Search blueprints tool handler
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { searchBlueprints } from "../services/blueprint-service.js";
import { getCloudProvider } from "../utils/cloud-provider.js";
import { logger } from "../utils/logger.js";

/**
 * Search blueprints tool schema
 */
export const searchBlueprintsSchema = {
  description: "Search for blueprints by keywords. Example: search_blueprints(query: 'serverless postgresql')",
  inputSchema: {
    query: z.string().describe("Search keywords"),
  },
};

/**
 * Search blueprints tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleSearchBlueprints(args: { query: string }) {
  const startTime = Date.now();
  const requestId = randomUUID();
  const wideEvent: Record<string, unknown> = {
    tool: "search_blueprints",
    request_id: requestId,
    query: args.query,
  };

  try {
    const queryLower = args.query.toLowerCase();
    const matches = searchBlueprints(queryLower, 10);

    wideEvent.result_count = matches.length;
    wideEvent.matches = matches.map(b => ({
      name: b.name,
      cloud: getCloudProvider(b.name) || "aws",
    }));

    if (matches.length === 0) {
      wideEvent.status_code = 200;
      wideEvent.outcome = "success";
      wideEvent.duration_ms = Date.now() - startTime;
      logger.info(wideEvent);

      return {
        content: [{
          type: "text" as const,
          text: `No blueprints found for "${args.query}". Try: 'serverless', 'postgresql', 'queue', 'containers', or use recommend_blueprint().`
        }]
      };
    }

    const results = matches.map(b => {
      const cloud = getCloudProvider(b.name) || "aws";
      return `- **${b.name}** (${cloud.toUpperCase()}) - ${b.description}`;
    }).join("\n");

    wideEvent.status_code = 200;
    wideEvent.outcome = "success";
    wideEvent.duration_ms = Date.now() - startTime;
    logger.info(wideEvent);

    return {
      content: [{
        type: "text" as const,
        text: `Found ${matches.length} blueprint(s):\n\n${results}\n\nUse recommend_blueprint() for detailed recommendations.`
      }]
    };
  } catch (error) {
    wideEvent.status_code = 500;
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    wideEvent.duration_ms = Date.now() - startTime;
    logger.error(wideEvent);
    throw error;
  }
}
