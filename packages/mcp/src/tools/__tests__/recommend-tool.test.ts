import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleRecommendBlueprint } from "../recommend-tool.js";
import { logger } from "../../utils/logger.js";
import { filterBlueprints } from "../../services/blueprint-service.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/blueprint-service.js", () => ({
  filterBlueprints: vi.fn(),
}));

describe("Recommend Tool Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recommendation when matches found", async () => {
    (filterBlueprints as any).mockReturnValue([
      { name: "apigw-lambda-rds", description: "Test", database: "PostgreSQL", pattern: "Sync" },
    ]);

    const result = await handleRecommendBlueprint({
      database: "postgresql",
      pattern: "sync",
    });

    expect(result.content[0].text).toContain("Recommended");
    expect(result.content[0].text).toContain("apigw-lambda-rds");
    
    const logCall = (logger.info as any).mock.calls[0][0];
    expect(logCall.tool).toBe("recommend_blueprint");
    expect(logCall.database).toBe("postgresql");
    expect(logCall.recommended_blueprint).toBe("apigw-lambda-rds");
    expect(logCall.status_code).toBe(200);
  });

  it("returns helpful message when no matches", async () => {
    (filterBlueprints as any).mockReturnValue([]);

    const result = await handleRecommendBlueprint({
      database: "nonexistent",
    });

    expect(result.content[0].text).toContain("No blueprint matches");
  });

  it("handles errors", async () => {
    (filterBlueprints as any).mockImplementation(() => {
      throw new Error("Test error");
    });

    await expect(
      handleRecommendBlueprint({ database: "postgresql" })
    ).rejects.toThrow();

    expect(logger.error).toHaveBeenCalled();
  });
});
