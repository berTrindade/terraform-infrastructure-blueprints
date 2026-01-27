#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

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

// Blueprint comparison data for architectural decision-making
export const COMPARISONS: Record<string, {
  optionA: { name: string; blueprints: string[] };
  optionB: { name: string; blueprints: string[] };
  factors: Array<{ factor: string; optionA?: string; optionB?: string; description?: string }>;
}> = {
  "serverless-vs-containers": {
    optionA: {
      name: "Serverless (Lambda)",
      blueprints: [
        "apigw-lambda-dynamodb",
        "apigw-lambda-dynamodb-cognito",
        "apigw-lambda-rds",
        "apigw-lambda-rds-proxy",
        "apigw-lambda-aurora",
        "appsync-lambda-aurora-cognito",
        "apigw-sqs-lambda-dynamodb",
        "apigw-eventbridge-lambda",
        "apigw-sns-lambda",
        "apigw-lambda-bedrock-rag",
        "amplify-cognito-apigw-lambda",
      ],
    },
    optionB: {
      name: "Containers (ECS Fargate)",
      blueprints: [
        "alb-ecs-fargate",
        "alb-ecs-fargate-rds",
        "eks-cluster",
        "eks-argocd",
      ],
    },
    factors: [
      { factor: "Cold starts", optionA: "Yes (100ms-1s)", optionB: "No (always warm)", description: "Lambda has cold start latency; containers stay warm" },
      { factor: "Cost model", optionA: "Pay per request", optionB: "Pay for running time", description: "Lambda charges per invocation; containers charge per hour" },
      { factor: "Scaling", optionA: "Automatic, instant", optionB: "Automatic, gradual", description: "Lambda scales instantly; containers scale gradually" },
      { factor: "Custom runtime", optionA: "Limited", optionB: "Full control", description: "Lambda supports limited runtimes; containers support any runtime" },
      { factor: "State management", optionA: "Stateless only", optionB: "Can maintain state", description: "Lambda is stateless; containers can maintain state" },
      { factor: "Long-running tasks", optionA: "15 min max", optionB: "Unlimited", description: "Lambda has 15-minute timeout; containers can run indefinitely" },
    ],
  },
  "dynamodb-vs-rds": {
    optionA: {
      name: "DynamoDB",
      blueprints: [
        "apigw-lambda-dynamodb",
        "apigw-lambda-dynamodb-cognito",
        "apigw-sqs-lambda-dynamodb",
        "amplify-cognito-apigw-lambda",
      ],
    },
    optionB: {
      name: "RDS (PostgreSQL)",
      blueprints: [
        "apigw-lambda-rds",
        "apigw-lambda-rds-proxy",
        "apigw-lambda-aurora",
        "appsync-lambda-aurora-cognito",
        "alb-ecs-fargate-rds",
      ],
    },
    factors: [
      { factor: "Data model", optionA: "NoSQL (key-value)", optionB: "Relational (SQL)", description: "DynamoDB is NoSQL; RDS supports relational data" },
      { factor: "Query flexibility", optionA: "Limited (key-based)", optionB: "Full SQL", description: "DynamoDB queries by key; RDS supports complex SQL queries" },
      { factor: "Scaling", optionA: "Automatic, unlimited", optionB: "Manual, vertical/horizontal", description: "DynamoDB scales automatically; RDS requires manual scaling" },
      { factor: "Cost", optionA: "Pay per request", optionB: "Pay per instance", description: "DynamoDB charges per read/write; RDS charges per instance hour" },
      { factor: "ACID transactions", optionA: "Limited (single table)", optionB: "Full ACID", description: "DynamoDB has limited transactions; RDS has full ACID compliance" },
      { factor: "Complex joins", optionA: "Not supported", optionB: "Supported", description: "DynamoDB doesn't support joins; RDS supports complex joins" },
    ],
  },
  "sync-vs-async": {
    optionA: {
      name: "Synchronous (Request/Response)",
      blueprints: [
        "apigw-lambda-dynamodb",
        "apigw-lambda-dynamodb-cognito",
        "apigw-lambda-rds",
        "apigw-lambda-rds-proxy",
        "apigw-lambda-aurora",
        "appsync-lambda-aurora-cognito",
        "alb-ecs-fargate",
        "alb-ecs-fargate-rds",
        "apigw-lambda-bedrock-rag",
        "amplify-cognito-apigw-lambda",
      ],
    },
    optionB: {
      name: "Asynchronous (Event-driven)",
      blueprints: [
        "apigw-sqs-lambda-dynamodb",
        "apigw-eventbridge-lambda",
        "apigw-sns-lambda",
      ],
    },
    factors: [
      { factor: "Response time", optionA: "Immediate", optionB: "Delayed", description: "Sync returns immediately; async processes in background" },
      { factor: "Reliability", optionA: "Depends on downstream", optionB: "Decoupled, resilient", description: "Sync fails if downstream fails; async can retry/queue" },
      { factor: "User experience", optionA: "Wait for result", optionB: "Fire and forget", description: "Sync requires waiting; async provides immediate acknowledgment" },
      { factor: "Error handling", optionA: "Immediate feedback", optionB: "Retry/Dead-letter queue", description: "Sync errors return immediately; async can retry failed messages" },
      { factor: "Scalability", optionA: "Limited by slowest component", optionB: "Independent scaling", description: "Sync scales with slowest component; async scales independently" },
      { factor: "Complexity", optionA: "Simpler", optionB: "More complex", description: "Sync is simpler to reason about; async requires queue/event management" },
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

// Get the workspace root directory
function getWorkspaceRoot(): string {
  // Try multiple paths to find workspace root
  const possiblePaths = [
    path.join(__dirname, "../.."),
    path.join(__dirname, "../../.."),
    process.cwd(),
  ];

  for (const possiblePath of possiblePaths) {
    const awsPath = path.join(possiblePath, "aws");
    const azurePath = path.join(possiblePath, "azure");
    const gcpPath = path.join(possiblePath, "gcp");
    if (fs.existsSync(awsPath) && fs.existsSync(azurePath) && fs.existsSync(gcpPath)) {
      return possiblePath;
    }
  }

  // Fallback to __dirname/../..
  return path.join(__dirname, "../..");
}

// Discover all blueprint files and return resource URIs
async function discoverBlueprintResources(): Promise<Array<{ uri: string; name: string; description: string; mimeType: string }>> {
  const resources: Array<{ uri: string; name: string; description: string; mimeType: string }> = [];
  const workspaceRoot = getWorkspaceRoot();
  const clouds = ["aws", "azure", "gcp"];

  for (const cloud of clouds) {
    const cloudPath = path.join(workspaceRoot, cloud);
    if (!fs.existsSync(cloudPath)) continue;

    try {
      const blueprintDirs = await readdir(cloudPath);

      for (const blueprintName of blueprintDirs) {
        const blueprintPath = path.join(cloudPath, blueprintName);
        const blueprintStat = await stat(blueprintPath);

        if (!blueprintStat.isDirectory()) continue;

        // Add README.md resource
        const readmePath = path.join(blueprintPath, "README.md");
        if (fs.existsSync(readmePath)) {
          resources.push({
            uri: `blueprints://${cloud}/${blueprintName}/README.md`,
            name: `${blueprintName} - README`,
            description: `Documentation for ${blueprintName} blueprint`,
            mimeType: "text/markdown",
          });
        }

        // Recursively discover files in blueprint directory
        await discoverFilesInDirectory(
          blueprintPath,
          cloud,
          blueprintName,
          "",
          resources
        );
      }
    } catch (error) {
      console.error(`Error scanning ${cloud} directory:`, error);
    }
  }

  return resources;
}

// Recursively discover files in a directory
async function discoverFilesInDirectory(
  dirPath: string,
  cloud: string,
  blueprintName: string,
  relativePath: string,
  resources: Array<{ uri: string; name: string; description: string; mimeType: string }>
): Promise<void> {
  try {
    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const entryStat = await stat(fullPath);
      const entryRelativePath = relativePath ? `${relativePath}/${entry}` : entry;

      if (entryStat.isDirectory()) {
        // Skip node_modules, .git, and other hidden/system directories
        if (entry.startsWith(".") && entry !== "." && entry !== "..") {
          continue;
        }
        await discoverFilesInDirectory(fullPath, cloud, blueprintName, entryRelativePath, resources);
      } else if (entryStat.isFile()) {
        // Only include relevant file types
        const ext = path.extname(entry);
        const relevantExtensions = [".tf", ".md", ".json", ".sh", ".sql", ".yaml", ".yml", ".js", ".ts", ".graphql", ".hcl"];

        if (relevantExtensions.includes(ext) || entry === "Dockerfile" || entry.endsWith(".example")) {
          const mimeType = getMimeType(entry);
          resources.push({
            uri: `blueprints://${cloud}/${blueprintName}/${entryRelativePath}`,
            name: `${blueprintName} - ${entryRelativePath}`,
            description: `${entryRelativePath} from ${blueprintName} blueprint`,
            mimeType,
          });
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read (expected for some file system operations)
    if (error instanceof Error && !error.message.includes("ENOENT")) {
      console.error(`Error discovering files in directory:`, error);
    }
  }
}

// Get MIME type based on file extension
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".md": "text/markdown",
    ".tf": "text/x-hcl",
    ".hcl": "text/x-hcl",
    ".json": "application/json",
    ".sh": "text/x-shellscript",
    ".sql": "text/x-sql",
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    ".js": "text/javascript",
    ".ts": "text/typescript",
    ".graphql": "text/x-graphql",
  };
  return mimeTypes[ext] || "text/plain";
}

// Read a blueprint file from a resource URI
async function readBlueprintFile(uri: string): Promise<{ content: string; mimeType: string }> {
  // Parse URI: blueprints://aws/apigw-lambda-rds/README.md
  const match = uri.match(/^blueprints:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid blueprint URI: ${uri}`);
  }

  const [, cloud, blueprintName, filePath] = match;
  const workspaceRoot = getWorkspaceRoot();
  const fullPath = path.join(workspaceRoot, cloud, blueprintName, filePath);

  // Security: ensure path is within workspace
  const resolvedPath = path.resolve(fullPath);
  const resolvedWorkspace = path.resolve(workspaceRoot);
  if (!resolvedPath.startsWith(resolvedWorkspace)) {
    throw new Error(`Path outside workspace: ${filePath}`);
  }

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${uri}`);
  }

  const content = await readFile(resolvedPath, "utf-8");
  const mimeType = getMimeType(filePath);

  return { content, mimeType };
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
server.registerResource(
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

server.registerResource(
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

// Register module files for a blueprint
async function registerModuleFiles(
  blueprintPath: string,
  cloud: string,
  blueprintName: string,
  moduleDir: string = "modules"
): Promise<void> {
  const modulesPath = path.join(blueprintPath, moduleDir);
  if (!fs.existsSync(modulesPath)) return;

  try {
    const moduleEntries = await readdir(modulesPath);

    for (const moduleEntry of moduleEntries) {
      const modulePath = path.join(modulesPath, moduleEntry);
      const moduleStat = await stat(modulePath);

      if (!moduleStat.isDirectory()) continue;

      // Recursively register all relevant files in the module directory
      await registerModuleDirectoryFiles(
        modulePath,
        cloud,
        blueprintName,
        `${moduleDir}/${moduleEntry}`
      );
    }
  } catch (error) {
    // Skip if modules directory doesn't exist or can't be read
    // This is expected for blueprints without modules
    if (error instanceof Error && !error.message.includes("ENOENT")) {
      console.error(`Error reading modules directory for ${blueprintName}:`, error);
    }
  }
}

// Recursively register files in a module directory
async function registerModuleDirectoryFiles(
  dirPath: string,
  cloud: string,
  blueprintName: string,
  relativePath: string
): Promise<void> {
  try {
    const entries = await readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const entryStat = await stat(fullPath);
      const entryRelativePath = `${relativePath}/${entry}`;

      if (entryStat.isDirectory()) {
        // Skip hidden/system directories
        if (entry.startsWith(".") && entry !== "." && entry !== "..") {
          continue;
        }
        await registerModuleDirectoryFiles(fullPath, cloud, blueprintName, entryRelativePath);
      } else if (entryStat.isFile()) {
        // Only register relevant file types
        const ext = path.extname(entry);
        const relevantExtensions = [".tf", ".md", ".json", ".hcl"];

        if (relevantExtensions.includes(ext)) {
          const fileUri = `blueprints://${cloud}/${blueprintName}/${entryRelativePath}`;
          const resourceName = `blueprint-${cloud}-${blueprintName}-${entryRelativePath.replace(/[^a-zA-Z0-9-]/g, "-")}`;

          server.registerResource(
            resourceName,
            fileUri,
            {
              description: `${entryRelativePath} from ${blueprintName} blueprint`,
              mimeType: getMimeType(entry),
            },
            async () => {
              try {
                const { content, mimeType } = await readBlueprintFile(fileUri);
                return {
                  contents: [{ uri: fileUri, mimeType, text: content }],
                };
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                  contents: [{
                    uri: fileUri,
                    mimeType: "text/plain",
                    text: `Error reading file: ${errorMessage}`,
                  }],
                };
              }
            }
          );
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read (expected for some file system operations)
    if (error instanceof Error && !error.message.includes("ENOENT")) {
      console.error(`Error registering module directory files:`, error);
    }
  }
}

// Register important blueprint file resources dynamically
// We'll register READMEs, main environment files, and module files for each blueprint
async function registerImportantBlueprintResources() {
  const workspaceRoot = getWorkspaceRoot();
  const clouds = ["aws", "azure", "gcp"];

  for (const cloud of clouds) {
    const cloudPath = path.join(workspaceRoot, cloud);
    if (!fs.existsSync(cloudPath)) continue;

    try {
      const blueprintDirs = await readdir(cloudPath);

      for (const blueprintName of blueprintDirs) {
        const blueprintPath = path.join(cloudPath, blueprintName);
        try {
          const blueprintStat = await stat(blueprintPath);
          if (!blueprintStat.isDirectory()) continue;

          // Register README.md
          const readmePath = path.join(blueprintPath, "README.md");
          if (fs.existsSync(readmePath)) {
            const readmeUri = `blueprints://${cloud}/${blueprintName}/README.md`;
            server.registerResource(
              `blueprint-${cloud}-${blueprintName}-readme`.replace(/[^a-zA-Z0-9-]/g, "-"),
              readmeUri,
              {
                description: `README documentation for ${blueprintName} blueprint`,
                mimeType: "text/markdown",
              },
              async () => {
                try {
                  const { content, mimeType } = await readBlueprintFile(readmeUri);
                  return {
                    contents: [{ uri: readmeUri, mimeType, text: content }],
                  };
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  return {
                    contents: [{
                      uri: readmeUri,
                      mimeType: "text/plain",
                      text: `Error reading file: ${errorMessage}`,
                    }],
                  };
                }
              }
            );
          }

          // Register main environment file
          const mainTfPath = path.join(blueprintPath, "environments", "dev", "main.tf");
          if (fs.existsSync(mainTfPath)) {
            const mainTfUri = `blueprints://${cloud}/${blueprintName}/environments/dev/main.tf`;
            server.registerResource(
              `blueprint-${cloud}-${blueprintName}-main-tf`.replace(/[^a-zA-Z0-9-]/g, "-"),
              mainTfUri,
              {
                description: `Main Terraform configuration for ${blueprintName} blueprint`,
                mimeType: "text/x-hcl",
              },
              async () => {
                try {
                  const { content, mimeType } = await readBlueprintFile(mainTfUri);
                  return {
                    contents: [{ uri: mainTfUri, mimeType, text: content }],
                  };
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : String(error);
                  return {
                    contents: [{
                      uri: mainTfUri,
                      mimeType: "text/plain",
                      text: `Error reading file: ${errorMessage}`,
                    }],
                  };
                }
              }
            );
          }

          // Register module files
          await registerModuleFiles(blueprintPath, cloud, blueprintName);

        } catch (error) {
          // Skip blueprints we can't access
          if (error instanceof Error) {
            console.error(`Error registering blueprint ${blueprintName}:`, error.message);
          }
          continue;
        }
      }
    } catch (error) {
      console.error(`Error registering ${cloud} blueprint resources:`, error);
    }
  }
}

// Resources will be registered in main() before server starts

// Register tools
server.registerTool(
  "search_blueprints",
  {
    description: "Search for blueprints matching a use case or requirement. Supports keyword matching with synonyms (e.g., 'database' matches 'postgresql', 'rds', 'dynamodb').",
    inputSchema: {
      query: z.string().describe("Search query (e.g., 'serverless api postgres', 'async queue', 'kubernetes')"),
    },
  },
  async ({ query }) => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Keyword synonyms mapping
    const synonyms: Record<string, string[]> = {
      "database": ["postgresql", "postgres", "rds", "dynamodb", "aurora", "mysql", "sql"],
      "postgresql": ["postgres", "rds", "database", "sql"],
      "postgres": ["postgresql", "rds", "database", "sql"],
      "rds": ["postgresql", "postgres", "database", "sql"],
      "dynamodb": ["dynamo", "database", "nosql"],
      "queue": ["sqs", "async", "message"],
      "async": ["queue", "sqs", "event", "background"],
      "serverless": ["lambda", "function"],
      "lambda": ["serverless", "function"],
      "container": ["docker", "ecs", "fargate", "eks", "kubernetes"],
      "kubernetes": ["k8s", "eks", "container"],
      "auth": ["authentication", "cognito", "user"],
      "api": ["rest", "graphql", "endpoint"],
    };

    // Expand query with synonyms
    const expandedTerms = new Set<string>();
    queryWords.forEach(word => {
      expandedTerms.add(word);
      if (synonyms[word]) {
        synonyms[word].forEach(syn => expandedTerms.add(syn));
      }
    });

    // Score blueprints based on matches
    const scored = BLUEPRINTS.map(blueprint => {
      const searchableText = `${blueprint.name} ${blueprint.description} ${blueprint.database} ${blueprint.pattern} ${blueprint.useCase}`.toLowerCase();
      let score = 0;

      // Exact phrase match
      if (searchableText.includes(queryLower)) {
        score += 10;
      }

      // Individual word matches
      queryWords.forEach(word => {
        if (searchableText.includes(word)) {
          score += 3;
        }
        // Synonym matches
        if (synonyms[word]) {
          synonyms[word].forEach(syn => {
            if (searchableText.includes(syn)) {
              score += 2;
            }
          });
        }
      });

      return { blueprint, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (scored.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No blueprints found matching "${query}".\n\nTry searching for:\n- 'serverless postgresql' or 'lambda rds'\n- 'async queue' or 'sqs'\n- 'containers' or 'ecs'\n- 'auth' or 'cognito'\n\nOr use \`recommend_blueprint\` with specific requirements.`
        }]
      };
    }

    const results = scored.map(({ blueprint, score }) => {
      const cloudProvider = getCloudProvider(blueprint.name) || "aws";
      return `- **${blueprint.name}** (${cloudProvider.toUpperCase()}) - ${blueprint.description}\n  - Database: ${blueprint.database} | Pattern: ${blueprint.pattern} | Use Case: ${blueprint.useCase}`;
    }).join("\n\n");

    return {
      content: [{
        type: "text",
        text: `# Search Results for "${query}"\n\nFound ${scored.length} matching blueprint(s):\n\n${results}\n\n## Next Steps\n\nUse \`get_blueprint_details(name: "${scored[0].blueprint.name}")\` to get detailed information about a specific blueprint.\n\nOr use \`fetch_blueprint_file(blueprint: "${scored[0].blueprint.name}", path: "README.md")\` to fetch specific blueprint files.`
      }]
    };
  }
);

server.registerTool(
  "get_blueprint_details",
  {
    description: "Get detailed information about a specific blueprint including structure, modules, and quick start instructions.",
    inputSchema: {
      name: z.string().describe("Blueprint name (e.g., 'apigw-lambda-rds')"),
    },
  },
  async ({ name }) => {
    const blueprint = BLUEPRINTS.find(b => b.name === name);

    if (!blueprint) {
      const available = BLUEPRINTS.map(b => b.name).join(", ");
      return {
        content: [{
          type: "text",
          text: `Blueprint "${name}" not found.\n\nAvailable blueprints:\n${available.split(", ").map(b => `- ${b}`).join("\n")}\n\nUse \`search_blueprints\` to find blueprints by use case.`
        }]
      };
    }

    const cloudProvider = getCloudProvider(blueprint.name) || "aws";
    const cloudPath = cloudProvider === "aws" ? "aws" : cloudProvider;

    const details = `# ${blueprint.name}

${blueprint.description}

## Details
- **Database**: ${blueprint.database}
- **Pattern**: ${blueprint.pattern}
- **Use Case**: ${blueprint.useCase}
- **Origin**: ${blueprint.origin || "TBD"}
- **Cloud Provider**: ${cloudProvider.toUpperCase()}

## Quick Start

\`\`\`bash
# Download this blueprint
npx tiged berTrindade/terraform-infrastructure-blueprints/${cloudPath}/${blueprint.name} ./infra

# Deploy
cd infra/environments/dev
terraform init
terraform plan
terraform apply
\`\`\`

## Structure

\`\`\`
${cloudPath}/${blueprint.name}/
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

## Access Blueprint Files

Use MCP resources to access blueprint files:

- **README**: \`blueprints://${cloudProvider}/${blueprint.name}/README.md\`
- **Main Config**: \`blueprints://${cloudProvider}/${blueprint.name}/environments/dev/main.tf\`

Or use \`fetch_blueprint_file(blueprint: "${blueprint.name}", path: "README.md")\` to fetch files directly.
`;

    return {
      content: [{ type: "text", text: details }],
    };
  }
);

server.registerTool(
  "fetch_blueprint_file",
  {
    description: "Fetch a specific file from a blueprint. Returns the file content directly. Example: fetch_blueprint_file(blueprint: 'apigw-lambda-rds', path: 'modules/data/main.tf')",
    inputSchema: {
      blueprint: z.string().describe("Blueprint name (e.g., 'apigw-lambda-rds')"),
      path: z.string().describe("File path relative to blueprint root (e.g., 'README.md', 'modules/data/main.tf', 'environments/dev/main.tf')"),
    },
  },
  async ({ blueprint, path }) => {
    const blueprintData = BLUEPRINTS.find(b => b.name === blueprint);

    if (!blueprintData) {
      const available = BLUEPRINTS.map(b => b.name).join(", ");
      return {
        content: [{
          type: "text",
          text: `Blueprint "${blueprint}" not found.\n\nAvailable blueprints: ${available}`
        }]
      };
    }

    const cloudProvider = getCloudProvider(blueprint) || "aws";
    const uri = `blueprints://${cloudProvider}/${blueprint}/${path}`;

    try {
      const { content, mimeType } = await readBlueprintFile(uri);
      return {
        content: [{
          type: "text",
          text: `# ${blueprint}/${path}\n\n\`\`\`${mimeType.includes("hcl") ? "hcl" : mimeType.includes("markdown") ? "markdown" : "text"}\n${content}\n\`\`\``
        }]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error fetching file: ${errorMessage}\n\nMake sure the path is correct. Common paths:\n- README.md\n- environments/dev/main.tf\n- modules/data/main.tf\n- modules/vpc/main.tf`
        }]
      };
    }
  }
);

server.registerTool(
  "recommend_blueprint",
  {
    description: "Get a blueprint recommendation based on requirements. Example: recommend_blueprint(database: 'postgresql', pattern: 'sync', auth: false)",
    inputSchema: {
      database: z.string().optional().describe("Database type: dynamodb, postgresql, aurora, none"),
      pattern: z.string().optional().describe("API pattern: sync, async"),
      auth: z.boolean().optional().describe("Whether authentication is needed"),
      containers: z.boolean().optional().describe("Whether containers (ECS/EKS) are needed"),
      cloud: z.string().optional().describe("Cloud provider: aws, azure, gcp"),
    },
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

server.registerTool(
  "extract_pattern",
  {
    description: "Get guidance on extracting a specific pattern/capability from blueprints to add to an existing project. Optionally include file contents. Example: extract_pattern(capability: 'database', include_files: true)",
    inputSchema: {
      capability: z.string().describe("Capability to extract: database, queue, auth, events, ai, notifications"),
      include_files: z.boolean().optional().describe("If true, includes actual file contents from key modules (default: false)"),
    },
  },
  async ({ capability, include_files = false }) => {
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

    const cloudProvider = getCloudProvider(pattern.blueprint) || "aws";
    const moduleResourceUris = pattern.modules.map((m) => {
      // Convert module path to resource URI
      // e.g., "modules/data/" -> "blueprints://aws/apigw-lambda-rds/modules/data/main.tf"
      // Ensure the path ends with / before appending main.tf
      const modulePath = m.endsWith("/") ? m : `${m}/`;
      return `blueprints://${cloudProvider}/${pattern.blueprint}/${modulePath}main.tf`;
    });

    let fileContents = "";
    if (include_files) {
      try {
        // Fetch key files
        const filesToFetch = [
          `blueprints://${cloudProvider}/${pattern.blueprint}/README.md`,
          `blueprints://${cloudProvider}/${pattern.blueprint}/environments/dev/main.tf`,
          ...moduleResourceUris,
        ];

        const contents = await Promise.all(
          filesToFetch.map(async (uri) => {
            try {
              const { content } = await readBlueprintFile(uri);
              const fileName = uri.split("/").pop() || uri;
              return `### ${fileName}\n\n\`\`\`${fileName.endsWith(".tf") ? "hcl" : fileName.endsWith(".md") ? "markdown" : "text"}\n${content}\n\`\`\`\n`;
            } catch (error) {
              const fileName = uri.split("/").pop() || uri;
              if (error instanceof Error) {
                console.error(`Error fetching file ${fileName}:`, error.message);
              }
              return `### ${fileName}\n\n*File not found or could not be read*\n`;
            }
          })
        );

        fileContents = `\n## File Contents\n\n${contents.join("\n")}`;
      } catch (error) {
        fileContents = `\n## File Contents\n\n*Error fetching files: ${error instanceof Error ? error.message : String(error)}*\n`;
      }
    }

    const output = `# Extract: ${capability}

**Source Blueprint:** \`${pattern.blueprint}\`

${pattern.description}

## Modules to Copy

${pattern.modules.map((m) => `- \`${m}\``).join("\n")}

## Reference Files (MCP Resources)

Access these blueprint files as MCP resources for battle-tested examples:

- **Blueprint README**: \`blueprints://${cloudProvider}/${pattern.blueprint}/README.md\`
- **Main Environment Config**: \`blueprints://${cloudProvider}/${pattern.blueprint}/environments/dev/main.tf\`
${moduleResourceUris.map((uri) => `- **Module File**: \`${uri}\``).join("\n")}

## Integration Steps

${pattern.integrationSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

## How to Use

1. **Fetch the blueprint files** using the MCP resource URIs above or use \`fetch_blueprint_file(blueprint: "${pattern.blueprint}", path: "...")\`
2. **Review the examples** - these are battle-tested patterns from real projects
3. **Copy and adapt** the modules to your existing Terraform project
4. **Manual integration** - you'll integrate the code manually based on the examples
${include_files ? "\n**Note**: File contents are included below. If you need more files, use `fetch_blueprint_file`." : "\n**Tip**: Set `include_files: true` to get file contents directly, or use `fetch_blueprint_file` for specific files."}

## Additional Reference

View the full blueprint on GitHub for context:
https://github.com/berTrindade/terraform-infrastructure-blueprints/tree/main/${cloudProvider}/${pattern.blueprint}

## Important

- Adapt module variables to match your existing naming conventions
- Update security groups to allow access from your existing resources
- Follow your project's existing patterns for outputs and state management
- These are **reference examples** - you'll integrate them manually into your project
${fileContents}`;

    return {
      content: [{ type: "text", text: output }],
    };
  }
);

server.registerTool(
  "compare_blueprints",
  {
    description: "Compare two architectural approaches to help make a decision. Example: compare_blueprints(comparison: 'serverless-vs-containers')",
    inputSchema: {
      comparison: z.string().describe("Comparison type: serverless-vs-containers, dynamodb-vs-rds, sync-vs-async"),
    },
  },
  async ({ comparison }) => {
    const compLower = comparison.toLowerCase();
    const comp = COMPARISONS[compLower];

    if (!comp) {
      const available = Object.keys(COMPARISONS).join(", ");
      return {
        content: [{
          type: "text",
          text: `Unknown comparison "${comparison}". Available comparisons: ${available}`
        }]
      };
    }

    const optionABlueprints = comp.optionA.blueprints.map(name => {
      const bp = BLUEPRINTS.find(b => b.name === name);
      return bp ? `- **${name}**: ${bp.description}` : `- ${name}`;
    }).join("\n");

    const optionBBlueprints = comp.optionB.blueprints.map(name => {
      const bp = BLUEPRINTS.find(b => b.name === name);
      return bp ? `- **${name}**: ${bp.description}` : `- ${name}`;
    }).join("\n");

    const factorsTable = comp.factors.map(f => {
      const optionAVal = f.optionA || "N/A";
      const optionBVal = f.optionB || "N/A";
      const desc = f.description ? ` - ${f.description}` : "";
      return `| ${f.factor} | ${optionAVal} | ${optionBVal} |${desc}|`;
    }).join("\n");

    const output = `# ${comp.optionA.name} vs ${comp.optionB.name}

## ${comp.optionA.name}

**Blueprints:**
${optionABlueprints}

## ${comp.optionB.name}

**Blueprints:**
${optionBBlueprints}

## Comparison Factors

| Factor | ${comp.optionA.name} | ${comp.optionB.name} | Notes |
|--------|---------------------|---------------------|-------|
${factorsTable}

## Recommendation

Use \`recommend_blueprint\` with your specific requirements to get a tailored recommendation, or use \`search_blueprints\` to find blueprints matching your use case.
`;

    return {
      content: [{ type: "text", text: output }],
    };
  }
);

server.registerTool(
  "find_by_project",
  {
    description: "Find blueprint used by a specific project and optionally get cross-cloud equivalents. Example: find_by_project(project_name: 'Mavie', target_cloud: 'aws')",
    inputSchema: {
      project_name: z.string().describe("Project name (e.g., 'Mavie', 'HM Impuls', 'SuprDOG')"),
      target_cloud: z.string().optional().describe("Target cloud provider for equivalent: aws, azure, gcp"),
    },
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
  // Register important blueprint resources before connecting
  await registerImportantBlueprintResources();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ustwo Infrastructure Blueprints MCP Server running");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
