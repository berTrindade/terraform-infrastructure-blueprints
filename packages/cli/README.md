# @bertrindade/agent-skills

CLI to install and manage skills for AI coding agents, specifically designed for Terraform infrastructure blueprints.

## Installation

```bash
npm install -g @bertrindade/agent-skills
```

Or use directly with npx:

```bash
npx @bertrindade/agent-skills
```

## Usage

### Interactive Installation (Default)

```bash
ustwo-skills
# or
ustwo-skills install
```

This will launch an interactive wizard to:
1. Browse skills by category
2. Select skills to install
3. Choose target agents
4. Configure installation method (symlink or copy)
5. Choose installation scope (local or global)

### Non-Interactive Installation

```bash
# Install a specific skill
ustwo-skills install --skill blueprint-guidance

# Install to specific agents
ustwo-skills install --skill blueprint-guidance --agent cursor claude-code

# Use copy instead of symlink
ustwo-skills install --skill blueprint-guidance --copy

# Install globally
ustwo-skills install --skill blueprint-guidance --global
```

### List Available Skills

```bash
ustwo-skills list
```

### Remove Skills

```bash
# Interactive removal
ustwo-skills remove

# Remove specific skill
ustwo-skills remove --skill blueprint-guidance

# Remove from specific agents
ustwo-skills remove --skill blueprint-guidance --agent cursor

# Remove from global installation
ustwo-skills remove --skill blueprint-guidance --global
```

## Available Skills

- **blueprint-guidance**: Guide AI assistants to reference infrastructure blueprint patterns when writing Terraform code
- **blueprint-catalog**: Blueprint catalog with decision trees, cross-cloud equivalents, and blueprint structure
- **blueprint-patterns**: Common infrastructure patterns from blueprints (ephemeral passwords, IAM auth, VPC, naming)

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Test

```bash
npm test
```

### Type Check

```bash
npm run typecheck
```

## Architecture

This CLI is built without NX dependencies, using:
- **esbuild** for bundling
- **jest** for testing
- **TypeScript** for type safety
- **commander** for CLI interface
- **@clack/prompts** for interactive prompts

## Skills Directory Structure

Skills are located in the `skills/` directory:

```
skills/
├── categories.json         # Skill category mappings
├── categories.schema.json  # JSON schema for categories
├── blueprint-guidance/     # Skill 1
│   └── SKILL.md
├── blueprint-catalog/      # Skill 2
│   └── SKILL.md
└── blueprint-patterns/     # Skill 3
    └── SKILL.md
```

Each skill must have a `SKILL.md` file with frontmatter:

```markdown
---
name: skill-name
description: Skill description
---
```

## License

MIT
