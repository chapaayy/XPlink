# Permissions — текущая граница

На этапе 1 существует только Matrix membership и стандартные Synapse power levels по умолчанию. `createEncryptedRoom` создаёт `visibility: private`, `preset: private_chat`, приглашения через Matrix Client API. Не реализована Discord-подобная кастомная модель ролей; UI нигде не утверждает, что она есть. Проверка отказа от приглашения/записи через прямые Matrix-запросы нужна для этапа 3.
