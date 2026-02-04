# Template Generator vs Blueprint Repository

Guide to understand when to use **Template Generator** (skill) vs when to use **Blueprint Repository** (MCP tools).

> **Architectural context**: This document describes the two scenarios mentioned by Felipe: **Template Generator** works as a "technical assembly line" that delivers ready code, while **Blueprint Repository** works as a "best practices manual" for study and understanding. To understand the complete vision about YAML manifests and agnostic architecture, see [ADR 0007: Manifest-Based Template Generation Architecture](../adr/0007-manifest-based-template-generation.md).

## Overview

**Template Generator** and **Blueprint Repository** serve different and complementary purposes:

| Scenario | Tool | Why? |
|---------|------|------|
| **Add capability** to existing project | Template Generator | Generates adapted code, saves tokens |
| **Create new blueprint** | Blueprint Repository | Need to see complete structure, patterns, tests |
| **Study how it works** | Blueprint Repository | Need to see complete code, understand architecture |
| **Copy complete blueprint** | Blueprint Repository | Need entire structure (modules, tests, docs) |
| **Generate specific snippet** | Template Generator | Generates only what's needed, already adapted |

## When to Use Template Generator

### ✅ Use Template Generator For

1. **Add capability to existing project**
   - Example: "I need to add RDS to my existing Lambda project"
   - The generator extracts parameters from history and generates adapted code
   - Saves tokens (50 lines vs 200+ lines)

2. **Generate specific snippets**
   - Example: "I need the ephemeral password pattern"
   - Generates only what's needed, not the entire blueprint

3. **Quick module scaffolding**
   - Example: "I need an SQS module following blueprint patterns"
   - Generates code already following project conventions

### ❌ DON'T Use Template Generator For

- Study how a blueprint works
- See the complete structure of a blueprint
- Copy a complete blueprint for new project
- Understand tests and validations
- See complete documentation

## When to Use Blueprint Repository

### ✅ Use Blueprint Repository (MCP tools) For

1. **Create new blueprints**
   - Need to see complete structure of existing blueprints
   - Need to understand module patterns, tests, documentation
   - Need to reference multiple files to create complete blueprint

2. **Study blueprints**
   - Example: "How does the apigw-lambda-rds blueprint work?"
   - Need to see complete code, architecture, tests

3. **Copy complete blueprint**
   - Example: "I want to use the apigw-lambda-rds blueprint in my project"
   - Need entire structure: modules, environments, tests, docs

4. **Understand complex patterns**
   - Example: "How does the VPC endpoints pattern work?"
   - Need to see complete implementation, not just snippet

5. **Reference multiple files**
   - Example: "I need to see data, networking and secrets modules together"
   - Template generator generates one snippet, repo allows seeing everything

## New Blueprint Creation Flow

### Step 1: Identify Need

**When to create a new blueprint:**

- New architectural pattern not covered by existing blueprints
- Unique combination of services that doesn't exist
- Cloud provider-specific pattern

**Example**: "I need a blueprint for API Gateway + Step Functions + Lambda + DynamoDB"

### Step 2: Study Existing Blueprints

**Use Blueprint Repository** to:

- See structure of similar blueprints
- Understand module patterns
- See how tests are structured
- Understand necessary documentation

```typescript
// Use MCP tools to study
fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "modules/api/main.tf")
fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "environments/dev/main.tf")
fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "README.md")
```

### Step 3: Create Blueprint Structure

**Use the `create-blueprint` skill** or follow the pattern manually:

```
aws/apigw-lambda-stepfunctions/
├── environments/
│   └── dev/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── versions.tf
│       └── terraform.tfvars
├── modules/
│   ├── api/
│   ├── compute/
│   ├── data/
│   ├── orchestration/  # New module for Step Functions
│   ├── networking/
│   ├── naming/
│   └── tagging/
├── src/
├── tests/
└── README.md
```

### Step 4: Implement Modules

**Use Blueprint Repository** to reference patterns:

- Copy and adapt similar modules
- Follow naming, tagging, secrets patterns
- Implement tests following existing patterns

### Step 5: Create YAML Manifest (Optional)

**After creating the blueprint**, you can create a manifest for Template Generator:

