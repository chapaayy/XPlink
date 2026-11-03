# XPlink — приватный мессенджер (Stage 2 development)

XPlink — самостоятельный веб-клиент для закрытого Matrix-сервера. Архитектура: **React + TypeScript + Vite + Tailwind**, **matrix-js-sdk / Rust Crypto WASM**, **Synapse + PostgreSQL + Caddy**. Никакой собственной криптографии или сервера, читающего сообщения. Цель — до 100 пользователей, но **это не готовый защищённый продукт**.

## Этапы 1 и 2: функциональность

- Вход двух предварительно созданных аккаунтов, независимые устройства и локальное Rust Crypto хранилище (IndexedDB).
- Создание **только приватных E2EE-комнат** с приглашением участника; принятие приглашения, обмен сообщениями и их расшифровка клиентом.
- **Fail-closed:** без подтверждённого E2EE нельзя отправить сообщение; две вкладки с общей crypto store не работают параллельно.
- Локальная инфраструктура Docker Compose с сохранением PostgreSQL, Synapse-ключей и медиа; закрытая регистрация; Caddy публикует только Matrix client API.
- TypeScript strict, unit/security tests, E2E-сценарий двух браузеров с проверкой шифротекста в API, CI и файловый индекс.

### Добавления второго этапа

- Панель «Безопасность и устройства»: реальный список Matrix devices, статус доверия через Rust Crypto, отзыв другой сессии с подтверждением пароля на сервере.
- Первичная настройка Matrix secret storage и cross-signing с recovery key. Ключ показывается только пользователю; браузер **не сохраняет** его в localStorage/sessionStorage и не передаёт нашему backend.
- На другом устройстве — ввод recovery key и восстановление зашифрованных Megolm-сессий из стандартного Matrix key backup.
- SAS verification через Matrix SDK: сравнение эмодзи/чисел и ручное подтверждение. Изменившаяся identity блокирует отправку до проверки.
- При успешном Matrix kick отправляющая Megolm-сессия сбрасывается. Ранее прочитанные сообщения нельзя отозвать.

**Граница безопасности:** без сохранённого recovery key история может быть безвозвратно потеряна; старые сообщения остаются доступными тем, кто их уже получил. Проект по-прежнему не прошёл security audit и не готов к публичной эксплуатации.

## Запуск на Linux / WSL2 / macOS с Docker

Требуются **Docker Engine с Compose v2**, `python3`, `curl`. Для команд качества: Node.js 22.12+ и Corepack/pnpm.

```bash
bash scripts/init-dev.sh
docker compose --env-file .env -f deploy/compose.dev.yml up --build -d
bash scripts/healthcheck.sh
```

Открыть **http://localhost:8080** — это только локальная среда. Затем создать двух пользователей (в двух отдельных интерактивных запусках):

```bash
docker compose --env-file .env -f deploy/compose.dev.yml exec synapse \
  register_new_matrix_user -c /data/homeserver.yaml http://localhost:8008
```

Создайте `alice` и `bob`, не делайте их администраторами. Войти в двух **разных профилях браузера** через UI. Под `alice` создайте комнату, пригласите `@bob:localhost`; `bob` принимает приглашение и может отправлять зашифрованные сообщения. Регистрации в UI нет намеренно. **Не публикуйте порт 8080 наружу.**

## Проверки разработчика

```bash
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm docs:check
```

Docker E2E запускается в CI на чистой среде и требует Chromium. Скрипт ручного E2E запуска — в `docs/TEST_PLAN.md`. Изменения изолированы в PR. Версии закреплены, lockfile должен быть сгенерирован pnpm в доверенной CI среде.

**Важно:** `MATRIX_SERVER_NAME=localhost` — постоянная локальная Matrix identity. Если создать реальные аккаунты на другом домене, нельзя просто поменять `server_name`. Внешний HTTPS и поддерживаемый production-деплой относятся к этапу 6. Восстановление ключей, cross-signing и trust — в работе этапа 2, под проверкой E2E. **Не отправляйте секретные сообщения до прохождения всех проверок.**

## Навигация

`docs/START_HERE.md` → `docs/PROJECT_MAP.md` → `docs/FILE_INDEX.md` → `docs/ARCHITECTURE.md` → `docs/SECURITY_MODEL.md` → `docs/ROADMAP.md`.

Решения — `docs/adr/`, тесты — `docs/TEST_PLAN.md`, эксплуатация — `docs/runbooks/`.
