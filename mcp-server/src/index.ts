#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blueprint catalog data
export const BLUEPRINTS = [
  { name: "apigw-lambda-dynamodb", description: "Serverless REST API with DynamoDB", database: "DynamoDB", pattern: "Sync", useCase: "Simple CRUD, NoSQL, lowest cost", origin: "TBD" },
  { name: "apigw-lambda-dynamodb-cognito", description: "Serverless API + Auth with DynamoDB", database: "DynamoDB", pattern: "Sync", useCase: "Need user authentication", origin: "TBD" },
  { name: "apigw-lambda-rds", description: "Serverless REST API with PostgreSQL", database: "PostgreSQL", pattern: "Sync", useCase: "Relational data, SQL queries", origin: "NBCU Loyalty Build (Backlot) - Web app for fan loyalty & quest rewards (ustwo, 2025)" },
  { name: "apigw-lambda-rds-proxy", description: "Serverless API + Connection Pooling", database: "PostgreSQL", pattern: "Sync", useCase: "High-traffic production with RDS", origin: "TBD" },
  { name: "apigw-lambda-aurora", description: "Serverless API + Aurora Serverless", database: "Aurora", pattern: "Sync", useCase: "Variable/unpredictable traffic", origin: "TBD" },
  { name: "appsync-lambda-aurora-cognito", description: "GraphQL API + Auth + Aurora", database: "Aurora Serverless", pattern: "Sync", useCase: "GraphQL, user auth, relational data", origin: "The Body Coach (ustwo, 2020)" },
  { name: "apigw-sqs-lambda-dynamodb", description: "Async Queue Worker", database: "DynamoDB", pattern: "Async", useCase: "Background jobs, decoupled processing", origin: "SuprDOG/FetchIQ - Pet health platform with AI-powered lab analysis and product recommendations (ustwo, 2025)" },
  { name: "apigw-eventbridge-lambda", description: "Event-driven Fanout", database: "N/A", pattern: "Async", useCase: "Multiple consumers, event routing", origin: "TBD" },
  { name: "apigw-sns-lambda", description: "Pub/Sub Pattern", database: "N/A", pattern: "Async", useCase: "Notify multiple systems", origin: "TBD" },
  { name: "alb-ecs-fargate", description: "Containerized API on ECS Fargate", database: "N/A", pattern: "Sync", useCase: "Custom runtime, containers", origin: "Sproufiful - AI meal planning app (ustwo, 2024), Samsung Maestro - AI collaboration tool (ustwo, 2025)" },
  { name: "alb-ecs-fargate-rds", description: "Containerized API + RDS", database: "PostgreSQL", pattern: "Sync", useCase: "Containers with relational data", origin: "TBD" },
  { name: "eks-cluster", description: "Kubernetes Cluster on EKS", database: "N/A", pattern: "N/A", useCase: "Container orchestration at scale", origin: "TBD" },
  { name: "eks-argocd", description: "EKS + GitOps with ArgoCD", database: "N/A", pattern: "N/A", useCase: "GitOps deployment workflow", origin: "RVO QuitBuddy - AI-powered smoking cessation platform with event-driven architecture (ustwo, 2025)" },
  { name: "apigw-lambda-bedrock-rag", description: "RAG API with Bedrock", database: "OpenSearch", pattern: "Sync", useCase: "AI/ML, document Q&A", origin: "Cancer Platform (Backend) - RAG API for document Q&A (ustwo, 2025)" },
  { name: "amplify-cognito-apigw-lambda", description: "Full-stack with Amplify + Auth", database: "DynamoDB", pattern: "Sync", useCase: "Frontend + backend + auth", origin: "Cancer Platform (Frontend) - Next.js app for document management (ustwo, 2024)" },
  { name: "azure-functions-postgresql", description: "Serverless API with PostgreSQL", database: "PostgreSQL Flexible Server", pattern: "Sync", useCase: "Azure serverless, relational data", origin: "HM Impuls - WhatsApp-based pitch submission platform (ustwo, 2025)" },
  { name: "gcp-appengine-cloudsql-strapi", description: "Containerized app with Cloud SQL", database: "Cloud SQL PostgreSQL", pattern: "Sync", useCase: "GCP serverless, CMS/Strapi", origin: "Mavie iOS - Mobile app backend with Strapi CMS (ustwo, 2025)" },
];

