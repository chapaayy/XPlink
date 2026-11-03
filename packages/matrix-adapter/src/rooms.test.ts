import { describe, it, expect, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import { createEncryptedRoom } from './rooms';

const createRoom = vi.fn(async (options: unknown) => {
  void options;
  return { room_id: '!test:localhost' };
});
const client = { getCrypto: () => ({}), createRoom } as unknown as MatrixClient;

describe('room creation invariants', () => {
  it('always creates private Megolm rooms', async () => {
    expect(await createEncryptedRoom(client, 'General', '@bob:localhost')).toBe('!test:localhost');
    const options = createRoom.mock.calls.at(-1)?.[0] as {
      visibility: string;
      initial_state: { type: string; content: { algorithm: string } }[];
      invite: string[];
    };
    expect(options.visibility).toBe('private');
    expect(options.initial_state[0]).toEqual({
      type: 'm.room.encryption',
      state_key: '',
      content: { algorithm: 'm.megolm.v1.aes-sha2' },
    });
    expect(options.invite).toEqual(['@bob:localhost']);
  });
  it('blocks create without a crypto engine', async () => {
    const noCrypto = { getCrypto: () => null, createRoom } as unknown as MatrixClient;
    await expect(createEncryptedRoom(noCrypto, 'Bad', '')).rejects.toThrow('Rust Crypto');
  });
});
