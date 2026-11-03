#!/usr/bin/env bash
set -euo pipefail
curl --fail --silent --show-error http://localhost:8080/_matrix/client/versions >/dev/null
curl --fail --silent --show-error http://localhost:8080/ >/dev/null
echo 'XPlink dev gateway and Matrix client API reachable.'
