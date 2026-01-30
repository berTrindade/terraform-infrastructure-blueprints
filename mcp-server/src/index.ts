#!/usr/bin/env node

/**
 * MCP Server for ustwo Infrastructure Blueprints
 *
 * Provides AI assistants with access to Terraform infrastructure blueprints
 * across AWS, Azure, and GCP.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { randomUUID } from "node:crypto";
import { config } from "./config/config.js";
// BLUEPRINTS constant still used by tools, but not for static resources
import { BLUEPRINTS } from "./config/constants.js";
import { logger } from "./utils/logger.js";
// Resource service deprecated - static resources moved to Skills per ADR 0009
// import { registerImportantBlueprintResources } from "./services/resource-service.js";

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
export function createServer(): McpServer {
  const server = new McpServer({
    name: config.server.name,
    version: config.server.version,
  });

  // Static resources (catalog, list, blueprint files) removed per ADR 0009
  // Use Skills for static content (blueprint-catalog, blueprint-patterns)
  // Use MCP tools for dynamic discovery (search_blueprints, recommend_blueprint, fetch_blueprint_file)

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
  const startTime = Date.now();
  const requestId = randomUUID();
  const wideEvent: Record<string, unknown> = {
    operation: "server_startup",
    request_id: requestId,
    server_name: config.server.name,
    server_version: config.server.version,
  };

  try {
    const server = createServer();

    // Static blueprint resources removed per ADR 0009
    // Static content now in Skills, dynamic discovery via MCP tools

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    wideEvent.status_code = 200;
    wideEvent.outcome = "success";
    wideEvent.duration_ms = Date.now() - startTime;
    logger.info(wideEvent);
  } catch (error) {
    wideEvent.status_code = 500;
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    wideEvent.duration_ms = Date.now() - startTime;
    logger.error(wideEvent);
    process.exit(1);
  }
}

// Start server with top-level await
try {
  await main();
} catch (error) {
  const wideEvent: Record<string, unknown> = {
    operation: "server_startup",
    status_code: 500,
    outcome: "error",
    error: {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
  };
  logger.error(wideEvent);
  process.exit(1);
}
// test

// Trigger release test
