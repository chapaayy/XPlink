# Caddy dev gateway

The only host port is `127.0.0.1:8080`. Caddy proxies Matrix client endpoints to Synapse and the rest to Vite. HTTPS, trusted remote hostname, secure deployment headers and production release images are stage 6 tasks. The dev CSP is deliberately restrictive; adjust via a documented security review if the upstream SDK adds worker requirements.
