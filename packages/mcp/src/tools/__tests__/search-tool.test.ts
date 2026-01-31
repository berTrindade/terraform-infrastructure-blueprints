import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleSearchBlueprints } from "../search-tool.js";
import { logger } from "../../utils/logger.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Search Tool Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns matching blueprints for valid query", async () => {
    const result = await handleSearchBlueprints({ query: "postgresql" });

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("Found");
  });

  it("returns helpful message when no matches found", async () => {
    const result = await handleSearchBlueprints({ query: "nonexistent-xyz-123" });

    expect(result.content[0].text).toContain("No blueprints found");
  });

  it("emits wide event with query and results", async () => {
    await handleSearchBlueprints({ query: "postgresql" });

    expect(logger.info).toHaveBeenCalled();
    const logCall = (logger.info as any).mock.calls[0][0];
    expect(logCall.tool).toBe("search_blueprints");
    expect(logCall.query).toBe("postgresql");
    expect(logCall.request_id).toBeDefined();
    expect(logCall.result_count).toBeDefined();
    expect(logCall.status_code).toBe(200);
    expect(logCall.outcome).toBe("success");
    expect(logCall.duration_ms).toBeGreaterThanOrEqual(0);
  });
});
