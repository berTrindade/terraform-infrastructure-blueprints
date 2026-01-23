# Standalone Self-Contained Blueprints

Date: 2025-01-06
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

ustwo is a consultancy that builds software for clients. When client engagements end, clients must own their infrastructure code completely with no ongoing dependencies on ustwo systems, repositories, or tooling.

We needed a way to provide reusable Infrastructure-as-Code patterns that accelerate project delivery while ensuring clean handover. The challenge was balancing code reuse (DRY principles) against client independence.

Key constraints:
- Clients must be able to maintain their infrastructure after ustwo leaves
- No references to ustwo repositories or packages in delivered code
- Patterns should be battle-tested and production-ready
- New projects should be quick to bootstrap

## Decision

Each blueprint is a complete, self-contained package. No shared modules across blueprints. When a consultant copies one blueprint folder, they have everything needed to deploy that infrastructure pattern.

This means:
- Each blueprint contains its own modules, naming conventions, and configurations
- Blueprints do not reference each other or a shared `/modules` folder
- Code duplication across blueprints is intentional and acceptable
- Clients receive a single folder with no external dependencies

## Alternatives Considered

1. **Shared module library**
   - Description: Central `/modules` folder referenced by all blueprints
   - Pros: DRY code, single source of truth, easier to propagate improvements
   - Cons: Creates ustwo dependency, versioning complexity, harder client handover

2. **Terraform Registry modules**
   - Description: Publish modules to public Terraform Registry
   - Pros: Standard Terraform approach, version pinning built-in
   - Cons: Still creates external dependency, public exposure of internal patterns

3. **Git submodules**
   - Description: Shared modules as git submodules
   - Pros: Versioned, trackable
   - Cons: Complex workflow, confusing for clients, still creates dependency

## Consequences

**Benefits:**
- Clean client handover with zero ustwo dependencies
- No vendor lock-in for clients
- Easy to understand and modify
- Each blueprint is self-documenting
- Clients can diverge from patterns without breaking anything

**Risks:**
- Code duplication across blueprints
- Improvements to one blueprint don't automatically propagate to others
- Maintenance overhead when fixing bugs across multiple blueprints

**Mitigations:**
- Use official terraform-aws-modules where possible (community-maintained)
- Document patterns clearly so similar fixes can be applied manually
- Periodic audits to sync improvements across blueprints
