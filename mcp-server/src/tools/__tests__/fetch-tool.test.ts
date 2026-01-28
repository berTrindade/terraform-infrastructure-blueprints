import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleFetchBlueprintFile } from "../fetch-tool.js";
import { logger } from "../../utils/logger.js";
import { readBlueprintFile } from "../../services/file-service.js";
import { findBlueprint } from "../../services/blueprint-service.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../services/file-service.js", () => ({
  readBlueprintFile: vi.fn(),
}));

vi.mock("../../services/blueprint-service.js", () => ({
  findBlueprint: vi.fn(),
}));

describe("Fetch Tool Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error message when blueprint not found", async () => {
    (findBlueprint as any).mockReturnValue(null);

    const result = await handleFetchBlueprintFile({
      blueprint: "nonexistent",
      path: "README.md",
    });

    expect(result.content[0].text).toContain("not found");
    expect((logger.info as any).mock.calls[0][0].status_code).toBe(404);
  });

  it("fetches file content when blueprint exists", async () => {
    (findBlueprint as any).mockReturnValue({ name: "apigw-lambda-rds" });
    (readBlueprintFile as any).mockResolvedValue({
      content: "# Test Content",
      mimeType: "text/markdown",
    });

    const result = await handleFetchBlueprintFile({
      blueprint: "apigw-lambda-rds",
      path: "README.md",
    });

    expect(result.content[0].text).toContain("# apigw-lambda-rds/README.md");
    
    const logCall = (logger.info as any).mock.calls[0][0];
    expect(logCall.tool).toBe("fetch_blueprint_file");
    expect(logCall.blueprint).toBe("apigw-lambda-rds");
    expect(logCall.file_size).toBeDefined();
    expect(logCall.status_code).toBe(200);
  });

  it("handles file read errors", async () => {
    (findBlueprint as any).mockReturnValue({ name: "apigw-lambda-rds" });
    (readBlueprintFile as any).mockRejectedValue(new Error("File not found"));

    const result = await handleFetchBlueprintFile({
      blueprint: "apigw-lambda-rds",
      path: "nonexistent.md",
    });

    expect(result.content[0].text).toContain("Error fetching file");
    expect(logger.error).toHaveBeenCalled();
  });
});
