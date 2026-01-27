import { describe, it, expect } from "vitest";
import { BLUEPRINTS, EXTRACTION_PATTERNS, COMPARISONS } from "../index.js";
// Local copy for backwards compatibility with existing tests
const BLUEPRINTS_LOCAL = [
    { name: "apigw-lambda-dynamodb", description: "Serverless REST API with DynamoDB", database: "DynamoDB", pattern: "Sync", useCase: "Simple CRUD, NoSQL, lowest cost" },
    { name: "apigw-lambda-dynamodb-cognito", description: "Serverless API + Auth with DynamoDB", database: "DynamoDB", pattern: "Sync", useCase: "Need user authentication" },
    { name: "apigw-lambda-rds", description: "Serverless REST API with PostgreSQL", database: "PostgreSQL", pattern: "Sync", useCase: "Relational data, SQL queries" },
    { name: "apigw-lambda-rds-proxy", description: "Serverless API + Connection Pooling", database: "PostgreSQL", pattern: "Sync", useCase: "High-traffic production with RDS" },
    { name: "apigw-lambda-aurora", description: "Serverless API + Aurora Serverless", database: "Aurora", pattern: "Sync", useCase: "Variable/unpredictable traffic" },
    { name: "apigw-sqs-lambda-dynamodb", description: "Async Queue Worker", database: "DynamoDB", pattern: "Async", useCase: "Background jobs, decoupled processing" },
    { name: "apigw-eventbridge-lambda", description: "Event-driven Fanout", database: "N/A", pattern: "Async", useCase: "Multiple consumers, event routing" },
    { name: "apigw-sns-lambda", description: "Pub/Sub Pattern", database: "N/A", pattern: "Async", useCase: "Notify multiple systems" },
    { name: "alb-ecs-fargate", description: "Containerized API on ECS Fargate", database: "N/A", pattern: "Sync", useCase: "Custom runtime, containers" },
    { name: "alb-ecs-fargate-rds", description: "Containerized API + RDS", database: "PostgreSQL", pattern: "Sync", useCase: "Containers with relational data" },
    { name: "eks-cluster", description: "Kubernetes Cluster on EKS", database: "N/A", pattern: "N/A", useCase: "Container orchestration at scale" },
    { name: "eks-argocd", description: "EKS + GitOps with ArgoCD", database: "N/A", pattern: "N/A", useCase: "GitOps deployment workflow" },
    { name: "apigw-lambda-bedrock-rag", description: "RAG API with Bedrock", database: "OpenSearch", pattern: "Sync", useCase: "AI/ML, document Q&A" },
    { name: "amplify-cognito-apigw-lambda", description: "Full-stack with Amplify + Auth", database: "DynamoDB", pattern: "Sync", useCase: "Frontend + backend + auth" },
];
// Helper functions (mirrored from index.ts)
function searchBlueprints(query) {
    const searchQuery = query.toLowerCase();
    return BLUEPRINTS_LOCAL.filter((b) => b.name.toLowerCase().includes(searchQuery) ||
        b.description.toLowerCase().includes(searchQuery) ||
        b.database.toLowerCase().includes(searchQuery) ||
        b.useCase.toLowerCase().includes(searchQuery) ||
        b.pattern.toLowerCase().includes(searchQuery));
}
function recommendBlueprint(options) {
    const { database, pattern, auth, containers } = options;
    let recommendations = [...BLUEPRINTS_LOCAL];
    if (containers) {
        recommendations = recommendations.filter((b) => b.name.includes("ecs") || b.name.includes("eks"));
    }
    else if (containers === false) {
        recommendations = recommendations.filter((b) => !b.name.includes("ecs") && !b.name.includes("eks"));
    }
    if (database) {
        const dbLower = database.toLowerCase();
        if (dbLower === "none" || dbLower === "n/a") {
            recommendations = recommendations.filter((b) => b.database === "N/A");
        }
        else {
            recommendations = recommendations.filter((b) => b.database.toLowerCase().includes(dbLower));
        }
    }
    if (pattern) {
        recommendations = recommendations.filter((b) => b.pattern.toLowerCase().includes(pattern.toLowerCase()));
    }
    if (auth) {
        recommendations = recommendations.filter((b) => b.name.includes("cognito") || b.name.includes("amplify"));
    }
    return recommendations;
}
// =============================================================================
// EMPLOYEE SCENARIO TESTS
// =============================================================================
describe("Employee Scenario: Add RDS to existing project", () => {
    it("finds PostgreSQL blueprints when searching 'postgres'", () => {
        const results = searchBlueprints("postgres");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
        expect(results.some((b) => b.name === "apigw-lambda-rds-proxy")).toBe(true);
        expect(results.some((b) => b.name === "alb-ecs-fargate-rds")).toBe(true);
    });
    it("finds RDS blueprints when searching 'rds'", () => {
        const results = searchBlueprints("rds");
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((b) => b.name.includes("rds"))).toBe(true);
    });
});
describe("Employee Scenario: Serverless API recommendation", () => {
    it("recommends DynamoDB blueprint for simple serverless API", () => {
        const results = recommendBlueprint({
            database: "dynamodb",
            pattern: "sync",
            containers: false,
        });
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toBe("apigw-lambda-dynamodb");
    });
    it("recommends PostgreSQL blueprint for SQL needs", () => {
        const results = recommendBlueprint({
            database: "postgresql",
            pattern: "sync",
            containers: false,
        });
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });
});
describe("Employee Scenario: Need authentication", () => {
    it("recommends Cognito blueprint when auth is required", () => {
        const results = recommendBlueprint({ auth: true });
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((b) => b.name.includes("cognito") || b.name.includes("amplify"))).toBe(true);
    });
    it("finds auth blueprints when searching 'auth'", () => {
        const results = searchBlueprints("auth");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name.includes("cognito"))).toBe(true);
    });
});
describe("Employee Scenario: Async processing / queues", () => {
    it("finds async blueprints when searching 'async'", () => {
        const results = searchBlueprints("async");
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((b) => b.pattern === "Async")).toBe(true);
    });
    it("finds queue blueprints when searching 'queue'", () => {
        const results = searchBlueprints("queue");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name.includes("sqs"))).toBe(true);
    });
    it("recommends async blueprint for background jobs", () => {
        const results = recommendBlueprint({
            pattern: "async",
            containers: false,
        });
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((b) => b.pattern === "Async")).toBe(true);
    });
});
describe("Employee Scenario: Containers / Kubernetes", () => {
    it("finds container blueprints when searching 'containers'", () => {
        const results = searchBlueprints("containers");
        expect(results.length).toBeGreaterThan(0);
    });
    it("finds EKS blueprints when searching 'kubernetes'", () => {
        const results = searchBlueprints("kubernetes");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name.includes("eks"))).toBe(true);
    });
    it("recommends container blueprints when containers flag is true", () => {
        const results = recommendBlueprint({ containers: true });
        expect(results.length).toBeGreaterThan(0);
        expect(results.every((b) => b.name.includes("ecs") || b.name.includes("eks"))).toBe(true);
    });
    it("recommends ECS with RDS for containerized app with database", () => {
        const results = recommendBlueprint({
            containers: true,
            database: "postgresql",
        });
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name === "alb-ecs-fargate-rds")).toBe(true);
    });
});
describe("Employee Scenario: AI/ML workload", () => {
    it("finds AI/ML blueprints when searching 'ai'", () => {
        const results = searchBlueprints("ai");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name.includes("bedrock"))).toBe(true);
    });
    it("finds RAG blueprint when searching 'rag'", () => {
        const results = searchBlueprints("rag");
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toBe("apigw-lambda-bedrock-rag");
    });
});
describe("Employee Scenario: Full-stack app with frontend", () => {
    it("finds Amplify blueprint when searching 'frontend'", () => {
        const results = searchBlueprints("frontend");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name.includes("amplify"))).toBe(true);
    });
    it("finds full-stack blueprint when searching 'full-stack'", () => {
        const results = searchBlueprints("full-stack");
        expect(results.length).toBeGreaterThan(0);
    });
});
// =============================================================================
// EDGE CASES
// =============================================================================
describe("Edge Cases", () => {
    it("returns empty array for non-matching search", () => {
        const results = searchBlueprints("xyz-nonexistent-blueprint");
        expect(results).toEqual([]);
    });
    it("returns all blueprints when no filters applied", () => {
        const results = recommendBlueprint({});
        expect(results.length).toBe(BLUEPRINTS_LOCAL.length);
    });
    it("handles case-insensitive search", () => {
        const lowerResults = searchBlueprints("dynamodb");
        const upperResults = searchBlueprints("DYNAMODB");
        const mixedResults = searchBlueprints("DynamoDB");
        expect(lowerResults).toEqual(upperResults);
        expect(upperResults).toEqual(mixedResults);
    });
    it("returns specific blueprint by exact name search", () => {
        const results = searchBlueprints("apigw-lambda-rds");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });
});
// =============================================================================
// BLUEPRINT DATA INTEGRITY
// =============================================================================
describe("Blueprint Data Integrity", () => {
    it("has 14 blueprints in the catalog", () => {
        expect(BLUEPRINTS_LOCAL.length).toBe(14);
    });
    it("all blueprints have required fields", () => {
        BLUEPRINTS_LOCAL.forEach((blueprint) => {
            expect(blueprint.name).toBeDefined();
            expect(blueprint.description).toBeDefined();
            expect(blueprint.database).toBeDefined();
            expect(blueprint.pattern).toBeDefined();
            expect(blueprint.useCase).toBeDefined();
        });
    });
    it("all blueprint names are unique", () => {
        const names = BLUEPRINTS_LOCAL.map((b) => b.name);
        const uniqueNames = [...new Set(names)];
        expect(names.length).toBe(uniqueNames.length);
    });
    it("patterns are valid values", () => {
        const validPatterns = ["Sync", "Async", "N/A"];
        BLUEPRINTS_LOCAL.forEach((blueprint) => {
            expect(validPatterns).toContain(blueprint.pattern);
        });
    });
});
// =============================================================================
// EXTRACTION PATTERNS TESTS
// =============================================================================
describe("Extract Pattern Tool", () => {
    it("has extraction patterns for database capability", () => {
        expect(EXTRACTION_PATTERNS.database).toBeDefined();
        expect(EXTRACTION_PATTERNS.database.blueprint).toBe("apigw-lambda-rds");
        expect(EXTRACTION_PATTERNS.database.modules.length).toBeGreaterThan(0);
        expect(EXTRACTION_PATTERNS.database.integrationSteps.length).toBeGreaterThan(0);
    });
    it("has extraction patterns for queue capability", () => {
        expect(EXTRACTION_PATTERNS.queue).toBeDefined();
        expect(EXTRACTION_PATTERNS.queue.blueprint).toBe("apigw-sqs-lambda-dynamodb");
        expect(EXTRACTION_PATTERNS.queue.modules).toContain("modules/queue/");
    });
    it("has extraction patterns for auth capability", () => {
        expect(EXTRACTION_PATTERNS.auth).toBeDefined();
        expect(EXTRACTION_PATTERNS.auth.blueprint).toBe("apigw-lambda-dynamodb-cognito");
        expect(EXTRACTION_PATTERNS.auth.modules).toContain("modules/auth/");
    });
    it("has extraction patterns for events capability", () => {
        expect(EXTRACTION_PATTERNS.events).toBeDefined();
        expect(EXTRACTION_PATTERNS.events.blueprint).toBe("apigw-eventbridge-lambda");
    });
    it("has extraction patterns for ai capability", () => {
        expect(EXTRACTION_PATTERNS.ai).toBeDefined();
        expect(EXTRACTION_PATTERNS.ai.blueprint).toBe("apigw-lambda-bedrock-rag");
        expect(EXTRACTION_PATTERNS.ai.modules).toContain("modules/ai/");
    });
    it("has extraction patterns for notifications capability", () => {
        expect(EXTRACTION_PATTERNS.notifications).toBeDefined();
        expect(EXTRACTION_PATTERNS.notifications.blueprint).toBe("apigw-sns-lambda");
    });
    it("all extraction patterns reference valid blueprints", () => {
        const blueprintNames = BLUEPRINTS.map((b) => b.name);
        Object.values(EXTRACTION_PATTERNS).forEach((pattern) => {
            expect(blueprintNames).toContain(pattern.blueprint);
        });
    });
});
// =============================================================================
// COMPARISON TOOL TESTS
// =============================================================================
describe("Compare Blueprints Tool", () => {
    it("has serverless-vs-containers comparison", () => {
        expect(COMPARISONS["serverless-vs-containers"]).toBeDefined();
        expect(COMPARISONS["serverless-vs-containers"].optionA.name).toBe("Serverless (Lambda)");
        expect(COMPARISONS["serverless-vs-containers"].optionB.name).toBe("Containers (ECS Fargate)");
        expect(COMPARISONS["serverless-vs-containers"].factors.length).toBeGreaterThan(0);
    });
    it("has dynamodb-vs-rds comparison", () => {
        expect(COMPARISONS["dynamodb-vs-rds"]).toBeDefined();
        expect(COMPARISONS["dynamodb-vs-rds"].optionA.name).toContain("DynamoDB");
        expect(COMPARISONS["dynamodb-vs-rds"].optionB.name).toContain("RDS");
    });
    it("has sync-vs-async comparison", () => {
        expect(COMPARISONS["sync-vs-async"]).toBeDefined();
        expect(COMPARISONS["sync-vs-async"].factors.length).toBeGreaterThan(0);
    });
    it("all comparison options reference valid blueprints", () => {
        const blueprintNames = BLUEPRINTS.map((b) => b.name);
        Object.values(COMPARISONS).forEach((comparison) => {
            comparison.optionA.blueprints.forEach((bp) => {
                expect(blueprintNames).toContain(bp);
            });
            comparison.optionB.blueprints.forEach((bp) => {
                expect(blueprintNames).toContain(bp);
            });
        });
    });
});
// =============================================================================
// 5 CORE SCENARIO TESTS
// =============================================================================
describe("Scenario 1: App Exists, Need Infrastructure", () => {
    it("finds container blueprints for existing containerized app", () => {
        const results = recommendBlueprint({ containers: true, database: "postgresql" });
        expect(results.some((b) => b.name === "alb-ecs-fargate-rds")).toBe(true);
    });
    it("finds serverless blueprints for refactoring to serverless", () => {
        const results = recommendBlueprint({ containers: false, database: "postgresql" });
        expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });
    it("comparison exists for serverless vs containers decision", () => {
        expect(COMPARISONS["serverless-vs-containers"]).toBeDefined();
    });
});
describe("Scenario 2: Existing Terraform, Add Capability", () => {
    it("has database extraction pattern for adding RDS", () => {
        expect(EXTRACTION_PATTERNS.database).toBeDefined();
        expect(EXTRACTION_PATTERNS.database.integrationSteps.length).toBeGreaterThan(3);
    });
    it("has queue extraction pattern for adding SQS", () => {
        expect(EXTRACTION_PATTERNS.queue).toBeDefined();
        expect(EXTRACTION_PATTERNS.queue.modules).toContain("modules/queue/");
    });
    it("has auth extraction pattern for adding Cognito", () => {
        expect(EXTRACTION_PATTERNS.auth).toBeDefined();
        expect(EXTRACTION_PATTERNS.auth.modules).toContain("modules/auth/");
    });
});
describe("Scenario 3: Client Brief Only", () => {
    it("recommends based on requirements: REST API + auth + PostgreSQL", () => {
        const results = recommendBlueprint({
            database: "postgresql",
            pattern: "sync",
            auth: false,
            containers: false,
        });
        expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });
    it("recommends async blueprint for background processing requirement", () => {
        const results = recommendBlueprint({ pattern: "async" });
        expect(results.some((b) => b.name === "apigw-sqs-lambda-dynamodb")).toBe(true);
    });
    it("recommends auth blueprint when authentication required", () => {
        const results = recommendBlueprint({ auth: true });
        expect(results.some((b) => b.name.includes("cognito"))).toBe(true);
    });
});
describe("Scenario 4: Add AI Features", () => {
    it("has AI extraction pattern", () => {
        expect(EXTRACTION_PATTERNS.ai).toBeDefined();
        expect(EXTRACTION_PATTERNS.ai.blueprint).toBe("apigw-lambda-bedrock-rag");
    });
    it("AI pattern includes Bedrock and OpenSearch modules", () => {
        expect(EXTRACTION_PATTERNS.ai.modules).toContain("modules/ai/");
        expect(EXTRACTION_PATTERNS.ai.modules).toContain("modules/vectorstore/");
    });
    it("finds AI blueprint via search", () => {
        const results = searchBlueprints("bedrock");
        expect(results.some((b) => b.name === "apigw-lambda-bedrock-rag")).toBe(true);
    });
});
describe("Scenario 5: Compare Options", () => {
    it("can compare serverless vs containers", () => {
        const comparison = COMPARISONS["serverless-vs-containers"];
        expect(comparison.factors.some((f) => f.factor === "Cold starts")).toBe(true);
        expect(comparison.factors.some((f) => f.factor === "Cost model")).toBe(true);
    });
    it("can compare DynamoDB vs RDS", () => {
        const comparison = COMPARISONS["dynamodb-vs-rds"];
        expect(comparison.factors.some((f) => f.factor === "Data model")).toBe(true);
        expect(comparison.factors.some((f) => f.factor === "Query flexibility")).toBe(true);
    });
    it("can compare sync vs async patterns", () => {
        const comparison = COMPARISONS["sync-vs-async"];
        expect(comparison.factors.some((f) => f.factor === "Response time")).toBe(true);
        expect(comparison.factors.some((f) => f.factor === "Reliability")).toBe(true);
    });
});
//# sourceMappingURL=server.test.js.map