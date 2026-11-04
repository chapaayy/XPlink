export { passwordLogin, readSession, storeSession, clearSession } from './session';
export type { StoredSession } from './session';
export { acquireCryptoTab } from './tab-lock';
export { initializeMatrix } from './client';
export { assertEncryptedRoom } from './crypto';
export { listRooms, createEncryptedRoom, acceptRoomInvite } from './rooms';
export type { RoomSummary } from './rooms';
export { sendEncryptedMessage } from './messages';
export { roomMessages } from './timeline';
export type { ChatMessage } from './timeline';

export { SecretStorageAccess } from './secret-storage';
export { createRecovery, getRecoveryStatus, recoverDevice } from './recovery';
export type { RecoveryStatus } from './recovery';
export { listOwnDevices, revokeDevice } from './devices';
export type { OwnDevice } from './devices';
export { roomIdentities, assertStableRoomIdentities, removeRoomMember } from './identity';
export type { PeerIdentity } from './identity';
export { VerificationFlow, requestOwnVerification, requestPeerVerification } from './verification';
export type { SasDisplay } from './verification';

export {
  createSpace,
  createCategory,
  createSpaceChannel,
  listSpaces,
  childRoomIds,
  isSpace,
  inviteToSpace,
} from './spaces';
export type { SpaceSummary } from './spaces';
export { createDirectChat, directRoomMap, directRoomIds, markIncomingDirect } from './directs';
export {
  roomPowerLevels,
  userLevel,
  isRoomCreator,
  canWrite,
  isReadOnly,
  assignChannelRole,
  setChannelReadOnly,
} from './roles';
export type { ChannelRole } from './roles';
export { addReaction } from './reactions';
export {
  sendEncryptedAttachment,
  downloadEncryptedAttachment,
  MAX_ATTACHMENT_BYTES,
} from './attachments';
export type { ChatAttachment, AttachmentRef } from './attachments';
export type { ReactionSummary } from './timeline';

export { createVoiceRoom, isVoiceRoom, VOICE_ROOM_STATE } from './voice';
