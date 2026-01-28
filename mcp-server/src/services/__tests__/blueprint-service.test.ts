import { describe, it, expect } from "vitest";
import {
  findBlueprint,
  getBlueprint,
  searchBlueprints,
  filterBlueprints,
  getExtractionPattern,
  getProjectBlueprint,
  findCrossCloudEquivalent,
} from "../blueprint-service.js";
import { PROJECT_BLUEPRINTS } from "../../config/constants.js";
import { BlueprintNotFoundError } from "../../utils/errors.js";

describe("Blueprint Service", () => {
  describe("findBlueprint", () => {
    it("finds existing blueprint", () => {
      const blueprint = findBlueprint("apigw-lambda-rds");
      expect(blueprint).toBeDefined();
      expect(blueprint?.name).toBe("apigw-lambda-rds");
    });

    it("returns null for non-existent blueprint", () => {
      const blueprint = findBlueprint("nonexistent-blueprint");
      expect(blueprint).toBeNull();
    });
  });

  describe("getBlueprint", () => {
    it("returns blueprint for valid name", () => {
      const blueprint = getBlueprint("apigw-lambda-rds");
      expect(blueprint.name).toBe("apigw-lambda-rds");
    });

    it("throws BlueprintNotFoundError for non-existent blueprint", () => {
      expect(() => getBlueprint("nonexistent")).toThrow(BlueprintNotFoundError);
    });
  });

  describe("searchBlueprints", () => {
    it("finds blueprints by name", () => {
      const results = searchBlueprints("apigw-lambda-rds");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });

    it("finds blueprints by description", () => {
      const results = searchBlueprints("serverless");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty array for non-matching query", () => {
      const results = searchBlueprints("nonexistent-xyz-123");
      expect(results).toEqual([]);
    });

    it("respects limit parameter", () => {
      const results = searchBlueprints("lambda", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("returns empty array for empty query", () => {
      const results = searchBlueprints("");
      expect(results).toEqual([]);
    });
  });

  describe("filterBlueprints", () => {
    it("filters by database", () => {
      const results = filterBlueprints({ database: "postgresql" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => b.database.toLowerCase().includes("postgres"))).toBe(true);
    });

    it("filters by pattern", () => {
      const results = filterBlueprints({ pattern: "sync" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => b.pattern.toLowerCase().includes("sync"))).toBe(true);
    });

    it("filters by auth requirement", () => {
      const results = filterBlueprints({ auth: true });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => b.name.includes("cognito") || b.name.includes("amplify"))).toBe(true);
    });

    it("filters by containers requirement", () => {
      const results = filterBlueprints({ containers: true });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => b.name.includes("ecs") || b.name.includes("eks"))).toBe(true);
    });

    it("applies multiple filters", () => {
      const results = filterBlueprints({
        database: "postgresql",
        pattern: "sync",
        containers: false,
      });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("getExtractionPattern", () => {
    it("returns pattern for valid capability", () => {
      const pattern = getExtractionPattern("database");
      expect(pattern).toBeDefined();
      expect(pattern?.blueprint).toBeDefined();
      expect(pattern?.modules).toBeDefined();
    });

    it("returns null for unknown capability", () => {
      expect(getExtractionPattern("unknown")).toBeNull();
    });
  });

  describe("getProjectBlueprint", () => {
    it("returns project blueprint for known project", () => {
      const project = Object.keys(PROJECT_BLUEPRINTS)[0];
      const result = getProjectBlueprint(project);
      expect(result.info).toBeDefined();
      expect(result.info.blueprint).toBeDefined();
    });

    it("throws ProjectNotFoundError for unknown project", () => {
      expect(() => getProjectBlueprint("UnknownProject")).toThrow();
    });
  });

  describe("findCrossCloudEquivalent", () => {
    it("finds equivalent blueprint for different cloud", () => {
      const equivalent = findCrossCloudEquivalent("apigw-lambda-rds", "azure");
      expect(equivalent).toBeDefined();
    });
  });
});
