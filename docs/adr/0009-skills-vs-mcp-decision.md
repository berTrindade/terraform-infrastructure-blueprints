# Skills vs MCP: When to use each approach

Date: 2026-01-30
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

When designing how to share blueprint knowledge with AI assistants, we needed to decide between two approaches: **Skills** (local reference guides) and **MCP** (Model Context Protocol - live connections). This decision impacts how fast AI assistants respond, how easy they are to maintain, and how well they perform.

**What are Skills?** Think of Skills as reference books installed directly in your AI assistant. They contain knowledge that doesn't change often, like blueprint patterns and best practices. When you ask a question, the AI can instantly look it up locally without making network calls.

**What is MCP?** Think of MCP as a live connection to a searchable catalog. It lets AI assistants ask questions in real-time, search for blueprints, and get recommendations. It's like having a librarian who can search the entire library for you.

**The Challenge:** We needed to figure out when to use each approach. Using too many live connections (MCP) can slow down your IDE, especially in large organizations. But we also need interactive discovery capabilities that static reference guides can't provide.

Key considerations:

- **Performance**: Too many live connections can slow down IDE startup and operations
- **Update frequency**: Information that doesn't change often doesn't need real-time fetching
- **Developer experience**: Local reference guides provide instant access without network calls
- **Maintenance**: Different update mechanisms for static vs dynamic content

## Decision

Use a **hybrid approach** - combine both methods based on what type of information you're sharing:

### Use Skills (Local Reference Guides) For

- **Information that doesn't change often** - like blueprint patterns and best practices
- **Blueprint code patterns** - Terraform files, module structures, architectural patterns
- **Documentation** - guides and references that are updated via releases, not in real-time

**Why?** Skills are like having a reference book on your desk - instant access, no waiting for network calls. They keep your IDE fast because everything is local. Perfect for information that's stable and doesn't need to be fetched fresh every time.

**Real-world analogy**: Like having a printed manual vs calling a help desk. The manual is faster for common questions, but you call the help desk when you need something specific or up-to-the-minute.

### Use MCP (Live Connections) For

- **Information that changes frequently** - needs to be fresh and current
- **Discovery and recommendations** - when you need help finding the right blueprint
- **Real-time data** - from databases or external systems that update constantly
- **Interactive search** - when you need to search, filter, or ask specific questions

**Why?** MCP is like having a live connection to a searchable database. It's perfect when you need to find something specific or get recommendations based on your current needs. The trade-off is it requires a network connection, which can slow things down if you have too many.

**Real-world analogy**: Like calling a librarian vs reading a book. The librarian can search the entire catalog and give you personalized recommendations, but it takes a moment. The book is instant but limited to what's printed.

## Current Implementation

Our current architecture already follows this pattern:

### Internal Development (This Repository)

1. **Skills** (`.cursor/skills/`): Used for **development workflows**
   - `create-blueprint/` - Scaffold new blueprints following repository standards
   - `validate-blueprint/` - Validate blueprint structure and quality
   - `release-mcp-server/` - Automated release workflows for MCP server
   - `update-documentation/` - Update docs following progressive disclosure pattern

2. **MCP Server** (`mcp-server/`): Used for **discovery and recommendation**
   - `recommend_blueprint()` - Interactive recommendation based on requirements
   - `extract_pattern()` - Dynamic pattern extraction guidance
   - `search_blueprints()` - Search and filtering capabilities
   - `find_by_project()` - Cross-cloud equivalent discovery
   - Published as `@bertrindade/infra-mcp` (npm) and `ghcr.io/bertrindade/infra-mcp` (Docker)

### Client Projects

1. **Blueprint Skill Package** (`packages/blueprint-skill/`): Distributes Skills to client projects
   - Published as `@bertrindade/blueprint-skill` on GitHub Packages
   - Installs `blueprint-guidance` skill to guide AI assistants
   - Updates `AGENTS.md` with blueprint references
   - Works alongside MCP server for complete blueprint awareness