// Cross-cloud blueprint equivalents
export const CROSS_CLOUD_EQUIVALENTS: Record<string, {
  aws?: string;
  azure?: string;
  gcp?: string;
  description: string;
}> = {
  "containerized-postgresql": {
    aws: "alb-ecs-fargate-rds",
    azure: "azure-functions-postgresql", // Note: Azure Functions is serverless, not containers
    gcp: "gcp-appengine-cloudsql-strapi",
    description: "Containerized application with PostgreSQL database"
  },
  "serverless-postgresql": {
    aws: "apigw-lambda-rds",
    azure: "azure-functions-postgresql",
    gcp: undefined, // No direct GCP equivalent (Cloud Functions + Cloud SQL exists but not in catalog)
    description: "Serverless API with PostgreSQL database"
  },
};

// Project to blueprint mapping (for project-based queries)
export const PROJECT_BLUEPRINTS: Record<string, {
  blueprint: string;
  cloud: "aws" | "azure" | "gcp";
  description: string;
}> = {
  "mavie": {
    blueprint: "gcp-appengine-cloudsql-strapi",
    cloud: "gcp",
    description: "Mavie iOS - Mobile app backend with Strapi CMS"
  },
  "hm impuls": {
    blueprint: "azure-functions-postgresql",
    cloud: "azure",
    description: "HM Impuls - WhatsApp-based pitch submission platform"
  },
  "suprdog": {
    blueprint: "apigw-sqs-lambda-dynamodb",
    cloud: "aws",
    description: "SuprDOG/FetchIQ - Pet health platform with AI-powered lab analysis and product recommendations"
  },
  "fetchiq": {
    blueprint: "apigw-sqs-lambda-dynamodb",
    cloud: "aws",
    description: "SuprDOG/FetchIQ - Pet health platform with AI-powered lab analysis and product recommendations"
  },
  "backlot": {
    blueprint: "apigw-lambda-rds",
    cloud: "aws",
    description: "NBCU Loyalty Build (Backlot) - Web app for fan loyalty & quest rewards"
  },
  "cancer platform": {
    blueprint: "apigw-lambda-bedrock-rag",
    cloud: "aws",
    description: "Cancer Platform (Backend) - RAG API for document Q&A"
  },
  "rvo quitbuddy": {
    blueprint: "eks-argocd",
    cloud: "aws",
    description: "RVO QuitBuddy - AI-powered smoking cessation platform with event-driven architecture"
  },
  "quitbuddy": {
    blueprint: "eks-argocd",
    cloud: "aws",
    description: "RVO QuitBuddy - AI-powered smoking cessation platform with event-driven architecture"
  },
  "body coach": {
    blueprint: "appsync-lambda-aurora-cognito",
    cloud: "aws",
    description: "The Body Coach - GraphQL API with authentication and Aurora database"
  },
  "sproufiful": {
    blueprint: "alb-ecs-fargate",
    cloud: "aws",
    description: "Sproufiful - AI meal planning app"
  },
  "samsung maestro": {
    blueprint: "alb-ecs-fargate",
    cloud: "aws",
    description: "Samsung Maestro - AI collaboration tool"
  },
};

