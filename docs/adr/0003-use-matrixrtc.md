# ADR 0003 — MatrixRTC/Element Call/LiveKit

- Status: Stage 4 implementation; acceptance requires real media E2EE test
- Date: 2026-11-04

## Problem

The Discord-like client needs voice channels, group video and screen sharing, while preserving existing Rust Crypto E2EE identities and never exposing raw streams to a homemade server.

## Decision

- Use **MatrixRTC** for call membership and key distribution, self-hosted **LiveKit SFU** for media forwarding, **lk-jwt-service v0.9.0** in Synapse application-service mode for membership-scoped short-lived JWT.
- Use **official Element Call React component v0.28.1** on the existing single MatrixClient. This deviates narrowly from the initial recommendation of an embedded widget: the newly published component reuses one crypto store and removes the need for an unreviewed custom Matrix Widget API bridge. It is experimental and isolated inside `features/calls` and `rtc-adapter`; swapping it for the official widget later does not change the transport/backend.
- No custom SRTP encryptor or "E2EE-like" transport. Fail closed before media setup if Matrix crypto/transport unavailable.
- Run locally under loopback ports; generate and retain LiveKit secrets once. Set `room.auto_create: false`. Never commit secrets.
- License: Element Call component/Compound are **AGPL-3.0-only OR commercial license**; review distribution/compliance before releasing XPlink.

## Consequences

Audio/video and screen-sharing UI are provided by an upstream large component; performance and UX polish belong to stage 5. Compatibility with MatrixRTC experimental MSC flags is subject to version upgrades. Claiming SFU-blind media requires genuine 3-client E2EE call acceptance; typing, HTTP reachability and presence of call buttons alone are not proof.
