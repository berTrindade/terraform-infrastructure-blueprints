# Standalone Self-Contained Blueprints

Date: 2026-01-23
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

1. **Shared Module Library**
   - Pros: DRY principle, single source of truth, easier updates
   - Cons: Clients depend on ustwo repository, can't maintain independently, violates consultancy model
   - Rejected: Violates core requirement of client ownership

2. **Terraform Registry Modules**
   - Pros: Standard approach, versioned modules, widely used
   - Cons: Still creates dependency, requires registry access, harder to customize
   - Rejected: Doesn't solve the client ownership problem

3. **Copy-Paste with Manual Adaptation**
   - Pros: Complete independence, no dependencies
   - Cons: Time-consuming, error-prone, inconsistent patterns
   - Rejected: Too slow for project delivery

## Consequences

### Benefits

- **Client Independence**: Clients own complete, working infrastructure code
- **Fast Handover**: Single folder copy, no dependency resolution
- **Battle-Tested Patterns**: Each blueprint is production-ready
- **Flexibility**: Clients can modify without breaking dependencies
- **Clear Boundaries**: Each blueprint is a complete unit

### Trade-offs

- **Code Duplication**: Similar modules exist across multiple blueprints
- **Maintenance Overhead**: Updates must be applied to multiple blueprints
- **Larger Repository**: More code overall due to duplication

### Impact

- **Project Delivery**: Faster client handover, less dependency management
- **Client Satisfaction**: Clients can maintain and modify independently
- **Repository Size**: Larger repository, but acceptable trade-off
- **Maintenance**: Requires discipline to keep blueprints consistent

## Notes

This decision is fundamental to the repository's purpose. It ensures that every blueprint can be copied and owned by clients without any ustwo dependencies. Code duplication is intentional and acceptable to achieve client independence.
