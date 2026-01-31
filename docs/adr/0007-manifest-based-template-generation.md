# Manifest-Based Template Generation Architecture

Date: 2026-01-30
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

The repository evolved to support two scenarios:
1. **Scenario 1 (Study)**: AI assistants fetch blueprint files to study and understand patterns
2. **Scenario 2 (Generation)**: AI assistants generate code to add capabilities to existing projects

Scenario 2 initially required AI assistants to:
- Fetch entire blueprint files (200+ lines)
- Analyze and adapt code manually
- Extract relevant modules
- Adapt naming conventions and patterns

This consumed significant tokens and processing time. The challenge was creating a system that generates production-ready code efficiently while maintaining consistency with blueprint patterns.

Key requirements:
- Generate code adapted to project conventions (naming, tags, VPC)
- Validate parameters before generation
- Follow blueprint patterns (ephemeral passwords, IAM auth, etc.)
- Work with any blueprint (agnostic design)
- Execute locally without LLM overhead

## Decision

Implement a manifest-based template generation system:

1. **Blueprint Manifests** (`blueprints/manifests/{blueprint}.yaml`):
   - Define available snippets (reusable Terraform modules)
   - Specify variables, types, validation rules, defaults
   - Reference template files
   - Machine-readable specification

2. **Template Generator Skill** (`skills/blueprint-template-generator`):
   - Agnostic skill that works with any manifest
   - Validates parameters against manifest definitions
   - Renders templates with parameter substitution
   - Returns generated Terraform code
   - Executes locally (Node.js), sub-second response

3. **Reusable Templates** (`skills/blueprint-template-generator/templates/*.tf.template`):
   - Parameterized Terraform templates
   - Use `{{variable_name}}` placeholders
   - Follow blueprint patterns (ephemeral passwords, naming, etc.)

This architecture enables Scenario 2 (generation) to be efficient and consistent while keeping the skill agnostic and scalable.

## Alternatives Considered

1. **Hardcode Blueprint-Specific Logic in Skill**
   - Pros: Simple implementation, direct control
   - Cons: Skill grows with each blueprint, not scalable, violates DRY
   - Rejected: Doesn't scale, creates maintenance burden

2. **LLM-Based Code Generation Only**
   - Pros: Flexible, can adapt to any scenario
   - Cons: High token cost, inconsistent output, slower
   - Rejected: Too expensive and unreliable

3. **Terraform Registry Modules**
   - Pros: Standard approach, versioned
   - Cons: Still requires adaptation, doesn't solve parameterization
   - Rejected: Doesn't address the core need

## Consequences

### Benefits

- **Token Efficiency**: 50 lines generated vs 200+ lines fetched (~75% reduction)
- **Speed**: Sub-second local execution vs seconds of LLM processing
- **Consistency**: Always follows blueprint patterns from manifest
- **Scalability**: Add new blueprint = create manifest, no skill changes
- **Agnostic Design**: Skill works with any blueprint that has a manifest

### Trade-offs

- **Initial Setup**: Requires creating manifests for each blueprint
- **Template Maintenance**: Templates must be kept in sync with blueprint code
- **Learning Curve**: Developers must understand manifest structure

### Impact

- **AI Assistant Performance**: Faster, more efficient code generation
- **Developer Experience**: Get production-ready code in seconds
- **Repository Structure**: New `blueprints/manifests/` directory
- **Maintenance**: Must keep manifests and templates updated with blueprints

## Notes

This architecture follows Felipe's vision of "skill as a technical assembly line" (Scenario 2) and "fetch as a best practices manual" (Scenario 1). The manifest-based approach makes the skill agnostic and allows blueprints to be pluggable. The key principle is that skills remain agnostic and blueprints are pluggable through YAML manifests, enabling scalability without modifying the skill code.
