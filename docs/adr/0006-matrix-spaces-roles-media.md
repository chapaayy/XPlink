# ADR 0006 — Native Matrix Spaces, per-room roles and encrypted attachments

- Status: accepted for Stage 3 implementation, pending full E2E acceptance
- Date: 2026-11-04

**Context.** XPlink needs a Discord-like structure with private rooms, categories, DMs and roles, but must not invent a second incompatible authorization layer or encrypt files insecurely.

**Decisions.** Implement Spaces/categories using standard `m.space.child`/`m.space.parent` state, never store chat plaintext in Spaces. Text channels and DMs are separately encrypted Matrix rooms. Store DM associations in `m.direct`. Use `m.room.power_levels` and server 403 checks, applying write permission to the `m.room.encrypted` wire type. Adopt Matrix.org's `matrix-encrypt-attachment` for protocol v2 media encryption/integrity, prohibit plaintext upload/fallback, 10 MB maximum.

**Consequences.** Spaces do not imply membership or power inheritance. The Matrix room hierarchy and its names/member list are visible to Synapse. Power levels are per-channel; any future global or custom roles need an independently reviewed server-side authorization design. File and text plaintext remain exposed to trusted client JS and endpoints, not to the normal homeserver, subject to E2EE assumptions. A single-room role system does not claim Discord feature parity.
