import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleExtractPattern } from "../extract-tool.js";
import { logger } from "../../utils/logger.js";
import { getExtractionPattern } from "../../services/blueprint-service.js";
import { readBlueprintFile } from "../../services/file-service.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/blueprint-service.js", () => ({
  getExtractionPattern: vi.fn(),
}));

vi.mock("../../services/file-service.js", () => ({
  readBlueprintFile: vi.fn(),
}));

describe("Extract Tool Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error message for unknown capability", async () => {
    (getExtractionPattern as any).mockReturnValue(null);

    const result = await handleExtractPattern({ capability: "unknown" });

    expect(result.content[0].text).toContain("Unknown capability");
    expect((logger.info as any).mock.calls[0][0].status_code).toBe(400);
  });

  it("returns extraction pattern for valid capability", async () => {
    (getExtractionPattern as any).mockReturnValue({
      blueprint: "apigw-lambda-rds",
      description: "Test description",
      modules: ["modules/data/"],
      integrationSteps: ["Step 1", "Step 2"],
    });

    const result = await handleExtractPattern({ capability: "database" });

    expect(result.content[0].text).toContain("Extract: database");
    expect(result.content[0].text).toContain("apigw-lambda-rds");
    
    const logCall = (logger.info as any).mock.calls[0][0];
    expect(logCall.tool).toBe("extract_pattern");
    expect(logCall.capability).toBe("database");
    expect(logCall.blueprint).toBe("apigw-lambda-rds");
    expect(logCall.status_code).toBe(200);
  });

  it("includes file contents when include_files is true", async () => {
    (getExtractionPattern as any).mockReturnValue({
      blueprint: "apigw-lambda-rds",
      description: "Test",
      modules: ["modules/data/"],
      integrationSteps: [],
    });
    (readBlueprintFile as any).mockResolvedValue({
      content: "test content",
    });

    const result = await handleExtractPattern({
      capability: "database",
      include_files: true,
    });

    expect(result.content[0].text).toContain("## Files");
  });

  it("handles errors", async () => {
    (getExtractionPattern as any).mockImplementation(() => {
      throw new Error("Test error");
    });

    await expect(handleExtractPattern({ capability: "database" })).rejects.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });
});
