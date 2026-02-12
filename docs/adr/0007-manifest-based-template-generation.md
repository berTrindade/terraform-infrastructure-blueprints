# Simplified Template Generation Architecture

Date: 2026-01-30 (Updated: 2026-02-08)
Owner: Bernardo Trindade de Abreu
Status: Superseded - Simplified Architecture

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

**Initial Approach (2026-01-30)**: Manifest-based system with YAML files defining variables, types, validation rules, and defaults. This created duplication - manifest YAML files duplicated variable definitions already present in `variables.tf` files.

**Problem Identified**: Modern LLMs can infer types, required fields, and valid patterns directly from Terraform code. The manifest layer added maintenance cost without proportional benefit.

## Decision (Updated 2026-02-08)

**Simplify to direct template rendering** - Remove manifest layer entirely:

1. **Templates** (`skills/code-generation/templates/*.tftpl`):
   - Parameterized Terraform templates
   - Use `${variable}` placeholders (Terraform convention)
   - Follow blueprint patterns (ephemeral passwords, naming, etc.)

2. **Template Generator Script** (`skills/code-generation/scripts/generate.js`):
   - Accepts template name and parameters directly
   - Renders templates with parameter substitution
   - No validation layer - Terraform catches errors at plan time
   - Returns generated Terraform code
   - Executes locally (Node.js), sub-second response

3. **Single Source of Truth**: Blueprint's `variables.tf` files
   - LLMs reference these to understand parameter names, types, defaults
   - No duplication - one definition in `variables.tf`, not two (manifest + variables.tf)
   - Use MCP `fetch_blueprint_file()` to read parameter definitions

This simplified architecture maintains token efficiency while eliminating maintenance burden.

## Alternatives Considered

### Original Alternatives (2026-01-30)

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

### Simplification Alternatives (2026-02-08)

1. **Keep Manifest-Based System**
   - Pros: Strict validation, type checking, pattern matching
   - Cons: Duplicates `variables.tf` definitions, high maintenance burden, LLMs can infer types
   - Rejected: Overengineering - modern LLMs don't need strict validation layer

2. **Direct Template Rendering (Chosen)**
   - Pros: Single source of truth (`variables.tf`), simpler architecture, LLM-friendly
   - Cons: No pre-validation (Terraform catches errors at plan time)
   - Accepted: Fast feedback loop, clear error messages, acceptable tradeoff

## Consequences

### Benefits

- **Token Efficiency**: 50 lines generated vs 200+ lines fetched (~75% reduction)
- **Speed**: Sub-second local execution vs seconds of LLM processing
- **Consistency**: Always follows blueprint patterns from templates
- **Scalability**: Add new template = create `.tftpl` file, no skill changes
- **Agnostic Design**: Skill works with any template file
- **Single Source of Truth**: Parameter definitions in `variables.tf` only, no duplication
- **Simpler Architecture**: Removed ~200 lines of validation code, 19 manifest files

### Trade-offs

- **No Pre-Validation**: Missing parameters appear as `${undefined}` in output
- **Type Errors**: Caught by Terraform at `terraform plan` time, not before generation
- **Pattern Violations**: Caught by AWS at `terraform apply` time, not before generation
- **Template Maintenance**: Templates must be kept in sync with blueprint code

**Acceptable Tradeoffs**: Fast feedback loop (plan/apply), clear error messages, LLMs can infer types from `variables.tf`

### Impact

- **AI Assistant Performance**: Faster, more efficient code generation
- **Developer Experience**: Get production-ready code in seconds
- **Repository Structure**: Removed `blueprints/manifests/` directory (19 files deleted)
- **Maintenance**: Only templates need updates, parameter definitions live in `variables.tf`
- **Code Reduction**: Removed `parse-manifest.js` (~180 lines), simplified `generate.js`

## Migration Notes

**What Changed**:
- Removed: `blueprints/manifests/*.yaml` (19 files), `parse-manifest.js` validation layer
- Simplified: `generate.js` now accepts `{ "template": "...", "params": {...} }` directly
- Updated: `SKILL.md` documents direct template usage and `variables.tf` as source of truth

**What Stayed**:
- Template files (`.tftpl`) - unchanged
- Template rendering logic (`render-template.js`) - unchanged
- Token efficiency - still generating 50 lines vs fetching 200+

## Notes

This simplified architecture maintains the benefits of template-based generation while eliminating the maintenance burden of manifest duplication. Modern LLMs can infer types and patterns from Terraform code, making strict validation layers unnecessary. The fast feedback loop (Terraform plan/apply) provides clear error messages when parameters are missing or incorrect.

The architecture still follows Felipe's vision of "skill as a technical assembly line" (Scenario 2) and "fetch as a best practices manual" (Scenario 1). The key principle remains: skills stay agnostic, templates are pluggable, and blueprints provide the source of truth through `variables.tf` files.
