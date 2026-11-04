#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Synapse stores its signing key and config as uid 991. Keep RTC secrets
# private to the same uid even if the host user does not have chown rights.
docker compose --env-file .env -f deploy/compose.dev.yml run --rm --no-deps \
  --user 0:0 --entrypoint sh -v "$PWD:/workspace" synapse \
  -c 'mkdir -p /workspace/.local/rtc && chown 991:991 /workspace/.local/rtc && chmod 700 /workspace/.local/rtc'
docker compose --env-file .env -f deploy/compose.dev.yml run --rm --no-deps \
  --user 991:991 --entrypoint python \
  -v "$PWD:/workspace" synapse /workspace/services/synapse/enable_rtc.py
