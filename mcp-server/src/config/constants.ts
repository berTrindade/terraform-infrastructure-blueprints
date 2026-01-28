/**
 * Application constants
 */

import type { Blueprint, ProjectBlueprint, ExtractionPattern } from "./types.js";

/**
 * Cloud provider constants
 */
export const CLOUD_PROVIDERS = {
    AWS: "aws",
    AZURE: "azure",
    GCP: "gcp",
} as const;

/**
 * File extensions by type
 */
export const FILE_EXTENSIONS = {
    TERRAFORM: [".tf", ".hcl"],
    MARKDOWN: [".md"],
    JSON: [".json"],
    RELEVANT: [".tf", ".md", ".json", ".sh", ".sql", ".yaml", ".yml", ".js", ".ts", ".graphql", ".hcl"],
} as const;

/**
 * MIME types mapping
 */
export const MIME_TYPES: Record<string, string> = {
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

/**
 * Blueprint catalog data
 */
export const BLUEPRINTS: Blueprint[] = [
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

/**
 * Project to blueprint mapping
 */
export const PROJECT_BLUEPRINTS: Record<string, ProjectBlueprint> = {
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

/**
 * Pattern extraction mapping
 */
export const EXTRACTION_PATTERNS: Record<string, ExtractionPattern> = {
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
