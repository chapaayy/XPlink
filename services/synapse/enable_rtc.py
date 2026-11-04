#!/usr/bin/env python3
"""Idempotent localhost-only RTC provisioning. Synapse image includes PyYAML."""
from pathlib import Path
import os
import secrets
import yaml

root = Path("/workspace")
data = root / ".local/synapse"
rtc = root / ".local/rtc"
registration = data / "rtc-appservice.yaml"
config = data / "homeserver.yaml"
secret_file = rtc / "secret"
livekit_file = rtc / "livekit.yaml"

if not config.exists() or not rtc.is_dir():
    raise SystemExit("First initialize Synapse and the private RTC directory")
if not registration.exists():
    registration.write_text(yaml.safe_dump({
        "id": "XPlink LiveKit JWT service",
        "as_token": secrets.token_urlsafe(48),
        "hs_token": secrets.token_urlsafe(48),
        "sender_localpart": "_xplink_lk",
        "namespaces": {"users": [{"exclusive": False, "regex": ".*"}]},
        "url": None,
        "io.element.msc4502.scopes": ["urn:matrix:client:io.element.msc4502:rooms:is_joined"],
        "io.element.msc4512.proxy_prefix": "rtc/livekit",
        "io.element.msc4512.proxy_url": "http://lk-jwt:8080"
    }, sort_keys=False))
    registration.chmod(0o600)
if not secret_file.exists():
    secret_file.write_text(secrets.token_urlsafe(64))
    secret_file.chmod(0o600)
if not livekit_file.exists():
    livekit_file.write_text(yaml.safe_dump({
        "port": 7880,
        "rtc": {
            "tcp_port": 7881,
            "port_range_start": 7882,
            "port_range_end": 7902,
            "node_ip": "127.0.0.1",
            "use_external_ip": False
        },
        "keys": {"xplinkrtc": secret_file.read_text().strip()},
        "room": {"auto_create": False},
        "webhook": {"api_key": "xplinkrtc", "urls": ["http://lk-jwt:8080/sfu_webhook"]},
        "logging": {"level": "warn"}
    }, sort_keys=False))
    livekit_file.chmod(0o600)

with config.open(encoding="utf-8") as file:
    homeserver = yaml.safe_load(file)
if not isinstance(homeserver, dict) or homeserver.get("server_name") != "localhost":
    raise SystemExit("RTC provisioning permitted only for localhost Synapse")
expected_transport = {
    "type": "livekit",
    "url": "ws://xplink.localhost:8080/livekit/sfu",
    "livekit_service_url": "http://localhost:8080/livekit/jwt"
}
existing_services = homeserver.get("app_service_config_files") or []
if existing_services and "/data/rtc-appservice.yaml" not in existing_services:
    raise SystemExit("Unknown existing appservice: manual migration required")
existing_transport = homeserver.get("matrix_rtc", {}).get("transports")
if existing_transport and existing_transport != [expected_transport]:
    raise SystemExit("Existing MatrixRTC transport differs: refusing overwrite")
homeserver["app_service_config_files"] = ["/data/rtc-appservice.yaml"]
features = homeserver.setdefault("experimental_features", {})
for name in ("msc4143_enabled", "msc4502_enabled", "msc4512_enabled"):
    if features.get(name) is False:
        raise SystemExit("Existing RTC feature disabled; manual review required")
    features[name] = True
homeserver["max_event_delay_duration"] = "24h"
homeserver["rc_message"] = {"per_second": 0.5, "burst_count": 30}
homeserver["rc_delayed_event_mgmt"] = {"per_second": 1, "burst_count": 20}
homeserver["matrix_rtc"] = {"transports": [expected_transport]}
for listener in homeserver.get("listeners", []):
    for resource in listener.get("resources", []):
        names = resource.get("names", [])
        if "client" in names and "federation" not in names:
            resource["names"].append("federation")
new = yaml.safe_dump(homeserver, sort_keys=False)
if config.read_text() != new:
    tmp = config.with_suffix(".yaml.stage4-new")
    tmp.write_text(new)
    tmp.chmod(0o600)
    os.replace(tmp, config)
print("RTC configuration valid. Existing secrets preserved; localhost only.")
