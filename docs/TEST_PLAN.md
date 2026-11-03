# План проверок первого этапа

**Быстрые:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm docs:check` (запускает Node-манифестный индекс). Юнит-тесты проверяют, что crypto отсутствует или state не encrypted => sendEvent не вызывается.

**Интеграция:** `tests/e2e/two-browsers.spec.ts`: два отдельных Chromium context + отдельные Matrix аккаунты alice/bob, приватная комната, invitation/join, send, decrypt; запрос Matrix `/messages` обязан вернуть `m.room.encrypted` и не содержать plaintext. Требуется реальная Docker-инсталляция и Chromium (`pnpm exec playwright install chromium`). GitHub Actions поднимает Synapse/Postgres/Caddy и создаёт временные аккаунты перед E2E.

**Перезапуск:** после успешного E2E выполнить `docker compose --env-file .env -f deploy/compose.dev.yml restart postgres synapse` и убедиться, что `/versions` снова отвечает. Для полной проверки исторической расшифровки не закрывайте оба Chromium context до повторного подключения: восстановление ключей с другого устройства относится к этапу 2.

**Ограничения:** тест `m.room.encrypted` проверяет отсутствие конкретного маркера в ответе API и отправку по SDK, но не доказывает отсутствие его во всех логах/бэкапах. Не заменяет криптоаудит, XSS-тесты и план backup/restore. Они входят в этап 6.

**Bootstrap regression:** the E2E test first requires the React login form to render (not just HTTP 200); on failure it reports only bootstrap error summaries and DOM root element count, never message bodies or session tokens. The dev gateway CSP must allow the Vite React Refresh preamble; production CSP must not inherit that exception.

## Этап 2 — ключи, устройства, идентичность

Unit: `packages/matrix-adapter/src/identity.test.ts` проверяет запрет отправки после identity change и сброс outgoing Megolm только после успешного server-authorized kick. `recovery.test.ts` проверяет ручной ключ, очистку памяти и запрет сброса существующих trust keys / отзыв собственной сессии.

E2E: `tests/e2e/recovery-devices.spec.ts` использует два независимых Chromium-контекста с одним Matrix-аккаунтом: настройка secret storage, зашифрованное сообщение, ожидание серверного backup count, новый вход, ввод recovery key, чтение предыдущего сообщения, отзыв старого устройства через UIA и HTTP 401 для старого access token. Тест не печатает recovery key и токен.

Дополнительная ручная приёмка: сравнить SAS на двух настоящих устройствах, намеренно выбрать «не совпадает», проверить отмену; проверить смену identity, удаление участника и невозможность чтения новых событий после kick; второй экземпляр той же вкладки должен быть безопасно заблокирован. Полноценная криптоэкспертиза остаётся этапом 6.
