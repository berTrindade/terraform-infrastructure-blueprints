/**
 * Resource service for managing MCP resources
 * 
 * @deprecated Per ADR 0007, static resources have been moved to Skills.
 * This service is kept for reference but is no longer used.
 * Static content (blueprint files, catalog) is now in Skills:
 * - blueprint-catalog: Catalog table, decision trees, cross-cloud equivalents
 * - blueprint-patterns: Common patterns (RDS, DynamoDB, VPC, etc.)
 * 
 * Dynamic discovery still uses MCP tools:
 * - search_blueprints(): Search for blueprints
 * - recommend_blueprint(): Get recommendations
 * - fetch_blueprint_file(): Get specific files on-demand
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { promisify } from "node:util";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CloudProvider } from "../config/types.js";
import { config } from "../config/config.js";
import { FILE_EXTENSIONS } from "../config/constants.js";
import { getMimeType, sanitizeResourceName, fileExists } from "../utils/path-utils.js";
import { readBlueprintFile } from "./file-service.js";
import { logger } from "../utils/logger.js";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Creates a resource handler for a blueprint file
 *
 * @param uri - Resource URI
 * @returns Resource handler function
 */
function createResourceHandler(uri: string) {
  return async () => {
    try {
      const { content, mimeType } = await readBlueprintFile(uri);
      return {
        contents: [{ uri, mimeType, text: content }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({
        operation: "read_resource_file",
        uri,
        outcome: "error",
        error: {
          type: error instanceof Error ? error.name : "UnknownError",
          message: errorMessage,
        },
      });
      return {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: `Error reading file: ${errorMessage}`,
        }],
      };
    }
  };
}

/**
 * Registers a blueprint file as an MCP resource
 *
 * @param server - MCP server instance
 * @param cloud - Cloud provider
 * @param blueprintName - Blueprint name
 * @param relativePath - Relative file path
 * @param mimeType - MIME type
 */
function registerBlueprintFile(
  server: McpServer,
  cloud: CloudProvider,
  blueprintName: string,
  relativePath: string,
  mimeType: string
): void {
  const uri = `blueprints://${cloud}/${blueprintName}/${relativePath}`;
  const resourceName = sanitizeResourceName(`blueprint-${cloud}-${blueprintName}-${relativePath}`);

  server.registerResource(
    resourceName,
    uri,
    {
      description: `${relativePath} from ${blueprintName} blueprint`,
      mimeType,
    },
    createResourceHandler(uri)
  );

  // Resource registration is logged at higher level during bulk registration
}

/**
 * Recursively registers files in a module directory
 *
 * @param server - MCP server instance
 * @param dirPath - Directory path
 * @param cloud - Cloud provider
 * @param blueprintName - Blueprint name
 * @param relativePath - Relative path from blueprint root
 */
async function registerModuleDirectoryFiles(
  server: McpServer,
  dirPath: string,
  cloud: CloudProvider,
  blueprintName: string,
  relativePath: string
): Promise<void> {
  try {
    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const entryStat = await stat(fullPath);
      const entryRelativePath = `${relativePath}/${entry}`;

      if (entryStat.isDirectory()) {
        // Skip hidden/system directories
        if (entry.startsWith(".") && entry !== "." && entry !== "..") {
          continue;
        }
        await registerModuleDirectoryFiles(server, fullPath, cloud, blueprintName, entryRelativePath);
      } else if (entryStat.isFile()) {
        // Only register relevant file types
        const ext = path.extname(entry);
        if (FILE_EXTENSIONS.RELEVANT.includes(ext as any)) {
          registerBlueprintFile(
            server,
            cloud,
            blueprintName,
            entryRelativePath,
            getMimeType(entry)
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes("ENOENT")) {
      logger.error({
        operation: "register_module_directory_files",
        dir_path: dirPath,
        outcome: "error",
        error: {
          type: error.name,
          message: error.message,
        },
      });
    }
  }
}

/**
 * Registers module files for a blueprint
 *
 * @param server - MCP server instance
 * @param blueprintPath - Blueprint directory path
 * @param cloud - Cloud provider
 * @param blueprintName - Blueprint name
 * @param moduleDir - Module directory name (default: "modules")
 */
async function registerModuleFiles(
  server: McpServer,
  blueprintPath: string,
  cloud: CloudProvider,
  blueprintName: string,
  moduleDir: string = "modules"
): Promise<void> {
  const modulesPath = path.join(blueprintPath, moduleDir);
  if (!(await fileExists(modulesPath))) {
    return;
  }

  try {
    const moduleEntries = await readdir(modulesPath);

    for (const moduleEntry of moduleEntries) {
      const modulePath = path.join(modulesPath, moduleEntry);
      const moduleStat = await stat(modulePath);

      if (!moduleStat.isDirectory()) continue;

      await registerModuleDirectoryFiles(
        server,
        modulePath,
        cloud,
        blueprintName,
        `${moduleDir}/${moduleEntry}`
      );
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes("ENOENT")) {
      logger.error({
        operation: "register_module_files",
        blueprint_name: blueprintName,
        outcome: "error",
        error: {
          type: error.name,
          message: error.message,
        },
      });
    }
  }
}

/**
 * Registers resources for a single blueprint
 *
 * @param server - MCP server instance
 * @param blueprintPath - Blueprint directory path
 * @param cloud - Cloud provider
 * @param blueprintName - Blueprint name
 */
async function registerBlueprintResources(
  server: McpServer,
  blueprintPath: string,
  cloud: CloudProvider,
  blueprintName: string
): Promise<void> {
  const blueprintStat = await stat(blueprintPath);
  if (!blueprintStat.isDirectory()) return;

  // Register README.md
  const readmePath = path.join(blueprintPath, "README.md");
  if (await fileExists(readmePath)) {
    registerBlueprintFile(
      server,
      cloud,
      blueprintName,
      "README.md",
      "text/markdown"
    );
  }

  // Register main environment file
  const mainTfPath = path.join(blueprintPath, "environments", "dev", "main.tf");
  if (await fileExists(mainTfPath)) {
    registerBlueprintFile(
      server,
      cloud,
      blueprintName,
      "environments/dev/main.tf",
      "text/x-hcl"
    );
  }

  // Register module files
  await registerModuleFiles(server, blueprintPath, cloud, blueprintName);
}

/**
 * Registers all blueprint resources
 *
 * @param server - MCP server instance
 */
export async function registerImportantBlueprintResources(server: McpServer): Promise<void> {
  const workspaceRoot = config.workspace.root;
  const clouds: CloudProvider[] = ["aws", "azure", "gcp"];

  for (const cloud of clouds) {
    const cloudPath = path.join(workspaceRoot, cloud);
    if (!(await fileExists(cloudPath))) continue;

    try {
      const blueprintDirs = await readdir(cloudPath);

      for (const blueprintName of blueprintDirs) {
        const blueprintPath = path.join(cloudPath, blueprintName);
        try {
          await registerBlueprintResources(server, blueprintPath, cloud, blueprintName);
        } catch (error) {
          if (error instanceof Error) {
            logger.error({
              operation: "register_blueprint_resources",
              blueprint_name: blueprintName,
              cloud,
              outcome: "error",
              error: {
                type: error.name,
                message: error.message,
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error({
        operation: "register_cloud_blueprint_resources",
        cloud,
        outcome: "error",
        error: {
          type: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
}
