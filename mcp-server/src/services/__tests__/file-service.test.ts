import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { readBlueprintFile } from "../file-service.js";
import { InvalidUriError, FileNotFoundError } from "../../utils/errors.js";

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("File Service", () => {
  let testDir: string;
  let testFile: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
    testFile = path.join(testDir, "test.txt");
    fs.writeFileSync(testFile, "test content");
  });

  afterEach(() => {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    if (fs.existsSync(testDir)) fs.rmdirSync(testDir);
    vi.clearAllMocks();
  });

  describe("readBlueprintFile", () => {
    it("throws InvalidUriError for invalid URI format", async () => {
      await expect(readBlueprintFile("invalid-uri")).rejects.toThrow(InvalidUriError);
    });

    it("throws FileNotFoundError for non-existent file", async () => {
      const uri = `blueprints://aws/test/nonexistent.md`;
      await expect(readBlueprintFile(uri)).rejects.toThrow(FileNotFoundError);
    });
  });
});
