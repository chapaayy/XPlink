# Backup / restore — рамки этапа 1

PostgreSQL хранится в Docker volume `postgres-data`, signing key/конфиг/медиа — в `.local/synapse`. Оба компонента сохраняются при `docker compose restart` и `down` без `-v`. Потеря любого из них может нарушить работоспособность. Backup требует **совместного согласованного снимка PostgreSQL и `.local/synapse`**. Не копируйте живую PostgreSQL директорию как обычный архив. Рецепт зашифрованного off-host backup и реально проверенного restore остаётся этапом 6. Пользовательские browser encryption keys **не** входят в server backup.
