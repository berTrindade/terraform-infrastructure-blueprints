/**
 * Type declarations for @modelcontextprotocol/sdk deep imports
 * These declarations ensure TypeScript can resolve types for deep imports
 * that aren't explicitly exported in the package.json exports field.
 */

declare module "@modelcontextprotocol/sdk/server/mcp.js" {
  export { McpServer } from "@modelcontextprotocol/sdk/dist/esm/server/mcp.js";
  export type { ServerOptions } from "@modelcontextprotocol/sdk/dist/esm/server/index.js";
}

declare module "@modelcontextprotocol/sdk/server/stdio.js" {
  export { StdioServerTransport } from "@modelcontextprotocol/sdk/dist/esm/server/stdio.js";
}

declare module "@modelcontextprotocol/sdk/types.js" {
  export type { Tool } from "@modelcontextprotocol/sdk/dist/esm/types.js";
  export * from "@modelcontextprotocol/sdk/dist/esm/types.js";
}
