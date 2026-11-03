# ADR-0002: Приватные E2EE-комнаты без downgrade

Статус: принят. Новые комнаты создаются приватными с `m.room.encryption` уже в `initial_state`. Отправка требует `hasEncryptionStateEvent()` и `CryptoApi.isEncryptionEnabledInRoom()`. Внешний недоверенный Matrix room нельзя незаметно превратить в обычный чат. Сбой E2EE = отказ отправки. Негативные тесты обязательны.