// Pattern extraction mapping - which blueprint to use for each capability
export const EXTRACTION_PATTERNS: Record<string, { blueprint: string; modules: string[]; description: string; integrationSteps: string[] }> = {
  database: {
    blueprint: "apigw-lambda-rds",
    modules: ["modules/data/", "modules/networking/"],
    description: "RDS PostgreSQL database with VPC integration",
    integrationSteps: [
      "Copy modules/data/ to your project's modules directory",
      "Copy relevant security group rules from modules/networking/",
      "Add database module call to your main.tf",
      "Configure VPC subnet IDs and security group references",
      "Add Secrets Manager for connection metadata",
      "Update Lambda/ECS IAM roles for database access",
    ],
  },
  queue: {
    blueprint: "apigw-sqs-lambda-dynamodb",
    modules: ["modules/queue/", "modules/worker/"],
    description: "SQS queue with Lambda worker for async processing",
    integrationSteps: [
      "Copy modules/queue/ to your project's modules directory",
      "Copy modules/worker/ for the Lambda consumer",
      "Add queue module call to your main.tf",
      "Configure dead-letter queue for failed messages",
      "Update API to send messages to SQS instead of processing directly",
      "Add IAM permissions for SQS send/receive",
    ],
  },
  auth: {
    blueprint: "apigw-lambda-dynamodb-cognito",
    modules: ["modules/auth/"],
    description: "Cognito user pool with API Gateway authorizer",
    integrationSteps: [
      "Copy modules/auth/ to your project's modules directory",
      "Add auth module call to your main.tf",
      "Configure Cognito user pool settings (password policy, MFA)",
      "Update API Gateway to use Cognito authorizer",
      "Add callback URLs for your frontend",
      "Update frontend to use Cognito SDK for authentication",
    ],
  },
  events: {
    blueprint: "apigw-eventbridge-lambda",
    modules: ["modules/events/"],
    description: "EventBridge for event-driven fanout to multiple consumers",
    integrationSteps: [
      "Copy modules/events/ to your project's modules directory",
      "Add events module call to your main.tf",
      "Define event rules for routing",
      "Create Lambda targets for each consumer",
      "Update source service to publish events to EventBridge",
      "Configure event patterns for filtering",
    ],
  },
  ai: {
    blueprint: "apigw-lambda-bedrock-rag",
    modules: ["modules/ai/", "modules/vectorstore/"],
    description: "Bedrock RAG with OpenSearch for document Q&A",
    integrationSteps: [
      "Copy modules/ai/ to your project's modules directory",
      "Copy modules/vectorstore/ for OpenSearch Serverless",
      "Add AI module calls to your main.tf",
      "Configure Bedrock model access (Claude, Titan, etc.)",
      "Set up document ingestion pipeline from S3",
      "Add IAM permissions for Bedrock and OpenSearch",
      "Update API to expose chat/query endpoints",
    ],
  },
  notifications: {
    blueprint: "apigw-sns-lambda",
    modules: ["modules/notifications/"],
    description: "SNS for pub/sub notifications to multiple subscribers",
    integrationSteps: [
      "Copy modules/notifications/ to your project's modules directory",
      "Add notifications module call to your main.tf",
      "Configure SNS topic and subscriptions",
      "Add Lambda, email, or HTTP subscribers",
      "Update source service to publish to SNS",
      "Configure message filtering if needed",
    ],
  },
};

// Helper function to find cross-cloud equivalent blueprint
function findCrossCloudEquivalent(sourceBlueprint: string, targetCloud: string): typeof BLUEPRINTS[0] | null {
  const source = BLUEPRINTS.find(b => b.name === sourceBlueprint);
  if (!source) return null;

  const targetCloudLower = targetCloud.toLowerCase();

  // Map based on characteristics
  if (sourceBlueprint === "gcp-appengine-cloudsql-strapi" && targetCloudLower === "aws") {
    return BLUEPRINTS.find(b => b.name === "alb-ecs-fargate-rds") || null;
  }

  if (sourceBlueprint === "azure-functions-postgresql" && targetCloudLower === "aws") {
    return BLUEPRINTS.find(b => b.name === "apigw-lambda-rds") || null;
  }

  if (sourceBlueprint === "azure-functions-postgresql" && targetCloudLower === "gcp") {
    return BLUEPRINTS.find(b => b.name === "gcp-appengine-cloudsql-strapi") || null;
  }

  if (sourceBlueprint === "apigw-lambda-rds" && targetCloudLower === "azure") {
    return BLUEPRINTS.find(b => b.name === "azure-functions-postgresql") || null;
  }

  if (sourceBlueprint === "apigw-lambda-rds" && targetCloudLower === "gcp") {
    return BLUEPRINTS.find(b => b.name === "gcp-appengine-cloudsql-strapi") || null;
  }

  if (sourceBlueprint === "alb-ecs-fargate-rds" && targetCloudLower === "gcp") {
    return BLUEPRINTS.find(b => b.name === "gcp-appengine-cloudsql-strapi") || null;
  }

  if (sourceBlueprint === "alb-ecs-fargate-rds" && targetCloudLower === "azure") {
    return BLUEPRINTS.find(b => b.name === "azure-functions-postgresql") || null;
  }

  return null;
}

