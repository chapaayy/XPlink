# Начать здесь

1. `README.md` — быстрый старт и реальные возможности.
2. `docs/ROADMAP.md` — граница текущего этапа, критерии приёмки и незавершённые работы.
3. `docs/PROJECT_MAP.md` — какой модуль менять.
4. `docs/FILE_INDEX.md` — полный реестр конкретных источников.
5. `docs/SECURITY_MODEL.md` → `docs/ARCHITECTURE.md` → `docs/adr/` — инварианты и решения.

Монорепо в раннем этапе: `apps/web` (UI), `packages/matrix-adapter` (единственная бизнес-граница с SDK), `services/synapse`, `services/caddy`, `deploy/`, `scripts/`, `tests/`. **Не создавать заранее** API, RTC, Redis, S3 и фиктивные папки модулей следующих этапов.
