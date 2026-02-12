---
name: mcp-discovery
description: Use when the user wants to find blueprints, fetch blueprint files, get workflow guidance, or find cross-cloud equivalents. Triggers on: "what blueprint does X use", "I need the AWS version of...", "show me the RDS module", "how do I add a database", "what did project Mavie use", "I need what [project] has on [cloud]". Describes when to use each MCP tool (search_blueprints, recommend_blueprint, fetch_blueprint_file, get_workflow_guidance, find_by_project, extract_pattern).
---

# MCP Blueprint Discovery

**Overview.** This skill explains when and how to use MCP tools for blueprint discovery, file fetching, workflow guidance, and cross-cloud lookups. Use it when the user wants to find blueprints, get file contents, or follow a workflow (new project, add capability, migrate cloud).

**When to use**
- User wants to find blueprints by keywords or requirements
- User needs to fetch a specific blueprint file (e.g. RDS module from apigw-lambda-rds)
- User asks "how do I start a new project?" or "how do I add a database?"
- User needs cross-cloud equivalents (e.g. "Mavie on AWS")
- Deciding whether to call MCP vs use a Skill for static content

**When not to use**
- Static catalog or decision tree → use `style-guide` skill
- Generating code from templates → use `code-generation` skill

## When to use MCP vs Skills

| Need | Use |
|------|-----|
| Catalog, decision tree, patterns (static) | Skill: `style-guide` |
| Recommend blueprint by requirements | MCP: `recommend_blueprint()` |
| Search by keywords | MCP: `search_blueprints()` |
| Get a specific file from a blueprint | MCP: `fetch_blueprint_file()` |
| Workflow steps (new project, add capability, migrate) | MCP: `get_workflow_guidance()` |
| Cross-cloud / project-based lookup | MCP: `find_by_project()` |
| Extract a capability into existing project | MCP: `extract_pattern()` |
| Generate Terraform from templates | Skill: `code-generation` |

## Tool matrix

| Tool | When to use | Example |
|------|-------------|---------|
| `get_workflow_guidance(task)` | **First** – understand the workflow | `get_workflow_guidance(task: "add_capability")` |
| `recommend_blueprint(...)` | New project – get recommendation by requirements | `recommend_blueprint(database: "postgresql", pattern: "sync")` |
| `search_blueprints(query)` | Find blueprints by keywords | `search_blueprints(query: "serverless postgresql")` |
| `fetch_blueprint_file(blueprint, path)` | Get file contents from a blueprint | `fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "modules/data/main.tf")` |
| `extract_pattern(capability)` | Adding a capability to existing project | `extract_pattern(capability: "database", include_code_examples: true)` |
| `find_by_project(project_name, target_cloud?)` | Cross-cloud equivalent or "what did project X use?" | `find_by_project(project_name: "Mavie", target_cloud: "aws")` |

## Example flows

### Add RDS to existing project

1. `get_workflow_guidance(task: "add_capability")`
2. `extract_pattern(capability: "database", include_code_examples: true)`
3. Option A: Use `code-generation` skill to generate from templates  
   Option B: `fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "modules/data/main.tf")` to study then adapt

### New project – serverless API with PostgreSQL

1. `get_workflow_guidance(task: "new_project")`
2. `recommend_blueprint(database: "postgresql", pattern: "sync")` → e.g. `apigw-lambda-rds`
3. Provide download/setup instructions; use `fetch_blueprint_file` if user needs to see specific files

### Cross-cloud: "I need what Mavie has but on AWS"

1. `find_by_project(project_name: "Mavie", target_cloud: "aws")`  
   → Returns AWS equivalent (e.g. `alb-ecs-fargate-rds` if Mavie uses `appengine-cloudsql-strapi`)

## Reference

- **Technical reference:** [MCP Tools Reference](docs/mcp-tools-reference.md)
- **Skills vs MCP decision:** [ADR 0005](docs/adr/0005-skills-vs-mcp-decision.md)
