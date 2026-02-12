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
import { getOAuthMetadata } from "./services/oauth-metadata.js";
// Resource service deprecated - static resources moved to Skills per ADR 0007
// import { registerImportantBlueprintResources } from "./services/resource-service.js";

// Tool handlers
import { searchBlueprintsSchema, handleSearchBlueprints } from "./tools/search-tool.js";
import { fetchBlueprintFileSchema, handleFetchBlueprintFile } from "./tools/fetch-tool.js";
import { recommendBlueprintSchema, handleRecommendBlueprint } from "./tools/recommend-tool.js";
import { extractPatternSchema, handleExtractPattern } from "./tools/extract-tool.js";
import { findByProjectSchema, handleFindByProject } from "./tools/project-tool.js";
import { getWorkflowGuidanceSchema, handleGetWorkflowGuidance } from "./tools/workflow-tool.js";
import { getWorkflowContent, WORKFLOW_PROMPTS_LIST } from "./services/prompts-service.js";
// generate_module tool removed - use code-generation skill instead
// import { generateModuleSchema, handleGenerateModule } from "./tools/generate-tool.js";

/**
 * Creates and configures the MCP server
 *
 * @returns Configured MCP server instance
 */
export function createServer(): McpServer {
  const oauthMetadata = getOAuthMetadata();
  
  // Initialize server with OAuth metadata if configured
  // Note: The MCP SDK may support OAuth via capabilities or well-known endpoints
  // This structure follows the MCP OAuth 2.0 specification
  const serverOptions: {
    name: string;
    version: string;
    capabilities?: {
      experimental?: {
        oauth?: {
          authorizationServerMetadata: {
            issuer: string;
            authorizationEndpoint: string;
            tokenEndpoint: string;
            scopesSupported: string[];
            responseTypesSupported: string[];
            codeChallengeMethodsSupported: string[];
          };
        };
      };
    };
  } = {
    name: config.server.name,
    version: config.server.version,
  };

  // Add OAuth metadata if configured
  if (oauthMetadata) {
    serverOptions.capabilities = {
      experimental: {
        oauth: {
          authorizationServerMetadata: {
            issuer: oauthMetadata.issuer,
            authorizationEndpoint: oauthMetadata.authorization_endpoint,
            tokenEndpoint: oauthMetadata.token_endpoint,
            scopesSupported: oauthMetadata.scopes_supported,
            responseTypesSupported: oauthMetadata.response_types_supported,
            codeChallengeMethodsSupported: oauthMetadata.code_challenge_methods_supported,
          },
        },
      },
    };
  }

  const server = new McpServer(serverOptions);

  // Static resources (catalog, list, blueprint files) removed per ADR 0007
  // Use Skills for static content (style-guide)
  // Use MCP tools for dynamic discovery (search_blueprints, recommend_blueprint, fetch_blueprint_file)

  // Register tools with annotations
  // All tools are read-only and idempotent operations
  server.registerTool("search_blueprints", {
    ...searchBlueprintsSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, handleSearchBlueprints);
  
  server.registerTool("fetch_blueprint_file", {
    ...fetchBlueprintFileSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, handleFetchBlueprintFile);
  
  server.registerTool("recommend_blueprint", {
    ...recommendBlueprintSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, handleRecommendBlueprint);
  
  server.registerTool("extract_pattern", {
    ...extractPatternSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, handleExtractPattern);
  
  server.registerTool("find_by_project", {
    ...findByProjectSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, handleFindByProject);
  
  server.registerTool("get_workflow_guidance", {
    ...getWorkflowGuidanceSchema,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  }, handleGetWorkflowGuidance);
  // generate_module tool removed - use code-generation skill instead
  // server.registerTool("generate_module", generateModuleSchema, handleGenerateModule);

  // MCP Prompts API (third building block) — same content as get_workflow_guidance, for list/get prompt
  for (const prompt of WORKFLOW_PROMPTS_LIST) {
    server.registerPrompt(prompt.name, {
      title: prompt.title,
      description: prompt.description,
    }, () => ({
      messages: [{
        role: "user" as const,
        content: { type: "text" as const, text: getWorkflowContent(prompt.name) },
      }],
    }));
  }

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

    // Static blueprint resources removed per ADR 0007
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
