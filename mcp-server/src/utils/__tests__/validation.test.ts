import { describe, it, expect } from "vitest";
import * as os from "node:os";
import {
  validateBlueprintName,
  validateCloudProvider,
  validateFilePath,
} from "../validation.js";
import { ValidationError } from "../errors.js";

describe("Validation Utils", () => {
  describe("validateBlueprintName", () => {
    it("accepts valid blueprint names", () => {
      expect(() => validateBlueprintName("apigw-lambda-rds")).not.toThrow();
      expect(() => validateBlueprintName("alb-ecs-fargate")).not.toThrow();
      expect(() => validateBlueprintName("test-123")).not.toThrow();
    });

    it("rejects empty string", () => {
      expect(() => validateBlueprintName("")).toThrow(ValidationError);
    });

    it("rejects names with uppercase letters", () => {
      expect(() => validateBlueprintName("Apigw-Lambda-Rds")).toThrow(ValidationError);
    });

    it("rejects names with spaces", () => {
      expect(() => validateBlueprintName("apigw lambda rds")).toThrow(ValidationError);
    });

    it("rejects names with special characters", () => {
      expect(() => validateBlueprintName("apigw_lambda_rds")).toThrow(ValidationError);
      expect(() => validateBlueprintName("apigw.lambda.rds")).toThrow(ValidationError);
    });

    it("rejects non-string values", () => {
      expect(() => validateBlueprintName(null as any)).toThrow(ValidationError);
      expect(() => validateBlueprintName(undefined as any)).toThrow(ValidationError);
      expect(() => validateBlueprintName(123 as any)).toThrow(ValidationError);
    });
  });

  describe("validateCloudProvider", () => {
    it("accepts valid cloud providers", () => {
      expect(() => validateCloudProvider("aws")).not.toThrow();
      expect(() => validateCloudProvider("azure")).not.toThrow();
      expect(() => validateCloudProvider("gcp")).not.toThrow();
    });

    it("accepts case-insensitive providers", () => {
      expect(() => validateCloudProvider("AWS")).not.toThrow();
      expect(() => validateCloudProvider("Azure")).not.toThrow();
      expect(() => validateCloudProvider("GCP")).not.toThrow();
    });

    it("rejects invalid providers", () => {
      expect(() => validateCloudProvider("invalid")).toThrow(ValidationError);
      expect(() => validateCloudProvider("")).toThrow(ValidationError);
    });
  });

  describe("validateFilePath", () => {
    const workspaceRoot = os.tmpdir();

    it("accepts valid relative paths", () => {
      expect(() => validateFilePath("aws/apigw-lambda-rds/README.md", workspaceRoot)).not.toThrow();
      expect(() => validateFilePath("modules/data/main.tf", workspaceRoot)).not.toThrow();
    });

    it("rejects paths with ..", () => {
      expect(() => validateFilePath("../outside/file.txt", workspaceRoot)).toThrow(ValidationError);
      expect(() => validateFilePath("aws/../../etc/passwd", workspaceRoot)).toThrow(ValidationError);
    });

    it("rejects paths starting with /", () => {
      expect(() => validateFilePath("/absolute/path", workspaceRoot)).toThrow(ValidationError);
    });

    it("rejects paths with ~", () => {
      expect(() => validateFilePath("~/home/file.txt", workspaceRoot)).toThrow(ValidationError);
    });

    it("rejects empty string", () => {
      expect(() => validateFilePath("", workspaceRoot)).toThrow(ValidationError);
    });

    it("rejects non-string values", () => {
      expect(() => validateFilePath(null as any, workspaceRoot)).toThrow(ValidationError);
      expect(() => validateFilePath(undefined as any, workspaceRoot)).toThrow(ValidationError);
    });
  });
});
