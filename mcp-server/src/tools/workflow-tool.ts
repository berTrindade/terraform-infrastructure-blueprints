/**
 * Workflow guidance tool handler
 */

import { z } from "zod";

/**
 * Workflow guidance tool schema
 */
export const getWorkflowGuidanceSchema = {
  description: "Get workflow guidance. Example: get_workflow_guidance(task: 'new_project')",
  inputSchema: {
    task: z.enum(["new_project", "add_capability", "migrate_cloud", "general"]).describe("Task: new_project, add_capability, migrate_cloud, general"),
  },
};

/**
 * Workflow guidance tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleGetWorkflowGuidance(args: { task: "new_project" | "add_capability" | "migrate_cloud" | "general" }) {
  const workflows: Record<string, string> = {
    new_project: `# New Project

1. recommend_blueprint(database: "postgresql", pattern: "sync")
2. Review blueprint
3. fetch_blueprint_file() to get files
4. Follow patterns`,

    add_capability: `# Add Capability

1. extract_pattern(capability: "database")
2. Review steps
3. fetch_blueprint_file() to get modules
4. Copy and adapt`,

    migrate_cloud: `# Cross-Cloud Migration

1. find_by_project(project_name: "Mavie")
2. find_by_project(project_name: "Mavie", target_cloud: "aws")
3. recommend_blueprint() for target cloud
4. extract_pattern() from target`,

    general: `# Available Tools

1. recommend_blueprint() - Get recommendations
2. extract_pattern() - Extract patterns
3. find_by_project() - Find by project
4. fetch_blueprint_file() - Get files
5. search_blueprints() - Search keywords
6. get_workflow_guidance() - This tool

**Quick Start**: recommend_blueprint(database: "postgresql")`,
  };

  return {
    content: [{
      type: "text" as const,
      text: workflows[args.task] || workflows.general
    }]
  };
}
