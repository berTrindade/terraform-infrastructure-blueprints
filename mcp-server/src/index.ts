#!/usr/bin/env node

/**
 * MCP Server for ustwo Infrastructure Blueprints
 *
 * Provides AI assistants with access to Terraform infrastructure blueprints
 * across AWS, Azure, and GCP.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config/config.js";
import { BLUEPRINTS } from "./config/constants.js";
import { logger } from "./utils/logger.js";
import { registerImportantBlueprintResources } from "./services/resource-service.js";
import { getAgentsMdContent } from "./services/catalog-service.js";

// Tool handlers
import { searchBlueprintsSchema, handleSearchBlueprints } from "./tools/search-tool.js";
import { fetchBlueprintFileSchema, handleFetchBlueprintFile } from "./tools/fetch-tool.js";
import { recommendBlueprintSchema, handleRecommendBlueprint } from "./tools/recommend-tool.js";
import { extractPatternSchema, handleExtractPattern } from "./tools/extract-tool.js";
import { findByProjectSchema, handleFindByProject } from "./tools/project-tool.js";
import { getWorkflowGuidanceSchema, handleGetWorkflowGuidance } from "./tools/workflow-tool.js";

/**
 * Creates and configures the MCP server
 *
 * @returns Configured MCP server instance
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  // Register catalog resource
  server.registerResource(
    "catalog",
    "blueprints://catalog",
    {
      description: "Full AI context for infrastructure blueprints including decision trees and workflows",
      mimeType: "text/markdown",
    },
    async () => {
      const content = await getAgentsMdContent();
      return {
        contents: [{ uri: "blueprints://catalog", mimeType: "text/markdown", text: content }],
      };
    }
  );

  // Register list resource
  server.registerResource(
    "list",
    "blueprints://list",
    {
      description: "JSON list of all available blueprints with metadata",
      mimeType: "application/json",
    },
    async () => {
      return {
        contents: [{ uri: "blueprints://list", mimeType: "application/json", text: JSON.stringify(BLUEPRINTS, null, 2) }],
      };
    }
  );

  // Register tools
  server.registerTool("search_blueprints", searchBlueprintsSchema, handleSearchBlueprints);
  server.registerTool("fetch_blueprint_file", fetchBlueprintFileSchema, handleFetchBlueprintFile);
  server.registerTool("recommend_blueprint", recommendBlueprintSchema, handleRecommendBlueprint);
  server.registerTool("extract_pattern", extractPatternSchema, handleExtractPattern);
  server.registerTool("find_by_project", findByProjectSchema, handleFindByProject);
  server.registerTool("get_workflow_guidance", getWorkflowGuidanceSchema, handleGetWorkflowGuidance);

  return server;
}

/**
 * Main server startup function
 */
async function main(): Promise<void> {
  try {
    logger.info("Starting MCP server", { name: config.server.name, version: config.server.version });

    const server = createServer();

    // Register blueprint resources before connecting
    logger.info("Registering blueprint resources");
    await registerImportantBlueprintResources(server);

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info("MCP server running", { name: config.server.name });
  } catch (error) {
    logger.error("Failed to start MCP server", error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

// Start server with top-level await
try {
  await main();
} catch (error) {
  logger.error("Unhandled error in main", error instanceof Error ? error : undefined);
  process.exit(1);
}
