import type { MatrixClient } from 'matrix-js-sdk';
import { Preset, Visibility } from 'matrix-js-sdk';

export const VOICE_ROOM_STATE = 'io.xplink.voice';
export function isVoiceRoom(client: MatrixClient, roomId: string): boolean {
  return client.getRoom(roomId)?.currentState.getStateEvents(VOICE_ROOM_STATE, '')?.getContent()?.kind === 'voice';
}

/** Voice channels have real membership and E2EE, not just a client-side label. */
export async function createVoiceRoom(client: MatrixClient, name: string, invitee = ''): Promise<string> {
  if (!client.getCrypto()) throw new Error('Rust Crypto необходим для голосового канала.');
  if (!name.trim()) throw new Error('Укажите название голосового канала.');
  const invite = invitee.trim();
  if (invite && !/^@[^:\s]+:.+$/.test(invite)) throw new Error('Неверный Matrix ID.');
  const result = await client.createRoom({
    name: name.trim(),
    visibility: Visibility.Private,
    preset: Preset.PrivateChat,
    invite: invite ? [invite] : [],
    initial_state: [
      { type: 'm.room.encryption', state_key: '', content: { algorithm: 'm.megolm.v1.aes-sha2' } },
      { type: VOICE_ROOM_STATE, state_key: '', content: { kind: 'voice', version: 1 } },
    ],
  });
  return result.room_id;
}
