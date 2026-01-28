import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { logger } from "../logger.js";
import { config } from "../../config/config.js";

describe("Logger - Wide Events Pattern", () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
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

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleInfoSpy.mock.calls[0][0];
      const event = JSON.parse(logCall);

      // JSON format
      expect(() => JSON.parse(logCall)).not.toThrow();
      
      // Environment context
      expect(event.service).toBe(config.server.name);
      expect(event.version).toBe(config.server.version);
      expect(event.node_version).toBe(process.version);
      
      // Custom fields
      expect(event.operation).toBe("test_operation");
      expect(event.request_id).toBe("req_123");
      expect(event.status_code).toBe(200);
      expect(event.outcome).toBe("success");
      
      // Standard fields
      expect(event.level).toBe("info");
      expect(event.timestamp).toBeDefined();
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

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logCall = consoleErrorSpy.mock.calls[0][0];
      const event = JSON.parse(logCall);

      expect(event.level).toBe("error");
      expect(event.error.type).toBe("TestError");
      expect(event.error.message).toBe("Something went wrong");
      expect(event.service).toBe(config.server.name);
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

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const event = JSON.parse(consoleInfoSpy.mock.calls[0][0]);
      
      expect(event.tool).toBe("test_tool");
      expect(event.request_id).toBe("req_123");
      expect(event.status_code).toBe(200);
      expect(event.outcome).toBe("success");
      expect(event.duration_ms).toBe(42);
      expect(Object.keys(event).length).toBeGreaterThan(10); // Environment + custom fields
    });
  });
});
