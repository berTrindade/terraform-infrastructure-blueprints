---
name: update-documentation
description: Update documentation following progressive disclosure pattern. Use when updating docs, adding content, or modifying AGENTS.md.
---

# Update Documentation

## Overview

This skill guides updating documentation while maintaining the progressive disclosure pattern. The root `AGENTS.md` must stay minimal (~10-15 lines), with detailed content in domain-specific files.

## When to Use

- Updating blueprint catalog
- Adding new workflows or scenarios
- Documenting new patterns
- Adding customization examples
- Modifying `AGENTS.md`
- Adding documentation content

## Instructions

### Step 1: Determine Content Type

Identify what type of content needs updating:

- **Blueprint catalog** → `docs/blueprints/catalog.md`
- **Workflows/scenarios** → `docs/blueprints/workflows.md`
- **Patterns** → `docs/blueprints/patterns.md`
- **Customization examples** → `docs/blueprints/customization.md`
- **Root AGENTS.md** → Only minimal updates (see rules below)

### Step 2: Follow Progressive Disclosure Rules

#### Root `AGENTS.md` Rules

**CRITICAL**: The root `AGENTS.md` must remain minimal (~10-15 lines).

**What to include in root `AGENTS.md`:**
- ✅ One-sentence project description
- ✅ Key principle (standalone, self-contained blueprints)
- ✅ Consultancy model (clients own the code)
- ✅ References to detailed documentation files

**What NOT to include in root `AGENTS.md`:**
- ❌ Detailed blueprint catalogs
- ❌ Workflow descriptions
- ❌ Pattern details
- ❌ Customization examples
- ❌ Long explanations

#### Domain-Specific Files

Update the appropriate domain-specific file:

**`docs/blueprints/catalog.md`**
- Blueprint catalog with descriptions
- Decision trees
- Cross-cloud equivalents
- Blueprint structure documentation

**`docs/blueprints/workflows.md`**
- Usage scenarios
- Step-by-step workflows
- Common tasks

**`docs/blueprints/patterns.md`**
- Key patterns (secrets, naming, VPC)
- Extractable patterns
- Best practices

**`docs/blueprints/customization.md`**
- Common customizations
- Commands reference
- Constraints

### Step 3: Update the Appropriate File

1. Navigate to the correct domain-specific file
2. Add or modify content following the existing structure
3. Maintain consistency with existing documentation style
4. Ensure content is well-organized and discoverable

### Step 4: Verify Root `AGENTS.md`

After updating domain-specific files, verify the root `AGENTS.md`:

1. **Check length**: Should be ~10-15 lines
2. **Check references**: Links to domain-specific files are correct
3. **Check content**: Only includes minimal essential information
4. **No detailed content**: Remove any detailed content that should be in domain files

### Step 5: Update References (if needed)

If you added a new domain-specific file, ensure:
- Root `AGENTS.md` references it (if appropriate)
- Other documentation files reference it (if needed)
- Links are correct and working

## Progressive Disclosure Pattern

The progressive disclosure pattern minimizes token consumption:

```
Root AGENTS.md (minimal)
    ↓ references
Domain-specific files (detailed)
    ↓ loaded on demand
Specific content needed for task
```

**Why this matters:**
- AI assistants load `AGENTS.md` on every request
- Detailed content should be in referenced files loaded only when needed
- This reduces token consumption and improves response efficiency

## Checklist

### Before Updating
- [ ] Identified the correct domain-specific file
- [ ] Confirmed root `AGENTS.md` should not be updated with detailed content

### When Updating Domain Files
- [ ] Content added to correct domain-specific file
- [ ] Structure and style consistent with existing content
- [ ] Content is well-organized and discoverable

### After Updating
- [ ] Root `AGENTS.md` remains minimal (~10-15 lines)
- [ ] References in root `AGENTS.md` are correct
- [ ] No detailed content added to root `AGENTS.md`
- [ ] Domain-specific file updated correctly

## Examples

### ✅ Correct: Adding Blueprint to Catalog

**Action**: Add new blueprint to catalog

1. Update `docs/blueprints/catalog.md` with new blueprint entry
2. Do NOT add detailed description to root `AGENTS.md`
3. Ensure root `AGENTS.md` still references `catalog.md`

### ✅ Correct: Adding New Workflow

**Action**: Document new workflow scenario

1. Update `docs/blueprints/workflows.md` with new workflow
2. Do NOT add workflow details to root `AGENTS.md`
3. Ensure root `AGENTS.md` still references `workflows.md`

### ❌ Incorrect: Adding Details to Root

**Action**: Adding blueprint catalog to root `AGENTS.md`

**Problem**: Root `AGENTS.md` grows beyond 10-15 lines
**Solution**: Move content to `docs/blueprints/catalog.md` and reference it

## References

- [ADR-0006: Progressive Disclosure](../docs/adr/0006-progressive-disclosure-agents.md) - Rationale and decision
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Documentation standards and maintenance rules
- [AGENTS.md](../AGENTS.md) - Root file (keep minimal)
- [Blueprint Catalog](../docs/blueprints/catalog.md) - Blueprint catalog
- [Workflows](../docs/blueprints/workflows.md) - Workflow documentation
- [Patterns](../docs/blueprints/patterns.md) - Pattern documentation
- [Customization](../docs/blueprints/customization.md) - Customization examples
