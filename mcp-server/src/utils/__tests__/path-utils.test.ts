import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";
import {
  resolveWorkspacePath,
  getMimeType,
  fileExists,
  sanitizeResourceName,
} from "../path-utils.js";
import { SecurityError } from "../errors.js";

describe("Path Utils", () => {
  describe("resolveWorkspacePath", () => {
    const workspaceRoot = os.tmpdir();

    it("resolves valid relative paths", () => {
      const result = resolveWorkspacePath("aws/test/README.md", workspaceRoot);
      expect(result).toBe(path.join(workspaceRoot, "aws/test/README.md"));
    });

    it("throws SecurityError for paths with ..", () => {
      expect(() => resolveWorkspacePath("../outside/file.txt", workspaceRoot)).toThrow(SecurityError);
    });

    it("normalizes path separators", () => {
      const result = resolveWorkspacePath("aws\\test\\README.md", workspaceRoot);
      expect(result).toContain("aws");
      expect(result).toContain("test");
      expect(result).toContain("README.md");
    });
  });

  describe("getMimeType", () => {
    it("returns correct MIME type for .tf files", () => {
      expect(getMimeType("main.tf")).toBe("text/x-hcl");
      expect(getMimeType("modules/data/main.tf")).toBe("text/x-hcl");
    });

    it("returns correct MIME type for .md files", () => {
      expect(getMimeType("README.md")).toBe("text/markdown");
    });

    it("returns correct MIME type for .json files", () => {
      expect(getMimeType("package.json")).toBe("application/json");
    });

    it("returns text/plain for unknown extensions", () => {
      expect(getMimeType("file.unknown")).toBe("text/plain");
    });

    it("handles case-insensitive extensions", () => {
      expect(getMimeType("README.MD")).toBe("text/markdown");
      expect(getMimeType("main.TF")).toBe("text/x-hcl");
    });

    it("handles files without extensions", () => {
      expect(getMimeType("README")).toBe("text/plain");
    });
  });

  describe("fileExists", () => {
    it("returns true for existing file", async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
      const testFile = path.join(tmpDir, "test.txt");
      fs.writeFileSync(testFile, "test");

      const result = await fileExists(testFile);
      expect(result).toBe(true);

      fs.unlinkSync(testFile);
      fs.rmdirSync(tmpDir);
    });

    it("returns false for non-existent file", async () => {
      const result = await fileExists("/nonexistent/file/path");
      expect(result).toBe(false);
    });
  });

  describe("sanitizeResourceName", () => {
    it("replaces invalid characters with hyphens", () => {
      const result = sanitizeResourceName("blueprint://aws/test/README.md");
      expect(result).toMatch(/^blueprint-+-aws-test-README-md$/);
    });

    it("preserves valid characters", () => {
      expect(sanitizeResourceName("blueprint-aws-test-readme")).toBe("blueprint-aws-test-readme");
    });

    it("handles special characters", () => {
      const result = sanitizeResourceName("test@#$%^&*()name");
      expect(result).toMatch(/^test-+name$/);
    });

    it("handles spaces", () => {
      expect(sanitizeResourceName("test name")).toBe("test-name");
    });
  });
});
