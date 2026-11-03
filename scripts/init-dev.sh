#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v docker >/dev/null || { echo 'Docker is required' >&2; exit 1; }
command -v python3 >/dev/null || { echo 'Python 3 is required' >&2; exit 1; }

if [ ! -f .env ]; then
  python3 - <<'PY'
import secrets
from pathlib import Path
Path('.env').write_text('MATRIX_SERVER_NAME=localhost\nPOSTGRES_PASSWORD='+secrets.token_urlsafe(36)+'\n')
PY
  chmod 600 .env
fi
set -a
# .env must only contain trusted developer-controlled data
source .env
set +a
: "${MATRIX_SERVER_NAME:?}" "${POSTGRES_PASSWORD:?}"
if [[ "$MATRIX_SERVER_NAME" != 'localhost' ]]; then
  echo 'This stage-1 dev compose is localhost-only. For a public domain use a separately reviewed deployment.' >&2
  exit 1
fi
mkdir -p .local/synapse
if [ ! -f .local/synapse/localhost.signing.key ]; then
  echo 'Generating signing key and base Synapse configuration...'
  docker compose --env-file .env -f deploy/compose.dev.yml run --rm --no-deps synapse generate
fi
if [ -f .local/synapse/homeserver.yaml ] && [ -f .local/synapse/.xplink-configured ]; then
  echo 'Keeping existing Synapse configuration and secrets unchanged.'
else
  # Synapse owns /data as uid 991. Render in that identity, not as the host user.
  docker compose --env-file .env -f deploy/compose.dev.yml run --rm --no-deps \
    --user 991:991 --entrypoint python \
    -v "$PWD:/workspace" \
    -e POSTGRES_PASSWORD -e MATRIX_SERVER_NAME \
    synapse /workspace/services/synapse/render_config.py
fi
echo 'Ready: docker compose --env-file .env -f deploy/compose.dev.yml up --build -d'
