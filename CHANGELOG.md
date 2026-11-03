# CHANGELOG

## 0.1.0 — Stage 1 foundation (unreleased)

- Инициализирована архитектура XPlink, закрытая локальная Synapse-инфраструктура.
- Добавлен минимальный Rust Crypto E2EE-клиент с fail-closed отправкой и защитой от двух вкладок.
- Реализованы комнаты, приглашения, сообщения и проверки целостности документации.
- Исправлена несовместимость dev CSP с Vite React Refresh; браузерная проверка теперь диагностирует пустую страницу до долгих таймаутов.
- Пройдена реальная E2EE-приёмка двух независимых Chromium-контекстов с Synapse/PostgreSQL/Caddy, API ciphertext assertion и restart persistence в GitHub Actions (`41711889621`).
- **Не готово для production:** recovery/device verification, HTTPS, hardening, резервное восстановление и аудиты.

## 0.2.0 — Stage 2 identity and recovery (accepted prototype)

- Матрица операций с личными Matrix-устройствами: просмотр, проверка статуса и отзыв чужой сессии через серверный UIA.
- Добавлены Matrix secret storage / cross-signing / key backup и восстановление ключей на втором устройстве, без самодельной криптографии.
- SAS-проверка и защита от автоматического подтверждения новой identity.
- Появились предупреждения о смене идентичности, отказ от отправки при изменённой identity, сброс Megolm outbound session после успешного исключения участника.
- Подтверждено реальным GitHub Actions CI #41722622079: unit/build/docs/format/lint/typecheck, 5 Playwright E2E (recovery, SAS, kick, tab isolation, encrypted chat), restart persistence.
- **Ограничение:** ключи нельзя восстановить без сохранённого recovery key; уже прочитанные данные нельзя отозвать; production HTTPS, аудит и более широкий device/session hardening запланированы на отдельные этапы.

## 0.3.0 — Stage 3 text product (under CI acceptance)

- Matrix `m.space` и вложенные категории, каналы, отдельная навигация.
- Защищённые прямые чаты с `m.direct`, реакции и зашифрованные файлы с проверкой целостности.
- Реальные per-channel роли и read-only permissions на основе Synapse power levels.
- Новый интерфейс ролей, медиа, реакций и навигации; E2E и негативные тесты безопасности.
- До завершения CI и проверки всех сценариев этот этап считается в разработке.
