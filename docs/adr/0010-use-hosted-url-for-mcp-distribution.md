# Use hosted URL for MCP distribution

Date: 2026-02-06
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

Teams need a simple way to use the company MCP server when working on client projects. Options include running the server locally (Docker/stdio or npm) or connecting to a hosted HTTP endpoint via a single URL in their MCP client configuration.

Key considerations:

- **Setup friction**: Local Docker or npm run adds steps and environment differences per machine.
- **Consistency**: A single hosted endpoint gives everyone the same version and behaviour.
- **Operational cost**: One central service to maintain versus many local installs.

## Decision

Prefer a **hosted MCP HTTP server** (e.g. on company infrastructure behind HTTPS) as the primary distribution. Users add one URL to their MCP config (e.g. `mcp.json`); no local Docker or npm run is required.

The hosted server should expose the MCP HTTP/SSE endpoint with appropriate timeouts and keep-alive so long-lived connections are stable behind reverse proxies.

## Alternatives Considered

1. **Docker/stdio (run locally)**
   - Pros: Works air-gapped, full control on the client machine.
   - Cons: More setup, per-machine differences, everyone must run Docker and the right image.

2. **npm run (local process)**
   - Pros: No Docker required, uses Node directly.
   - Cons: Still per-machine setup, version drift, need to keep Node and deps in sync.

3. **Hosted HTTP URL (chosen)**
   - Pros: One-step config (single URL), single place to operate and update, consistent behaviour.
   - Cons: Requires running and maintaining the HTTP MCP service and tuning SSE timeouts/keep-alive (e.g. Caddy and transport).

## Consequences

**Benefits:**

- One-step configuration (add URL to MCP config).
- Single service to operate, update, and monitor.
- Consistent behaviour and version for all users.

**Risks and operational requirements:**

- The company must run and maintain the HTTP MCP service (e.g. on company Linux behind Caddy/HTTPS).
- Long-lived SSE connections require tuned timeouts and keep-alive (reverse proxy and transport) so connections are not closed prematurely.

**Impact:**

- Caddy (or equivalent) reverse-proxy timeout for the MCP path should be increased (e.g. to 300s) so SSE is not cut off.
- SSE transport keep-alive interval should be short enough (e.g. 15s) to avoid proxy idle timeouts.
