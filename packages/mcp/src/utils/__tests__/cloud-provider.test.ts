import { describe, it, expect } from "vitest";
import { getCloudProvider } from "../cloud-provider.js";
import { CLOUD_PROVIDERS } from "../../config/constants.js";

describe("Cloud Provider Utils", () => {
  describe("getCloudProvider", () => {
    it("identifies AWS blueprints starting with apigw-", () => {
      expect(getCloudProvider("apigw-lambda-rds")).toBe(CLOUD_PROVIDERS.AWS);
      expect(getCloudProvider("apigw-lambda-dynamodb")).toBe(CLOUD_PROVIDERS.AWS);
    });

    it("identifies AWS blueprints starting with alb-", () => {
      expect(getCloudProvider("alb-ecs-fargate")).toBe(CLOUD_PROVIDERS.AWS);
      expect(getCloudProvider("alb-ecs-fargate-rds")).toBe(CLOUD_PROVIDERS.AWS);
    });

    it("identifies AWS blueprints starting with eks-", () => {
      expect(getCloudProvider("eks-cluster")).toBe(CLOUD_PROVIDERS.AWS);
      expect(getCloudProvider("eks-argocd")).toBe(CLOUD_PROVIDERS.AWS);
    });

    it("identifies AWS blueprints starting with amplify-", () => {
      expect(getCloudProvider("amplify-cognito-apigw-lambda")).toBe(CLOUD_PROVIDERS.AWS);
    });

    it("identifies AWS blueprints starting with appsync-", () => {
      expect(getCloudProvider("appsync-lambda-aurora-cognito")).toBe(CLOUD_PROVIDERS.AWS);
    });

    it("identifies Azure blueprints starting with functions-", () => {
      expect(getCloudProvider("functions-postgresql")).toBe(CLOUD_PROVIDERS.AZURE);
    });

    it("identifies GCP blueprints starting with appengine-", () => {
      expect(getCloudProvider("appengine-cloudsql-strapi")).toBe(CLOUD_PROVIDERS.GCP);
    });

    it("returns null for unknown blueprint patterns", () => {
      expect(getCloudProvider("unknown-blueprint")).toBeNull();
      expect(getCloudProvider("custom-service")).toBeNull();
    });

    it("handles empty string", () => {
      expect(getCloudProvider("")).toBeNull();
    });
  });
});
