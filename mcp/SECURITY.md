# Security Policy

## Security Model Overview

The MCP server implements a defense-in-depth security model with multiple layers of protection:

1. **Input Validation**: All inputs are validated for format, length, and dangerous patterns
2. **Path Traversal Protection**: Comprehensive path validation prevents directory traversal attacks
3. **Command Injection Prevention**: Secure command execution using `execFile` with array arguments
4. **Error Information Disclosure Prevention**: Error messages are sanitized to prevent information leakage
5. **Container Security**: Docker containers run as non-root users

## Authentication/Authorization Model

The MCP server operates in a trusted environment where:

- **No Authentication**: The server assumes it's running in a trusted context (local development or controlled deployment)
- **File System Access**: The server has read-only access to blueprint files within the configured workspace
- **GitHub API Access**: Uses GitHub CLI (`gh`) for fetching content, requiring appropriate GitHub authentication

## Input Validation Approach

### Blueprint Names
- **Format**: Only lowercase letters, numbers, and hyphens (`^[a-z0-9-]+$`)
- **Length**: Maximum 1000 characters
- **Rejection**: Any special characters, uppercase letters, or spaces

### File Paths
- **Format**: Relative paths only (no absolute paths, no `..`, no `~`)
- **Length**: Maximum 500 characters
- **Encoding**: URL-encoded paths are decoded and validated
- **Symlinks**: Resolved and validated against real paths
- **Null Bytes**: Rejected to prevent path injection

### Input Size Limits
- **General Input**: Maximum 1000 characters
- **File Paths**: Maximum 500 characters
- **Validation**: Applied before processing any input

## Path Traversal Protection

The server implements comprehensive path traversal protection:

### Prevented Patterns
- `../` (Unix path traversal)
- `..\\` (Windows path traversal)
- URL-encoded traversal (`%2e%2e%2f`)
- Double-encoded paths
- Symlink traversal
- Absolute paths (`/`, `C:\`)
- Home directory access (`~`)

### Implementation
1. **Pattern Detection**: Checks for dangerous patterns before path resolution
2. **Path Resolution**: Resolves paths relative to workspace root
3. **Symlink Resolution**: Uses `fs.realpathSync.native()` to resolve symlinks
4. **Boundary Check**: Validates resolved path is within workspace boundaries

## Command Execution Security

### Secure Command Execution
- **Method**: Uses `execFile()` instead of `execSync()` with shell commands
- **Arguments**: Commands are passed as arrays, preventing shell injection
- **Timeout**: All commands have timeout limits
- **No Shell**: Commands execute directly without shell interpretation

### Example
```typescript
// INSECURE (shell command string)
execSync(`gh api repos/${repo}/contents/file.md`, { shell: true });

// SECURE (execFile with array arguments)
execFileAsync("gh", ["api", `repos/${repo}/contents/file.md`], { timeout });
```

## Error Handling Best Practices

### Error Message Sanitization
- **Path Sanitization**: Only last 3 path segments shown in error messages
- **Stack Traces**: Never exposed to clients
- **Internal Details**: File system structure not revealed
- **User Data**: Home directories and usernames not exposed

### Sanitization Functions
- `sanitizeErrorPath()`: Reduces paths to last 3 segments
- `sanitizeErrorMessage()`: Removes absolute paths and sensitive data

### Example
```typescript
// INSECURE (full path exposed)
throw new Error(`File not found: /home/user/secret/file.txt`);

// SECURE (sanitized path)
throw new FileNotFoundError(uri); // Shows only "...secret/file.txt"
```

## Logging Security

### Sensitive Data Redaction
- **URIs**: Sanitized before logging
- **Paths**: Only last 3 segments logged
- **Error Messages**: Paths removed from error messages in logs
- **No Secrets**: No API keys, tokens, or credentials logged

### Log Structure
- **Structured Logging**: JSON format with wide events
- **Context**: Environment context included automatically
- **Redaction**: Applied before log emission

## Docker Security

### Container Hardening
- **Non-Root User**: Container runs as `mcpuser` (UID 1001)
- **Minimal Permissions**: Only necessary files copied
- **Alpine Base**: Minimal attack surface
- **No Shell**: No shell access required

### Dockerfile Security
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Change ownership
RUN chown -R mcpuser:mcpuser /app

# Switch to non-root user
USER mcpuser
```

## Security Testing

### Test Coverage
- **Command Injection Tests**: Verify `execFile` usage
- **Path Traversal Tests**: Test all traversal techniques
- **Input Validation Tests**: Test size limits and format validation
- **Error Message Tests**: Verify no information disclosure

### Running Security Tests
```bash
npm test -- --grep "security"
```

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. **Email**: Contact the maintainers directly
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline
- **Initial Response**: Within 48 hours
- **Fix Timeline**: Depends on severity (typically 1-2 weeks)
- **Disclosure**: After fix is released

## Security Best Practices for Developers

### Code Review Checklist
- [ ] All user inputs validated
- [ ] Path validation handles edge cases
- [ ] Commands use `execFile` with arrays
- [ ] Error messages sanitized
- [ ] No sensitive data in logs
- [ ] Input size limits enforced

### Pre-Commit Checks
- [ ] Security tests pass
- [ ] No hardcoded secrets
- [ ] Error messages don't expose paths
- [ ] Input validation in place

### Deployment Verification
- [ ] Container runs as non-root
- [ ] No unnecessary permissions
- [ ] Logging configured correctly
- [ ] Security tests passing

## Security Updates

Security updates are released as:
- **Patch Versions**: For low-severity fixes
- **Minor Versions**: For medium-severity fixes
- **Major Versions**: For high-severity fixes requiring breaking changes

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