// Helper function to get cloud provider from blueprint name
function getCloudProvider(blueprintName: string): "aws" | "azure" | "gcp" | null {
  if (blueprintName.startsWith("azure-")) return "azure";
  if (blueprintName.startsWith("gcp-")) return "gcp";
  if (blueprintName.startsWith("apigw-") || blueprintName.startsWith("alb-") ||
    blueprintName.startsWith("eks-") || blueprintName.startsWith("amplify-") ||
    blueprintName.startsWith("appsync-")) return "aws";
  return null;
}

// Try to fetch AGENTS.md content
async function getAgentsMdContent(): Promise<string> {
  // Try local file first (if running from repo)
  const localPaths = [
    path.join(process.cwd(), "AGENTS.md"),
    path.join(__dirname, "../../AGENTS.md"),
    path.join(__dirname, "../../../AGENTS.md"),
  ];

  for (const localPath of localPaths) {
    try {
      if (fs.existsSync(localPath)) {
        return fs.readFileSync(localPath, "utf-8");
      }
    } catch {
      // Continue to next path
    }
  }

  // Try fetching from GitHub using gh CLI
  try {
    const content = execSync(
      'gh api repos/berTrindade/terraform-infrastructure-blueprints/contents/AGENTS.md --jq ".content" | base64 -d',
      { encoding: "utf-8", timeout: 10000 }
    );
    return content;
  } catch {
    // Return embedded fallback
    return generateFallbackContent();
  }
}

function generateFallbackContent(): string {
  const blueprintTable = BLUEPRINTS.map(
    (b) => `| ${b.name} | ${b.description} | ${b.database} | ${b.pattern} | ${b.useCase} | ${b.origin || "TBD"} |`
  ).join("\n");

  return `# Terraform Infrastructure Blueprints

## Blueprint Catalog

| Blueprint | Description | Database | Pattern | Use Case | Origin |
|-----------|-------------|----------|---------|----------|--------|
${blueprintTable}

## Quick Start

\`\`\`bash
# Download a blueprint
npx tiged berTrindade/terraform-infrastructure-blueprints/aws/{blueprint-name} ./infra

# Deploy
cd infra/environments/dev
terraform init && terraform apply
\`\`\`

For full documentation, see the AGENTS.md file in the repository.
`;
}

// Create MCP server
const server = new McpServer({
  name: "ustwo-infra-blueprints",
  version: "1.0.0",
});

// Register resources
server.resource(
  "catalog",
  "blueprints://catalog",
  {
    description: "Full AI context for infrastructure blueprints including decision trees and workflows",
    mimeType: "text/markdown",
  },
  async () => {
    const content = await getAgentsMdContent();
    return {
      contents: [{ uri: "blueprints://catalog", mimeType: "text/markdown", text: content }],
    };
  }
);

server.resource(
  "list",
  "blueprints://list",
  {
    description: "JSON list of all available blueprints with metadata",
    mimeType: "application/json",
  },
  async () => {
    return {
      contents: [{ uri: "blueprints://list", mimeType: "application/json", text: JSON.stringify(BLUEPRINTS, null, 2) }],
    };
  }
);

