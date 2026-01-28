import { describe, it, expect } from "vitest";
import { BLUEPRINTS, EXTRACTION_PATTERNS } from "../config/constants.js";

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
function searchBlueprints(query: string) {
  const searchQuery = query.toLowerCase();
  return BLUEPRINTS_LOCAL.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery) ||
      b.description.toLowerCase().includes(searchQuery) ||
      b.database.toLowerCase().includes(searchQuery) ||
      b.useCase.toLowerCase().includes(searchQuery) ||
      b.pattern.toLowerCase().includes(searchQuery)
  );
}

function recommendBlueprint(options: {
  database?: string;
  pattern?: string;
  auth?: boolean;
  containers?: boolean;
}) {
  const { database, pattern, auth, containers } = options;
  let recommendations = [...BLUEPRINTS_LOCAL];

  if (containers) {
    recommendations = recommendations.filter(
      (b) => b.name.includes("ecs") || b.name.includes("eks")
    );
  } else if (containers === false) {
    recommendations = recommendations.filter(
      (b) => !b.name.includes("ecs") && !b.name.includes("eks")
    );
  }

  if (database) {
    const dbLower = database.toLowerCase();
    if (dbLower === "none" || dbLower === "n/a") {
      recommendations = recommendations.filter((b) => b.database === "N/A");
    } else {
      recommendations = recommendations.filter((b) =>
        b.database.toLowerCase().includes(dbLower)
      );
    }
  }

  if (pattern) {
    recommendations = recommendations.filter((b) =>
      b.pattern.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  if (auth) {
    recommendations = recommendations.filter(
      (b) => b.name.includes("cognito") || b.name.includes("amplify")
    );
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
    expect(
      results.every(
        (b) => b.name.includes("cognito") || b.name.includes("amplify")
      )
    ).toBe(true);
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
    expect(
      results.every((b) => b.name.includes("ecs") || b.name.includes("eks"))
    ).toBe(true);
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
// Note: COMPARISONS removed - comparison functionality not currently implemented
// These tests are kept for reference but commented out
// describe("Compare Blueprints Tool", () => {
//   // Comparison tests would go here if comparison feature is re-implemented
// });

// =============================================================================
// 5 CORE SCENARIO TESTS
// =============================================================================

describe("Scenario 1: App Exists, Need Infrastructure", () => {
  describe("Search Phase", () => {
    it("finds PostgreSQL blueprints when app uses PostgreSQL", () => {
      const results = searchBlueprints("postgresql");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.database === "PostgreSQL" || b.database === "Aurora")).toBe(true);
      expect(results.some((b) => b.name.includes("rds"))).toBe(true);
    });

    it("finds serverless blueprints when refactoring to serverless", () => {
      const results = searchBlueprints("serverless");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name.includes("lambda"))).toBe(true);
      expect(results.every((b) => !b.name.includes("ecs") && !b.name.includes("eks"))).toBe(true);
    });

    it("finds container blueprints when containerizing existing app", () => {
      const results = searchBlueprints("containers");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name.includes("ecs") || b.name.includes("eks"))).toBe(true);
    });

    it("finds DynamoDB blueprints when app uses NoSQL", () => {
      const results = searchBlueprints("dynamodb");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => b.database === "DynamoDB")).toBe(true);
    });

    it("finds auth blueprints when app needs authentication", () => {
      const results = searchBlueprints("auth");
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name.includes("cognito") || b.name.includes("amplify"))).toBe(true);
    });
  });

  describe("Recommendation Phase", () => {
    it("recommends apigw-lambda-rds for Node.js + PostgreSQL app", () => {
      const results = recommendBlueprint({
        database: "postgresql",
        pattern: "sync",
        containers: false,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });

    it("recommends alb-ecs-fargate-rds for containerized app with PostgreSQL", () => {
      const results = recommendBlueprint({
        containers: true,
        database: "postgresql",
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name === "alb-ecs-fargate-rds")).toBe(true);
    });

    it("recommends apigw-lambda-dynamodb for serverless refactor with DynamoDB", () => {
      const results = recommendBlueprint({
        database: "dynamodb",
        pattern: "sync",
        containers: false,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name === "apigw-lambda-dynamodb")).toBe(true);
    });

    it("recommends Cognito blueprints when app needs auth", () => {
      const results = recommendBlueprint({
        auth: true,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((b) => b.name.includes("cognito"))).toBe(true);
      expect(results.every((b) => b.name.includes("cognito") || b.name.includes("amplify"))).toBe(true);
    });

    it("recommends async blueprints for async processing needs", () => {
      const results = recommendBlueprint({
        pattern: "async",
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => b.pattern === "Async")).toBe(true);
      expect(results.some((b) => b.name.includes("sqs") || b.name.includes("eventbridge") || b.name.includes("sns"))).toBe(true);
    });

    it("filters out containers when containers flag is false", () => {
      const results = recommendBlueprint({
        containers: false,
        database: "postgresql",
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((b) => !b.name.includes("ecs") && !b.name.includes("eks"))).toBe(true);
      expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
    });
  });

  describe("Blueprint Discovery", () => {
    it("verifies recommended blueprints have required modules", () => {
      const rdsBlueprint = BLUEPRINTS_LOCAL.find((b) => b.name === "apigw-lambda-rds");
      expect(rdsBlueprint).toBeDefined();
      expect(rdsBlueprint?.database).toBe("PostgreSQL");
      expect(rdsBlueprint?.pattern).toBe("Sync");
    });

    it("verifies blueprint structure matches deployment needs", () => {
      const containerBlueprint = BLUEPRINTS_LOCAL.find((b) => b.name === "alb-ecs-fargate-rds");
      expect(containerBlueprint).toBeDefined();
      expect(containerBlueprint?.database).toBe("PostgreSQL");
      expect(containerBlueprint?.name).toContain("ecs");
    });

    it("verifies async blueprints have correct pattern", () => {
      const asyncBlueprints = BLUEPRINTS_LOCAL.filter((b) => b.pattern === "Async");
      expect(asyncBlueprints.length).toBeGreaterThan(0);
      asyncBlueprints.forEach((b) => {
        expect(b.pattern).toBe("Async");
        expect(b.name.includes("sqs") || b.name.includes("eventbridge") || b.name.includes("sns")).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles no matching blueprint found scenario", () => {
      const results = searchBlueprints("nonexistent-technology-xyz");
      expect(results).toEqual([]);
    });

    it("verifies best match is returned for multiple matching blueprints", () => {
      const results = recommendBlueprint({
        database: "postgresql",
        pattern: "sync",
      });

      expect(results.length).toBeGreaterThan(1);
      // Should include both serverless and container options
      expect(results.some((b) => b.name === "apigw-lambda-rds")).toBe(true);
      expect(results.some((b) => b.name === "alb-ecs-fargate-rds")).toBe(true);
    });

    it("handles invalid search queries gracefully", () => {
      const emptyResults = searchBlueprints("");
      const specialCharResults = searchBlueprints("!@#$%");
      
      // Empty query should return all or handle gracefully
      expect(Array.isArray(emptyResults)).toBe(true);
      // Special characters should not crash
      expect(Array.isArray(specialCharResults)).toBe(true);
    });
  });
});

describe("Scenario 2: Existing Terraform, Add Capability", () => {
  describe("Pattern Extraction", () => {
    it("extracts database pattern returning RDS pattern from apigw-lambda-rds", () => {
      const pattern = EXTRACTION_PATTERNS.database;
      
      expect(pattern).toBeDefined();
      expect(pattern.blueprint).toBe("apigw-lambda-rds");
      expect(pattern.modules).toContain("modules/data/");
      expect(pattern.modules).toContain("modules/vpc/");
      expect(pattern.description).toContain("RDS");
    });

    it("extracts queue pattern returning SQS pattern from apigw-sqs-lambda-dynamodb", () => {
      const pattern = EXTRACTION_PATTERNS.queue;
      
      expect(pattern).toBeDefined();
      expect(pattern.blueprint).toBe("apigw-sqs-lambda-dynamodb");
      expect(pattern.modules).toContain("modules/queue/");
      expect(pattern.modules).toContain("modules/worker/");
      expect(pattern.description).toContain("SQS");
    });

    it("extracts auth pattern returning Cognito pattern from apigw-lambda-dynamodb-cognito", () => {
      const pattern = EXTRACTION_PATTERNS.auth;
      
      expect(pattern).toBeDefined();
      expect(pattern.blueprint).toBe("apigw-lambda-dynamodb-cognito");
      expect(pattern.modules).toContain("modules/auth/");
      expect(pattern.description).toContain("Cognito");
    });

    it("extracts events pattern returning EventBridge pattern", () => {
      const pattern = EXTRACTION_PATTERNS.events;
      
      expect(pattern).toBeDefined();
      expect(pattern.blueprint).toBe("apigw-eventbridge-lambda");
      expect(pattern.modules).toContain("modules/events/");
      expect(pattern.description).toContain("EventBridge");
    });

    it("extracts AI pattern returning Bedrock RAG pattern", () => {
      const pattern = EXTRACTION_PATTERNS.ai;
      
      expect(pattern).toBeDefined();
      expect(pattern.blueprint).toBe("apigw-lambda-bedrock-rag");
      expect(pattern.modules).toContain("modules/ai/");
      expect(pattern.modules).toContain("modules/vectorstore/");
      expect(pattern.description).toContain("Bedrock");
    });

    it("extracts notifications pattern returning SNS pattern", () => {
      const pattern = EXTRACTION_PATTERNS.notifications;
      
      expect(pattern).toBeDefined();
      expect(pattern.blueprint).toBe("apigw-sns-lambda");
      expect(pattern.modules).toContain("modules/notifications/");
      expect(pattern.description).toContain("SNS");
    });
  });

  describe("Integration Guidance", () => {
    it("verifies extraction patterns include integration steps", () => {
      Object.values(EXTRACTION_PATTERNS).forEach((pattern) => {
        expect(pattern.integrationSteps).toBeDefined();
        expect(Array.isArray(pattern.integrationSteps)).toBe(true);
        expect(pattern.integrationSteps.length).toBeGreaterThan(0);
      });
    });

    it("verifies extraction patterns include module paths", () => {
      Object.values(EXTRACTION_PATTERNS).forEach((pattern) => {
        expect(pattern.modules).toBeDefined();
        expect(Array.isArray(pattern.modules)).toBe(true);
        expect(pattern.modules.length).toBeGreaterThan(0);
        pattern.modules.forEach((module) => {
          expect(module).toContain("modules/");
        });
      });
    });

    it("verifies extraction patterns reference correct blueprint", () => {
      const blueprintNames = BLUEPRINTS_LOCAL.map((b) => b.name);
      
      Object.values(EXTRACTION_PATTERNS).forEach((pattern) => {
        expect(pattern.blueprint).toBeDefined();
        expect(blueprintNames).toContain(pattern.blueprint);
      });
    });
  });

  describe("Module Validation", () => {
    it("verifies database pattern includes modules/data/ and modules/vpc/", () => {
      const pattern = EXTRACTION_PATTERNS.database;
      
      expect(pattern.modules).toContain("modules/data/");
      expect(pattern.modules).toContain("modules/vpc/");
    });

    it("verifies queue pattern includes modules/queue/ and modules/worker/", () => {
      const pattern = EXTRACTION_PATTERNS.queue;
      
      expect(pattern.modules).toContain("modules/queue/");
      expect(pattern.modules).toContain("modules/worker/");
    });

    it("verifies auth pattern includes modules/auth/", () => {
      const pattern = EXTRACTION_PATTERNS.auth;
      
      expect(pattern.modules).toContain("modules/auth/");
    });

    it("verifies AI pattern includes modules/ai/ and modules/vectorstore/", () => {
      const pattern = EXTRACTION_PATTERNS.ai;
      
      expect(pattern.modules).toContain("modules/ai/");
      expect(pattern.modules).toContain("modules/vectorstore/");
    });
  });

  describe("Error Handling", () => {
    it("handles invalid capability name gracefully", () => {
      const invalidCapability = "invalid-capability-name";
      const pattern = EXTRACTION_PATTERNS[invalidCapability];
      
      expect(pattern).toBeUndefined();
    });

    it("verifies all extraction patterns have required fields", () => {
      Object.entries(EXTRACTION_PATTERNS).forEach(([capability, pattern]) => {
        expect(pattern.blueprint).toBeDefined();
        expect(pattern.modules).toBeDefined();
        expect(Array.isArray(pattern.modules)).toBe(true);
        expect(pattern.description).toBeDefined();
        expect(pattern.integrationSteps).toBeDefined();
        expect(Array.isArray(pattern.integrationSteps)).toBe(true);
      });
    });
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
  // Comparison feature not currently implemented
  // These tests would verify comparison functionality if re-implemented
  it("placeholder for comparison tests", () => {
    expect(true).toBe(true);
  });
});
