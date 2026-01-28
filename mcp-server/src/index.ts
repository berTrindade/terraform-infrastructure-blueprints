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
  { name: "functions-postgresql", description: "Serverless API with PostgreSQL", database: "PostgreSQL Flexible Server", pattern: "Sync", useCase: "Azure serverless, relational data", origin: "HM Impuls - WhatsApp-based pitch submission platform (ustwo, 2025)" },
  { name: "appengine-cloudsql-strapi", description: "Containerized app with Cloud SQL", database: "Cloud SQL PostgreSQL", pattern: "Sync", useCase: "GCP serverless, CMS/Strapi", origin: "Mavie iOS - Mobile app backend with Strapi CMS (ustwo, 2025)" },
];

// Project to blueprint mapping (for project-based queries)
export const PROJECT_BLUEPRINTS: Record<string, {
  blueprint: string;
  cloud: "aws" | "azure" | "gcp";
  description: string;
}> = {
  "mavie": {
    blueprint: "appengine-cloudsql-strapi",
    cloud: "gcp",
    description: "Mavie iOS - Mobile app backend with Strapi CMS"
  },
  "hm impuls": {
    blueprint: "functions-postgresql",
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
    modules: ["modules/data/", "modules/vpc/"],
    description: "RDS PostgreSQL database with VPC integration",
    integrationSteps: [
      "Copy modules/data/ to your project's modules directory",
      "Copy relevant security group rules from modules/vpc/",
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
  if (sourceBlueprint === "appengine-cloudsql-strapi" && targetCloudLower === "aws") {
    return BLUEPRINTS.find(b => b.name === "alb-ecs-fargate-rds") || null;
  }

  if (sourceBlueprint === "functions-postgresql" && targetCloudLower === "aws") {
    return BLUEPRINTS.find(b => b.name === "apigw-lambda-rds") || null;
  }

  if (sourceBlueprint === "functions-postgresql" && targetCloudLower === "gcp") {
    return BLUEPRINTS.find(b => b.name === "appengine-cloudsql-strapi") || null;
  }

  if (sourceBlueprint === "apigw-lambda-rds" && targetCloudLower === "azure") {
    return BLUEPRINTS.find(b => b.name === "functions-postgresql") || null;
  }

  if (sourceBlueprint === "apigw-lambda-rds" && targetCloudLower === "gcp") {
    return BLUEPRINTS.find(b => b.name === "appengine-cloudsql-strapi") || null;
  }

  if (sourceBlueprint === "alb-ecs-fargate-rds" && targetCloudLower === "gcp") {
    return BLUEPRINTS.find(b => b.name === "appengine-cloudsql-strapi") || null;
  }

  if (sourceBlueprint === "alb-ecs-fargate-rds" && targetCloudLower === "azure") {
    return BLUEPRINTS.find(b => b.name === "functions-postgresql") || null;
  }

  return null;
}

// Helper function to get cloud provider from blueprint name
function getCloudProvider(blueprintName: string): "aws" | "azure" | "gcp" | null {
  // Azure blueprints: functions-*
  if (blueprintName.startsWith("functions-")) return "azure";
  // GCP blueprints: appengine-*
  if (blueprintName.startsWith("appengine-")) return "gcp";
  // AWS blueprints: apigw-*, alb-*, eks-*, amplify-*, appsync-*
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
# Download a blueprint (use your preferred method - git clone, GitHub CLI, etc.)
git clone https://github.com/berTrindade/terraform-infrastructure-blueprints.git
cd terraform-infrastructure-blueprints/aws/{blueprint-name}

# Deploy
cd environments/dev
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
    description: "Search for blueprints by keywords. Example: search_blueprints(query: 'serverless postgresql')",
    inputSchema: {
      query: z.string().describe("Search keywords"),
    },
  },
  async ({ query }) => {
    const queryLower = query.toLowerCase();
    const matches = BLUEPRINTS.filter(b => {
      const text = `${b.name} ${b.description} ${b.database} ${b.pattern}`.toLowerCase();
      return text.includes(queryLower);
    }).slice(0, 10);

    if (matches.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No blueprints found for "${query}". Try: 'serverless', 'postgresql', 'queue', 'containers', or use recommend_blueprint().`
        }]
      };
    }

    const results = matches.map(b => {
      const cloud = getCloudProvider(b.name) || "aws";
      return `- **${b.name}** (${cloud.toUpperCase()}) - ${b.description}`;
    }).join("\n");

    return {
      content: [{
        type: "text",
        text: `Found ${matches.length} blueprint(s):\n\n${results}\n\nUse recommend_blueprint() for detailed recommendations.`
      }]
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
    description: "Get blueprint recommendation based on requirements. Example: recommend_blueprint(database: 'postgresql', pattern: 'sync')",
    inputSchema: {
      database: z.string().optional().describe("Database: dynamodb, postgresql, aurora, none"),
      pattern: z.string().optional().describe("Pattern: sync, async"),
      auth: z.boolean().optional().describe("Need authentication?"),
      containers: z.boolean().optional().describe("Need containers (ECS/EKS)?"),
      cloud: z.string().optional().describe("Cloud: aws, azure, gcp"),
    },
  },
  async ({ database, pattern, auth, containers, cloud }) => {
    let matches = BLUEPRINTS;

    // Simple filtering
    if (containers === true) matches = matches.filter(b => b.name.includes("ecs") || b.name.includes("eks"));
    if (containers === false) matches = matches.filter(b => !b.name.includes("ecs") && !b.name.includes("eks"));
    if (database) matches = matches.filter(b => b.database.toLowerCase().includes(database.toLowerCase()));
    if (pattern) matches = matches.filter(b => b.pattern.toLowerCase().includes(pattern.toLowerCase()));
    if (auth === true) matches = matches.filter(b => b.name.includes("cognito") || b.name.includes("amplify"));
    if (cloud) {
      const provider = cloud.toLowerCase();
      matches = matches.filter(b => getCloudProvider(b.name) === provider);
    }

    if (matches.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No blueprint matches your requirements. Try recommend_blueprint() with fewer filters, or use search_blueprints() to browse.`
        }]
      };
    }

    const blueprint = matches[0];
    const cloudProvider = getCloudProvider(blueprint.name) || "aws";
    const cloudPath = cloudProvider === "aws" ? "aws" : cloudProvider;

    return {
      content: [{
        type: "text",
        text: `# Recommended: ${blueprint.name}

${blueprint.description}

**Database**: ${blueprint.database} | **Pattern**: ${blueprint.pattern} | **Cloud**: ${cloudProvider.toUpperCase()}

## Quick Start

\`\`\`bash
git clone https://github.com/berTrindade/terraform-infrastructure-blueprints.git
cd terraform-infrastructure-blueprints/${cloudPath}/${blueprint.name}/environments/dev
terraform init && terraform apply
\`\`\`

## Files

- README: \`blueprints://${cloudProvider}/${blueprint.name}/README.md\`
- Main: \`blueprints://${cloudProvider}/${blueprint.name}/environments/dev/main.tf\`

Use fetch_blueprint_file() to get file contents, or extract_pattern() to add capabilities.`
      }]
    };
  }
);

