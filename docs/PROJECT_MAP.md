# PROJECT_MAP — искать по задаче

| Что изменить                             | Файл/модуль                                                                              | Не менять                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------- |
| Логин и временное хранение сессии        | `packages/matrix-adapter/src/session.ts`, `apps/web/src/features/auth/`                  | Ключи или Synapse DB                  |
| Единственный MatrixClient и Rust Crypto  | `packages/matrix-adapter/src/client.ts`, `tab-lock.ts`, `apps/web/src/app/use-matrix.ts` | Самостоятельные crypto алгоритмы      |
| Создать E2EE-канал и пригласить          | `packages/matrix-adapter/src/rooms.ts`, `apps/web/src/features/channels/`                | Публичные комнаты, plaintext fallback |
| Отказ plaintext и отправка               | `packages/matrix-adapter/src/crypto.ts`, `messages.ts`                                   | React rendering                       |
| Расшифрованные сообщения                 | `packages/matrix-adapter/src/timeline.ts`, `apps/web/src/features/messages/`             | Исходные wire payloads                |
| Графитовый стиль и каркас                | `apps/web/src/layouts/`, `shared/styles/`                                                | Matrix Crypto API                     |
| Postgres и запуск                        | `deploy/compose.dev.yml`, `scripts/init-dev.sh`                                          | Новые Docker-сервисы без ADR          |
| Конфиг Synapse, безопасность регистрации | `services/synapse/render_config.py`                                                      | Отдельную БД/протокол                 |
| Сетевой маршрутизатор и dev headers      | `services/caddy/Caddyfile.dev`                                                           | Ключи/сессии                          |
| CI и интеграционный тест                 | `.github/workflows/`, `tests/e2e/`                                                       | Production secrets                    |
| Документировать файл                     | `scripts/file-manifest.json`, `scripts/generate-file-index.mjs`                          | Ручной FILE_INDEX                     |

Точный список по файлам с контрактами — `docs/FILE_INDEX.md`; архитектурная граница описана в `docs/ARCHITECTURE.md`.

## Этап 2: точки входа

| Задача | Модуль | Ограничения |
| --- | --- | --- |
| Recovery key / encrypted secret storage | `packages/matrix-adapter/src/recovery.ts`, `secret-storage.ts`; UI `features/security/RecoveryControls.tsx` | Не писать и не логировать приватные ключи |
| Список и отзыв устройств | `packages/matrix-adapter/src/devices.ts`, `features/security/DeviceControls.tsx` | Только штатная серверная проверка Matrix UIA |
| SAS / предупреждения о новой identity | `packages/matrix-adapter/src/verification.ts`, `identity.ts`; `VerificationControls.tsx`, `RoomTrust.tsx` | Без silent verify / acceptance |
| Исключение и ротация Megolm | `packages/matrix-adapter/src/identity.ts` | Server-enforced kick, old events remain accessible |
| Сквозное восстановление на втором устройстве | `tests/e2e/recovery-devices.spec.ts` | Ни ключи, ни токены не записывать в CI логи |
