# План проверок первого этапа

**Быстрые:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm docs:check` (запускает Node-манифестный индекс). Юнит-тесты проверяют, что crypto отсутствует или state не encrypted => sendEvent не вызывается.

**Интеграция:** `tests/e2e/two-browsers.spec.ts`: два отдельных Chromium context + отдельные Matrix аккаунты alice/bob, приватная комната, invitation/join, send, decrypt; запрос Matrix `/messages` обязан вернуть `m.room.encrypted` и не содержать plaintext. Требуется реальная Docker-инсталляция и Chromium (`pnpm exec playwright install chromium`). GitHub Actions поднимает Synapse/Postgres/Caddy и создаёт временные аккаунты перед E2E.

**Перезапуск:** после успешного E2E выполнить `docker compose --env-file .env -f deploy/compose.dev.yml restart postgres synapse` и убедиться, что `/versions` снова отвечает. Для полной проверки исторической расшифровки не закрывайте оба Chromium context до повторного подключения: восстановление ключей с другого устройства относится к этапу 2.

**Ограничения:** тест `m.room.encrypted` проверяет отсутствие конкретного маркера в ответе API и отправку по SDK, но не доказывает отсутствие его во всех логах/бэкапах. Не заменяет криптоаудит, XSS-тесты и план backup/restore. Они входят в этап 6.
