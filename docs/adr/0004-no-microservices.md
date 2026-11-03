# ADR-0004: без лишних сервисов

Статус: принят. Этап 1 содержит только web, Synapse, PostgreSQL и Caddy. Собственный Fastify control API, Redis, MinIO, LiveKit не создаются без конкретного сценария и ADR. Система остаётся простым modular monolith вокруг проверенного Matrix backend.
