/**
 * HTTP/SSE Transport for MCP Server
 * 
 * Implements Server-Sent Events (SSE) transport for MCP protocol over HTTP.
 * This allows MCP servers to be accessed via HTTP instead of stdio.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Request, Response } from "express";
import { logger } from "../utils/logger.js";

/**
 * SSE connection state
 */
interface SSEConnection {
  id: string;
  response: Response;
  server: McpServer;
  lastActivity: number;
}

/**
 * Active SSE connections
 */
const connections = new Map<string, SSEConnection>();

/**
 * Clean up inactive connections
 */
function cleanupInactiveConnections(): void {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  for (const [id, connection] of connections.entries()) {
    if (now - connection.lastActivity > timeout) {
      logger.info({ operation: "sse_cleanup", connection_id: id });
      connections.delete(id);
      try {
        connection.response.end();
      } catch (error) {
        // Connection already closed
      }
    }
  }
}

// Clean up every minute
setInterval(cleanupInactiveConnections, 60 * 1000);

/**
 * Handle SSE connection for MCP
 * 
 * @param req - Express request
 * @param res - Express response
 * @param server - MCP server instance
 */
export async function handleSSEConnection(
  req: Request,
  res: Response,
  server: McpServer
): Promise<void> {
  const connectionId = req.headers["x-connection-id"] as string || `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  // Store connection
  const connection: SSEConnection = {
    id: connectionId,
    response: res,
    server,
    lastActivity: Date.now(),
  };
  connections.set(connectionId, connection);

  logger.info({
    operation: "sse_connection",
    connection_id: connectionId,
    remote_address: req.ip,
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connection", connectionId })}\n\n`);

  // Handle client disconnect
  req.on("close", () => {
    logger.info({
      operation: "sse_disconnect",
      connection_id: connectionId,
    });
    connections.delete(connectionId);
    res.end();
  });

  // Keep connection alive with periodic ping
  const pingInterval = setInterval(() => {
    if (!connections.has(connectionId)) {
      clearInterval(pingInterval);
      return;
    }
    try {
      res.write(`: ping\n\n`);
      connection.lastActivity = Date.now();
    } catch (error) {
      clearInterval(pingInterval);
      connections.delete(connectionId);
    }
  }, 30000); // Every 30 seconds

  // Store ping interval for cleanup
  (connection as any).pingInterval = pingInterval;
}

/**
 * Handle MCP message via POST
 * 
 * @param req - Express request
 * @param res - Express response
 */
export async function handleMCPMessage(
  req: Request,
  res: Response
): Promise<void> {
  const connectionId = req.headers["x-connection-id"] as string;
  const connection = connectionId ? connections.get(connectionId) : undefined;

  if (!connection) {
    res.status(400).json({
      error: "No active connection",
      error_description: "Establish SSE connection first",
    });
    return;
  }

  connection.lastActivity = Date.now();

  try {
    const message = req.body;

    // Process MCP message through server
    // Note: This is a simplified implementation
    // The actual MCP SDK may need to be adapted for HTTP transport
    const response = await processMCPMessage(connection.server, message);

    res.json(response);
  } catch (error) {
    logger.error({
      operation: "mcp_message_error",
      connection_id: connectionId,
      error: {
        type: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: "internal_error",
      error_description: error instanceof Error ? error.message : "Internal error",
    });
  }
}

/**
 * Process MCP message through server
 * 
 * @param server - MCP server instance
 * @param message - MCP message
 * @returns Response message
 */
async function processMCPMessage(
  server: McpServer,
  message: unknown
): Promise<unknown> {
  // This is a placeholder - actual implementation depends on MCP SDK HTTP support
  // For now, we'll need to adapt the stdio transport to work over HTTP
  // The MCP SDK may need updates or we implement a custom HTTP transport adapter
  
  // TODO: Implement actual MCP message processing
  // This might require:
  // 1. Creating a custom transport adapter
  // 2. Using MCP SDK's internal message handling
  // 3. Implementing the MCP protocol over HTTP/SSE manually

  return {
    jsonrpc: "2.0",
    id: (message as any)?.id,
    result: null,
  };
}

/**
 * Get active connection count
 */
export function getActiveConnectionCount(): number {
  return connections.size;
}
