FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY mcp-server/package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code and type declarations
COPY mcp-server/tsconfig.json ./
COPY mcp-server/src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

WORKDIR /app

# Copy package files
COPY mcp-server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy blueprint directories (needed for file fetching)
COPY aws/ ./aws/
COPY azure/ ./azure/
COPY gcp/ ./gcp/

# Copy AGENTS.md if needed for catalog resource
COPY AGENTS.md ./AGENTS.md

# Change ownership to non-root user
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# MCP servers communicate via stdio
ENTRYPOINT ["node", "dist/index.js"]
