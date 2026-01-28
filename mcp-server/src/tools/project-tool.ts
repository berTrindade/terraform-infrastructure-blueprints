/**
 * Find by project tool handler
 */

import { z } from "zod";
import { getProjectBlueprint, getBlueprint, findCrossCloudEquivalent } from "../services/blueprint-service.js";
import { logger } from "../utils/logger.js";

/**
 * Find by project tool schema
 */
export const findByProjectSchema = {
  description: "Find blueprint used by a project. Example: find_by_project(project_name: 'Mavie', target_cloud: 'aws')",
  inputSchema: {
    project_name: z.string().describe("Project name: Mavie, HM Impuls, SuprDOG, etc."),
    target_cloud: z.string().optional().describe("Get cross-cloud equivalent: aws, azure, gcp"),
  },
};

/**
 * Find by project tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleFindByProject(args: {
  project_name: string;
  target_cloud?: string;
}) {
  logger.info("Finding project blueprint", { project: args.project_name });

  const { info } = getProjectBlueprint(args.project_name);
  const blueprint = getBlueprint(info.blueprint);

  let text = `# ${args.project_name}\n\n**Blueprint**: \`${info.blueprint}\` (${info.cloud.toUpperCase()})\n**Description**: ${info.description}\n\n**Details**: Database: ${blueprint.database} | Pattern: ${blueprint.pattern}\n`;

  if (args.target_cloud && info.cloud !== args.target_cloud.toLowerCase()) {
    const equivalent = findCrossCloudEquivalent(info.blueprint, args.target_cloud.toLowerCase());
    if (equivalent) {
      text += `\n**${args.target_cloud.toUpperCase()} Equivalent**: \`${equivalent.name}\`\n`;
      text += `\`\`\`bash\ncd terraform-infrastructure-blueprints/${args.target_cloud}/${equivalent.name}/environments/dev\nterraform init && terraform apply\n\`\`\``;
    }
  }

  return { content: [{ type: "text" as const, text }] };
}