2. **Blueprint Content**: Static Terraform code that changes infrequently
   - Blueprints are updated via Git commits and releases
   - Content is relatively stable (architecture patterns, not dynamic data)

## Alternatives Considered

1. **Live Connections Only (MCP Only)**
   - Description: Use only live connections for all blueprint information
   - Pros: One system to maintain, always has the latest information
   - Cons: Slower IDE performance (too many network calls), unnecessary delays for information that doesn't change, doesn't scale well in large organizations

2. **Local Reference Guides Only (Skills Only)**
   - Description: Use only local reference guides for all blueprint knowledge
   - Pros: Very fast access, no network calls needed
   - Cons: Can't search or discover blueprints interactively, harder to find what you need, requires manual updates when information changes

3. **Hybrid Approach (Chosen)**
   - Description: Use live connections for discovery and searching, local guides for reference
   - Pros: Best of both worlds - instant answers for common questions, interactive help when you need to find something
   - Cons: Two systems to maintain, but they solve different problems so it's worth the complexity

## Consequences

**Benefits:**

- **Performance**: Local reference guides (Skills) provide instant answers without waiting for network calls
- **Scalability**: Fewer live connections means faster IDE startup and less server load
- **Developer Experience**: Common questions get answered instantly from local guides
- **Clear Separation**: Use live connections (MCP) to discover what you need, then use local guides (Skills) to reference how to use it

**Risks:**

- **Maintenance**: We need to keep both systems updated, though local guides update less often (only when we release new versions)
- **Complexity**: Two systems to maintain instead of one, but they serve different purposes
- **Coordination**: We need to make sure recommendations from live connections match what's in the local guides

**Impact:**

- **MCP Server**: Continue using for discovery, recommendation, and interactive workflows
- **Internal Skills**: Already implemented for development workflows (create, validate, release, docs)
- **Client Skills**: Already implemented via `@bertrindade/blueprint-skill` package
- **Documentation**: Updated to clarify when to use each approach

## Notes

### When Content Changes Frequently

If blueprint patterns start changing very frequently (e.g., daily updates from a central pattern library), consider:

- Moving to MCP for that specific content
- Using a hybrid: Skills for stable patterns, MCP for frequently updated ones

### Internal Marketplace Pattern

Industry best practices suggest an "internal marketplace" pattern where:

- Teams publish Skills to a central repository
- Developers install Skills locally
- Updates happen via releases (not real-time)
- This avoids HTTP calls on every use

This aligns with our blueprint distribution model where blueprints are:

- Published to GitHub
- Copied/downloaded by developers
- Updated via Git releases
- Used locally without network dependencies

### Current Architecture Summary

**Internal Development:**

- ✅ Skills for development workflows (create, validate, release, docs)
- ✅ MCP Server for blueprint discovery and recommendations

**Client Projects:**

- ✅ `@bertrindade/blueprint-skill` package installs Skills for blueprint guidance
- ✅ MCP Server (optional) for interactive discovery
- ✅ Hybrid approach: Skills provide static patterns, MCP provides interactive discovery

### Future Considerations

- **Pattern Skills**: Consider creating Skills for common blueprint patterns (e.g., "RDS pattern", "Lambda API pattern") for client projects
- **MCP Enhancement**: Keep MCP focused on discovery and recommendation workflows
- **Hybrid Workflows**: Use MCP to find what you need, then reference Skills for detailed patterns

## References

- [ADR 0003: MCP Server for AI-Assisted Blueprint Discovery](./0003-mcp-server-ai-discovery.md)
- [Model Context Protocol (MCP) - GitHub Copilot Documentation](https://docs.github.com/enterprise-cloud@latest/copilot/concepts/about-mcp)
- [Extending GitHub Copilot Chat with MCP Servers](https://docs.github.com/enterprise-cloud@latest/copilot/how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp)
- [Using MCP Tools with Agents - Microsoft Agent Framework](https://learn.microsoft.com/agent-framework/user-guide/model-context-protocol/using-mcp-tools)
