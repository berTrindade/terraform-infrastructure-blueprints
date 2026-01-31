/**
 * Security tests for path validation
 * Tests path traversal prevention, URL encoding, symlinks, and other attack vectors
 */

import { describe, it, expect } from "vitest";
import * as os from "node:os";
import * as fs from "node:fs";
import * as path from "node:path";
import { validateFilePath } from "../validation.js";
import { SecurityError, ValidationError } from "../errors.js";

describe("Path Validation Security", () => {
  const workspaceRoot = os.tmpdir();

  describe("Path Traversal Prevention", () => {
    it("rejects ../ traversal attempts", () => {
      expect(() => validateFilePath("../outside/file.txt", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("aws/../../etc/passwd", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("../../../etc/passwd", workspaceRoot)).toThrow(SecurityError);
    });

    it("rejects URL-encoded traversal (%2e%2e%2f)", () => {
      expect(() => validateFilePath("%2e%2e%2foutside%2ffile.txt", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("aws%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd", workspaceRoot)).toThrow(SecurityError);
    });

    it("rejects double-encoded paths", () => {
      expect(() => validateFilePath("%252e%252e%252foutside", workspaceRoot)).toThrow(SecurityError);
    });

    it("rejects Windows path traversal (..\\)", () => {
      expect(() => validateFilePath("..\\outside\\file.txt", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("aws\\..\\..\\etc\\passwd", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("..\\\\outside", workspaceRoot)).toThrow(SecurityError);
    });

    it("rejects absolute paths", () => {
      expect(() => validateFilePath("/absolute/path", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("/etc/passwd", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("C:\\Windows\\System32", workspaceRoot)).toThrow(SecurityError);
    });

    it("rejects home directory access (~)", () => {
      expect(() => validateFilePath("~/home/file.txt", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("~/.ssh/id_rsa", workspaceRoot)).toThrow(SecurityError);
    });
  });

  describe("Null Byte Injection", () => {
    it("rejects null bytes in paths", () => {
      expect(() => validateFilePath("file\0.txt", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("aws\0/file.txt", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("file.txt\0", workspaceRoot)).toThrow(SecurityError);
    });
  });

  describe("Symlink Traversal Prevention", () => {
    it("resolves symlinks and validates against real path", () => {
      // Create a temporary directory structure
      const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));
      const workspaceDir = path.join(testDir, "workspace");
      const outsideDir = path.join(testDir, "outside");
      
      fs.mkdirSync(workspaceDir, { recursive: true });
      fs.mkdirSync(outsideDir, { recursive: true });
      
      // Create a symlink inside workspace pointing outside
      const symlinkPath = path.join(workspaceDir, "symlink");
      fs.symlinkSync(outsideDir, symlinkPath);
      
      // Create a file outside workspace
      const outsideFile = path.join(outsideDir, "secret.txt");
      fs.writeFileSync(outsideFile, "secret");
      
      try {
        // Attempt to access file via symlink should fail
        const relativeSymlinkPath = path.relative(workspaceDir, symlinkPath);
        const relativeOutsidePath = path.join(relativeSymlinkPath, "secret.txt");
        
        expect(() => validateFilePath(relativeOutsidePath, workspaceDir)).toThrow(SecurityError);
      } finally {
        // Cleanup
        fs.unlinkSync(symlinkPath);
        fs.unlinkSync(outsideFile);
        fs.rmdirSync(outsideDir);
        fs.rmdirSync(workspaceDir);
        fs.rmdirSync(testDir);
      }
    });
  });

  describe("Input Length Validation", () => {
    it("rejects paths exceeding maximum length", () => {
      const longPath = "a".repeat(501); // MAX_PATH_LENGTH is 500
      expect(() => validateFilePath(longPath, workspaceRoot)).toThrow(ValidationError);
    });

    it("accepts paths within maximum length", () => {
      const validPath = "a".repeat(500); // Exactly MAX_PATH_LENGTH
      // May throw SecurityError for invalid format, but not ValidationError for length
      expect(() => validateFilePath(validPath, workspaceRoot)).not.toThrow(ValidationError);
    });
  });

  describe("Edge Cases", () => {
    it("rejects empty string", () => {
      expect(() => validateFilePath("", workspaceRoot)).toThrow(ValidationError);
    });

    it("rejects non-string values", () => {
      expect(() => validateFilePath(null as any, workspaceRoot)).toThrow(ValidationError);
      expect(() => validateFilePath(undefined as any, workspaceRoot)).toThrow(ValidationError);
      expect(() => validateFilePath(123 as any, workspaceRoot)).toThrow(ValidationError);
    });

    it("handles mixed encoding attempts", () => {
      expect(() => validateFilePath("aws/%2e%2e/etc/passwd", workspaceRoot)).toThrow(SecurityError);
      expect(() => validateFilePath("%2e%2e/../outside", workspaceRoot)).toThrow(SecurityError);
    });

    it("rejects paths with control characters", () => {
      expect(() => validateFilePath("file\n.txt", workspaceRoot)).toThrow();
      expect(() => validateFilePath("file\r.txt", workspaceRoot)).toThrow();
      expect(() => validateFilePath("file\t.txt", workspaceRoot)).toThrow();
    });
  });

  describe("Valid Paths", () => {
    it("accepts valid relative paths", () => {
      expect(() => validateFilePath("aws/apigw-lambda-rds/README.md", workspaceRoot)).not.toThrow();
      expect(() => validateFilePath("modules/data/main.tf", workspaceRoot)).not.toThrow();
      expect(() => validateFilePath("environments/dev/main.tf", workspaceRoot)).not.toThrow();
    });

    it("accepts paths with hyphens and underscores", () => {
      expect(() => validateFilePath("aws/test-blueprint/file_name.tf", workspaceRoot)).not.toThrow();
    });
  });
});
