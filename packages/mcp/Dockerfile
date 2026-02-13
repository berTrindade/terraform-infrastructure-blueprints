FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY packages/mcp/package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code and type declarations
COPY packages/mcp/tsconfig.json ./
COPY packages/mcp/src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:22-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

WORKDIR /app

# Copy package files
COPY packages/mcp/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy blueprint directories (needed for file fetching)
COPY blueprints/ ./blueprints/

# Copy AGENTS.md if needed for catalog resource
COPY AGENTS.md ./AGENTS.md

# Copy public directory for landing page
COPY packages/mcp/public/ ./public/

# Copy skills directory for skill distribution
COPY skills/ ./skills/

# Change ownership to non-root user
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser

# Support both stdio and HTTP modes
# Default: stdio mode (for Docker/local MCP clients)
# HTTP mode: set MCP_TRANSPORT=http environment variable
ENTRYPOINT ["sh", "-c", "if [ \"$MCP_TRANSPORT\" = \"http\" ]; then node dist/http-server.js; else node dist/index.js; fi"]
