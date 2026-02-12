/**
 * Workflow guidance tool handler.
 * Content is sourced from prompts-service (single source of truth; also used by MCP Prompts API).
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";
import { getWorkflowContent } from "../services/prompts-service.js";

/**
 * Workflow guidance tool schema
 */
export const getWorkflowGuidanceSchema = {
  description: "Get workflow guidance. Example: get_workflow_guidance(task: 'new_project')",
  inputSchema: {
    task: z.enum(["new_project", "add_capability", "migrate_cloud", "general"]).describe("Task: new_project, add_capability, migrate_cloud, general"),
  },
  outputSchema: z.object({
    task: z.enum(["new_project", "add_capability", "migrate_cloud", "general"]),
    content: z.string(),
  }),
};

/**
 * Workflow guidance tool handler
 *
 * @param args - Tool arguments
 * @returns Tool response
 */
export async function handleGetWorkflowGuidance(args: { task: "new_project" | "add_capability" | "migrate_cloud" | "general" }) {
  const startTime = Date.now();
  const requestId = randomUUID();
  const wideEvent: Record<string, unknown> = {
    tool: "get_workflow_guidance",
    request_id: requestId,
    task: args.task,
  };

  try {
    const text = getWorkflowContent(args.task);

    wideEvent.status_code = 200;
    wideEvent.outcome = "success";
    wideEvent.duration_ms = Date.now() - startTime;
    logger.info(wideEvent);

    return {
      content: [{
        type: "text" as const,
        text,
        mimeType: "text/markdown",
      }],
      structuredContent: {
        task: args.task,
        content: text,
      },
    };
  } catch (error) {
    wideEvent.status_code = 500;
    wideEvent.outcome = "error";
    wideEvent.error = {
      type: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    wideEvent.duration_ms = Date.now() - startTime;
    logger.error(wideEvent);
    throw error;
  }
}
