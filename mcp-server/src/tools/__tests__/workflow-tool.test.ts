import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleGetWorkflowGuidance } from "../workflow-tool.js";
import { logger } from "../../utils/logger.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Workflow Tool Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workflow guidance for different task types", async () => {
    const newProject = await handleGetWorkflowGuidance({ task: "new_project" });
    expect(newProject.content[0].text).toContain("New Project");

    const addCapability = await handleGetWorkflowGuidance({ task: "add_capability" });
    expect(addCapability.content[0].text).toContain("Add Capability");

    const migrateCloud = await handleGetWorkflowGuidance({ task: "migrate_cloud" });
    expect(migrateCloud.content[0].text).toContain("Cross-Cloud Migration");

    const general = await handleGetWorkflowGuidance({ task: "general" });
    expect(general.content[0].text).toContain("Available Tools");
  });

  it("falls back to general for unknown task", async () => {
    const result = await handleGetWorkflowGuidance({ task: "unknown" as any });
    expect(result.content[0].text).toContain("Available Tools");
  });

  it("emits wide event with task type", async () => {
    await handleGetWorkflowGuidance({ task: "new_project" });

    const logCall = (logger.info as any).mock.calls[0][0];
    expect(logCall.tool).toBe("get_workflow_guidance");
    expect(logCall.task).toBe("new_project");
    expect(logCall.status_code).toBe(200);
  });
});
