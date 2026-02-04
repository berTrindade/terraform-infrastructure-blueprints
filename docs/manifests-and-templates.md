# Manifests and Templates

How blueprints, manifests, and templates work together in the Terraform Infrastructure Blueprints system.

## The Relationship

```mermaid
graph TD
    A[Blueprint: Real Terraform Code] -->|based on| B[Manifest: YAML Metadata]
    B -->|references| C[Template: Parameterized Code]
    C -->|generates| D[Generated Code]
    
    A1[blueprints/aws/apigw-lambda-rds/modules/data/main.tf] --> A
    B1[blueprints/manifests/apigw-lambda-rds.yaml] --> B
    C1[skills/infrastructure-code-generation/templates/rds-module.tftpl] --> C
    D1[Generated Terraform HCL] --> D
```

## Complete Flow

```mermaid
flowchart LR
    A[Phase 1: Write Blueprint Code] --> B[Phase 2: Create Manifest YAML]
    B --> C[Phase 3: Create Template]
    C --> D[Phase 4: Usage]
    D --> E[Option A: Template Generator]
    D --> F[Option B: Copy Blueprint]
```

**Phase 1**: Write Terraform code in `blueprints/aws/{blueprint-name}/`  
**Phase 2**: Create manifest describing blueprint in YAML  
**Phase 3**: Create parameterized template with `${placeholders}` (`.tftpl` files; Terraform-style placeholders)  
**Phase 4**: Use Template Generator or copy blueprint directly

Design-time code generation uses Node.js and `${var}` substitution. For **runtime** file templating inside Terraform (e.g. `user_data`, IAM policies), HashiCorp recommends `templatefile()` and `.tftpl` files.

## Template Generator Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant AI as AI Assistant
    participant TG as Template Generator
    participant M as Manifest
    participant T as Template
    
    U->>AI: "I need to add RDS PostgreSQL"
    AI->>AI: Analyzes existing Terraform
    AI->>TG: Generate code with params
    TG->>M: Read manifest
    M-->>TG: Validate parameters
    TG->>T: Read template
    T-->>TG: Render with placeholders
    TG-->>AI: Generated Terraform code
    AI-->>U: Code ready to use
```

## When You Write Terraform Code

### ✅ You write code when

1. **Creating a new blueprint**
   - Write all Terraform code in `blueprints/aws/{blueprint-name}/`
   - Create modules, environments, tests
   - This is production code

2. **Updating an existing blueprint**
   - Modify code in `blueprints/aws/{blueprint-name}/`
   - Add resources, improve patterns
   - Keep code updated

3. **Creating templates for snippets**
   - Based on real blueprint code
   - Use `.tftpl` extension and Terraform-style placeholders `${variable}` (simple identifiers only; Terraform literals like `"${var.x}"` stay intact)
   - Keep templates synchronized with real code

### ❌ You DON'T write code when

1. **Using Template Generator**
   - The generator creates code based on templates
   - You only provide parameters (JSON)
   - Code is generated automatically

2. **Using existing blueprints**
   - Copy the complete blueprint
   - Don't need to rewrite, just adapt

## Manifest location

The **canonical manifest location** is **`blueprints/manifests/`** at the repository root. The infrastructure-code-generation skill reads manifests from there when run from the repo (single source of truth).

## Fundamental Principle

> **The blueprint's Terraform code is always the source of truth.**
>
> Manifests and templates are **derived** from real code. If you change the blueprint code, you must update templates and manifests to maintain synchronization.

## References

- [Developer Workflow](./developer-workflow.md) - How developers use the system
- [AI Assistant Guidelines](./ai-assistant-guidelines.md) - How AI assistants work with manifests
- [Template Generator vs Repository](./blueprints/template-generator-vs-repo.md) - When to use which
