# MCP Server Security Hardening

Date: 2026-01-29
Owner: Bernardo Trindade de Abreu
Status: Approved

## Context

The MCP server for ustwo Infrastructure Blueprints handles user inputs, executes system commands, and accesses filesystem resources. As an MCP server that may be deployed in various environments and accessed by AI assistants, security is critical to prevent:

- **Command Injection**: Malicious input executing arbitrary system commands
- **Path Traversal**: Accessing files outside the intended workspace
- **Information Disclosure**: Error messages exposing sensitive filesystem structure
- **Container Compromise**: Docker containers running with excessive privileges

Initial implementation had several security vulnerabilities:

- Used `execSync()` with shell command strings (command injection risk)
- Path validation didn't handle URL encoding, symlinks, or null bytes
- Error messages exposed full file paths
- Docker container ran as root user

The challenge was implementing comprehensive security measures without impacting functionality or developer experience.

## Decision

Implement defense-in-depth security model with multiple layers of protection:

1. **Input Validation**: All inputs validated for format, length, and dangerous patterns
2. **Path Traversal Protection**: Comprehensive validation prevents directory traversal via multiple attack vectors
3. **Command Injection Prevention**: Secure command execution using `execFile()` with array arguments
4. **Error Information Disclosure Prevention**: Error messages sanitized to prevent information leakage
5. **Container Security**: Docker containers run as non-root users
6. **Logging Security**: Sensitive data redacted before logging

## Security Patterns Implemented

### Pattern 1: Secure Command Execution

**Implementation**: Replace shell command execution with `execFile()` using array arguments. Use Node.js built-ins (like `Buffer.from()` for base64) instead of shell commands when possible.

**Example**: GitHub API fetching and base64 decoding

```typescript
// ❌ INSECURE (shell command string)
execSync(`gh api repos/${repo}/contents/file.md | base64 -d`, { shell: true });

// ✅ SECURE (execFile with array arguments)
const { stdout: apiOutput } = await execFileAsync("gh", [
  "api",
  `repos/${repo}/contents/AGENTS.md`,
  "--jq",
  ".content"
], { timeout, encoding: "utf-8" });

// ✅ SECURE (Node.js built-in, no shell command)
const content = Buffer.from(apiOutput.trim(), "base64").toString("utf-8");
```

**Reference**: `mcp-server/src/services/catalog-service.ts` lines 88-103

**Benefits**:

- Prevents command injection via input manipulation
- No shell interpretation of arguments
- Timeout protection for long-running commands
- Uses Node.js built-ins when possible (more secure, no subprocess)

### Pattern 2: Comprehensive Path Validation

**Implementation**: Multi-layer path validation handling URL encoding, symlinks, null bytes, and cross-platform traversal attempts.

**Example**: Path validation with symlink resolution

```typescript
export function validateFilePath(filePath: string, workspaceRoot: string): void {
  // Check for null bytes
  if (filePath.includes("\0")) {
    throw new SecurityError("Invalid path pattern detected");
  }
  
  // Decode URL-encoded paths
  const decoded = decodeURIComponent(filePath);
  if (decoded !== filePath && decoded.includes("..")) {
    throw new SecurityError("Invalid path pattern detected");
  }
  
  // Resolve symlinks to prevent symlink traversal
  const realResolved = fs.realpathSync.native(normalized);
  const realWorkspace = fs.realpathSync.native(resolvedWorkspace);
  
  if (!realResolved.startsWith(realWorkspace)) {
    throw new SecurityError("Path traversal detected");
  }
}
```

**Reference**: `mcp-server/src/utils/validation.ts` lines 33-107

**Prevented Attack Vectors**:

- `../` (Unix path traversal)
- `..\\` (Windows path traversal)
- `%2e%2e%2f` (URL-encoded traversal)
- Double-encoded paths
- Symlink traversal
- Null byte injection (`\0`)
- Absolute paths (`/`, `C:\`)
- Home directory access (`~`)

**Benefits**:

- Comprehensive protection against known traversal techniques
- Handles edge cases (encoding, symlinks, cross-platform)
- Input size limits prevent DoS via oversized paths

### Pattern 3: Error Message Sanitization

**Implementation**: Sanitize error messages to show only last 3 path segments, removing absolute paths and internal structure.

**Example**: Error sanitization utilities

```typescript
export function sanitizeErrorPath(path: string): string {
  const parts = path.split(/[/\\]/).filter(p => p.length > 0);
  if (parts.length <= 3) {
    return parts.join("/");
  }
  return "..." + parts.slice(-3).join("/");
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    let message = error.message;
    // Remove absolute paths
    message = message.replace(/\/[^\s]+/g, (match) => {
      return sanitizeErrorPath(match);
    });
    return message;
  }
  return String(error);
}
```

**Reference**: `mcp-server/src/utils/errors.ts` lines 8-50

**Benefits**:

- Prevents information disclosure about filesystem structure
- Doesn't expose user home directories or system paths
- Maintains useful error context (last 3 segments)

### Pattern 4: Input Size Limits

**Implementation**: Enforce maximum input lengths to prevent DoS attacks via oversized inputs.

**Example**: Input validation with size limits

```typescript
export const MAX_INPUT_LENGTH = 1000;
export const MAX_PATH_LENGTH = 500;

