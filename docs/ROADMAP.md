# ROADMAP — этапы и гейты

**Текущий этап: 4 / 6.** Этап 5 без отдельного запроса не начинать.

| Этап                    | Результат                                                                                           | Статус                                                |
| ----------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1. Каркас и E2EE        | Docker Synapse/Postgres/Caddy, React, два аккаунта и защищённый канал, ciphertext test, CI, restart | Принято: CI quality/E2EE зелёные, restart подтверждён |
| 2. Идентичность и ключи | Trust, verification, cross-signing, recovery и второй девайс                                        | Принято: quality, 5 E2E и restart успешно             |
| 3. Текстовый продукт    | Spaces, роли, DMs, реакции, вложения, серверные permissions                                         | Принято: quality, 7 E2E и restart успешно             |
| 4. RTC                  | MatrixRTC/LiveKit/видео/демонстрация экрана с отдельным E2EE тестом                                 | Реализация, приёмка требует реального медиа E2EE      |
| 5. UX/PWA               | Адаптивность, доступность, уведомления, performance                                                 | Не начат                                              |
| 6. Hardening            | HTTPS, независимый аудит, prod deploy, backup/restore, load                                         | Не начат                                              |

**Приёмка этапа 1:** разные browser contexts меняются сообщением; Synapse возвращает `m.room.encrypted` без test plaintext; `pnpm` checks в CI; docs index актуален; PostgreSQL и Synapse ключи переживают restart. Пока хотя бы один из этих пунктов не прошёл реальный тест — этап не считать принятым. Не выдавать этот прототип за production.

**Результат первой приёмки (2026-11-03, UTC):** GitHub Actions [run #41711889621](https://github.com/chapaayy/XPlink/actions/runs/41711889621): `quality` успешно, реальный Playwright E2EE-тест успешно (4,9 сек), шифротекст в Matrix API подтверждён, перезапуск PostgreSQL/Synapse сохранил комнату. Коммит исправления dev-CSP: `6f574aa`. Приёмка относится исключительно к локальному прототипу и не включает production-аудит, восстановление ключей или проверку устройств.

**Результат приёмки этапа 2 (2026-11-04):** [GitHub Actions #41722622079](https://github.com/chapaayy/XPlink/actions/runs/41722622079) — `quality` и `e2ee` успешно. Пять Playwright-проверок: восстановление зашифрованной истории по recovery key на втором устройстве с отзывом старой сессии; двухстороннее SAS-подтверждение; отказ исключённому участнику в доступе к новому шифротексту; безопасная блокировка второй вкладки одного криптохранилища; независимый E2EE-обмен. Перезапуск PostgreSQL/Synapse сохранил 4 комнаты. Этап принят как локальный прототип, не security-audited production.

**Приёмка этапа 3 (2026-11-04):** [GitHub Actions #41846507062](https://github.com/chapaayy/XPlink/actions/runs/41846507062) — оба job успешно; 7 Playwright E2E, включая Spaces/categories/E2EE channels, права на сервере, прямой отказ Synapse при неавторизованной отправке `m.room.encrypted`, DMs/reactions/зашифрованные вложения, а также регрессию ключей и E2EE. После рестарта PostgreSQL/Synapse сохранены 8 комнат. Приёмка локального прототипа, без production/security-аудита.
