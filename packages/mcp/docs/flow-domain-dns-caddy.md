# Flow: Why domain → why DNS → why Caddy

This document explains how **domain**, **DNS**, and **Caddy** chain together for the MCP server (and the same pattern for youandustwo).

---

## 1. Why domain?

**Problem:** The MCP server runs in a container on a host. Clients (Cursor, VS Code, Claude) need a **stable, shareable URL** to connect.

- **Without a domain:** You’d use something like `http://10.17.0.10:8443` or a changing IP. That’s hard to remember, can’t get a proper TLS certificate, and breaks when the host or port changes.
- **With a domain:** You use **one human-readable name** that stays the same: `https://mcp.ustwo.com:8443`.

**What the domain gives you:**

| Need | Role of domain |
|------|-----------------|
| Stable URL | `mcp.ustwo.com` is the single address everyone uses. |
| OAuth | Google OAuth requires fixed **redirect URIs** (e.g. `https://mcp.ustwo.com:8443/oauth/callback`). No domain → no valid redirect URI. |
| TLS (HTTPS) | Certificate authorities (e.g. Let’s Encrypt) issue certs for **domain names**, not raw IPs. |
| Multiple apps on one host | Different hostnames (e.g. `mcp.ustwo.com` vs `youand.ustwo.com`) let one server host several services. |

So: **domain = stable identity for the service** so clients, OAuth, and TLS can all rely on one name.

---

## 2. Why DNS?

**Problem:** The domain is just a name. Something has to map that name to the **actual machine** (IP + port) where the server runs.

**DNS does that mapping:**

```
mcp.ustwo.com  →  (e.g. 10.17.0.10 or a public IP that forwards to that host)
```

**Flow:**

1. User or Cursor opens `https://mcp.ustwo.com:8443`.
2. The client asks DNS: “What is the IP for `mcp.ustwo.com`?”
3. DNS returns the IP of the server (or the edge that forwards to it).
4. The client connects to that IP on port 8443.

**Without DNS:** Browsers and clients wouldn’t know which server to connect to for `mcp.ustwo.com`.  
**With DNS:** The domain consistently resolves to the right host so traffic reaches your Caddy/MCP stack.

So: **DNS = “where does this domain live?”** so traffic reaches your server.

---

## 3. Why Caddy?

**Problem:** The host has a **container** (mcp-server) listening on an **internal** port (e.g. 3000). External clients need **HTTPS on a public port** (e.g. 8443), with a **valid certificate** and no app logic for TLS or HTTP routing.

**Caddy sits in front and:**

| Responsibility | Why Caddy (not the app) |
|----------------|-------------------------|
| **TLS termination** | Caddy gets a certificate for `mcp.ustwo.com` (e.g. Let’s Encrypt) and terminates HTTPS. The app only sees plain HTTP from Caddy. |
| **Reverse proxy** | Clients hit `https://mcp.ustwo.com:8443`; Caddy listens on 8443 and forwards to `mcp-server:3000` on the Docker network. |
| **Single entry point** | One place (Caddy) handles 8080/8443; the app exposes no ports to the host and stays internal. |
| **Hostname-based routing** | If you add more services, Caddy can route by hostname (e.g. `mcp.ustwo.com` → MCP, `youand.ustwo.com` → youandustwo). |

**Flow:**

1. Client connects to **mcp.ustwo.com:8443** (DNS already resolved to your server).
2. **Caddy** listens on 8443, does TLS handshake (using cert for `mcp.ustwo.com`).
3. Caddy matches the hostname and path (from **Caddyfile** block `mcp.ustwo.com { ... }`).
4. Caddy **reverse-proxies** the request to `mcp-server:3000` on the Docker network.
5. MCP server responds; Caddy sends the response back over HTTPS to the client.

So: **Caddy = TLS + reverse proxy + routing by domain** so the app can stay internal and simple.

---

## End-to-end flow (summary)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. WHY DOMAIN                                                                │
│    One stable name: mcp.ustwo.com                                            │
│    → OAuth redirect URIs, TLS certs, shareable URL                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. WHY DNS                                                                   │
│    mcp.ustwo.com  →  IP of server (e.g. 10.17.0.10 or public IP)             │
│    → So clients know where to connect                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. WHY CADDY                                                                 │
│    On that IP:port (8443) → Caddy                                            │
│    → TLS (HTTPS), reverse proxy to mcp-server:3000, routing by hostname     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Concrete request path:**

1. **User** configures Cursor with `https://mcp.ustwo.com:8443/sse`.
2. **DNS**: Cursor resolves `mcp.ustwo.com` to the server IP.
3. **Caddy** (listening on 8443): receives HTTPS, validates cert for `mcp.ustwo.com`, forwards to `mcp-server:3000`.
4. **mcp-server** (internal only): handles the request and responds.
5. **Caddy** sends the response back over HTTPS to Cursor.

So: **domain** defines *who you are*, **DNS** defines *where you are*, **Caddy** does *TLS and routing* so the app can stay internal and port-free on the host.
