#!/usr/bin/env bash
set -euo pipefail
curl --fail --silent --show-error http://localhost:8080/_matrix/client/versions >/dev/null
curl --fail --silent --show-error http://localhost:8080/ >/dev/null
curl --fail --silent --show-error http://localhost:8080/livekit/jwt/healthz >/dev/null
curl --fail --silent --show-error http://localhost:8080/livekit/sfu/ >/dev/null
echo 'XPlink dev gateway, Matrix API and RTC services reachable.'
