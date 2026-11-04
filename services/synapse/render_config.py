#!/usr/bin/env python3
"""Render minimal localhost-only Synapse config after official image generated a signing key."""
import json
import os
import secrets
from pathlib import Path

root = Path(__file__).resolve().parents[2]
data = root / '.local' / 'synapse'
env = {key: os.environ[key] for key in ('MATRIX_SERVER_NAME', 'POSTGRES_PASSWORD') if key in os.environ}
if len(env) != 2:
    # The host-side script may also be used directly outside Docker.
    fallback = dict(line.split('=', 1) for line in (root / '.env').read_text().splitlines() if '=' in line and not line.startswith('#'))
    env = {**fallback, **env}
assert env['MATRIX_SERVER_NAME'] == 'localhost', 'stage 1 is localhost-only'
assert (data / 'localhost.signing.key').exists(), 'run scripts/init-dev.sh first'
assert not (data / '.xplink-configured').exists(), 'refusing to overwrite generated credentials'

p = data / 'homeserver.yaml'
# Secrets are new only at first generation; no keys are rotated on subsequent starts.
password = json.dumps(env['POSTGRES_PASSWORD'])
registration = json.dumps(secrets.token_urlsafe(48))
macaroon = json.dumps(secrets.token_urlsafe(48))
form = json.dumps(secrets.token_urlsafe(48))
config = f'''# Generated once by XPlink scripts/init-dev.sh; do not commit or overwrite.
server_name: "localhost"
public_baseurl: "http://localhost:8080/"
pid_file: /data/homeserver.pid
signing_key_path: /data/localhost.signing.key
log_config: /data/localhost.log.config
report_stats: false
macaroon_secret_key: {macaroon}
form_secret: {form}
registration_shared_secret: {registration}
# Local-only CI has multiple ephemeral logins from one loopback gateway IP.
# Keep account and failed-attempt rate limits at Synapse defaults; never deploy publicly.
rc_login:
  address:
    per_second: 2
    burst_count: 30
enable_registration: false
enable_registration_without_verification: false
allow_public_rooms_without_auth: false
allow_public_rooms_over_federation: false
federation_domain_whitelist: []
url_preview_enabled: false
media_store_path: /data/media_store
max_upload_size: 10M
app_service_config_files:
  - /data/rtc-appservice.yaml
experimental_features:
  msc4143_enabled: true
  msc4502_enabled: true
  msc4512_enabled: true
max_event_delay_duration: 24h
rc_message:
  per_second: 0.5
  burst_count: 30
rc_delayed_event_mgmt:
  per_second: 1
  burst_count: 20
matrix_rtc:
  transports:
    - type: livekit
      url: ws://xplink.localhost:8080/livekit/sfu
      livekit_service_url: http://localhost:8080/livekit/jwt
listeners:
  - port: 8008
    bind_addresses: ['0.0.0.0']
    tls: false
    type: http
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
database:
  name: psycopg2
  args:
    user: synapse
    password: {password}
    database: synapse
    host: postgres
    cp_min: 5
    cp_max: 10
'''
p.write_text(config, encoding='utf-8')
p.chmod(0o600)
(data / '.xplink-configured').write_text('v1\n')
print('Wrote initial Synapse config; secrets remain in .local (gitignored).')
