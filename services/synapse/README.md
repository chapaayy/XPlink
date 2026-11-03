# Synapse service (stage 1)

The official Synapse 1.163.0 image generates a signing key and log config. `scripts/init-dev.sh` then creates the localhost-only PostgreSQL configuration **once**, preserving secrets and signing keys after Docker restarts. Account creation uses `register_new_matrix_user` inside the container; anonymous registration is disabled. The HTTP listener is reachable only on the Docker network. Caddy forwards `/_matrix/*` and _not_ `/_synapse/admin/*`.

**Do not change `server_name` after creating accounts**. Back up both the PostgreSQL volume and `.local/synapse`; browser crypto keys require separate client-side recovery (stage 2). This is development-only, not an internet-facing deployment.