// Register tools
server.tool(
  "recommend_blueprint",
  "Get a blueprint recommendation based on requirements",
  {
    database: z.string().optional().describe("Database type: dynamodb, postgresql, aurora, none"),
    pattern: z.string().optional().describe("API pattern: sync, async"),
    auth: z.boolean().optional().describe("Whether authentication is needed"),
    containers: z.boolean().optional().describe("Whether containers (ECS/EKS) are needed"),
    cloud: z.string().optional().describe("Cloud provider: aws, azure, gcp"),
  },
  async ({ database, pattern, auth, containers, cloud }) => {
    let recommendations: typeof BLUEPRINTS = [...BLUEPRINTS];

    // Filter by containers first
    if (containers) {
      recommendations = recommendations.filter(
        (b) => b.name.includes("ecs") || b.name.includes("eks")
      );
    } else if (containers === false) {
      recommendations = recommendations.filter(
        (b) => !b.name.includes("ecs") && !b.name.includes("eks")
      );
    }

    // Filter by database
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

    // Filter by pattern
    if (pattern) {
      recommendations = recommendations.filter((b) =>
        b.pattern.toLowerCase().includes(pattern.toLowerCase())
      );
    }

    // Filter by auth
    if (auth) {
      recommendations = recommendations.filter(
        (b) => b.name.includes("cognito") || b.name.includes("amplify")
      );
    }

    // Filter by cloud provider
    if (cloud) {
      const cloudLower = cloud.toLowerCase();
      recommendations = recommendations.filter((b) => {
        const provider = getCloudProvider(b.name);
        if (cloudLower === "aws") return provider === "aws";
        if (cloudLower === "azure") return provider === "azure";
        if (cloudLower === "gcp") return provider === "gcp";
        return true;
      });
    }

    if (recommendations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No exact match found. Here are some suggestions:\n\n" +
              "- For serverless APIs: apigw-lambda-dynamodb or apigw-lambda-rds\n" +
              "- For async processing: apigw-sqs-lambda-dynamodb\n" +
              "- For containers: alb-ecs-fargate or eks-cluster\n" +
              "- For auth: apigw-lambda-dynamodb-cognito",
          },
        ],
      };
    }

    const top = recommendations[0];
    const cloudProvider = getCloudProvider(top.name) || "aws";
    const cloudPath = cloudProvider === "aws" ? "aws" : cloudProvider;

    const details = `# ${top.name}

${top.description}

## Details
- **Database**: ${top.database}
- **Pattern**: ${top.pattern}
- **Use Case**: ${top.useCase}
- **Origin**: ${top.origin || "TBD"}
- **Cloud Provider**: ${cloudProvider.toUpperCase()}

## Quick Start

\`\`\`bash
# Download this blueprint
npx tiged berTrindade/terraform-infrastructure-blueprints/${cloudPath}/${top.name} ./infra

# Deploy
cd infra/environments/dev
terraform init
terraform plan
terraform apply
\`\`\`

## Structure

\`\`\`
${cloudPath}/${top.name}/
├── environments/
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── modules/
├── src/
├── tests/
└── README.md
\`\`\`
`;

    return {
      content: [
        {
          type: "text",
          text: details +
            (recommendations.length > 1
              ? `\n\n## Alternatives\n\n${recommendations
                .slice(1, 4)
                .map((b) => `- **${b.name}**: ${b.description} (Database: ${b.database}, Pattern: ${b.pattern})`)
                .join("\n")}`
              : ""),
        },
      ],
    };
  }
);

server.tool(
  "extract_pattern",
  "Get guidance on extracting a specific pattern/capability from blueprints to add to an existing project",
  {
    capability: z.string().describe("Capability to extract: database, queue, auth, events, ai, notifications"),
  },
  async ({ capability }) => {
    const capLower = (capability || "").toLowerCase();
    const pattern = EXTRACTION_PATTERNS[capLower];

    if (!pattern) {
      const available = Object.keys(EXTRACTION_PATTERNS).join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Unknown capability "${capability}". Available capabilities: ${available}`,
          },
        ],
      };
    }

    const output = `# Extract: ${capability}

**Source Blueprint:** \`${pattern.blueprint}\`

${pattern.description}

## Modules to Copy

${pattern.modules.map((m) => `- \`${m}\``).join("\n")}

## Integration Steps

${pattern.integrationSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

## Reference

View the full blueprint on GitHub for context:
https://github.com/berTrindade/terraform-infrastructure-blueprints/tree/main/aws/${pattern.blueprint}

Or clone the repo locally as a reference library:
\`\`\`bash
git clone git@github.com:berTrindade/terraform-infrastructure-blueprints.git ~/terraform-blueprints
\`\`\`

## Important

- Adapt module variables to match your existing naming conventions
- Update security groups to allow access from your existing resources
- Follow your project's existing patterns for outputs and state management
`;

    return {
      content: [{ type: "text", text: output }],
    };
  }
);

