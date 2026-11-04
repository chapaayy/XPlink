# FILE_INDEX — смысловой реестр файлов

Этот индекс генерируется из `scripts/file-manifest.json`. Для каждого файла указан контракт и связанная проверка. Не редактируйте таблицу вручную.

| Путь | Ответственность | Публичный контракт | Зависимости | Проверка | Пересмотр |
| --- | --- | --- | --- | --- | --- |
| `.github/workflows/lockfile.yml` | Bootstrap lockfile and formatting on feature branch | GHA workflow | pnpm + Prettier | docs:check / CI | 2026-11-03 |
| `.github/workflows/verify.yml` | CI quality and real E2EE test | GHA workflow | Docker + pnpm | docs:check / CI | 2026-11-03 |
| `apps/web/Dockerfile` | Dev configuration and supporting module | file-level interface | XPlink configuration | docs:check / CI | 2026-11-03 |
| `apps/web/src/app/App.tsx` | Auth/session UI switch | App | React + adapter | docs:check / CI | 2026-11-03 |
| `apps/web/src/app/use-matrix.ts` | Own crypto lifecycle and Matrix subscriptions | useMatrix() | React + Matrix SDK | docs:check / CI | 2026-11-03 |
| `apps/web/src/features/auth/LoginForm.tsx` | Credential form UI | LoginForm | React | docs:check / CI | 2026-11-03 |
| `apps/web/src/features/channels/CreateRoomForm.tsx` | Private E2EE room creation form | CreateRoomForm | adapter + React | docs:check / CI | 2026-11-03 |
| `apps/web/src/features/channels/RoomList.tsx` | Matrix room navigation/invites | RoomList | adapter + React | docs:check / CI | 2026-11-03 |
| `apps/web/src/features/messages/Composer.tsx` | Fail-closed message form | Composer | adapter + React | docs:check / CI | 2026-11-03 |
| `apps/web/src/features/messages/MessageTimeline.tsx` | Render decrypted messages only | MessageTimeline | adapter + React | docs:check / CI | 2026-11-03 |
| `apps/web/src/layouts/AppShell.tsx` | Minimal Discord-style layout | AppShell | React + adapter | E2E | 2026-11-03 |
| `apps/web/src/main.tsx` | React entrypoint | boot React App | React DOM | docs:check / CI | 2026-11-03 |
| `apps/web/vite.config.ts` | Dev configuration and supporting module | file-level interface | XPlink configuration | docs:check / CI | 2026-11-03 |
| `deploy/compose.dev.yml` | Persisted dev infrastructure | docker compose | Docker | docs:check / CI | 2026-11-03 |
| `packages/matrix-adapter/src/client.ts` | Construct one Rust Crypto Matrix client | initializeMatrix | matrix-js-sdk | docs:check / CI | 2026-11-03 |
| `packages/matrix-adapter/src/crypto.test.ts` | Negative E2EE upload gates | Vitest tests | Vitest | unit/security | 2026-11-03 |
| `packages/matrix-adapter/src/crypto.ts` | Fail-closed encrypted room enforcement | assertEncryptedRoom | Matrix CryptoApi | unit/security | 2026-11-03 |
| `packages/matrix-adapter/src/index.ts` | Single public adapter boundary | exports | local adapter modules | docs:check / CI | 2026-11-03 |
| `packages/matrix-adapter/src/messages.ts` | Send only to confirmed E2EE room | sendEncryptedMessage | crypto + matrix-js-sdk | unit/security | 2026-11-03 |
| `packages/matrix-adapter/src/rooms.test.ts` | Initial-state encryption tests | Vitest tests | Vitest | unit/security | 2026-11-03 |
| `packages/matrix-adapter/src/rooms.ts` | Room creation and invitations | createEncryptedRoom/listRooms/acceptRoomInvite | matrix-js-sdk | unit/security | 2026-11-03 |
| `packages/matrix-adapter/src/session.ts` | Login and session token lifetime | passwordLogin/readSession/storeSession/clearSession | matrix-js-sdk + browser sessionStorage | docs:check / CI | 2026-11-03 |
| `packages/matrix-adapter/src/tab-lock.ts` | Exclusive crypto store ownership | acquireCryptoTab | navigator.locks | docs:check / CI | 2026-11-03 |
| `packages/matrix-adapter/src/timeline.ts` | Map SDK events to safe UI objects | roomMessages | matrix-js-sdk | docs:check / CI | 2026-11-03 |
| `playwright.config.ts` | Dev configuration and supporting module | file-level interface | XPlink configuration | docs:check / CI | 2026-11-03 |
| `scripts/generate-file-index.mjs` | Deterministic FILE_INDEX renderer | node CLI | file-manifest.json | docs:check / CI | 2026-11-03 |
| `scripts/healthcheck.sh` | HTTP readiness check | bash healthcheck.sh | curl | docs:check / CI | 2026-11-03 |
| `scripts/init-dev.sh` | Create dev secrets and signing key | bash init-dev.sh | Docker + Python | docs:check / CI | 2026-11-03 |
| `scripts/verify-repo-map.mjs` | Require docs metadata for all source | node CLI | file-manifest.json | docs:check / CI | 2026-11-03 |
| `scripts/verify-repo-map.test.mjs` | Check file index smoke | node test | Node stdlib | docs:check / CI | 2026-11-03 |
| `services/caddy/Caddyfile.dev` | Proxy only Matrix client endpoints / Vite | localhost :8080 | Caddy | docs:check / CI | 2026-11-03 |
| `services/synapse/render_config.py` | Generate secrets once; write localhost homeserver config | CLI render | Python stdlib | docs:check / CI | 2026-11-03 |
| `tests/e2e/two-browsers.spec.ts` | Independent browsers and ciphertext API assertion | Playwright test | Synapse + browser | E2E | 2026-11-03 |
| `packages/matrix-adapter/src/secret-storage.ts` | Ephemeral recovery key access to Matrix secret storage | SecretStorageAccess | Matrix recovery-key decoder | recovery.test.ts | 2026-11-04 |
| `packages/matrix-adapter/src/recovery.ts` | Cross-signing, SSSS, encrypted key backup and restore | createRecovery/recoverDevice/getRecoveryStatus | Rust Crypto API | recovery.test.ts / E2E | 2026-11-04 |
| `packages/matrix-adapter/src/devices.ts` | Server-backed own device inventory and revocation | listOwnDevices/revokeDevice | MatrixClient /devices + Rust trust | recovery.test.ts / E2E | 2026-11-04 |
| `packages/matrix-adapter/src/identity.ts` | Trust warnings, fail-closed sending and member removal | roomIdentities/assertStableRoomIdentities/removeRoomMember | Matrix membership + Rust Crypto | identity.test.ts | 2026-11-04 |
| `packages/matrix-adapter/src/verification.ts` | SAS verification negotiation without auto-confirmation | VerificationFlow + request helpers | Matrix to-device verification | SAS E2E / typecheck | 2026-11-04 |
| `packages/matrix-adapter/src/recovery.test.ts` | Negative tests for recovery and session revocation | Vitest tests | adapter | CI unit | 2026-11-04 |
| `packages/matrix-adapter/src/identity.test.ts` | Fail-closed identity and outbound key rotation tests | Vitest tests | adapter | CI unit | 2026-11-04 |
| `apps/web/src/features/security/RecoveryControls.tsx` | Create, display once, and recover user-owned secret storage key | RecoveryControls | recovery adapter | recovery-devices.spec.ts | 2026-11-04 |
| `apps/web/src/features/security/DeviceControls.tsx` | Show actual devices and revoke sessions with UIA | DeviceControls | devices adapter | recovery-devices.spec.ts | 2026-11-04 |
| `apps/web/src/features/security/VerificationControls.tsx` | Interactive SAS display and explicit human confirmation | VerificationControls | verification adapter | CI E2E / typecheck | 2026-11-04 |
| `apps/web/src/features/security/RoomTrust.tsx` | Room member identity warnings and moderation actions | RoomTrust | identity adapter | identity.test.ts | 2026-11-04 |
| `apps/web/src/features/security/SecurityPanel.tsx` | Compose security settings by feature responsibility | SecurityPanel | React features | CI build | 2026-11-04 |
| `tests/e2e/recovery-devices.spec.ts` | Real browser recovery and session revocation acceptance | Playwright E2E | Synapse + browser | CI e2ee | 2026-11-04 |
| `.github/workflows/stage2-format.yml` | Format stage 2 branch without altering stage 1 or main | GHA on feature push | pnpm + Prettier | CI | 2026-11-04 |
| `tests/e2e/sas-verification.spec.ts` | Two independent Matrix devices complete human-confirmed SAS verification | Playwright E2E | Synapse + Rust Crypto + browser | CI e2ee | 2026-11-04 |
| `tests/e2e/member-revocation.spec.ts` | Verify server forbids post-kick ciphertext access to removed members | Playwright E2E | Matrix SDK + Synapse + Chromium | CI e2ee | 2026-11-04 |
| `tests/e2e/tab-ownership.spec.ts` | Ensure only one browser tab owns the Rust Crypto IndexedDB store | Playwright E2E | Matrix SDK + Synapse + Chromium | CI e2ee | 2026-11-04 |
| `.github/workflows/stage3-bootstrap.yml` | One-time lockfile, prettier and FILE_INDEX bootstrap on stage-3 branch | GitHub Actions | pnpm 10, Node 22 | CI bootstrap | 2026-11-04 |
| `packages/matrix-adapter/src/spaces.ts` | Native Matrix m.space hierarchy and E2EE channel linking | createSpace/createCategory/createSpaceChannel/listSpaces | Matrix state/membership | E2E workspace | 2026-11-04 |
| `packages/matrix-adapter/src/directs.ts` | Encrypted one-to-one chats and native m.direct account mapping | createDirectChat/markIncomingDirect | Matrix account_data | E2E DM | 2026-11-04 |
| `packages/matrix-adapter/src/roles.ts` | Server-authoritative channel roles and readonly permissions | assignChannelRole/setChannelReadOnly | Matrix power levels | E2E server 403 | 2026-11-04 |
| `packages/matrix-adapter/src/reactions.ts` | Encrypted Matrix m.reaction event sending | addReaction | Matrix SDK encrypted timeline | E2E reactions | 2026-11-04 |
| `packages/matrix-adapter/src/attachments.ts` | Encrypted media upload/download with hash verification and no plaintext fallback | sendEncryptedAttachment/downloadEncryptedAttachment | matrix-encrypt-attachment | E2E media | 2026-11-04 |
| `packages/matrix-adapter/src/stage3.test.ts` | Negative authorization, media and E2EE tests | Vitest tests | adapter + Vitest | unit tests | 2026-11-04 |
| `apps/web/src/features/spaces/WorkspaceRail.tsx` | Workspace switcher and new space action | WorkspaceRail | React + spaces adapter | E2E space | 2026-11-04 |
| `apps/web/src/features/spaces/SpaceNavigation.tsx` | Workspace category/channel tree and membership controls | SpaceNavigation | React + spaces adapter | E2E hierarchy | 2026-11-04 |
| `apps/web/src/features/directs/DirectChats.tsx` | One-to-one E2EE chat creation and navigation | DirectChats | React + direct adapter | E2E DM | 2026-11-04 |
| `apps/web/src/features/roles/ChannelPermissions.tsx` | Power levels and server-enforced role settings UI | ChannelPermissions | React + roles adapter | E2E 403 | 2026-11-04 |
| `apps/web/src/shared/styles/stage3.css` | Workspace, role and attachment layout styles | CSS presentation | global.css + React UI | visual review | 2026-11-04 |
| `tests/e2e/stage3-dm-media.spec.ts` | Real encrypted DM, reaction, binary media upload and download | Playwright E2E | Synapse + Chromium | CI E2E | 2026-11-04 |
| `tests/e2e/stage3-spaces-roles.spec.ts` | Workspace category linking and Synapse power-level rejection | Playwright E2E | Synapse + Chromium | CI E2E | 2026-11-04 |
| `docs/adr/0006-matrix-spaces-roles-media.md` | Protocol and safety decisions for Matrix text-product model | ADR | Matrix specification | review | 2026-11-04 |
| `packages/rtc-adapter/package.json` | Independent MatrixRTC adapter workspace | pnpm package | matrix-js-sdk, Rust Crypto adapter | CI pnpm typecheck | 2026-11-04 |
| `packages/rtc-adapter/tsconfig.json` | Strongly typed RTC adapter config | TypeScript project | tsconfig.base.json | CI typecheck | 2026-11-04 |
| `packages/rtc-adapter/src/transport.ts` | Authenticated homeserver RTC transport lookup and trusted URL gate | discoverRtcTransport/isTrustedRtcUrl | Matrix client API | RTC unit+integration | 2026-11-04 |
| `packages/rtc-adapter/src/call-session.ts` | Fail-closed call authorization prior to media startup | authorizeRtcCall | Matrix E2EE+transport | RTC unit+E2E | 2026-11-04 |
| `packages/rtc-adapter/src/index.ts` | Single RTC adapter entrypoint | RTC exports | RTC implementation | CI types | 2026-11-04 |
| `packages/rtc-adapter/src/call-session.test.ts` | RTC missing encryption and unsafe transport negative tests | Vitest tests | Vitest | CI unit | 2026-11-04 |
| `packages/matrix-adapter/src/voice.ts` | E2EE voice channel marker and creation | createVoiceRoom/isVoiceRoom | Matrix rooms | E2E | 2026-11-04 |
| `apps/web/src/features/calls/CallOverlay.tsx` | Lazy official Element Call, call lifecycle, device and screen-share UI | CallOverlay | RTC adapter + Element Call | RTC E2E | 2026-11-04 |
| `apps/web/src/features/calls/CreateVoiceRoomForm.tsx` | Private encrypted voice room form | CreateVoiceRoomForm | Matrix adapter | RTC E2E | 2026-11-04 |
| `apps/web/src/shared/styles/stage4.css` | Isolation of call layout and controls | RTC styles | Vite CSS | CI build | 2026-11-04 |
| `scripts/init-rtc.sh` | Idempotent private RTC provisioning in Synapse container | bash script | Docker+Synapse | Docker E2E | 2026-11-04 |
| `services/synapse/enable_rtc.py` | Secret management and homeserver config migration | python CLI | PyYAML, appservice | Docker E2E | 2026-11-04 |
| `tests/e2e/stage4-matrixrtc.spec.ts` | Three-browser MatrixRTC authorization and secure call UI smoke | Playwright E2E | LiveKit, JWT, Synapse | CI RTC E2E | 2026-11-04 |
| `.github/workflows/bootstrap-stage4.yml` | Resolve pinned RTC packages, format and lock on feature branch | GHA workflow | pnpm | CI quality | 2026-11-04 |
| `apps/web/index.html` | App entrypoint with PWA manifest and icon | HTML document | Vite app | PWA E2E | 2026-11-04 |
| `apps/web/public/manifest.webmanifest` | Installable standalone app metadata | Web app manifest | PWA icons | PWA E2E | 2026-11-04 |
| `apps/web/public/offline.html` | Generic offline fallback | Offline document | Service Worker | PWA E2E | 2026-11-04 |
| `apps/web/public/sw.js` | Public-only offline cache and notification focusing | Service Worker | Cache Storage | PWA E2E | 2026-11-04 |
| `apps/web/public/icons/xplink-192.png` | Public PWA icon 192x192 | PNG | Manifest | PWA E2E | 2026-11-04 |
| `apps/web/public/icons/xplink-512.png` | Public PWA icon 512x512 | PNG | Manifest | PWA E2E | 2026-11-04 |
| `apps/web/src/app/pwa.ts` | Production-only offline worker registration | registerOfflineShell | Browser | PWA E2E | 2026-11-04 |
| `apps/web/src/features/pwa/InstallControls.tsx` | User-controlled PWA installation | InstallControls | React | PWA E2E | 2026-11-04 |
| `apps/web/src/features/notifications/preferences.ts` | Non-sensitive opt-in bit | notificationOptIn | localStorage | Unit and E2E | 2026-11-04 |
| `apps/web/src/features/notifications/notification-policy.ts` | Privacy-preserving notification gate | shouldNotify | None | Vitest | 2026-11-04 |
| `apps/web/src/features/notifications/notification-policy.test.ts` | Negative notification privacy tests | Vitest | Policy module | CI unit | 2026-11-04 |
| `apps/web/src/features/notifications/NotificationSettings.tsx` | Explicit browser permission controls | NotificationSettings | Browser Notifications | PWA E2E | 2026-11-04 |
| `apps/web/src/features/notifications/usePrivateNotifications.ts` | Generic notifications for new decrypted events | usePrivateNotifications | Matrix SDK | PWA E2E | 2026-11-04 |
| `apps/web/src/shared/styles/stage5.css` | Responsive mobile and accessible layout | Styles | AppShell | PWA E2E | 2026-11-04 |
| `tests/e2e/stage5-pwa-mobile.spec.ts` | Real offline, privacy, mobile, permission acceptance | Playwright | Chromium | CI E2E | 2026-11-04 |
| `.github/workflows/stage5-format.yml` | One-off Prettier and deterministic file index on Stage 5 branch | GitHub Actions | pnpm + Node | CI quality | 2026-11-04 |
