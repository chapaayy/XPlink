# API contracts

На этапе 1 **нет собственного прикладного API**. Клиент пользуется проверенными интерфейсами matrix-js-sdk. За внешней границей adapters находятся функции `passwordLogin`, `initializeMatrix`, `createEncryptedRoom`, `acceptRoomInvite`, `assertEncryptedRoom`, `sendEncryptedMessage`, `listRooms`, `roomMessages`. Клиентские Matrix ошибки преобразуются UI в безопасное сообщение без содержимого исходного запроса/текста.

## Stage 3 — публичные интерфейсы matrix-adapter

- `spaces.ts`: `createSpace`, `createCategory`, `createSpaceChannel`, `listSpaces`, `childRoomIds`, `inviteToSpace`; все ссылки — стандартные `m.space.*` state events.
- `directs.ts`: `createDirectChat`, `markIncomingDirect`, `directRoomMap`, `directRoomIds`; сохранение привязок только в персональном `m.direct` account data.
- `roles.ts`: `roomPowerLevels`, `userLevel`, `canWrite`, `isReadOnly`, `assignChannelRole`, `setChannelReadOnly`. Клиент может предварительно скрыть кнопку, но авторизация выполняется Synapse.
- `reactions.ts`: `addReaction`, с двойной E2EE/identity проверкой.
- `attachments.ts`: `sendEncryptedAttachment`, `downloadEncryptedAttachment`, `MAX_ATTACHMENT_BYTES`. Вызов без E2EE отклоняется **до любого media upload**. Расшифровка требует корректного `mxc://`, SHA-256, encryption info и действующей Matrix-сессии.

Никакого собственного backend API и внешних сервисов расшифровки.
