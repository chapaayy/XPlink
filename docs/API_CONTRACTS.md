# API contracts

На этапе 1 **нет собственного прикладного API**. Клиент пользуется проверенными интерфейсами matrix-js-sdk. За внешней границей adapters находятся функции `passwordLogin`, `initializeMatrix`, `createEncryptedRoom`, `acceptRoomInvite`, `assertEncryptedRoom`, `sendEncryptedMessage`, `listRooms`, `roomMessages`. Клиентские Matrix ошибки преобразуются UI в безопасное сообщение без содержимого исходного запроса/текста.
