import { describe, it, expect } from "vitest";
import {
  BlueprintError,
  BlueprintNotFoundError,
  ProjectNotFoundError,
  FileNotFoundError,
  InvalidUriError,
  SecurityError,
  ValidationError,
} from "../errors.js";

describe("Custom Errors", () => {
  describe("BlueprintError", () => {
    it("creates error with message and code", () => {
      const error = new BlueprintError("Test error", "TEST_CODE");
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("BlueprintError");
    });
  });

  describe("BlueprintNotFoundError", () => {
    it("creates error with blueprint name", () => {
      const error = new BlueprintNotFoundError("test-blueprint");
      expect(error.message).toBe('Blueprint "test-blueprint" not found');
      expect(error.code).toBe("BLUEPRINT_NOT_FOUND");
      expect(error.name).toBe("BlueprintNotFoundError");
    });
  });

  describe("ProjectNotFoundError", () => {
    it("creates error with project name", () => {
      const error = new ProjectNotFoundError("test-project");
      expect(error.message).toBe('Project "test-project" not found');
      expect(error.code).toBe("PROJECT_NOT_FOUND");
      expect(error.name).toBe("ProjectNotFoundError");
    });
  });

  describe("FileNotFoundError", () => {
    it("creates error with URI", () => {
      const error = new FileNotFoundError("blueprints://aws/test/README.md");
      expect(error.message).toBe("File not found: blueprints://aws/test/README.md");
      expect(error.code).toBe("FILE_NOT_FOUND");
      expect(error.name).toBe("FileNotFoundError");
    });
  });

  describe("InvalidUriError", () => {
    it("creates error with URI", () => {
      const error = new InvalidUriError("invalid://uri");
      expect(error.message).toBe("Invalid blueprint URI: invalid://uri");
      expect(error.code).toBe("INVALID_URI");
      expect(error.name).toBe("InvalidUriError");
    });
  });

  describe("SecurityError", () => {
    it("creates error with message", () => {
      const error = new SecurityError("Path traversal detected");
      expect(error.message).toBe("Path traversal detected");
      expect(error.code).toBe("SECURITY_ERROR");
      expect(error.name).toBe("SecurityError");
    });
  });

  describe("ValidationError", () => {
    it("creates error with message", () => {
      const error = new ValidationError("Invalid input");
      expect(error.message).toBe("Invalid input");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.name).toBe("ValidationError");
    });
  });
});
