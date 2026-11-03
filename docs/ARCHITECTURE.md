# Архитектура XPlink

```text
Browser A / Browser B (separate devices / IndexedDB / Rust Crypto)
             | encrypted m.room.encrypted events
             v
         Caddy :8080 (local dev only)
          |                 |
    /_matrix/*               web:5173 (Vite + React)
          |
       Synapse:8008 (internal only)
          |
      PostgreSQL:5432 (internal only)
```

UI получает от `matrix-adapter` только примитивы и типизированные данные. SDK создаёт crypto store на устройстве, шифрует до сетевого запроса и расшифровывает после получения. Synapse хранит события, маршрутизирует их и знает метаданные, но при корректном E2EE не имеет ключей для plaintext. Участники, названия комнат и время событий не являются секретными для сервера.

`createEncryptedRoom()` задаёт `m.room.encryption` уже в `initial_state`; `sendEncryptedMessage()` проверяет **оба** сигнала шифрования (state event и Rust Crypto) и отказывается от отправки без них. Web Locks исключают конкурентное открытие одной Rust Crypto store в соседней вкладке.

Нет собственных `services/control-api`, `rtc-adapter`, LiveKit: они нужны позже, если принят ADR и подтверждена потребность. Критические API у Matrix. См. `docs/DATA_FLOW.md`.

## Этап 2

Контур trust и recovery остаётся в браузерном `matrix-adapter`. React-части `features/security` лишь принимают пользовательское подтверждение и показывают статус. Серверу разрешено хранить только зашифрованный secret storage и encrypted Megolm key backup. `SecretStorageAccess` предоставляет SDK исключительно временный raw key в памяти браузера, без серверной обработки. Запрещено добавлять самописный криптографический примитив или сторонний backend для этой логики.
