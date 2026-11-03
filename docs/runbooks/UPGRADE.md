# Upgrade policy

Не использовать `latest` в Compose или package.json. Для каждого обновления: сверить changelog matrix-js-sdk/Rust Crypto, Synapse, Vite и React; обновить lockfile; запустить E2E отправки и декодирования на двух устройствах; проверить на копии данных, что restart/restart Synapse не теряет историю; подготовить rollback. Отдельно контролировать критические server name и signing key — не изменять.
