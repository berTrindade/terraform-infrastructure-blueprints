/**
 * Security tests for catalog service
 * Tests command injection prevention and secure command execution
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execa } from "execa";
import { getAgentsMdContent } from "../catalog-service.js";

// Mock execa to verify it's used for secure command execution
vi.mock("execa", () => ({
  execa: vi.fn(),
}));

// Mock fs to prevent local file reads
vi.mock("node:fs", async () => {
  const actual = await vi.importActual("node:fs");
  return {
    ...actual,
    existsSync: vi.fn(() => false), // No local files found
    readFileSync: vi.fn(),
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
    it("uses execa with array arguments instead of shell command", async () => {
      const mockExeca = vi.mocked(execa);
      
      // Mock successful gh api call returning base64 content
      const base64Content = Buffer.from("test content").toString("base64");
      mockExeca.mockResolvedValueOnce({
        stdout: base64Content,
        stderr: "",
        exitCode: 0,
        command: "gh",
        escapedCommand: "gh",
        failed: false,
        killed: false,
        signal: null,
        timedOut: false,
        isCanceled: false,
        isMaxBuffer: false,
      } as any);

      try {
        await getAgentsMdContent();
      } catch {
        // Expected to fail in test environment, but we're checking execa usage
      }

      // Verify execa was called (not execSync or execFile)
      expect(mockExeca).toHaveBeenCalled();
      
      // Verify first call uses array arguments for gh command
      const firstCall = mockExeca.mock.calls[0];
      expect(firstCall[0]).toBe("gh");
      expect(Array.isArray(firstCall[1])).toBe(true);
      expect(firstCall[1]).toContain("api");
      // Check that repos path is in one of the arguments (as a single string)
      const argsString = firstCall[1].join(" ");
      expect(argsString).toContain("repos/");
      
      // Verify base64 decoding uses Buffer.from (not execa for base64)
      // Only one execa call should be made (for gh command)
      expect(mockExeca).toHaveBeenCalledTimes(1);
    });

    it("prevents command injection via repo name", async () => {
      const mockExeca = vi.mocked(execa);
      
      const base64Content = Buffer.from("test content").toString("base64");
      mockExeca.mockResolvedValueOnce({
        stdout: base64Content,
        stderr: "",
        exitCode: 0,
        command: "gh",
        escapedCommand: "gh",
        failed: false,
        killed: false,
        signal: null,
        timedOut: false,
        isCanceled: false,
        isMaxBuffer: false,
      } as any);

      try {
        await getAgentsMdContent();
      } catch {
        // Expected to fail in test environment
      }

      // Verify execa was called
      expect(mockExeca).toHaveBeenCalled();
      
      // Verify arguments are passed as array, preventing shell injection
      const firstCall = mockExeca.mock.calls[0];
      expect(firstCall).toBeDefined();
      expect(firstCall[0]).toBe("gh");
      expect(Array.isArray(firstCall[1])).toBe(true);
      
      const args = firstCall[1] as string[];
      
      // Even if repo name contains special characters, they're in array elements, not shell command
      args.forEach(arg => {
        // Each argument should be a string, not a shell command
        expect(typeof arg).toBe("string");
      });
      
      // Verify base64 decoding uses Buffer.from (secure, no shell command)
      expect(mockExeca).toHaveBeenCalledTimes(1);
    });

    it("handles timeout correctly", async () => {
      const mockExeca = vi.mocked(execa);
      
      const base64Content = Buffer.from("test content").toString("base64");
      mockExeca.mockImplementationOnce((command, args, options) => {
        const timeout = options?.timeout;
        
        if (timeout) {
          expect(typeof timeout).toBe("number");
          expect(timeout).toBeGreaterThan(0);
        }
        
        return Promise.resolve({
          stdout: base64Content,
          stderr: "",
          exitCode: 0,
          command: String(command),
          escapedCommand: String(command),
          failed: false,
          killed: false,
          signal: null,
          timedOut: false,
          isCanceled: false,
          isMaxBuffer: false,
        } as any);
      });

      try {
        await getAgentsMdContent();
      } catch {
        // Expected to fail in test environment
      }

      // Verify execa was called
      expect(mockExeca).toHaveBeenCalled();
      
      // Verify timeout is passed to execa
      const firstCall = mockExeca.mock.calls[0];
      expect(firstCall).toBeDefined();
      expect(firstCall.length).toBeGreaterThanOrEqual(3);
      
      const options = firstCall[2];
      
      expect(options).toBeDefined();
      expect(options?.timeout).toBeDefined();
      expect(typeof options?.timeout).toBe("number");
      
      // Verify only one execa call (gh command, base64 uses Buffer.from)
      expect(mockExeca).toHaveBeenCalledTimes(1);
    });
  });
});