server.registerTool(
  "extract_pattern",
  {
    description: "Get guidance on extracting a capability from blueprints. Example: extract_pattern(capability: 'database', include_code_examples: true)",
    inputSchema: {
      capability: z.string().describe("Capability: database, queue, auth, events, ai, notifications"),
      include_files: z.boolean().optional().describe("Include file contents?"),
      include_code_examples: z.boolean().optional().describe("Include code examples?"),
    },
  },
  async ({ capability, include_files = false, include_code_examples = false }) => {
    const capLower = capability.toLowerCase();
    const pattern = EXTRACTION_PATTERNS[capLower];

    if (!pattern) {
      return {
        content: [{
          type: "text",
          text: `Unknown capability "${capability}". Available: ${Object.keys(EXTRACTION_PATTERNS).join(", ")}`
        }]
      };
    }

    const cloud = getCloudProvider(pattern.blueprint) || "aws";
    const moduleFiles = pattern.modules.map(m => `blueprints://${cloud}/${pattern.blueprint}/${m}main.tf`);

    // Get file contents if requested
    let fileContents = "";
    if (include_files) {
      try {
        const files = [
          `blueprints://${cloud}/${pattern.blueprint}/README.md`,
          `blueprints://${cloud}/${pattern.blueprint}/environments/dev/main.tf`,
          ...moduleFiles
        ];
        const contents = await Promise.all(files.map(async uri => {
          try {
            const { content } = await readBlueprintFile(uri);
            const name = uri.split("/").pop() || "";
            return `### ${name}\n\n\`\`\`${name.endsWith(".tf") ? "hcl" : "markdown"}\n${content}\n\`\`\``;
          } catch {
            return "";
          }
        }));
        fileContents = `\n## Files\n\n${contents.filter(c => c).join("\n\n")}`;
      } catch {
        fileContents = "\n## Files\n\n*Error loading files*";
      }
    }

    // Get code examples if requested
    let codeExamples = "";
    if (include_code_examples && capLower === "database") {
      codeExamples = `\n## Code Example\n\n\`\`\`hcl\n# Add RDS to Lambda\nresource "aws_db_instance" "main" {\n  identifier = "\${var.project_name}-db"\n  engine = "postgres"\n  engine_version = "15.4"\n  # ... VPC config, security groups\n}\n\n# Update Lambda\nresource "aws_lambda_function" "api" {\n  vpc_config {\n    subnet_ids = aws_subnet.private[*].id\n    security_group_ids = [aws_security_group.lambda.id]\n  }\n}\n\`\`\``;
    }

    // Simple validation checklist
    const checks: Record<string, string[]> = {
      database: ["✅ VPC in private subnets", "✅ Security groups configured", "✅ IAM permissions", "✅ Encryption enabled"],
      queue: ["✅ Dead-letter queue", "✅ Visibility timeout set", "✅ IAM permissions"],
      auth: ["✅ User pool configured", "✅ API Gateway authorizer", "✅ Callback URLs"],
    };
    const checklist = checks[capLower] ? `\n## Checklist\n\n${checks[capLower].join("\n")}` : "";

    return {
      content: [{
        type: "text",
        text: `# Extract: ${capability}

**Blueprint**: \`${pattern.blueprint}\`

${pattern.description}

## Modules
${pattern.modules.map(m => `- ${m}`).join("\n")}

## Steps
${pattern.integrationSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${checklist}
${codeExamples}
## Files
- README: \`blueprints://${cloud}/${pattern.blueprint}/README.md\`
- Main: \`blueprints://${cloud}/${pattern.blueprint}/environments/dev/main.tf\`
${moduleFiles.map(f => `- Module: \`${f}\``).join("\n")}
${fileContents}

Use fetch_blueprint_file() to get specific files.`
      }]
    };
  }
);


server.registerTool(
  "find_by_project",
  {
    description: "Find blueprint used by a project. Example: find_by_project(project_name: 'Mavie', target_cloud: 'aws')",
    inputSchema: {
      project_name: z.string().describe("Project name: Mavie, HM Impuls, SuprDOG, etc."),
      target_cloud: z.string().optional().describe("Get cross-cloud equivalent: aws, azure, gcp"),
    },
  },
  async ({ project_name, target_cloud }) => {
    const projectLower = project_name.toLowerCase();
    const match = Object.entries(PROJECT_BLUEPRINTS).find(
      ([key]) => key.toLowerCase().includes(projectLower)
    );

    if (!match) {
      return {
        content: [{
          type: "text",
          text: `Project "${project_name}" not found. Available: ${Object.keys(PROJECT_BLUEPRINTS).join(", ")}`
        }]
      };
    }

    const [, info] = match;
    const blueprint = BLUEPRINTS.find(b => b.name === info.blueprint);

    if (!blueprint) {
      return {
        content: [{
          type: "text",
          text: `Blueprint "${info.blueprint}" not found.`
        }]
      };
    }

    let text = `# ${project_name}\n\n**Blueprint**: \`${info.blueprint}\` (${info.cloud.toUpperCase()})\n**Description**: ${info.description}\n\n**Details**: Database: ${blueprint.database} | Pattern: ${blueprint.pattern}\n`;

    if (target_cloud && info.cloud !== target_cloud.toLowerCase()) {
      const equivalent = findCrossCloudEquivalent(info.blueprint, target_cloud.toLowerCase());
      if (equivalent) {
        text += `\n**${target_cloud.toUpperCase()} Equivalent**: \`${equivalent.name}\`\n`;
        text += `\`\`\`bash\ncd terraform-infrastructure-blueprints/${target_cloud}/${equivalent.name}/environments/dev\nterraform init && terraform apply\n\`\`\``;
      }
    }

    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "get_workflow_guidance",
  {
    description: "Get workflow guidance. Example: get_workflow_guidance(task: 'new_project')",
    inputSchema: {
      task: z.enum(["new_project", "add_capability", "migrate_cloud", "general"]).describe("Task: new_project, add_capability, migrate_cloud, general"),
    },
  },
  async ({ task }) => {
    const workflows: Record<string, string> = {
      new_project: `# New Project

1. recommend_blueprint(database: "postgresql", pattern: "sync")
2. Review blueprint
3. fetch_blueprint_file() to get files
4. Follow patterns`,

      add_capability: `# Add Capability

1. extract_pattern(capability: "database")
2. Review steps
3. fetch_blueprint_file() to get modules
4. Copy and adapt`,

      migrate_cloud: `# Cross-Cloud Migration

1. find_by_project(project_name: "Mavie")
2. find_by_project(project_name: "Mavie", target_cloud: "aws")
3. recommend_blueprint() for target cloud
4. extract_pattern() from target`,

      general: `# Available Tools

1. recommend_blueprint() - Get recommendations
2. extract_pattern() - Extract patterns
3. find_by_project() - Find by project
4. fetch_blueprint_file() - Get files
5. search_blueprints() - Search keywords
6. get_workflow_guidance() - This tool

**Quick Start**: recommend_blueprint(database: "postgresql")`,
    };

    return {
      content: [{
        type: "text",
        text: workflows[task] || workflows.general
      }]
    };
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
