# Infrastructure Blueprint Guidance

This project uses infrastructure blueprint patterns from ustwo's Terraform Infrastructure Blueprints repository. AI assistants should reference these production-tested patterns when writing Terraform code.

**Key principle**: Reference blueprint patterns before writing generic Terraform code.

**Consultancy model**: When engagements end, clients own the code. Generated Terraform must be completely standalone with zero external dependencies.

## MCP Server Configuration

To enable blueprint discovery, configure the MCP server:

1. Install MCP server: See [mcp-server/README.md](https://github.com/berTrindade/terraform-infrastructure-blueprints/tree/main/mcp-server#quick-start)
2. Configure in Cursor: Add to `~/.cursor/mcp.json`
3. Restart Cursor to activate

## Available MCP Tools

Once configured, AI assistants can use:

- `recommend_blueprint()` - Get blueprint recommendations
- `extract_pattern()` - Extract capabilities from blueprints
- `search_blueprints()` - Search blueprint catalog
- `fetch_blueprint_file()` - Get blueprint code examples
- `get_workflow_guidance()` - Get step-by-step workflow guidance

## Blueprint Patterns

Key patterns to follow:

- **Ephemeral passwords**: Use `password_wo` for databases (never in state)
- **IAM Database Authentication**: Always enable for RDS/Aurora
- **Official modules**: Use terraform-aws-modules for VPC, Lambda, etc.
- **VPC endpoints**: Use for Lambda (not NAT Gateway)
- **Standalone code**: No dependencies on blueprint repository

## References

- **Blueprint Repository**: https://github.com/berTrindade/terraform-infrastructure-blueprints
- **AI Guidelines**: [AI Assistant Guidelines](https://github.com/berTrindade/terraform-infrastructure-blueprints/blob/main/docs/ai-assistant-guidelines.md)
- **Pattern Examples**: [Wrong vs Right Examples](https://github.com/berTrindade/terraform-infrastructure-blueprints/blob/main/docs/examples/wrong-vs-right-database.md)
