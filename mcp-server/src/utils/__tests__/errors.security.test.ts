/**
 * Security tests for error handling
 * Tests that error messages don't expose sensitive information
 */

import { describe, it, expect } from "vitest";
import { 
  sanitizeErrorPath, 
  sanitizeErrorMessage,
  FileNotFoundError,
  InvalidUriError,
  SecurityError,
} from "../errors.js";

describe("Error Security", () => {
  describe("sanitizeErrorPath", () => {
    it("shows only last 3 path segments", () => {
      const longPath = "/very/long/path/to/sensitive/file.txt";
      const sanitized = sanitizeErrorPath(longPath);
      expect(sanitized).toBe("...to/sensitive/file.txt");
      expect(sanitized).not.toContain("/very/long/path");
    });

    it("handles paths with 3 or fewer segments", () => {
      expect(sanitizeErrorPath("file.txt")).toBe("file.txt");
      expect(sanitizeErrorPath("dir/file.txt")).toBe("dir/file.txt");
      expect(sanitizeErrorPath("a/b/file.txt")).toBe("a/b/file.txt");
    });

    it("handles Windows paths", () => {
      const windowsPath = "C:\\Users\\username\\Documents\\secret\\file.txt";
      const sanitized = sanitizeErrorPath(windowsPath);
      expect(sanitized).toContain("file.txt");
      expect(sanitizeErrorPath(windowsPath)).not.toContain("C:\\Users\\username");
    });

    it("handles absolute paths", () => {
      const absolutePath = "/home/user/.ssh/id_rsa";
      const sanitized = sanitizeErrorPath(absolutePath);
      expect(sanitized).not.toContain("/home/user");
      expect(sanitized).toContain("id_rsa");
    });

    it("handles invalid input gracefully", () => {
      expect(sanitizeErrorPath("")).toBe("[invalid path]");
      expect(sanitizeErrorPath(null as any)).toBe("[invalid path]");
      expect(sanitizeErrorPath(undefined as any)).toBe("[invalid path]");
    });

    it("removes leading slashes from sanitized output", () => {
      const path = "/etc/passwd";
      const sanitized = sanitizeErrorPath(path);
      expect(sanitized).not.toStartWith("/");
    });
  });

  describe("sanitizeErrorMessage", () => {
    it("removes absolute paths from error messages", () => {
      const error = new Error("File not found: /home/user/secret/file.txt");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("/home/user/secret");
      expect(sanitized).toContain("file.txt");
    });

    it("handles Error objects", () => {
      const error = new Error("Something went wrong");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe("Something went wrong");
    });

    it("handles non-Error values", () => {
      expect(sanitizeErrorMessage("string error")).toBe("string error");
      expect(sanitizeErrorMessage(123)).toBe("123");
      expect(sanitizeErrorMessage(null)).toBe("null");
    });

    it("sanitizes multiple paths in error message", () => {
      const error = new Error("Path /home/user/file1.txt and /etc/passwd are invalid");
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("/home/user");
      expect(sanitized).not.toContain("/etc");
    });
  });

  describe("Error Classes", () => {
    it("FileNotFoundError sanitizes URI", () => {
      const error = new FileNotFoundError("/home/user/secret/file.txt");
      expect(error.message).not.toContain("/home/user/secret");
      expect(error.message).toContain("file.txt");
    });

    it("InvalidUriError sanitizes URI", () => {
      const error = new InvalidUriError("/etc/passwd");
      expect(error.message).not.toContain("/etc");
      expect(error.message).toContain("passwd");
    });

    it("SecurityError doesn't expose full paths", () => {
      const error = new SecurityError("Path traversal detected: /home/user/secret");
      // SecurityError uses the message as-is, but should be sanitized when used
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain("/home/user/secret");
    });

    it("error messages don't contain stack traces", () => {
      const error = new FileNotFoundError("test.txt");
      expect(error.message).not.toContain("at ");
      expect(error.message).not.toContain("Error:");
      expect(error.message).not.toContain("Stack:");
    });
  });

  describe("Information Disclosure Prevention", () => {
    it("doesn't expose internal file structure", () => {
      const paths = [
        "/app/src/services/file-service.ts",
        "/app/node_modules/package/index.js",
        "/app/.git/config",
      ];

      paths.forEach(path => {
        const sanitized = sanitizeErrorPath(path);
        expect(sanitized).not.toContain("/app/src");
        expect(sanitized).not.toContain("/app/node_modules");
        expect(sanitized).not.toContain("/app/.git");
      });
    });

    it("doesn't expose user home directories", () => {
      const homePaths = [
        "/Users/username/.ssh/id_rsa",
        "/home/user/.bashrc",
        "C:\\Users\\username\\Documents\\secret.txt",
      ];

      homePaths.forEach(path => {
        const sanitized = sanitizeErrorPath(path);
        expect(sanitized).not.toContain("username");
        expect(sanitized).not.toContain("user");
      });
    });

    it("doesn't expose system directories", () => {
      const systemPaths = [
        "/etc/passwd",
        "/etc/shadow",
        "/var/log/system.log",
        "C:\\Windows\\System32\\config",
      ];

      systemPaths.forEach(path => {
        const sanitized = sanitizeErrorPath(path);
        expect(sanitized).not.toContain("/etc");
        expect(sanitized).not.toContain("/var");
        expect(sanitized).not.toContain("System32");
      });
    });
  });
});
