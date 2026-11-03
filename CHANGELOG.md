# CHANGELOG

## 0.1.0 — Stage 1 foundation (unreleased)

- Инициализирована архитектура XPlink, закрытая локальная Synapse-инфраструктура.
- Добавлен минимальный Rust Crypto E2EE-клиент с fail-closed отправкой и защитой от двух вкладок.
- Реализованы комнаты, приглашения, сообщения и проверки целостности документации.
- Исправлена несовместимость dev CSP с Vite React Refresh; браузерная проверка теперь диагностирует пустую страницу до долгих таймаутов.
- Пройдена реальная E2EE-приёмка двух независимых Chromium-контекстов с Synapse/PostgreSQL/Caddy, API ciphertext assertion и restart persistence в GitHub Actions (`41711889621`).
- **Не готово для production:** recovery/device verification, HTTPS, hardening, резервное восстановление и аудиты.
