# Supported Consultant Scenarios

Date: 2026-01-23
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

After expanding the repository scope to support both "copy whole blueprint" and "extract patterns" workflows (see [ADR-0002](0002-expand-scope-pattern-extraction.md)), we needed to formalize the specific scenarios consultants face when using these blueprints.

Understanding these scenarios helps:
- Guide AI assistants to provide relevant recommendations
- Ensure the MCP server tools address real needs
- Document expected workflows for new team members
- Validate that our blueprints cover common use cases

We analyzed real consulting engagements to identify the most common situations where developers need infrastructure guidance.

## Decision

The repository formally supports five core consultant scenarios:

### Scenario 1: App Exists, Need Infrastructure
**Situation:** Developer has a working fullstack app locally (e.g., React + Node.js + PostgreSQL) and needs to deploy it to AWS.

**Workflow:** Recommend appropriate blueprint based on tech stack, then copy and adapt.

**Applicable blueprints:** `alb-ecs-fargate-rds` (containerize as-is) or `apigw-lambda-rds` (refactor to serverless)

### Scenario 2: Existing Terraform, Add Capability
**Situation:** Client project already has Terraform infrastructure. New requirement needs adding (database, queue, auth, etc.).

**Workflow:** Identify which blueprint contains the pattern, extract relevant modules, adapt to existing project conventions.

**Applicable blueprints:** Any - used as pattern reference, not copied wholesale.

### Scenario 3: Client Brief Only
**Situation:** Project kickoff with only requirements document. No code exists yet.

**Workflow:** Analyze requirements, recommend blueprint, download blueprint (via git clone, GitHub CLI, etc.), customize and deploy.

**Applicable blueprints:** All - decision tree guides selection.

### Scenario 4: Add AI Features
**Situation:** Existing application needs AI/ML capabilities like document Q&A or RAG.

**Workflow:** Extract Bedrock/OpenSearch patterns from AI blueprint, integrate with existing infrastructure.

**Applicable blueprints:** `apigw-lambda-bedrock-rag`

### Scenario 5: Compare Options
**Situation:** Technical decision needed - serverless vs containers, sync vs async, DynamoDB vs RDS.

**Workflow:** Compare relevant blueprints, explain trade-offs, recommend based on requirements.

**Applicable blueprints:** Multiple - used for comparison, not deployment.

## Alternatives Considered

1. **Support only greenfield scenarios**
   - Description: Only support "start from scratch" use cases
   - Pros: Simpler tooling, clearer documentation
   - Cons: Ignores majority of real consulting work on existing projects

2. **Unlimited scenario support**
   - Description: Try to support any possible use case
   - Pros: Maximum flexibility
   - Cons: Unfocused, hard to document, AI guidance becomes generic

3. **Scenario-specific repositories**
   - Description: Separate repos for each scenario type
   - Pros: Clear separation
   - Cons: Fragmentation, maintenance overhead, harder discovery

## Consequences

**Benefits:**
- Clear guidance for AI assistants on how to respond
- Focused MCP server tools that address real needs
- Easier onboarding for new team members
- Validates blueprint coverage against actual use cases

**Risks:**
- May miss edge case scenarios
- Scenarios may evolve as consulting work changes
- Requires periodic review to ensure relevance

**Impact:**
- AGENTS.md updated with scenario documentation
- MCP server enhanced with `extract_pattern` and `compare_blueprints` tools
- Test coverage for all five scenarios

## Notes

These scenarios were derived from analyzing ustwo consulting engagements. They should be reviewed annually to ensure they still reflect how the team works.
