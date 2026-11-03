# Потоки данных (stage 1)

1. **Login:** пользователь вводит пароль; браузер напрямую вызывает Synapse `/_matrix/client/v3/login` по localhost. Ответ содержит access token и `device_id`; токен в текущей вкладке хранится в `sessionStorage` (XSS риск остаётся), а криптоключи создаются Rust Crypto и сохраняются в IndexedDB.
2. **Room:** клиент создаёт приватную комнату через `createRoom(initial_state=[m.room.encryption])`; Synapse знает участников и имя комнаты. Приглашённый принимает приглашение стандартным `joinRoom`.
3. **Message:** React передаёт текст только локальному adapter; `assertEncryptedRoom` проверяет SDK, после чего matrix-js-sdk шифрует `m.room.message` в `m.room.encrypted`. Synapse хранит ciphertext, а другой browser расшифровывает своим Rust Crypto.
4. **No keys to backend:** нет своего API и backend-получателя plaintext; никакой серверный полнотекстовый поиск не выполняется.
5. **Media/RTC:** не реализованы в этапе 1. Запрещено объявлять их E2EE без отдельного теста.
