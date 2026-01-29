import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logger } from "../logger.js";
import { config } from "../../config/config.js";

describe("Logger - Wide Events Pattern", () => {
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;
  let stderrWriteSpy: ReturnType<typeof vi.spyOn>;
  let stdoutBuffer: string[] = [];
  let stderrBuffer: string[] = [];

  beforeEach(() => {
    stdoutBuffer = [];
    stderrBuffer = [];
    // Pino writes to stdout/stderr streams directly
    stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Buffer) => {
      stdoutBuffer.push(chunk.toString());
      return true;
    });
    stderrWriteSpy = vi.spyOn(process.stderr, "write").mockImplementation((chunk: string | Buffer) => {
      stderrBuffer.push(chunk.toString());
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Info logging", () => {
    it("emits JSON with environment context and custom fields", () => {
      logger.info({
        operation: "test_operation",
        request_id: "req_123",
        status_code: 200,
        outcome: "success",
      });

      // Pino writes synchronously, but we need to check after a microtask
      return Promise.resolve().then(() => {
        // Find the log entry in stdout buffer
        const logLines = stdoutBuffer.filter(line => line.trim().length > 0);
        expect(logLines.length).toBeGreaterThan(0);
        
        const logOutput = logLines[logLines.length - 1].trim();
        const event = JSON.parse(logOutput);

        // JSON format
        expect(() => JSON.parse(logOutput)).not.toThrow();
        
        // Environment context
        expect(event.service).toBe(config.server.name);
        expect(event.version).toBe(config.server.version);
        expect(event.node_version).toBe(process.version);
        
        // Custom fields
        expect(event.operation).toBe("test_operation");
        expect(event.request_id).toBe("req_123");
        expect(event.status_code).toBe(200);
        expect(event.outcome).toBe("success");
        
        // Standard fields (pino uses numeric levels and 'time' field)
        expect(typeof event.level).toBe("number");
        expect(event.level).toBeGreaterThanOrEqual(30); // info level is 30
        expect(event.time).toBeDefined(); // pino uses 'time' instead of 'timestamp'
      });
    });
  });

  describe("Error logging", () => {
    it("emits JSON with error details and environment context", () => {
      logger.error({
        operation: "test",
        outcome: "error",
        error: {
          type: "TestError",
          message: "Something went wrong",
        },
      });

      return Promise.resolve().then(() => {
        // Find the log entry in stderr buffer
        const logLines = stderrBuffer.filter(line => line.trim().length > 0);
        expect(logLines.length).toBeGreaterThan(0);
        
        const logOutput = logLines[logLines.length - 1].trim();
        const event = JSON.parse(logOutput);

        expect(typeof event.level).toBe("number");
        expect(event.level).toBeGreaterThanOrEqual(50); // error level is 50
        expect(event.error.type).toBe("TestError");
        expect(event.error.message).toBe("Something went wrong");
        expect(event.service).toBe(config.server.name);
      });
    });
  });

  describe("Wide events pattern", () => {
    it("emits single event with all context (high dimensionality)", () => {
      logger.info({
        tool: "test_tool",
        request_id: "req_123",
        query: "test",
        result_count: 5,
        status_code: 200,
        outcome: "success",
        duration_ms: 42,
      });

      return Promise.resolve().then(() => {
        const logLines = stdoutBuffer.filter(line => line.trim().length > 0);
        expect(logLines.length).toBeGreaterThan(0);
        
        const logOutput = logLines[logLines.length - 1].trim();
        const event = JSON.parse(logOutput);
        
        expect(event.tool).toBe("test_tool");
        expect(event.request_id).toBe("req_123");
        expect(event.status_code).toBe(200);
        expect(event.outcome).toBe("success");
        expect(event.duration_ms).toBe(42);
        expect(Object.keys(event).length).toBeGreaterThan(10); // Environment + custom fields
      });
    });
  });
});
