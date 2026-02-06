/**
 * Prompts service — single source of truth for workflow prompt content.
 * Used by the workflow tool (get_workflow_guidance) and MCP Prompts API (prompts/list, prompts/get).
 * Packrun-style: one place for content; tools and prompts both consume it.
 */

export const WORKFLOW_PROMPT_NAMES = ["new_project", "add_capability", "migrate_cloud", "general"] as const;
export type WorkflowPromptName = (typeof WORKFLOW_PROMPT_NAMES)[number];

export interface WorkflowPromptMeta {
  name: WorkflowPromptName;
  title: string;
  description: string;
}

/** Prompt metadata for prompts/list. */
export const WORKFLOW_PROMPTS_LIST: WorkflowPromptMeta[] = [
  { name: "new_project", title: "New Project", description: "Start a new project from a blueprint (recommend blueprint, fetch files, follow patterns)." },
  { name: "add_capability", title: "Add Capability", description: "Add a capability to existing Terraform (extract pattern, fetch modules, copy and adapt)." },
  { name: "migrate_cloud", title: "Migrate Cloud", description: "Cross-cloud migration (find by project, recommend for target, extract pattern)." },
  { name: "general", title: "General", description: "List of available MCP tools and quick start." },
];

const WORKFLOW_CONTENT: Record<WorkflowPromptName, string> = {
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

/**
 * Returns workflow prompt content for a given name.
 * Used by workflow tool and by MCP get_prompt handler.
 */
export function getWorkflowContent(name: string): string {
  if (WORKFLOW_PROMPT_NAMES.includes(name as WorkflowPromptName)) {
    return WORKFLOW_CONTENT[name as WorkflowPromptName];
  }
  return WORKFLOW_CONTENT.general;
}

/**
 * Returns whether the given name is a valid workflow prompt.
 */
export function isWorkflowPromptName(name: string): name is WorkflowPromptName {
  return WORKFLOW_PROMPT_NAMES.includes(name as WorkflowPromptName);
}
