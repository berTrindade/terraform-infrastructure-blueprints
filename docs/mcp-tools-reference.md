# MCP Tools Reference

Technical reference for MCP tools available for blueprint discovery and code generation.

> **ALWAYS use these tools before writing Terraform code.**

## Available Tools

| Tool | When to Use | Example |
|------|-------------|---------|
| `get_workflow_guidance(task)` | **FIRST** - Understand workflow | `get_workflow_guidance(task: "add_capability")` |
| `extract_pattern(capability)` | Adding capability to existing project | `extract_pattern(capability: "database")` |
| `recommend_blueprint(...)` | Starting new project | `recommend_blueprint(database: "postgresql", pattern: "sync")` |
| `find_by_project(project_name)` | Cross-cloud equivalents | `find_by_project(project_name: "Mavie", target_cloud: "aws")` |
| `compare_blueprints(comparison)` | Architectural decisions | `compare_blueprints(comparison: "dynamodb-vs-rds")` |
| `search_blueprints(query)` | Finding blueprints by keywords | `search_blueprints(query: "serverless postgresql")` |
| `get_blueprint_details(name)` | Getting detailed blueprint info | `get_blueprint_details(name: "apigw-lambda-rds")` |
| `list_available_tools()` | Discover available tools | `list_available_tools()` |

## Extractable Capabilities

| Capability | Source Blueprint | Modules |
|------------|------------------|---------|
| **Database** | `apigw-lambda-rds` | `modules/data/`, `modules/networking/` |
| **Queue** | `apigw-sqs-lambda-dynamodb` | `modules/queue/`, `modules/worker/` |
| **Auth** | `apigw-lambda-dynamodb-cognito` | `modules/auth/` |
| **Events** | `apigw-eventbridge-lambda` | `modules/events/` |
| **AI/RAG** | `apigw-lambda-bedrock-rag` | `modules/ai/`, `modules/vectorstore/` |
| **Notifications** | `apigw-sns-lambda` | `modules/notifications/` |

## MCP Resource URIs

Access blueprint files directly:
- `blueprints://aws/apigw-lambda-rds/README.md`
- `blueprints://aws/apigw-lambda-rds/environments/dev/main.tf`
- `blueprints://aws/apigw-lambda-rds/modules/data/main.tf`
- `blueprints://aws/apigw-lambda-rds/modules/secrets/main.tf`

## Usage Examples

### Example 1: Adding Database

```javascript
// Step 1: Get workflow guidance
get_workflow_guidance(task: "add_capability")

// Step 2: Extract pattern
extract_pattern(capability: "database")

// Step 3: Reference blueprint files
fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "modules/data/main.tf")
```

### Example 2: Starting New Project

```javascript
// Step 1: Get workflow guidance
get_workflow_guidance(task: "new_project")

// Step 2: Recommend blueprint
recommend_blueprint(database: "postgresql", pattern: "sync")

// Step 3: Get blueprint details
get_blueprint_details(name: "apigw-lambda-rds")
```

### Example 3: Cross-Cloud Migration

```javascript
// Find equivalent blueprint
find_by_project(project_name: "Mavie", target_cloud: "aws")
```

## References

- [AI Assistant Guidelines](./ai-assistant-guidelines.md) - How to use these tools
- [Developer Workflow](./developer-workflow.md) - Developer perspective
