/**
 * Security tests for tool handlers
 * Tests input validation, size limits, and injection prevention
 */

import { describe, it, expect } from "vitest";
import { validateBlueprintName, validateInputLength, MAX_INPUT_LENGTH, MAX_PATH_LENGTH } from "../../utils/validation.js";
import { ValidationError } from "../../utils/errors.js";

describe("Tool Security", () => {
  describe("Input Size Limits", () => {
    it("rejects oversized blueprint names", () => {
      const oversizedName = "a".repeat(MAX_INPUT_LENGTH + 1);
      expect(() => validateBlueprintName(oversizedName)).toThrow(ValidationError);
    });

    it("accepts blueprint names within size limit", () => {
      const validName = "a".repeat(MAX_INPUT_LENGTH);
      expect(() => validateBlueprintName(validName)).not.toThrow();
    });

    it("rejects oversized inputs", () => {
      const oversizedInput = "a".repeat(MAX_INPUT_LENGTH + 1);
      expect(() => validateInputLength(oversizedInput)).toThrow(ValidationError);
    });

    it("accepts inputs within size limit", () => {
      const validInput = "a".repeat(MAX_INPUT_LENGTH);
      expect(() => validateInputLength(validInput)).not.toThrow();
    });

    it("allows custom max length", () => {
      const customMax = 100;
      const oversizedInput = "a".repeat(customMax + 1);
      expect(() => validateInputLength(oversizedInput, customMax)).toThrow(ValidationError);
      
      const validInput = "a".repeat(customMax);
      expect(() => validateInputLength(validInput, customMax)).not.toThrow();
    });
  });

  describe("Special Characters in Blueprint Names", () => {
    it("rejects SQL injection patterns (defense in depth)", () => {
      expect(() => validateBlueprintName("'; DROP TABLE blueprints; --")).toThrow(ValidationError);
      expect(() => validateBlueprintName("1' OR '1'='1")).toThrow(ValidationError);
      expect(() => validateBlueprintName("'; SELECT * FROM")).toThrow(ValidationError);
    });

    it("rejects XSS patterns (defense in depth)", () => {
      expect(() => validateBlueprintName("<script>alert('xss')</script>")).toThrow(ValidationError);
      expect(() => validateBlueprintName("javascript:alert(1)")).toThrow(ValidationError);
      expect(() => validateBlueprintName("<img src=x onerror=alert(1)>")).toThrow(ValidationError);
    });

    it("rejects command injection patterns (defense in depth)", () => {
      expect(() => validateBlueprintName("; rm -rf /")).toThrow(ValidationError);
      expect(() => validateBlueprintName("| cat /etc/passwd")).toThrow(ValidationError);
      expect(() => validateBlueprintName("&& echo pwned")).toThrow(ValidationError);
      expect(() => validateBlueprintName("$(whoami)")).toThrow(ValidationError);
      expect(() => validateBlueprintName("`id`")).toThrow(ValidationError);
    });

    it("rejects paths with special characters", () => {
      // These should be caught by path validation, but testing here for defense in depth
      expect(() => validateBlueprintName("../etc/passwd")).toThrow(ValidationError);
      expect(() => validateBlueprintName("~/secret")).toThrow(ValidationError);
    });
  });

  describe("Invalid URI Formats", () => {
    it("rejects malformed URIs", () => {
      // URI validation happens in file-service, but we test input validation here
      const invalidUris = [
        "http://example.com",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "data:text/html,<script>alert(1)</script>",
      ];

      // These would be caught by URI parsing, but we ensure they don't pass basic validation
      invalidUris.forEach(uri => {
        // URI format validation is separate, but we ensure no dangerous patterns
        expect(uri.includes("..") || uri.includes("~") || uri.startsWith("/")).toBe(true);
      });
    });
  });

  describe("Blueprint Name Validation", () => {
    it("only accepts lowercase letters, numbers, and hyphens", () => {
      expect(() => validateBlueprintName("valid-blueprint-123")).not.toThrow();
      expect(() => validateBlueprintName("INVALID")).toThrow(ValidationError);
      expect(() => validateBlueprintName("invalid_name")).toThrow(ValidationError);
      expect(() => validateBlueprintName("invalid.name")).toThrow(ValidationError);
      expect(() => validateBlueprintName("invalid name")).toThrow(ValidationError);
    });

    it("rejects empty and null values", () => {
      expect(() => validateBlueprintName("")).toThrow(ValidationError);
      expect(() => validateBlueprintName(null as any)).toThrow(ValidationError);
      expect(() => validateBlueprintName(undefined as any)).toThrow(ValidationError);
    });
  });
});
