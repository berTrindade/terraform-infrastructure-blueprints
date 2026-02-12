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
  outputSchema: z.object({
    blueprints: z.array(z.object({
      name: z.string(),
      description: z.string(),
      cloud: z.string(),
      database: z.string().optional(),
      pattern: z.string().optional(),
    })),
    total: z.number(),
    query: z.string(),
  }),
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
          text: `No blueprints found for "${args.query}". Try: 'serverless', 'postgresql', 'queue', 'containers', or use recommend_blueprint().`,
          mimeType: "text/markdown",
        }],
        structuredContent: {
          blueprints: [],
          total: 0,
          query: args.query,
        },
      };
    }

    const results = matches.map(b => {
      const cloud = getCloudProvider(b.name) || "aws";
      return `- **${b.name}** (${cloud.toUpperCase()}) - ${b.description}`;
    }).join("\n");

    const structuredBlueprints = matches.map(b => ({
      name: b.name,
      description: b.description,
      cloud: getCloudProvider(b.name) || "aws",
      database: b.database,
      pattern: b.pattern,
    }));

    wideEvent.status_code = 200;
    wideEvent.outcome = "success";
    wideEvent.duration_ms = Date.now() - startTime;
    logger.info(wideEvent);

    return {
      content: [{
        type: "text" as const,
        text: `Found ${matches.length} blueprint(s):\n\n${results}\n\nUse recommend_blueprint() for detailed recommendations.`,
        mimeType: "text/markdown",
      }],
      structuredContent: {
        blueprints: structuredBlueprints,
        total: matches.length,
        query: args.query,
      },
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
