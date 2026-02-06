import { describe, it, expect } from "vitest";
import {
  getWorkflowContent,
  isWorkflowPromptName,
  WORKFLOW_PROMPT_NAMES,
  WORKFLOW_PROMPTS_LIST,
} from "../prompts-service.js";

describe("Prompts Service", () => {
  it("exports exactly four workflow prompt names", () => {
    expect(WORKFLOW_PROMPT_NAMES).toEqual(["new_project", "add_capability", "migrate_cloud", "general"]);
  });

  it("lists all workflow prompts with meta", () => {
    expect(WORKFLOW_PROMPTS_LIST).toHaveLength(4);
    expect(WORKFLOW_PROMPTS_LIST.map((p) => p.name)).toEqual([...WORKFLOW_PROMPT_NAMES]);
    for (const p of WORKFLOW_PROMPTS_LIST) {
      expect(p.title).toBeDefined();
      expect(p.description).toBeDefined();
    }
  });

  it("returns content for each known prompt name", () => {
    expect(getWorkflowContent("new_project")).toContain("New Project");
    expect(getWorkflowContent("new_project")).toContain("recommend_blueprint");
    expect(getWorkflowContent("add_capability")).toContain("Add Capability");
    expect(getWorkflowContent("add_capability")).toContain("extract_pattern");
    expect(getWorkflowContent("migrate_cloud")).toContain("Cross-Cloud");
    expect(getWorkflowContent("migrate_cloud")).toContain("find_by_project");
    expect(getWorkflowContent("general")).toContain("Available Tools");
    expect(getWorkflowContent("general")).toContain("recommend_blueprint()");
  });

  it("returns general content for unknown name", () => {
    expect(getWorkflowContent("unknown")).toContain("Available Tools");
    expect(getWorkflowContent("")).toContain("Available Tools");
  });

  it("isWorkflowPromptName validates names", () => {
    expect(isWorkflowPromptName("new_project")).toBe(true);
    expect(isWorkflowPromptName("add_capability")).toBe(true);
    expect(isWorkflowPromptName("general")).toBe(true);
    expect(isWorkflowPromptName("unknown")).toBe(false);
    expect(isWorkflowPromptName("")).toBe(false);
  });
});
