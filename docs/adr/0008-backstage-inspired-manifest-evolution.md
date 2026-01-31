# Backstage-Inspired Manifest Evolution

Date: 2026-01-31
Owner: Bernardo Trindade de Abreu
Status: Proposed
Inspired by: Felipe's vision and Backstage's catalog-info.yaml approach

## Context

Felipe's vision: "In the first scenario, the fetch works as if the LLM were consulting a company best practices manual to design the ideal solution. In the second, the skill becomes a technical assembly line that only delivers the ready piece, saving enormous processing time. This YAML manifest idea is the path to make everything scalable. If you follow this logic of having a configuration file in each blueprint, your skill becomes agnostic and you can plug new patterns without needing to modify the tool's intelligence all the time. It's basically what backstage does"

Current state:

- ✅ Manifests exist in `blueprints/manifests/` with snippet definitions
- ✅ Skill reads manifests dynamically
- ✅ Templates are parameterized and reusable
- ⚠️ Some blueprint-specific logic still exists in MCP server constants
- ⚠️ Catalog information is duplicated (in skills, MCP constants, and manifests)

## Decision

Evolve the manifest system to be the **single source of truth** for blueprint metadata, following Backstage's catalog-info.yaml pattern:

### 1. Enhanced Manifest Structure

Each blueprint manifest becomes a complete metadata file:

```yaml
# blueprints/manifests/apigw-lambda-rds.yaml
apiVersion: blueprint.ustwo.io/v1
kind: Blueprint
metadata:
  name: apigw-lambda-rds
  title: Serverless REST API with RDS PostgreSQL
  description: Production-tested serverless API pattern with PostgreSQL database
  tags:
    - serverless
    - api
    - postgresql
    - sync
  cloud: aws
  origin: "NBCU Loyalty Build (Backlot) - Web app for fan loyalty & quest rewards (ustwo, 2025)"
  
spec:
  database: postgresql
  pattern: sync
  components:
    - api-gateway
    - lambda
    - rds
    - vpc
  
  # Template generation snippets
  snippets:
    - id: rds-module
      name: RDS PostgreSQL Module
      description: Complete RDS module with ephemeral passwords (Flow A)
      template: rds-module.tf.template
      output_file: modules/data/main.tf
      variables:
        # ... existing variable definitions
      dependencies:
        - ephemeral-password
  
  # Cross-cloud equivalents
  equivalents:
    azure: functions-postgresql
    gcp: appengine-cloudsql-strapi
  
  # Decision tree metadata
  decision:
    when:
      - "Need serverless API"
      - "Need relational database"
      - "Need SQL queries"
    not_when:
      - "Need GraphQL (use appsync-lambda-aurora-cognito)"
      - "Need NoSQL (use apigw-lambda-dynamodb)"
```

### 2. Manifest as Single Source of Truth

**Before (Current)**:

- Blueprint info in `mcp/src/config/constants.ts` (hardcoded)
- Blueprint info in `skills/blueprint-catalog/SKILL.md` (static)
- Blueprint info in `blueprints/manifests/*.yaml` (for templates only)

**After (Proposed)**:

- All blueprint metadata in `blueprints/manifests/*.yaml`
- MCP server reads manifests dynamically
- Skills reference manifests when needed
- Catalog is generated from manifests

### 3. Dynamic Discovery

**MCP Server Evolution**:

```typescript
// Instead of hardcoded constants
export const BLUEPRINTS: Blueprint[] = [ /* ... */ ];

// Read manifests dynamically
async function discoverBlueprints(): Promise<Blueprint[]> {
  const manifestDir = join(repoRoot, 'blueprints', 'manifests');
  const files = await readdir(manifestDir);
  
  return Promise.all(
    files
      .filter(f => f.endsWith('.yaml'))
      .map(f => loadManifest(f.replace('.yaml', '')))
  );
}
```

### 4. Skill Agnosticism

**Current**: Skill knows about specific blueprints
**Proposed**: Skill only knows about manifest structure

```markdown
# blueprint-guidance/SKILL.md

## How to Use

1. Discover blueprints by reading manifests from `blueprints/manifests/`
2. For each blueprint, read its manifest to understand:
   - What it does (metadata.description)
   - When to use it (spec.decision.when)
   - Available snippets (spec.snippets)
3. Generate code using manifest-defined templates
```

## Implementation Plan

### Phase 1: Enhance Manifest Schema

- [ ] Add metadata section (name, title, description, tags, cloud, origin)
- [ ] Add spec section (database, pattern, components)
- [ ] Add equivalents section (cross-cloud mappings)
- [ ] Add decision section (when/not_when)

### Phase 2: Migrate Existing Data

- [ ] Move blueprint info from `constants.ts` to manifests
- [ ] Move catalog info from `SKILL.md` to manifests
- [ ] Keep snippets section (already exists)

### Phase 3: Update MCP Server

- [ ] Replace hardcoded `BLUEPRINTS` array with dynamic manifest loading
- [ ] Update `PROJECT_BLUEPRINTS` to read from manifests
- [ ] Add manifest discovery endpoint

### Phase 4: Update Skills

- [ ] Update `blueprint-catalog` to read from manifests
- [ ] Update `blueprint-guidance` to reference manifest structure
- [ ] Keep `blueprint-template-generator` as-is (already manifest-based)

## Benefits

### Scalability

- **Add new blueprint**: Create manifest file, no code changes
- **Update blueprint info**: Edit manifest, all systems update
- **Remove blueprint**: Delete manifest, system adapts

### Consistency

- **Single source of truth**: All info in manifests
- **No duplication**: Catalog, MCP, skills all read same source
- **Version control**: Manifest changes tracked in git

### Agnosticism

- **Skill doesn't know blueprints**: Only knows manifest structure
- **MCP doesn't hardcode**: Discovers blueprints dynamically
- **Easy to extend**: Add new manifest fields without breaking existing code

## Trade-offs

### Initial Migration

- **Effort**: Must migrate existing data to manifests
- **Risk**: Need to ensure all systems read manifests correctly
- **Testing**: Verify all tools work with new structure

### Manifest Complexity

- **Larger files**: More metadata per manifest
- **Learning curve**: Developers must understand manifest schema
- **Validation**: Need schema validation for manifests

## Comparison to Backstage

| Aspect | Backstage | Our System |
|--------|-----------|------------|
| **Metadata File** | `catalog-info.yaml` | `blueprints/manifests/{name}.yaml` |
| **Discovery** | Scans for catalog-info.yaml files | Scans for manifest YAML files |
| **Single Source** | ✅ Yes | ✅ Yes (after migration) |
| **Dynamic** | ✅ Yes | ✅ Yes (after migration) |
| **Agnostic** | ✅ Yes | ✅ Yes (after migration) |

## Next Steps

1. **Review this ADR** with team
2. **Create manifest schema** (JSON Schema for validation)
3. **Migrate one blueprint** as proof of concept
4. **Update MCP server** to read manifests
5. **Update skills** to reference manifests
6. **Migrate remaining blueprints**

## References

- [ADR 0007: Manifest-Based Template Generation](./0007-manifest-based-template-generation.md)
- [Backstage Catalog Model](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- Current manifests: `blueprints/manifests/*.yaml`
- Current MCP constants: `mcp/src/config/constants.ts`
