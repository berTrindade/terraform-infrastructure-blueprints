/**
 * Blueprint service for querying and filtering blueprints
 */

import type { Blueprint, CloudProvider } from "../config/types.js";
import { BLUEPRINTS, PROJECT_BLUEPRINTS, EXTRACTION_PATTERNS } from "../config/constants.js";
import { BlueprintNotFoundError, ProjectNotFoundError } from "../utils/errors.js";
import { getCloudProvider } from "../utils/cloud-provider.js";
import { logger } from "../utils/logger.js";
import { validateBlueprintName, validateCloudProvider } from "../utils/validation.js";

/**
 * Finds a blueprint by name
 *
 * @param name - Blueprint name
 * @returns Blueprint or null if not found
 */
export function findBlueprint(name: string): Blueprint | null {
  return BLUEPRINTS.find(b => b.name === name) || null;
}

/**
 * Gets a blueprint by name or throws error
 *
 * @param name - Blueprint name
 * @returns Blueprint object
 * @throws {BlueprintNotFoundError} If blueprint not found
 * @throws {ValidationError} If blueprint name is invalid
 *
 * @example
 * ```typescript
 * try {
 *   const blueprint = getBlueprint("apigw-lambda-rds");
 *   console.log(blueprint.description);
 * } catch (error) {
 *   if (error instanceof BlueprintNotFoundError) {
 *     console.error("Blueprint not found");
 *   }
 * }
 * ```
 */
export function getBlueprint(name: string): Blueprint {
  validateBlueprintName(name);
  const blueprint = findBlueprint(name);
  if (!blueprint) {
    throw new BlueprintNotFoundError(name);
  }
  return blueprint;
}

/**
 * Searches blueprints by query string
 *
 * Performs case-insensitive search across blueprint name, description,
 * database, and pattern fields.
 *
 * @param query - Search query string
 * @param limit - Maximum number of results to return (default: 10)
 * @returns Array of matching blueprints, sorted by relevance
 *
 * @example
 * ```typescript
 * const results = searchBlueprints("serverless postgresql", 5);
 * results.forEach(b => console.log(b.name));
 * ```
 */
export function searchBlueprints(query: string, limit: number = 10): Blueprint[] {
  if (!query || typeof query !== "string") {
    return [];
  }
  const queryLower = query.toLowerCase();
  return BLUEPRINTS
    .filter(b => {
      const text = `${b.name} ${b.description} ${b.database} ${b.pattern}`.toLowerCase();
      return text.includes(queryLower);
    })
    .slice(0, limit);
}

/**
 * Filters blueprints by multiple criteria
 *
 * Applies filters sequentially to narrow down blueprint matches.
 * All specified filters must match for a blueprint to be included.
 *
 * @param filters - Filter criteria object
 * @param filters.database - Database type to filter by (partial match)
 * @param filters.pattern - Pattern type to filter by (sync/async)
 * @param filters.auth - Whether authentication is required
 * @param filters.containers - Whether containers (ECS/EKS) are needed
 * @param filters.cloud - Cloud provider (aws, azure, gcp)
 * @returns Array of matching blueprints
 *
 * @example
 * ```typescript
 * const matches = filterBlueprints({
 *   database: "postgresql",
 *   pattern: "sync",
 *   cloud: "aws"
 * });
 * ```
 */
export function filterBlueprints(filters: {
  database?: string;
  pattern?: string;
  auth?: boolean;
  containers?: boolean;
  cloud?: string;
}): Blueprint[] {
  let matches = BLUEPRINTS;

  if (filters.containers === true) {
    matches = matches.filter(b => b.name.includes("ecs") || b.name.includes("eks"));
  } else if (filters.containers === false) {
    matches = matches.filter(b => !b.name.includes("ecs") && !b.name.includes("eks"));
  }

  if (filters.database) {
    matches = matches.filter(b => b.database.toLowerCase().includes(filters.database!.toLowerCase()));
  }

  if (filters.pattern) {
    matches = matches.filter(b => b.pattern.toLowerCase().includes(filters.pattern!.toLowerCase()));
  }

  if (filters.auth === true) {
    matches = matches.filter(b => b.name.includes("cognito") || b.name.includes("amplify"));
  }

  if (filters.cloud) {
    const provider = filters.cloud.toLowerCase();
    matches = matches.filter(b => getCloudProvider(b.name) === provider);
  }

  return matches;
}

/**
 * Finds a project blueprint mapping
 *
 * @param projectName - Project name
 * @returns Project blueprint info or null
 */
export function findProjectBlueprint(projectName: string): { key: string; info: typeof PROJECT_BLUEPRINTS[string] } | null {
  const projectLower = projectName.toLowerCase();
  const match = Object.entries(PROJECT_BLUEPRINTS).find(
    ([key]) => key.toLowerCase().includes(projectLower)
  );

  if (!match) {
    return null;
  }

  return { key: match[0], info: match[1] };
}

/**
 * Gets a project blueprint or throws error
 *
 * @param projectName - Project name
 * @returns Project blueprint info
 * @throws {ProjectNotFoundError} If project not found
 */
export function getProjectBlueprint(projectName: string): { key: string; info: typeof PROJECT_BLUEPRINTS[string] } {
  const result = findProjectBlueprint(projectName);
  if (!result) {
    throw new ProjectNotFoundError(projectName);
  }
  return result;
}

/**
 * Finds cross-cloud equivalent blueprint for migration scenarios
 *
 * Maps blueprints from one cloud provider to equivalent blueprints
 * in another cloud provider based on architectural characteristics.
 *
 * @param sourceBlueprint - Source blueprint name
 * @param targetCloud - Target cloud provider (aws, azure, gcp)
 * @returns Equivalent blueprint or null if no mapping exists
 * @throws {ValidationError} If cloud provider is invalid
 *
 * @example
 * ```typescript
 * const equivalent = findCrossCloudEquivalent("apigw-lambda-rds", "azure");
 * // Returns: { name: "functions-postgresql", ... }
 * ```
 */
export function findCrossCloudEquivalent(sourceBlueprint: string, targetCloud: string): Blueprint | null {
  validateCloudProvider(targetCloud);
  const source = findBlueprint(sourceBlueprint);
  if (!source) {
    logger.warn("Source blueprint not found", { sourceBlueprint });
    return null;
  }

  const targetCloudLower = targetCloud.toLowerCase();

  // Mapping logic
  const mappings: Record<string, Record<string, string>> = {
    "appengine-cloudsql-strapi": { aws: "alb-ecs-fargate-rds" },
    "functions-postgresql": { aws: "apigw-lambda-rds", gcp: "appengine-cloudsql-strapi" },
    "apigw-lambda-rds": { azure: "functions-postgresql", gcp: "appengine-cloudsql-strapi" },
    "alb-ecs-fargate-rds": { azure: "functions-postgresql", gcp: "appengine-cloudsql-strapi" },
  };

  const targetName = mappings[sourceBlueprint]?.[targetCloudLower];
  if (!targetName) {
    return null;
  }

  return findBlueprint(targetName);
}

/**
 * Gets extraction pattern for a capability
 *
 * @param capability - Capability name
 * @returns Extraction pattern or null
 */
export function getExtractionPattern(capability: string): typeof EXTRACTION_PATTERNS[string] | null {
  return EXTRACTION_PATTERNS[capability.toLowerCase()] || null;
}
