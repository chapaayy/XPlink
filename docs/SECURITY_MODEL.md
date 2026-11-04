# Модель безопасности — с ограничениями

**Цель:** Synapse не должен видеть plaintext **тел сообщений** в E2EE-комнатах. `m.room.encrypted` проверяется через реальный Matrix API в `tests/e2e`. E2EE обеспечивает библиотека matrix-js-sdk + Rust Crypto, а не собственный шифр.

**Чего система не защищает на этом этапе:** от подмены JS владельцем сайта, XSS в браузере, компрометации конечного устройства, копирования сообщений участником, скомпрометированного администратором сервера приглашения и фишинга новой identity, потери ключей после удаления browser storage. Реализация recovery и SAS/cross-signing выполняется в этапе 2; до прохождения CI гарантии не подтверждены. Между браузерами используется стандартная криптография SDK, но ручная проверка собеседника пока отсутствует; модель аутентичности неполная. **Не используйте stage 1 для секретной переписки.**

**Metadata visible to server:** Matrix ID участников, время отправки, членство, имена комнат, IP и объёмы трафика. Комната по умолчанию создаётся приватной; сервер может иметь журнал запросов. Заголовки CSP снижают, но не исключают XSS риск.

**Fail-closed:** room без `m.room.encryption` не позволяет отправлять; UI отказывает даже в просмотре как чата XPlink. Запросы API могут быть вызваны вручную напрямую; безопасность зависит от Matrix server-side membership & Matrix crypto, не от скрытия кнопок.

**Stage 1 auth/session:** token хранится в `sessionStorage` и живёт до завершения сессии вкладки; JS в скомпрометированном origin может его прочитать. Одновременно две вкладки с crypto store не запускаются (Web Locks, fail-closed). Вход с нового устройства создаёт отдельные ключи, и предыдущая история может быть недоступна.

**Dev gateway:** HTTP только на loopback; публичный интернет, TLS, CSP Trusted Types, автоматические бэкапы и независимый аудит пока не обеспечены. Уровень конфиденциальности: **прототип, не утверждённый аудитом**.

**Development-only CSP exception:** `services/caddy/Caddyfile.dev` permits `script-src 'unsafe-inline'` because Vite React Refresh injects an inline preamble. This is acceptable **only on loopback for local development**; a production build must have a separate hardened CSP and static assets. Do not reuse the dev Caddyfile for public hosting.

## Этап 2: добавленные меры

Recovery key генерируется клиентским Rust Crypto, отображается только в браузере и используется через временный callback. Пароль аккаунта передаётся штатному Matrix UIA только при явном действии, не сохраняется на клиенте. Существующая cross-signing identity не сбрасывается автоматически. Полный key backup — клиентски зашифрованный объект; Synapse может хранить шифротекст и метаданные, но не владеет ключом расшифровки.

Смена известной identity блокирует отправку, и интерфейс требует ручной SAS verification. Принудительное исключение проверяется Matrix на сервере, затем сбрасывается исходящий Megolm; прошлые ключи у исключённого пользователя остаются. Отзыв Matrix device не удаляет данные на уже скомпрометированном устройстве. Параллельные вкладки одной origin по-прежнему не используют общий crypto store одновременно.

**Local-only CI login rate limits:** dev `render_config.py` increases only the shared-IP `rc_login.address` burst for isolated Playwright logins through Caddy. Account and failed-attempt limits remain Synapse defaults. The Docker port remains loopback-only; never reuse these limits for a public deployment. Existing homeserver credentials/configuration are not overwritten automatically.

## Этап 3: медиа, роли и метаданные

- Прежде чем загрузить файл, проверяется реальное E2EE-состояние комнаты + идентичности. Размер до 10 МБ, пустые файлы отклоняются. Содержимое файла шифрует на клиенте стандартная `matrix-encrypt-attachment@1.0.3` (Matrix v2 AES-CTR + SHA-256). `/upload` получает ciphertext, MIME `application/octet-stream`, без исходного имени.
- AES-ключ, IV, SHA-256 и MXC передаются в E2EE `m.room.message`; сервер не должен видеть эти значения без компрометации конечного клиента. Скачивание — только Matrix `mxc://` с авторизованным запросом к доверенному homeserver и проверкой SHA-256 до расшифровки. Сторонние URL отклоняются.
- Названия пространства, категории, состояние power levels, членство, отправители/время событий и размер зашифрованного медиа остаются видимыми серверу. Защита plaintext не означает сокрытие метаданных.
- Права ролей проверяются Synapse на событии `m.room.encrypted` (wire type). Для «только модераторы» порог 50. Никаких client-only permission overrides.
- Протокол Matrix не наследует права и membership через space hierarchy: приглашение в пространство не даёт автоматический доступ ко всем E2EE-каналам. Не заявлять обратного.
- Секреты файлов остаются в памяти браузера на период выполнения операции; компрометированный JS или устройство может прочитать их. Никакой независимой криптоэкспертизы нет.

## Этап 4 — угрозы реального времени

- Неизвестный или незашифрованный Matrix room **не запускает** медиа: `authorizeRtcCall` проверяет Rust Crypto, членство и объявленный защищённый транспорт.
- JWT авторизации выдаёт проверяющий Matrix membership `lk-jwt-service`, интегрированный с Synapse appservice. Браузер не содержит статический ключ LiveKit, а SFU с `room.auto_create: false` не позволяет всем создавать звонки.
- Потоки аудио, видео, screen share зашифровывает MatrixRTC/Element Call до SFU; шифрование не реализуется самостоятельно. Сам SFU видит IP, длительность, идентификаторы участников, битрейт и сетевые метаданные, поэтому E2EE ≠ анонимность.
- Компонент сторонний и лицензируется AGPL-3.0-or-commercial; использование требует соблюдения его лицензионных условий. Компрометированный клиент, подмена JS, запись собеседника и потеря ключей остаются угрозами.
- Development-only: Caddy доступен на `127.0.0.1:8080`, медиа UDP/TCP только loopback; реальные внешние сети/NAT и продакшен HTTPS пока не проверены. Не открывать dev порты наружу.

## Этап 5 — браузерное хранение и уведомления

- **CacheStorage:** только `/offline.html`, `/icons/xplink-192.png` и `/icons/xplink-512.png`. SW обрабатывает лишь same-origin navigation, сначала всегда обращается в сеть; `/_matrix`, `/livekit`, `/_synapse` и `/api` не перехватываются. Worker не хранит JS bundles, credentials, session, E2EE события, вложения и crypto recovery keys. В offline нельзя прочитать старую переписку, возвращается общая статическая страница.
- **Notifications:** browser permission запрашивается исключительно кнопкой. Пользовательское opt-in — один несекретный бит localStorage; по умолчанию выключено. Уведомление только если вкладка скрыта и появился новый зашифрованный и уже расшифрованный incoming-event. OS получает лишь `XPlink` и константу `Новое зашифрованное сообщение`; sender, room ID, event ID и текст не передаются. Rate limit 2.5 s.
- При полностью закрытой вкладке push не работает и сервер ничего не дешифрует. Название приложения может отображаться на экране блокировки. Вредоносный JS в origin остаётся за пределами данной модели. Production CSP, TLS, Web Push privacy design и независимый аудит — отдельная работа.
