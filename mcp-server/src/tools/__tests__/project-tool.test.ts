import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleFindByProject } from "../project-tool.js";
import { logger } from "../../utils/logger.js";
import { getProjectBlueprint, getBlueprint, findCrossCloudEquivalent } from "../../services/blueprint-service.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/blueprint-service.js", () => ({
  getProjectBlueprint: vi.fn(),
  getBlueprint: vi.fn(),
  findCrossCloudEquivalent: vi.fn(),
}));

describe("Project Tool Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns project blueprint information", async () => {
    (getProjectBlueprint as any).mockReturnValue({
      info: {
        blueprint: "apigw-lambda-rds",
        cloud: "aws",
        description: "Test description",
      },
    });
    (getBlueprint as any).mockReturnValue({
      database: "PostgreSQL",
      pattern: "Sync",
    });

    const result = await handleFindByProject({ project_name: "TestProject" });

    expect(result.content[0].text).toContain("TestProject");
    expect(result.content[0].text).toContain("apigw-lambda-rds");
    
    const logCall = (logger.info as any).mock.calls[0][0];
    expect(logCall.tool).toBe("find_by_project");
    expect(logCall.project_name).toBe("TestProject");
    expect(logCall.blueprint).toBe("apigw-lambda-rds");
    expect(logCall.status_code).toBe(200);
  });

  it("includes cross-cloud equivalent when target_cloud specified", async () => {
    (getProjectBlueprint as any).mockReturnValue({
      info: {
        blueprint: "apigw-lambda-rds",
        cloud: "aws",
        description: "Test",
      },
    });
    (getBlueprint as any).mockReturnValue({
      database: "PostgreSQL",
      pattern: "Sync",
    });
    (findCrossCloudEquivalent as any).mockReturnValue({
      name: "functions-postgresql",
    });

    const result = await handleFindByProject({
      project_name: "TestProject",
      target_cloud: "azure",
    });

    expect(result.content[0].text).toContain("AZURE Equivalent");
    expect((logger.info as any).mock.calls[0][0].equivalent_blueprint).toBe("functions-postgresql");
  });

  it("handles errors", async () => {
    (getProjectBlueprint as any).mockImplementation(() => {
      throw new Error("Project not found");
    });

    await expect(
      handleFindByProject({ project_name: "Nonexistent" })
    ).rejects.toThrow();

    expect(logger.error).toHaveBeenCalled();
  });
});