server.tool(
  "find_by_project",
  "Find blueprint used by a specific project and optionally get cross-cloud equivalents",
  {
    project_name: z.string().describe("Project name (e.g., 'Mavie', 'HM Impuls', 'SuprDOG')"),
    target_cloud: z.string().optional().describe("Target cloud provider for equivalent: aws, azure, gcp"),
  },
  async ({ project_name, target_cloud }) => {
    const projectLower = project_name.toLowerCase();
    const projectMatch = Object.entries(PROJECT_BLUEPRINTS).find(
      ([key]) => key.toLowerCase().includes(projectLower) || projectLower.includes(key.toLowerCase())
    );

    if (!projectMatch) {
      return {
        content: [{
          type: "text",
          text: `No blueprint found for project "${project_name}". Available projects: ${Object.keys(PROJECT_BLUEPRINTS).join(", ")}`
        }]
      };
    }

    const [, projectInfo] = projectMatch;
    const blueprint = BLUEPRINTS.find(b => b.name === projectInfo.blueprint);

    if (!blueprint) {
      return {
        content: [{
          type: "text",
          text: `Blueprint "${projectInfo.blueprint}" not found in catalog.`
        }]
      };
    }

    let response = `# Project: ${project_name}\n\n`;
    response += `**Current Blueprint**: \`${projectInfo.blueprint}\` (${projectInfo.cloud.toUpperCase()})\n`;
    response += `**Description**: ${projectInfo.description}\n\n`;
    response += `**Blueprint Details**:\n`;
    response += `- Database: ${blueprint.database}\n`;
    response += `- Pattern: ${blueprint.pattern}\n`;
    response += `- Use Case: ${blueprint.useCase}\n\n`;

    // If target cloud specified, find equivalent
    if (target_cloud) {
      const targetCloudLower = target_cloud.toLowerCase();

      // If already on target cloud, no need to find equivalent
      if (projectInfo.cloud === targetCloudLower) {
        response += `**Note**: This project already uses ${targetCloudLower.toUpperCase()}.\n\n`;
      } else {
        // Find equivalent based on pattern characteristics
        const equivalent = findCrossCloudEquivalent(projectInfo.blueprint, targetCloudLower);
        if (equivalent) {
          response += `**${targetCloudLower.toUpperCase()} Equivalent**: \`${equivalent.name}\`\n`;
          response += `- Description: ${equivalent.description}\n`;
          response += `- Database: ${equivalent.database}\n`;
          response += `- Pattern: ${equivalent.pattern}\n\n`;
          response += `## Quick Start\n\n`;
          response += `\`\`\`bash\n`;
          response += `# Download ${targetCloudLower.toUpperCase()} equivalent\n`;
          response += `npx tiged berTrindade/terraform-infrastructure-blueprints/${targetCloudLower}/${equivalent.name} ./infra\n\n`;
          response += `# Deploy\n`;
          response += `cd infra/environments/dev\n`;
          response += `terraform init\n`;
          response += `terraform plan\n`;
          response += `terraform apply\n`;
          response += `\`\`\`\n`;
        } else {
          response += `**Note**: No direct ${targetCloudLower.toUpperCase()} equivalent found. Consider using \`recommend_blueprint\` with similar requirements:\n`;
          response += `- Database: ${blueprint.database}\n`;
          response += `- Pattern: ${blueprint.pattern}\n`;
          response += `- Containers: ${blueprint.name.includes("ecs") || blueprint.name.includes("eks") || blueprint.name.includes("appengine") ? "Yes" : "No"}\n`;
        }
      }
    } else {
      response += `## Current Blueprint\n\n`;
      response += `\`\`\`bash\n`;
      response += `# Download current blueprint\n`;
      response += `npx tiged berTrindade/terraform-infrastructure-blueprints/${projectInfo.cloud}/${projectInfo.blueprint} ./infra\n`;
      response += `\`\`\`\n`;
    }

    return { content: [{ type: "text", text: response }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ustwo Infrastructure Blueprints MCP Server running");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
