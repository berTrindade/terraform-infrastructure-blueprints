# Expand Scope to Support Pattern Extraction

Date: 2026-01-23
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

The original repository README explicitly stated this is "Not a reusable Terraform module source." The intended workflow was: copy an entire blueprint, adapt it for the client, deliver.

However, real consulting scenarios revealed a gap. Developers working on long-running client projects often need to add new capabilities (database, queue, authentication, AI features) to existing Terraform codebases. They wanted to reference battle-tested patterns from the blueprints without starting from scratch.

Common scenarios not well-served by "copy whole blueprint":
1. Client project has existing VPC and Lambda; needs to add SQS for async processing
2. Client project has API Gateway and DynamoDB; needs to add Cognito for authentication
3. Client project has working infrastructure; wants to add Bedrock RAG capabilities

These developers were manually extracting modules from blueprints anyway, but without clear guidance on how to adapt them.

## Decision

Expand the repository's purpose to support two use cases:

1. **Copy whole blueprint** (original purpose)
   - Start new projects from scratch
   - Download entire blueprint via tiged
   - Adapt and deploy

2. **Extract patterns** (new purpose)
   - Add modules/patterns from blueprints to existing Terraform projects
   - Reference blueprints as "source of truth" for implementation patterns
   - Adapt extracted code to fit existing project conventions

This does NOT mean creating shared modules. The blueprints remain self-contained. The change is in how we document and support the extraction workflow.

## Alternatives Considered

1. **Keep original scope**
   - Description: Only support copying whole blueprints, no extraction guidance
   - Pros: Simpler documentation, clearer boundaries
   - Cons: Doesn't match how consultants actually work, lower adoption

2. **Create separate "modules" repository**
   - Description: Split reusable patterns into a dedicated modules repo
   - Pros: Clear separation of concerns, explicit module versioning
   - Cons: Maintenance overhead, fragmented documentation, contradicts ADR-0001

3. **Terraform Registry publication**
   - Description: Publish individual modules to Terraform Registry
   - Pros: Standard Terraform workflow
   - Cons: Creates external dependency, violates client ownership principle

## Consequences

**Benefits:**
- Matches how consultants actually work on long-running projects
- More flexible usage of the blueprints
- Higher adoption and value from the repository
- Blueprints become a living reference, not just starter templates

**Risks:**
- More complex AI guidance needed to support extraction workflow
- Must document extraction patterns clearly
- Risk of consultants creating inconsistent implementations

**Impact:**
- Update AGENTS.md with "Add to Existing Project" workflow
- Enhance MCP server tools to support pattern discovery
- Add documentation for common extraction scenarios

## Notes

This decision does not change ADR-0001. Blueprints remain self-contained. The change is in supporting developers who want to learn from and adapt patterns, not in creating shared dependencies.
