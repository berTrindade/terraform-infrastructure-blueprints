# Documentation Consolidation and Cleanup

Date: 2026-01-30
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

The `docs/` directory had accumulated numerous files over time:
- Historical implementation status files
- Research documents
- Redundant guides (deployment, environments, testing, CI/CD)
- Developer workflow guide that duplicated content from workflows.md
- Multiple ADRs with information already present in other documentation

This created several problems:
- **Maintenance Burden**: Multiple files covering the same topics
- **Confusion**: Unclear which documentation is authoritative
- **Token Waste**: AI assistants loading redundant information
- **Outdated Content**: Historical files no longer relevant

The challenge was identifying which documentation is essential versus redundant, and consolidating information appropriately.

## Decision

Consolidate and clean up documentation following these principles:

1. **Remove Historical Files**: Delete implementation status, research documents, and outdated files
2. **Consolidate Redundant Guides**: Remove guides that duplicate information available elsewhere:
   - `deployment.md` - Basic Terraform info, should be in blueprint READMEs
   - `environments.md` - Specific to blueprints, should be in blueprint READMEs
   - `testing.md` - Basic Terraform testing, not blueprint-specific
   - `cicd.md` - Too specific, not needed for all users
   - `developer-workflow.md` - Redundant with `workflows.md`
3. **Keep Essential Guides**: Maintain only guides that provide unique value:
   - `template-generator-development.md` - Specific development guide
4. **Restore Key ADRs**: Re-add fundamental ADRs that document architectural decisions:
   - Standalone blueprints (0001)
   - Pattern extraction scope (0002)
   - Secrets management (0005)
   - Progressive disclosure (0006)
5. **Create New ADRs**: Document recent architectural decisions:
   - Documentation consolidation (this ADR)
   - Manifest-based template generation (0011)

## Alternatives Considered

1. **Keep All Files**
   - Pros: Preserves all information, no risk of losing content
   - Cons: Maintenance burden, confusion, token waste
   - Rejected: Creates more problems than it solves

2. **Archive Instead of Delete**
   - Pros: Preserves history, can reference if needed
   - Cons: Still clutters repository, doesn't solve maintenance issues
   - Rejected: Doesn't address core problems

3. **Move to Separate Documentation Repository**
   - Pros: Separates concerns, keeps main repo clean
   - Cons: Adds complexity, harder to maintain, breaks links
   - Rejected: Too complex for the benefit

## Consequences

### Benefits

- **Reduced Maintenance**: Fewer files to maintain and keep updated
- **Clearer Structure**: Only essential documentation remains
- **Token Efficiency**: AI assistants load less redundant content
- **Better Organization**: Clear separation between essential and historical content

### Trade-offs

- **Lost History**: Some historical context removed (but information preserved in other docs)
- **Potential Information Loss**: Risk of removing something important (mitigated by consolidation)
- **Migration Effort**: Requires updating references and consolidating content

### Impact

- **Repository Size**: Reduced from 25+ MD files to 12 essential files
- **Maintainability**: Easier to keep documentation current
- **AI Assistant Performance**: Reduced token consumption
- **Developer Experience**: Clearer documentation structure

## Notes

This consolidation aligns with the progressive disclosure pattern (ADR-0004) and ensures that documentation remains focused and maintainable. The cleanup removed 13 files while preserving essential information in consolidated locations. Future documentation should follow the principle: "If it's not essential and unique, it shouldn't be a separate file."
