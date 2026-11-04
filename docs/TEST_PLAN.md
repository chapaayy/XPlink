# План проверок этапов 1 и 2

**Быстрые:** `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm docs:check` (запускает Node-манифестный индекс). Юнит-тесты проверяют, что crypto отсутствует или state не encrypted => sendEvent не вызывается.

**Интеграция:** `tests/e2e/two-browsers.spec.ts`: два отдельных Chromium context + отдельные Matrix аккаунты alice/bob, приватная комната, invitation/join, send, decrypt; запрос Matrix `/messages` обязан вернуть `m.room.encrypted` и не содержать plaintext. Требуется реальная Docker-инсталляция и Chromium (`pnpm exec playwright install chromium`). GitHub Actions поднимает Synapse/Postgres/Caddy и создаёт временные аккаунты перед E2E.

**Перезапуск:** после успешного E2E выполнить `docker compose --env-file .env -f deploy/compose.dev.yml restart postgres synapse` и убедиться, что `/versions` снова отвечает. Для полной проверки исторической расшифровки не закрывайте оба Chromium context до повторного подключения: восстановление ключей с другого устройства относится к этапу 2.

**Ограничения:** тест `m.room.encrypted` проверяет отсутствие конкретного маркера в ответе API и отправку по SDK, но не доказывает отсутствие его во всех логах/бэкапах. Не заменяет криптоаудит, XSS-тесты и план backup/restore. Они входят в этап 6.

**Bootstrap regression:** the E2E test first requires the React login form to render (not just HTTP 200); on failure it reports only bootstrap error summaries and DOM root element count, never message bodies or session tokens. The dev gateway CSP must allow the Vite React Refresh preamble; production CSP must not inherit that exception.

## Этап 2 — ключи, устройства, идентичность

Unit: `packages/matrix-adapter/src/identity.test.ts` проверяет запрет отправки после identity change и сброс outgoing Megolm только после успешного server-authorized kick. `recovery.test.ts` проверяет ручной ключ, очистку памяти и запрет сброса существующих trust keys / отзыв собственной сессии.

E2E: `tests/e2e/recovery-devices.spec.ts` использует два независимых Chromium-контекста с одним Matrix-аккаунтом: настройка secret storage, зашифрованное сообщение, ожидание серверного backup count, новый вход, ввод recovery key, чтение предыдущего сообщения, отзыв старого устройства через UIA и HTTP 401 для старого access token. Тест не печатает recovery key и токен.

Дополнительная ручная приёмка: сравнить SAS на двух настоящих устройствах, намеренно выбрать «не совпадает», проверить отмену; проверить смену identity, удаление участника и невозможность чтения новых событий после kick; второй экземпляр той же вкладки должен быть безопасно заблокирован. Полноценная криптоэкспертиза остаётся этапом 6.

**Изоляция E2E:** каждый сценарий использует отдельную пару/аккаунт Synapse, чтобы rate limits для логина и изменения cross-signing / device identities одного теста не влияли на другие. Аккаунты создаются временно в job GitHub Actions при закрытой регистрации; ключи не печатаются.

**CI ratelimit policy:** Synapse normally limits `rc_login.address` to a burst of 5 requests per IP; several independent browser cases run behind the same local Caddy address. Dev-only generated config raises the IP burst to 30 while retaining normal per-account and failed-attempt limits. Production must have a separate, strict policy.

**Фактическая приёмка:** [GitHub Actions #41722622079](https://github.com/chapaayy/XPlink/actions/runs/41722622079), успешно 5/5 E2E, quality и restart persistence. Серверный отказ при чтении будущего события исключённым участником допускает HTTP 403 или 404 (скрытие существования приватного события), но не HTTP 200. Реальный CI не заменяет независимый аудит.

## Stage 3 — реальные проверки текстового продукта

- Unit `stage3.test.ts`: отсутствие Rust Crypto блокирует создание Space, некорректный размер файла блокирует upload, подмена URL не приводит к загрузке, попытка правки power levels не маскирует отказ сервера, E2EE gate запрещает реакцию без crypto.
- Playwright `stage3-dm-media.spec.ts`: личный E2EE чат в двух Chromium контекстах, зашифрованный текст/реакция, загрузка бинарного ciphertext, скачивание/дешифровка на устройстве получателя; ciphertext не содержит тестовый plaintext.
- Playwright `stage3-spaces-roles.spec.ts`: создание приватного Workspace, вложенной категории и E2EE-канала, приглашение второго пользователя, read-only power levels, HTTP 403 при прямом запросе записи `m.room.power_levels` без прав, повышение до moderator 50 и разрешённая зашифрованная отправка.
- Полный прогон объединяет регрессии этапов 1–2, `pnpm docs:check`, Prettier, ESLint, TS strict, Vitest, Vite production build, Docker restart persistence. Все тестовые аккаунты изолированы.
- Эти тесты проверяют конкретные сценарии, **но не** заменяют независимый security review, security testing of arbitrary file formats, DoS/large media и продакшен backup/restore.

## Этап 3 — результат приёмки

[GitHub Actions #41846507062](https://github.com/chapaayy/XPlink/actions/runs/41846507062) — 7/7 E2E прошли. В `stage3-spaces-roles.spec.ts` дополнительно проверена прямая HTTP-попытка отправить `m.room.encrypted` без необходимого power level: Synapse возвращает 403 `M_FORBIDDEN`; это не ограничение интерфейса. В `stage3-dm-media.spec.ts` проверены DM, реакции, ciphertext на сервере и восстановление файлового содержимого только на клиенте. После перезапуска PostgreSQL/Synapse сохранились 8 комнат. Проверки не заменяют аудит, отдельные права каждого пространства не наследуются в каналы.
