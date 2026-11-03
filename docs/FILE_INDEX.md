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
