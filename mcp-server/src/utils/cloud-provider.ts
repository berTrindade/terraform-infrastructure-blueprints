/**
 * Cloud provider utilities
 */

import type { CloudProvider } from "../config/types.js";
import { CLOUD_PROVIDERS } from "../config/constants.js";

/**
 * Gets cloud provider from blueprint name
 *
 * @param blueprintName - The blueprint name to analyze
 * @returns Cloud provider or null if unknown
 *
 * @example
 * ```typescript
 * getCloudProvider("apigw-lambda-rds") // "aws"
 * getCloudProvider("functions-postgresql") // "azure"
 * getCloudProvider("appengine-cloudsql-strapi") // "gcp"
 * ```
 */
export function getCloudProvider(blueprintName: string): CloudProvider | null {
  // Azure blueprints: functions-*
  if (blueprintName.startsWith("functions-")) return CLOUD_PROVIDERS.AZURE;
  // GCP blueprints: appengine-*
  if (blueprintName.startsWith("appengine-")) return CLOUD_PROVIDERS.GCP;
  // AWS blueprints: apigw-*, alb-*, eks-*, amplify-*, appsync-*
  if (
    blueprintName.startsWith("apigw-") ||
    blueprintName.startsWith("alb-") ||
    blueprintName.startsWith("eks-") ||
    blueprintName.startsWith("amplify-") ||
    blueprintName.startsWith("appsync-")
  ) {
    return CLOUD_PROVIDERS.AWS;
  }
  return null;
}