```yaml
# blueprints/manifests/apigw-lambda-stepfunctions.yaml
name: apigw-lambda-stepfunctions
description: Serverless API with Step Functions orchestration
version: 1.0.0

snippets:
  - id: stepfunctions-state-machine
    name: Step Functions State Machine
    template: stepfunctions-state-machine.tftpl
    variables:
      - name: state_machine_name
        type: string
        required: true
      # ...
```

This allows Template Generator to generate snippets from this blueprint in the future.

## Practical Examples

### Example 1: Add RDS to Existing Project

**Scenario**: Existing Lambda project, needs to add RDS

**Tool**: **Template Generator**

```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "rds-module",
  "params": {
    "db_identifier": "myapp-dev-db",
    "db_subnet_group_name": "existing-subnets",
    "security_group_id": "sg-existing"
  }
}
```

**Result**: Generated Terraform code (50 lines) already adapted to project

### Example 2: Create New Step Functions Blueprint

**Scenario**: Create complete blueprint for API Gateway + Step Functions

**Tool**: **Blueprint Repository**

1. Study similar blueprints:

   ```typescript
   fetch_blueprint_file(blueprint: "apigw-lambda-dynamodb", path: "modules/api/main.tf")
   fetch_blueprint_file(blueprint: "apigw-eventbridge-lambda", path: "modules/events/main.tf")
   ```

2. Create complete structure using `create-blueprint` skill

3. Implement modules referencing repo patterns

4. Create tests, documentation, etc.

**Result**: Complete blueprint ready for use

### Example 3: Understand How Ephemeral Password Works

**Scenario**: "How does the ephemeral password pattern work?"

**Tool**: **Blueprint Repository**

```typescript
fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "modules/data/main.tf")
fetch_blueprint_file(blueprint: "apigw-lambda-rds", path: "environments/dev/terraform.tfvars")
```

**Result**: Understands complete implementation, context, variables

### Example 4: Generate Ephemeral Password Snippet

**Scenario**: "I need the ephemeral password pattern in my project"

**Tool**: **Template Generator**

```json
{
  "blueprint": "apigw-lambda-rds",
  "snippet": "ephemeral-password",
  "params": {
    "password_name": "db"
  }
}
```

**Result**: Generated code ready to use

## Summary: What Do You Need Blueprint Repo For?

### You NEED Blueprint Repo for

1. ✅ **Create new blueprints**
   - See complete structure
   - Understand module patterns
   - See how tests are done
   - Understand necessary documentation

2. ✅ **Study blueprints**
   - See complete code
   - Understand architecture
   - See pattern implementation

3. ✅ **Copy complete blueprint**
   - For new project
   - Need entire structure

4. ✅ **Reference multiple files**
   - See related modules
   - Understand dependencies
   - See complex patterns

### You DON'T need Blueprint Repo for

1. ❌ **Add capability to existing project**
   - Use Template Generator
   - Generates adapted code
   - Saves tokens

2. ❌ **Generate specific snippet**
   - Use Template Generator
   - Generates only what's needed

## Recommended Workflow

### To Add Capability (Existing Project)

```
1. Identify need → "add RDS"
2. Use Template Generator → Generate adapted code
3. Integrate into project → Adapt if necessary
```

### To Create New Blueprint

```
1. Identify need → "new architectural pattern"
2. Study similar blueprints → Use Blueprint Repository
3. Create structure → Use create-blueprint skill
4. Implement modules → Reference repo patterns
5. Create YAML manifest → For Template Generator (optional)
```

### To Study Blueprint

```
1. Identify blueprint → "apigw-lambda-rds"
2. Use Blueprint Repository → fetch_blueprint_file()
3. Understand architecture → See multiple files
4. Apply knowledge → In project or create new blueprint
```

## Conclusion

**Template Generator** and **Blueprint Repository** are complementary:

- **Template Generator**: To add capabilities, generate snippets, save tokens
- **Blueprint Repository**: To create blueprints, study, copy complete, understand patterns

**To create new blueprints, you still need Blueprint Repository** for:

- See complete structure
- Understand patterns
- Reference multiple files
- Create complete blueprint with tests and documentation

Template Generator **complements** the repo, doesn't replace it.
