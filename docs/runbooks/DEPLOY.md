# Dev deployment

Запуск только localhost. Выполнить `scripts/init-dev.sh`, после чего `docker compose --env-file .env -f deploy/compose.dev.yml up --build -d`. Проверить `scripts/healthcheck.sh`. Для отката к предыдущему коммиту откатить код и пересобрать `web`; не откатывать базу Synapse без проверки схем совместимости. **Не использовать эти шаги как production-инструкции.**