export function validateInputLength(input: string, maxLength: number = MAX_INPUT_LENGTH): void {
  if (input.length > maxLength) {
    throw new ValidationError(`Input exceeds maximum length of ${maxLength} characters`);
  }
}
```

**Reference**: `mcp-server/src/utils/validation.ts` lines 7-9, 164-171

**Benefits**:

- Prevents DoS via oversized inputs
- Clear error messages for validation failures
- Configurable limits per input type

### Pattern 5: Container Security Hardening

**Implementation**: Docker containers run as non-root user with minimal permissions.

**Example**: Dockerfile security configuration

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Change ownership
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser
```

**Reference**: `mcp-server/Dockerfile` lines 21-23, 49-51

**Benefits**:

- Reduces impact of container compromise
- Follows principle of least privilege
- Minimal attack surface (Alpine base)

### Pattern 6: Logging Security

**Implementation**: Redact sensitive data (paths, URIs) before logging.

**Example**: Log redaction

```typescript
function redactSensitiveData(event: WideEvent): WideEvent {
  const redacted = { ...event };
  
  // Sanitize URI fields
  if (redacted.uri && typeof redacted.uri === "string") {
    redacted.uri = sanitizeErrorPath(redacted.uri);
  }
  
  // Sanitize path fields
  if (redacted.path && typeof redacted.path === "string") {
    redacted.path = sanitizeErrorPath(redacted.path);
  }
  
  return redacted;
}
```

**Reference**: `mcp-server/src/utils/logger.ts` lines 18-45

**Benefits**:

- Prevents sensitive data in logs
- Maintains useful context (sanitized paths)
- Applied automatically to all log events

## Alternatives Considered

1. **Minimal Validation**
   - Description: Only validate basic patterns, rely on path resolution
   - Pros: Simpler implementation, faster validation
   - Cons: Vulnerable to encoding attacks, symlink traversal, information disclosure

2. **Shell Command Execution with Sanitization**
   - Description: Continue using `execSync()` but sanitize inputs more aggressively
   - Pros: Simpler migration, fewer code changes
   - Cons: Still vulnerable to command injection, shell interpretation risks

3. **Full Path Disclosure in Errors**
   - Description: Show full paths in error messages for easier debugging
   - Pros: Better debugging experience
   - Cons: Information disclosure risk, exposes filesystem structure

4. **Root User in Docker**
   - Description: Keep container running as root for simplicity
   - Pros: No permission issues, simpler Dockerfile
   - Cons: Container compromise = host access, violates security best practices

5. **Comprehensive Security Hardening** (chosen)
   - Pros: Defense-in-depth, handles edge cases, prevents information disclosure, secure by default
   - Cons: More complex implementation, requires security testing

## Consequences

**Benefits**:

- **Security**: Multiple layers of protection prevent common attack vectors
- **Information Security**: Error messages and logs don't expose sensitive data
- **Container Security**: Non-root user reduces impact of compromise
- **Input Validation**: Size limits prevent DoS attacks
- **Developer Confidence**: Clear security patterns for future development

**Risks**:

- **Complexity**: More validation logic to maintain
- **Performance**: Additional validation overhead (minimal impact)
- **False Positives**: Strict validation might reject valid edge cases

**Mitigations**:

- Comprehensive security test suite covers all attack vectors
- Security documentation (SECURITY.md) guides developers
- Error messages still provide useful context (sanitized)
- Performance impact is negligible (<1ms per validation)

**Impact**:

- **Security Posture**: Significantly improved, addresses OWASP Top 10 concerns
- **Code Changes**: ~500 lines added (validation, sanitization, tests)
- **Test Coverage**: 90%+ coverage of security controls
- **Documentation**: SECURITY.md provides comprehensive security guidance
- **Developer Experience**: Clear patterns, well-documented, tested

## Notes

This security hardening establishes patterns that all future MCP server development should follow:

- **Always use `execFile()` with arrays** - Never shell command strings
- **Always validate paths comprehensively** - Handle encoding, symlinks, null bytes
- **Always sanitize error messages** - Use `sanitizeErrorPath()` and `sanitizeErrorMessage()`
- **Always enforce input size limits** - Use `validateInputLength()`
- **Always redact sensitive data in logs** - Applied automatically via logger

Security tests (`*security.test.ts`) should be run as part of CI/CD to ensure these patterns are maintained.

The security model assumes the MCP server runs in a trusted environment but implements defense-in-depth to protect against:

- Malicious input from AI assistants
- Accidental path traversal
- Information disclosure via errors/logs
- Container compromise

Future security enhancements could include:

- Rate limiting on tool calls
- Request signing/authentication
- Audit logging for security events
- Security headers for HTTP endpoints (if added)
