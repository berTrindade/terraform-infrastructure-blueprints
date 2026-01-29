---
name: release-mcp-server
description: Guide to MCP server automated release process using semantic-release. Use when releasing, versioning, or understanding the release workflow.
---

# Release MCP Server

## Overview

This skill explains the MCP server's fully automated release process. Releases are handled automatically by semantic-release based on conventional commit messages. No manual versioning or publishing is required.

## When to Use

- Understanding how MCP server releases work
- Planning version bumps for MCP server changes
- Explaining the release workflow
- Troubleshooting release issues

## Instructions

### Step 1: Understand Automated Releases

The MCP server uses **fully automated releases** via [semantic-release](https://github.com/semantic-release/semantic-release). This means:

- ✅ No manual versioning
- ✅ No manual changelog generation
- ✅ No manual git tagging
- ✅ No manual publishing
- ✅ Everything happens automatically on push to `main`

### Step 2: Commit Format Requirements

Use [Conventional Commits](https://www.conventionalcommits.org/) format for MCP server changes:

#### Version Bump Rules

| Commit Type | Version Bump | Example |
|------------|--------------|----------|
| `feat:` | Minor (1.0.0 → 1.1.0) | `feat: add new blueprint recommendation` |
| `fix:` | Patch (1.0.0 → 1.0.1) | `fix: correct blueprint path validation` |
| `feat!:` | Major (1.0.0 → 2.0.0) | `feat!: change API response format` |
| `chore:` | No release | `chore: update dependencies` |

#### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**
```bash
feat(mcp-server): add new blueprint recommendation endpoint
fix(mcp-server): correct path validation for blueprint files
feat(mcp-server)!: change API response format to include metadata
chore(mcp-server): update dependencies
```

**Important**: Only commits that modify files in `mcp-server/**` trigger releases.

### Step 3: What Happens on Push to Main

When you push to `main` (and `mcp-server/**` files changed):

1. **Tests run** - CI ensures code quality
2. **semantic-release analyzes commits** - Checks for conventional commit format
3. **If release needed** (based on commit types):
   - Version bumped automatically
   - `CHANGELOG.md` generated
   - Git tag created (`v1.2.3`)
   - GitHub Release created with changelog
   - npm package published to GitHub Packages
   - Docker image built and pushed to GHCR:
     - Versioned tag: `ghcr.io/bertrindade/infra-mcp:1.2.3`
     - Latest tag: `ghcr.io/bertrindade/infra-mcp:latest`
4. **If no release needed** - Workflow completes (no version change)

### Step 4: How Developers Get Updates

Developers configured with `--pull always` automatically receive updates:

**Docker Configuration:**
```json
{
  "mcpServers": {
    "ustwo-infra": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--pull", "always", "ghcr.io/bertrindade/infra-mcp:latest"]
    }
  }
}
```

**Automatic Update Process:**
- ✅ **No manual pull needed** - Docker pulls latest on each connection
- ✅ **No restart required** - Cursor reconnects with new image automatically
- ✅ **Zero developer action** - Updates happen transparently

### Step 5: Release Artifacts

Each release automatically creates:

- **Git tag**: `v1.2.3` (e.g., `v1.2.3`)
- **GitHub Release**: With auto-generated changelog
- **npm package**: `@bertrindade/infra-mcp@1.2.3` (published to GitHub Packages)
- **Docker images**:
  - `ghcr.io/bertrindade/infra-mcp:1.2.3` (versioned)
  - `ghcr.io/bertrindade/infra-mcp:latest` (always latest)

## Workflow Summary

```
Developer commits with conventional format
    ↓
Push to main branch
    ↓
CI runs tests
    ↓
semantic-release analyzes commits
    ↓
If release needed:
    - Version bump
    - Changelog generation
    - Git tag
    - GitHub Release
    - npm publish
    - Docker build & push
    ↓
Developers get updates automatically (--pull always)
```

## Common Scenarios

### Scenario 1: Adding a New Feature

**Action**: Add new MCP tool or endpoint

**Commit**:
```bash
feat(mcp-server): add blueprint comparison tool
```

**Result**: Minor version bump (1.0.0 → 1.1.0), automatic release

### Scenario 2: Fixing a Bug

**Action**: Fix validation bug

**Commit**:
```bash
fix(mcp-server): correct blueprint path validation
```

**Result**: Patch version bump (1.0.0 → 1.0.1), automatic release

### Scenario 3: Breaking Change

**Action**: Change API response format

**Commit**:
```bash
feat(mcp-server)!: change API response format
```

**Result**: Major version bump (1.0.0 → 2.0.0), automatic release

### Scenario 4: No Release Needed

**Action**: Update dependencies or documentation

**Commit**:
```bash
chore(mcp-server): update dependencies
```

**Result**: No release (workflow completes without version change)

## Troubleshooting

### Release Not Triggered

**Possible causes:**
1. No `mcp-server/**` files changed
2. Commit doesn't follow conventional format
3. Commit type is `chore:` (no release)
4. CI workflow failed before semantic-release

**Solution**: Check commit format and ensure `mcp-server/**` files were modified

### Wrong Version Bump

**Possible causes:**
1. Used wrong commit type
2. Breaking change not marked with `!`

**Solution**: Use correct commit type (`feat:`, `fix:`, `feat!:`) for desired version bump

## Checklist

### Before Committing
- [ ] Commit follows conventional format
- [ ] Commit type matches desired version bump
- [ ] Breaking changes marked with `!`
- [ ] Changes are in `mcp-server/**` directory

### After Pushing
- [ ] CI tests pass
- [ ] semantic-release runs successfully
- [ ] Version bumped correctly (if release needed)
- [ ] Release artifacts created (if release needed)

## References

- [mcp-server/README.md](../mcp-server/README.md) - MCP server documentation and release process
- [semantic-release](https://github.com/semantic-release/semantic-release) - Automated release tool
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message format
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Commit message guidelines
