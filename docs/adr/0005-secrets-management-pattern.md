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

**Flow B: Third-Party Secrets (API Keys, OAuth Credentials)**
- Terraform creates empty secret "shells" in AWS Secrets Manager
- Engineers seed actual values manually via CLI or console after `terraform apply`
- Applications read secrets at runtime via AWS SDK
- Terraform ignores changes to secret values (managed outside Terraform)

Both flows use consistent naming: `/{env}/{app}/{purpose}` (e.g., `/dev/myapp/db-credentials`)

## Alternatives Considered

1. **Store passwords in Terraform state**
   - Description: Use standard Terraform variables or outputs for passwords
   - Pros: Simple, no additional setup required
   - Cons: Passwords stored in plaintext in state files, security risk, violates client handover requirements

2. **AWS Secrets Manager with manual password rotation**
   - Description: Create secrets manually, Terraform references them
   - Pros: Full control over secret lifecycle
   - Cons: Operational overhead, requires manual coordination, harder to automate

3. **AWS Systems Manager Parameter Store**
   - Description: Use Parameter Store instead of Secrets Manager
   - Pros: Lower cost, simpler API
   - Cons: Less secure (no automatic encryption at rest for standard parameters), no versioning, doesn't align with engineering standard

4. **Environment variables in application code**
   - Description: Store secrets as environment variables, pass via Terraform
   - Pros: Simple for applications to consume
   - Cons: Secrets appear in Terraform configuration, risk of exposure in version control

5. **External secret management (HashiCorp Vault, etc.)**
   - Description: Use dedicated secret management service
   - Pros: Advanced features, rotation, audit logging
   - Cons: Additional infrastructure, complexity, not aligned with standalone blueprint principle

## Consequences

**Benefits:**
- Passwords never stored in Terraform state - eliminates security risk
- Clear separation between Terraform-generated and third-party secrets
- Standardized approach across all blueprints
- Aligns with terraform-secrets-poc engineering standard
- Works consistently across AWS, Azure, and GCP blueprints
- Clear naming convention makes secrets discoverable
- Governance tags enable compliance and auditing

**Risks:**
- Requires Terraform 1.11+ (for ephemeral values and write-only attributes)
- Flow B requires manual secret seeding - engineers must remember to seed values
- Applications must be updated to use IAM Database Authentication (Flow A)
- Secret rotation requires manual process for Flow B

**Mitigations:**
- Document secret seeding process clearly in blueprint READMEs
- Provide example commands for seeding secrets
- Use governance tags to track secret lifecycle
- Include secret management in blueprint testing where possible

**Impact:**
- All blueprints with databases use Flow A pattern
- All blueprints with third-party integrations use Flow B pattern
- Consistent secret naming convention: `/{env}/{app}/{purpose}`
- All secrets include governance tags: `SecretFlow`, `SecretType`, `DataClass`
- Terraform version requirement: >= 1.11
- AWS Provider requirement: >= 5.0

## Notes

This pattern is based on the terraform-secrets-poc engineering standard. The two-flow approach provides flexibility while maintaining security:

- **Flow A** is ideal for resources Terraform creates (databases) where we control the password lifecycle
- **Flow B** is ideal for external secrets (Stripe API keys, OAuth credentials) where values come from third parties

Blueprints using Flow A:
- `alb-ecs-fargate-rds`
- `apigw-lambda-aurora`
- `apigw-lambda-rds`
- `apigw-lambda-rds-proxy`

Blueprints using Flow B:
- `eks-argocd` (for third-party API keys)
- Any blueprint requiring external service credentials

The pattern ensures that when blueprints are copied to client projects, secrets remain secure and manageable without requiring additional infrastructure or complex tooling.
