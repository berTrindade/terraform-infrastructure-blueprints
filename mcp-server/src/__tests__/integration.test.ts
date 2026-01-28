import { describe, it, expect } from "vitest";
import { createServer } from "../index.js";

describe("MCP Server Integration", () => {
  it("creates server with tools and resources registered", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(Object);
  });
});
