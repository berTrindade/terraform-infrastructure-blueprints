# OAuth 2.0 Authorization Server for MCP

OAuth 2.0 authorization server that handles authentication for the MCP server. Implements PKCE (Proof Key for Code Exchange) for secure OAuth flows.

## Features

- OAuth 2.0 Authorization Code flow with PKCE
- Google OAuth integration
- Company domain verification
- JWT token generation for MCP server
- Token validation endpoint

## Environment Variables

```bash
PORT=3000
AUTH_BASE_URL=https://auth.yourdomain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
COMPANY_DOMAIN=yourcompany.com
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql://... # Optional, for production token storage
LOG_LEVEL=info
```

## OAuth Flow

1. Cursor generates PKCE code_verifier and code_challenge
2. Cursor redirects to: `https://auth.yourdomain.com/oauth/authorize?response_type=code&client_id=...&code_challenge=...&code_challenge_method=S256&redirect_uri=cursor://anysphere.cursor-mcp/oauth/callback&scope=mcp:read+mcp:write&state=...`
3. User authenticates with Google (via auth service)
4. Auth service validates company domain
5. Auth service redirects to `cursor://anysphere.cursor-mcp/oauth/callback?code=...&state=...`
6. Cursor exchanges code for token via `POST /oauth/token`
7. Cursor stores token and uses it for MCP requests

## Endpoints

- `GET /.well-known/mcp-oauth-authorization-server` - OAuth metadata
- `GET /oauth/authorize` - Authorization endpoint
- `POST /oauth/token` - Token exchange endpoint
- `POST /oauth/token/validate` - Token validation endpoint
- `GET /health` - Health check

## Development

```bash
npm install
npm run build
npm start
```

## Production

The service should be deployed as a containerized service with:
- HTTPS enabled
- Database for token storage (replace in-memory store)
- Proper secret management
- Rate limiting
- CORS configuration
