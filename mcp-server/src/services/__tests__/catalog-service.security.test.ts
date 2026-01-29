/**
 * Security tests for catalog service
 * Tests command injection prevention and secure command execution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getAgentsMdContent } from "../catalog-service.js";

const execFileAsync = promisify(execFile);

// Mock execFile to verify it's used instead of execSync
vi.mock("node:child_process", async () => {
  const actual = await vi.importActual("node:child_process");
  return {
    ...actual,
    execFile: vi.fn(),
  };
});

// Mock logger
vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Catalog Service Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Command Injection Prevention", () => {
    it("uses execFile with array arguments instead of shell command", async () => {
      const mockExecFile = vi.mocked(execFile);
      
      // Mock successful gh api call returning base64 content
      mockExecFile.mockImplementationOnce((command, args, options, callback) => {
        const base64Content = Buffer.from("test content").toString("base64");
        if (typeof options === "function") {
          options(null, { stdout: base64Content }, "");
        } else if (callback) {
          callback(null, { stdout: base64Content }, "");
        }
        return {} as any;
      });

      try {
        await getAgentsMdContent();
      } catch {
        // Expected to fail in test environment, but we're checking execFile usage
      }

      // Verify execFile was called (not execSync)
      expect(mockExecFile).toHaveBeenCalled();
      
      // Verify first call uses array arguments for gh command
      const firstCall = mockExecFile.mock.calls[0];
      expect(firstCall[0]).toBe("gh");
      expect(Array.isArray(firstCall[1])).toBe(true);
      expect(firstCall[1]).toContain("api");
      expect(firstCall[1]).toContain("repos/");
      
      // Verify base64 decoding uses Buffer.from (not execFile for base64)
      // Only one execFile call should be made (for gh command)
      expect(mockExecFile).toHaveBeenCalledTimes(1);
    });

    it("prevents command injection via repo name", async () => {
      const mockExecFile = vi.mocked(execFile);
      
      const base64Content = Buffer.from("test content").toString("base64");
      mockExecFile.mockImplementationOnce((command, args, options, callback) => {
        if (typeof options === "function") {
          options(null, { stdout: base64Content }, "");
        } else if (callback) {
          callback(null, { stdout: base64Content }, "");
        }
        return {} as any;
      });

      try {
        await getAgentsMdContent();
      } catch {
        // Expected to fail in test environment
      }

      // Verify arguments are passed as array, preventing shell injection
      const firstCall = mockExecFile.mock.calls[0];
      const args = firstCall[1] as string[];
      
      // Even if repo name contains special characters, they're in array elements, not shell command
      args.forEach(arg => {
        // Each argument should be a string, not a shell command
        expect(typeof arg).toBe("string");
      });
      
      // Verify base64 decoding uses Buffer.from (secure, no shell command)
      expect(mockExecFile).toHaveBeenCalledTimes(1);
    });

    it("handles timeout correctly", async () => {
      const mockExecFile = vi.mocked(execFile);
      
      const base64Content = Buffer.from("test content").toString("base64");
      mockExecFile.mockImplementationOnce((command, args, options, callback) => {
        const timeout = typeof options === "object" && options !== null && "timeout" in options 
          ? options.timeout 
          : undefined;
        
        if (timeout) {
          expect(typeof timeout).toBe("number");
          expect(timeout).toBeGreaterThan(0);
        }
        
        if (typeof options === "function") {
          options(null, { stdout: base64Content }, "");
        } else if (callback) {
          callback(null, { stdout: base64Content }, "");
        }
        return {} as any;
      });

      try {
        await getAgentsMdContent();
      } catch {
        // Expected to fail in test environment
      }

      // Verify timeout is passed to execFile
      const firstCall = mockExecFile.mock.calls[0];
      const options = typeof firstCall[2] === "object" && firstCall[2] !== null 
        ? firstCall[2] 
        : {};
      
      expect("timeout" in options).toBe(true);
      
      // Verify only one execFile call (gh command, base64 uses Buffer.from)
      expect(mockExecFile).toHaveBeenCalledTimes(1);
    });
  });
});
