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
// Pattern extraction mapping - which blueprint to use for each capability
export const EXTRACTION_PATTERNS = {
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
// Comparison data for architectural decisions
export const COMPARISONS = {
    "serverless-vs-containers": {
        optionA: { name: "Serverless (Lambda)", blueprints: ["apigw-lambda-dynamodb", "apigw-lambda-rds"] },
        optionB: { name: "Containers (ECS Fargate)", blueprints: ["alb-ecs-fargate", "alb-ecs-fargate-rds"] },
        factors: [
            { factor: "Cold starts", optionA: "Yes, can add 100ms-few seconds latency", optionB: "No, containers always warm" },
            { factor: "Cost model", optionA: "Pay per invocation (great for spiky traffic)", optionB: "Pay for running tasks (better for steady traffic)" },
            { factor: "Scaling speed", optionA: "Instant, automatic", optionB: "Automatic but slower (minutes)" },
            { factor: "Max duration", optionA: "15 minutes per invocation", optionB: "Unlimited" },
            { factor: "Runtime control", optionA: "Limited to Lambda runtimes", optionB: "Full control, any runtime" },
            { factor: "Complexity", optionA: "Simpler, less to manage", optionB: "More complex, but more flexible" },
            { factor: "Best for", optionA: "APIs, event processing, cost-sensitive", optionB: "Long-running processes, custom runtimes" },
        ],
    },
    "dynamodb-vs-rds": {
        optionA: { name: "DynamoDB (NoSQL)", blueprints: ["apigw-lambda-dynamodb", "apigw-sqs-lambda-dynamodb"] },
        optionB: { name: "RDS PostgreSQL (SQL)", blueprints: ["apigw-lambda-rds", "alb-ecs-fargate-rds"] },
        factors: [
            { factor: "Data model", optionA: "Key-value, document (denormalized)", optionB: "Relational (normalized)" },
            { factor: "Query flexibility", optionA: "Limited to primary/secondary keys", optionB: "Full SQL, complex joins" },
            { factor: "Scaling", optionA: "Automatic, unlimited", optionB: "Manual or Aurora Serverless" },
            { factor: "Cost model", optionA: "Pay per request or provisioned capacity", optionB: "Pay for instance hours" },
            { factor: "Transactions", optionA: "Limited transaction support", optionB: "Full ACID transactions" },
            { factor: "Schema", optionA: "Schemaless, flexible", optionB: "Schema required, migrations needed" },
            { factor: "Best for", optionA: "Simple access patterns, massive scale", optionB: "Complex queries, reporting, relational data" },
        ],
    },
    "sync-vs-async": {
        optionA: { name: "Sync API (request/response)", blueprints: ["apigw-lambda-dynamodb", "apigw-lambda-rds"] },
        optionB: { name: "Async (queue-based)", blueprints: ["apigw-sqs-lambda-dynamodb", "apigw-eventbridge-lambda"] },
        factors: [
            { factor: "Response time", optionA: "Immediate response required", optionB: "Accepted response, processed later" },
            { factor: "Reliability", optionA: "Fails if downstream fails", optionB: "Retries automatically, DLQ for failures" },
            { factor: "Coupling", optionA: "Tightly coupled", optionB: "Loosely coupled, services independent" },
            { factor: "Throughput", optionA: "Limited by slowest component", optionB: "Smooths traffic spikes" },
            { factor: "Complexity", optionA: "Simpler to implement and debug", optionB: "More complex, eventual consistency" },
            { factor: "Use cases", optionA: "User-facing APIs, real-time needs", optionB: "Background jobs, event processing" },
            { factor: "Best for", optionA: "Simple CRUD, immediate feedback needed", optionB: "Heavy processing, multiple consumers" },
        ],
    },
};
// Try to fetch AGENTS.md content
async function getAgentsMdContent() {
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
        }
        catch {
            // Continue to next path
        }
    }
    // Try fetching from GitHub using gh CLI
    try {
        const content = execSync('gh api repos/berTrindade/terraform-infrastructure-blueprints/contents/AGENTS.md --jq ".content" | base64 -d', { encoding: "utf-8", timeout: 10000 });
        return content;
    }
    catch {
        // Return embedded fallback
        return generateFallbackContent();
    }
}
function generateFallbackContent() {
    const blueprintTable = BLUEPRINTS.map((b) => `| ${b.name} | ${b.description} | ${b.database} | ${b.pattern} | ${b.useCase} |`).join("\n");
    return `# Terraform Infrastructure Blueprints

## Blueprint Catalog

| Blueprint | Description | Database | Pattern | Use Case |
|-----------|-------------|----------|---------|----------|
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
server.resource("catalog", "blueprints://catalog", {
    description: "Full AI context for infrastructure blueprints including decision trees and workflows",
    mimeType: "text/markdown",
}, async () => {
    const content = await getAgentsMdContent();
    return {
        contents: [{ uri: "blueprints://catalog", mimeType: "text/markdown", text: content }],
    };
});
server.resource("list", "blueprints://list", {
    description: "JSON list of all available blueprints with metadata",
    mimeType: "application/json",
}, async () => {
    return {
        contents: [{ uri: "blueprints://list", mimeType: "application/json", text: JSON.stringify(BLUEPRINTS, null, 2) }],
    };
});
// Register tools
server.tool("search_blueprints", "Search for blueprints matching a use case or requirement", {
    query: z.string().describe("Search query (e.g., 'serverless api postgres', 'async queue', 'kubernetes')"),
}, async ({ query }) => {
    const searchQuery = (query || "").toLowerCase();
    const results = BLUEPRINTS.filter((b) => b.name.toLowerCase().includes(searchQuery) ||
        b.description.toLowerCase().includes(searchQuery) ||
        b.database.toLowerCase().includes(searchQuery) ||
        b.useCase.toLowerCase().includes(searchQuery) ||
        b.pattern.toLowerCase().includes(searchQuery));
    return {
        content: [
            {
                type: "text",
                text: results.length > 0
                    ? `Found ${results.length} blueprint(s):\n\n${results
                        .map((b) => `**${b.name}**\n${b.description}\n- Database: ${b.database}\n- Pattern: ${b.pattern}\n- Use case: ${b.useCase}`)
                        .join("\n\n")}`
                    : `No blueprints found matching "${query}". Try searching for: serverless, postgres, dynamodb, async, kubernetes, containers`,
            },
        ],
    };
});
server.tool("get_blueprint_details", "Get detailed information about a specific blueprint", {
    name: z.string().describe("Blueprint name (e.g., 'apigw-lambda-rds')"),
}, async ({ name: blueprintName }) => {
    const blueprint = BLUEPRINTS.find((b) => b.name === blueprintName);
    if (!blueprint) {
        return {
            content: [
                {
                    type: "text",
                    text: `Blueprint "${blueprintName}" not found. Available blueprints:\n${BLUEPRINTS.map((b) => `- ${b.name}`).join("\n")}`,
                },
            ],
        };
    }
    const details = `# ${blueprint.name}

${blueprint.description}

## Details
- **Database**: ${blueprint.database}
- **Pattern**: ${blueprint.pattern}
- **Use Case**: ${blueprint.useCase}

## Quick Start

\`\`\`bash
# Download this blueprint
npx tiged berTrindade/terraform-infrastructure-blueprints/aws/${blueprint.name} ./infra

# Deploy
cd infra/environments/dev
terraform init
terraform plan
terraform apply
\`\`\`

## Structure

\`\`\`
aws/${blueprint.name}/
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
        content: [{ type: "text", text: details }],
    };
});
server.tool("recommend_blueprint", "Get a blueprint recommendation based on requirements", {
    database: z.string().optional().describe("Database type: dynamodb, postgresql, aurora, none"),
    pattern: z.string().optional().describe("API pattern: sync, async"),
    auth: z.boolean().optional().describe("Whether authentication is needed"),
    containers: z.boolean().optional().describe("Whether containers (ECS/EKS) are needed"),
}, async ({ database, pattern, auth, containers }) => {
    let recommendations = [...BLUEPRINTS];
    // Filter by containers first
    if (containers) {
        recommendations = recommendations.filter((b) => b.name.includes("ecs") || b.name.includes("eks"));
    }
    else if (containers === false) {
        recommendations = recommendations.filter((b) => !b.name.includes("ecs") && !b.name.includes("eks"));
    }
    // Filter by database
    if (database) {
        const dbLower = database.toLowerCase();
        if (dbLower === "none" || dbLower === "n/a") {
            recommendations = recommendations.filter((b) => b.database === "N/A");
        }
        else {
            recommendations = recommendations.filter((b) => b.database.toLowerCase().includes(dbLower));
        }
    }
    // Filter by pattern
    if (pattern) {
        recommendations = recommendations.filter((b) => b.pattern.toLowerCase().includes(pattern.toLowerCase()));
    }
    // Filter by auth
    if (auth) {
        recommendations = recommendations.filter((b) => b.name.includes("cognito") || b.name.includes("amplify"));
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
    return {
        content: [
            {
                type: "text",
                text: `**Recommended: ${top.name}**\n\n${top.description}\n\n` +
                    `- Database: ${top.database}\n- Pattern: ${top.pattern}\n- Use case: ${top.useCase}\n\n` +
                    `\`\`\`bash\nnpx tiged berTrindade/terraform-infrastructure-blueprints/aws/${top.name} ./infra\n\`\`\`\n\n` +
                    (recommendations.length > 1
                        ? `**Alternatives:**\n${recommendations
                            .slice(1, 4)
                            .map((b) => `- ${b.name}: ${b.description}`)
                            .join("\n")}`
                        : ""),
            },
        ],
    };
});
server.tool("extract_pattern", "Get guidance on extracting a specific pattern/capability from blueprints to add to an existing project", {
    capability: z.string().describe("Capability to extract: database, queue, auth, events, ai, notifications"),
}, async ({ capability }) => {
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
});
server.tool("compare_blueprints", "Compare two architectural approaches to help make a decision", {
    comparison: z.string().describe("Comparison type: serverless-vs-containers, dynamodb-vs-rds, sync-vs-async"),
}, async ({ comparison }) => {
    const compLower = (comparison || "").toLowerCase();
    const data = COMPARISONS[compLower];
    if (!data) {
        const available = Object.keys(COMPARISONS).join(", ");
        return {
            content: [
                {
                    type: "text",
                    text: `Unknown comparison "${comparison}". Available comparisons: ${available}`,
                },
            ],
        };
    }
    const tableRows = data.factors
        .map((f) => `| ${f.factor} | ${f.optionA} | ${f.optionB} |`)
        .join("\n");
    const output = `# Comparison: ${data.optionA.name} vs ${data.optionB.name}

## Side-by-Side

| Factor | ${data.optionA.name} | ${data.optionB.name} |
|--------|${"-".repeat(data.optionA.name.length + 2)}|${"-".repeat(data.optionB.name.length + 2)}|
${tableRows}

## Relevant Blueprints

**${data.optionA.name}:**
${data.optionA.blueprints.map((b) => `- \`${b}\``).join("\n")}

**${data.optionB.name}:**
${data.optionB.blueprints.map((b) => `- \`${b}\``).join("\n")}

## Decision Guide

Choose **${data.optionA.name}** when:
${data.factors.filter((_, i) => i < 3).map((f) => `- You need: ${f.optionA.split(",")[0]}`).join("\n")}

Choose **${data.optionB.name}** when:
${data.factors.filter((_, i) => i < 3).map((f) => `- You need: ${f.optionB.split(",")[0]}`).join("\n")}
`;
    return {
        content: [{ type: "text", text: output }],
    };
});
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
//# sourceMappingURL=index.js.map