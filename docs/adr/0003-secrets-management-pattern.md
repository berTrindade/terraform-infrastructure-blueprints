# Secrets Management Pattern

Date: 2026-01-24
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

All blueprints in this repository handle secrets (passwords, API keys, credentials) in a standardized way to ensure security and prevent secrets from appearing in Terraform state files. This is critical for client handover scenarios where infrastructure code must be secure and maintainable.

Key requirements:
- Passwords and credentials must never be stored in Terraform state
- Secrets must be accessible to applications at runtime
- The approach must work across all cloud providers (AWS, Azure, GCP)
- Engineers must be able to manage secrets without exposing them in version control
- The pattern must align with the terraform-secrets-poc engineering standard

The challenge was finding a pattern that works for both Terraform-generated secrets (like database passwords) and third-party secrets (like API keys from external services).

## Decision

Use a two-flow pattern for secrets management:

**Flow A: Terraform-Generated Secrets (Database Passwords)**
- Use Terraform 1.11+ `ephemeral "random_password"` to generate passwords
- Send passwords to resources via write-only attributes (`password_wo`, `master_password_wo`)
- Store connection metadata (host, port, username) in AWS Secrets Manager
- Applications use IAM Database Authentication instead of passwords
- Password never appears in Terraform state

**Flow B: Third-Party Secrets (API Keys, External Credentials)**
- Store secrets in AWS Secrets Manager (or equivalent cloud service)
- Reference secrets by ARN in Terraform
- Applications retrieve secrets at runtime via IAM permissions
- Secrets never appear in Terraform code or state

## Alternatives Considered

1. **Store Passwords in Terraform Variables**
   - Pros: Simple, straightforward
   - Cons: Passwords appear in state files, security risk, violates requirements
   - Rejected: Security vulnerability

2. **Use External Secret Management Only**
   - Pros: Centralized, consistent approach
   - Cons: Requires external setup before Terraform, more complex for generated secrets
   - Rejected: Too complex for Terraform-generated secrets

3. **Use Terraform Workspaces with Different Backends**
   - Pros: Isolates secrets per environment
   - Cons: Doesn't solve state file exposure, adds complexity
   - Rejected: Doesn't address core security concern

## Consequences

### Benefits

- **Security**: Secrets never appear in Terraform state files
- **Compliance**: Meets security requirements for client handover
- **Flexibility**: Works for both generated and external secrets
- **Cloud Agnostic**: Pattern works across AWS, Azure, GCP
- **Standards Alignment**: Follows terraform-secrets-poc engineering standard

### Trade-offs

- **Terraform Version**: Requires Terraform 1.11+ for ephemeral values
- **Complexity**: Two flows to understand and maintain
- **IAM Setup**: Requires IAM database authentication configuration

### Impact

- **Security Posture**: Significantly improved, no secrets in state
- **Client Handover**: Secure, maintainable code
- **Developer Experience**: Must understand two flows, but clear pattern
- **Compatibility**: Limits to Terraform 1.11+ for blueprints using ephemeral values

## Notes

This pattern is critical for security and client handover. All blueprints using databases (RDS, Aurora, RDS Proxy) must follow Flow A. Blueprints using external APIs must follow Flow B. The pattern is documented in `docs/blueprints/patterns.md` for reference.
