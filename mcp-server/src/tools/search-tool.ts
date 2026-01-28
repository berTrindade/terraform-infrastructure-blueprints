/**
 * Search blueprints tool handler
 */

import { z } from "zod";
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
  logger.info("Searching blueprints", { query: args.query });

  const queryLower = args.query.toLowerCase();
  const matches = searchBlueprints(queryLower, 10);

  if (matches.length === 0) {
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

  return {
    content: [{
      type: "text" as const,
      text: `Found ${matches.length} blueprint(s):\n\n${results}\n\nUse recommend_blueprint() for detailed recommendations.`
    }]
  };
}
