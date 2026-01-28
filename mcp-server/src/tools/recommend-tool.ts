/**
 * Recommend blueprint tool handler
 */

import { z } from "zod";
import { filterBlueprints } from "../services/blueprint-service.js";
import { getCloudProvider } from "../utils/cloud-provider.js";
import { logger } from "../utils/logger.js";

/**
 * Recommend blueprint tool schema
 */
export const recommendBlueprintSchema = {
  description: "Get blueprint recommendation based on requirements. Example: recommend_blueprint(database: 'postgresql', pattern: 'sync')",
  inputSchema: {
    database: z.string().optional().describe("Database: dynamodb, postgresql, aurora, none"),
    pattern: z.string().optional().describe("Pattern: sync, async"),
    auth: z.boolean().optional().describe("Need authentication?"),
    containers: z.boolean().optional().describe("Need containers (ECS/EKS)?"),
    cloud: z.string().optional().describe("Cloud: aws, azure, gcp"),
  },
};

/**
 * Recommend blueprint tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleRecommendBlueprint(args: {
  database?: string;
  pattern?: string;
  auth?: boolean;
  containers?: boolean;
  cloud?: string;
}) {
  logger.info("Recommending blueprint", args);

  const matches = filterBlueprints({
    database: args.database,
    pattern: args.pattern,
    auth: args.auth,
    containers: args.containers,
    cloud: args.cloud,
  });

  if (matches.length === 0) {
    return {
      content: [{
        type: "text" as const,
        text: `No blueprint matches your requirements. Try recommend_blueprint() with fewer filters, or use search_blueprints() to browse.`
      }]
    };
  }

  const blueprint = matches[0];
  const cloudProvider = getCloudProvider(blueprint.name) || "aws";
  const cloudPath = cloudProvider === "aws" ? "aws" : cloudProvider;

  return {
    content: [{
      type: "text" as const,
      text: `# Recommended: ${blueprint.name}

${blueprint.description}

**Database**: ${blueprint.database} | **Pattern**: ${blueprint.pattern} | **Cloud**: ${cloudProvider.toUpperCase()}

## Quick Start

\`\`\`bash
git clone https://github.com/berTrindade/terraform-infrastructure-blueprints.git
cd terraform-infrastructure-blueprints/${cloudPath}/${blueprint.name}/environments/dev
terraform init && terraform apply
\`\`\`

## Files

- README: \`blueprints://${cloudProvider}/${blueprint.name}/README.md\`
- Main: \`blueprints://${cloudProvider}/${blueprint.name}/environments/dev/main.tf\`

Use fetch_blueprint_file() to get file contents, or extract_pattern() to add capabilities.`
    }]
  };
}
