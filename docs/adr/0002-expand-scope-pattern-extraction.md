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
   - Download entire blueprint (via git clone, GitHub CLI, etc.)
   - Adapt and deploy

2. **Extract patterns** (new purpose)
   - Add modules/patterns from blueprints to existing Terraform projects
   - Use MCP tools (`extract_pattern`) to get guidance on extracting capabilities
   - Use template generator to generate adapted code
   - Reference blueprint modules as examples

## Alternatives Considered

1. **Keep Original Scope Only**
   - Pros: Clear, simple purpose, no confusion
   - Cons: Doesn't serve real consulting needs, developers extract patterns anyway without guidance
   - Rejected: Ignores real-world usage patterns

2. **Separate Repository for Patterns**
   - Pros: Clear separation, dedicated tooling
   - Cons: Maintenance overhead, duplication, harder to discover
   - Rejected: Creates unnecessary complexity

3. **Extract Patterns Only**
   - Pros: Focused purpose, optimized for extraction
   - Cons: Loses value of complete blueprints for new projects
   - Rejected: Removes valuable use case

## Consequences

### Benefits

- **Serves Real Needs**: Addresses both new projects and existing project enhancement
- **Flexible Usage**: Developers choose the approach that fits their scenario
- **Better Guidance**: MCP tools and template generator provide structured extraction guidance
- **Maintains Original Value**: Complete blueprints still available for new projects

### Trade-offs

- **Increased Complexity**: Repository serves two distinct use cases
- **Documentation Overhead**: Must document both workflows clearly
- **Tooling Requirements**: Need MCP tools and template generator to support extraction

### Impact

- **Developer Experience**: More flexible, serves more scenarios
- **Repository Purpose**: Broader scope, but more valuable
- **Tooling**: Requires MCP server and template generator skills
- **Documentation**: Must clearly distinguish between use cases

## Notes

This decision expanded the repository from "blueprint library" to "blueprint library + pattern extraction system." The addition of MCP tools and template generator skills enables the extraction use case while maintaining the original copy-whole-blueprint workflow.
