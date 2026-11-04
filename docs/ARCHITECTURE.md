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

## Этап 3 — Matrix text product

Пространства и категории — обычные Matrix комнаты с `m.room.create.type=m.space`, дочерние связи — `m.space.child` и `m.space.parent`. Пространства служат **навигацией** и не используются для хранения текстов чата. E2EE-каналы и DMs создаются отдельно с `m.room.encryption` до первого события. Личные чаты отмечаются `m.direct` для каждого аккаунта, без собственной таблицы пользователей.

Слой `matrix-adapter` изолирует SDK и медиакриптографию (`matrix-encrypt-attachment@1.0.3`); React компоненты занимаются только состоянием интерфейса. Media bytes шифруются локально перед запросом `/upload`; ключ и IV прикрепляются лишь к Megolm-зашифрованному сообщению, которое доставляет SDK. При скачивании используется авторизованный Matrix media endpoint, проверяется SHA-256 и затем дешифруется только локально. Никаких plaintext `mxc` ссылок.

Права доступа — `m.room.power_levels` и членство Matrix; роль «модератор» соответствует power 50, «администратор» — 100. Spaces не дают автоматического наследования этих прав в дочерние комнаты. Подробности — `docs/PERMISSIONS.md` и ADR 0006.

## Этап 4 — MatrixRTC и LiveKit

```text
XPlink React (единственный MatrixClient, Rust Crypto)
    -> packages/rtc-adapter (E2EE room & membership checks + transport lookup)
    -> Element Call component 0.28.1 (experimental official React embedding)
         -> MatrixRTC membership and per-sender E2EE keys: Synapse
         -> LiveKit JWT via Synapse appservice MSC4502/MSC4512 (membership check)
         -> LiveKit SFU (forward encrypted WebRTC audio/video/screenshare)
```

Новые процессы в локальном Docker: `lk-jwt-service`, `livekit`, существующие Synapse/Caddy. Ключи SFU генерируются локально с mode 0600, JWT выдаётся авторизованному пользователю. `room.auto_create: false` на SFU; `LIVEKIT_FULL_ACCESS_HOMESERVERS=localhost` вместо wildcard. Медиа не проходит через собственный сервер XPlink, клиент использует официальный upstream SDK. В браузере только один MatrixClient с Rust Crypto. Для developer loopback используются HTTP/WS; это **не публичная конфигурация**.

**Решение по встроенному компоненту:** ADR-0003 фиксирует выбор официального Element Call React component вместо самописного widget driver. Его API является экспериментальным и AGPL-3.0; компонент допускает замену на widget через границу rtc-adapter. Нельзя утверждать E2EE без реальной многопользовательской проверки.
