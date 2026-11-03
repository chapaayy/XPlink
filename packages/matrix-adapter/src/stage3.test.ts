import { describe, it, expect, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import {
  sendEncryptedAttachment,
  MAX_ATTACHMENT_BYTES,
  downloadEncryptedAttachment,
} from './attachments';
import { createSpace } from './spaces';
import { canWrite, setChannelReadOnly, userLevel } from './roles';
import { addReaction } from './reactions';

const levels = {
  users: { '@alice:localhost': 100, '@bob:localhost': 0 },
  users_default: 0,
  events_default: 0,
  state_default: 50,
  events: { 'm.room.encrypted': 50 },
};
const room = {
  getMyMembership: () => 'join',
  hasEncryptionStateEvent: () => true,
  currentState: { getStateEvents: () => ({ getContent: () => levels }) },
};
const client = {
  getRoom: () => room,
  getUserId: () => '@bob:localhost',
  getCrypto: () => ({ isEncryptionEnabledInRoom: async () => true }),
  sendStateEvent: vi.fn(async () => {
    throw new Error('M_FORBIDDEN');
  }),
  uploadContent: vi.fn(),
  sendEvent: vi.fn(),
} as unknown as MatrixClient;

describe('stage 3: server authorization and encrypted media safety', () => {
  it('uses actual m.room.encrypted wire-event power levels for readonly UI', () => {
    expect(userLevel(client, '!room:localhost', '@bob:localhost')).toBe(0);
    expect(canWrite(client, '!room:localhost')).toBe(false);
  });
  it('does not silently succeed when Synapse refuses power-level state', async () => {
    await expect(setChannelReadOnly(client, '!room:localhost', false)).rejects.toThrow(
      'M_FORBIDDEN',
    );
  });
  it('rejects attachment sizes before uploading any plaintext', async () => {
    const upload = vi.spyOn(client, 'uploadContent');
    const empty = { size: 0 } as File;
    const oversized = { size: MAX_ATTACHMENT_BYTES + 1 } as File;
    await expect(sendEncryptedAttachment(client, '!room:localhost', empty)).rejects.toThrow(
      '10 МБ',
    );
    await expect(sendEncryptedAttachment(client, '!room:localhost', oversized)).rejects.toThrow(
      '10 МБ',
    );
    expect(upload).not.toHaveBeenCalled();
  });
  it('will never fetch plaintext or arbitrary URLs in file metadata', async () => {
    await expect(
      downloadEncryptedAttachment(client, {
        name: 'bad',
        mimeType: 'text/plain',
        size: 1,
        encrypted: {
          url: 'https://evil.test/plaintext',
          iv: '',
          v: 'v2',
          hashes: { sha256: '' },
          key: { k: '', kty: 'oct', key_ops: [], alg: 'A256CTR', ext: true },
        },
      }),
    ).rejects.toThrow();
  });
  it('rejects reactions when no E2EE engine is available', async () => {
    const noCrypto = {
      getRoom: () => room,
      getCrypto: () => null,
      sendEvent: vi.fn(),
    } as unknown as MatrixClient;
    await expect(addReaction(noCrypto, '!room:localhost', '$event', '👍')).rejects.toThrow('E2EE');
    expect(noCrypto.sendEvent).not.toHaveBeenCalled();
  });
  it('cannot create a space without an initialized encrypted-message client', async () => {
    const noCrypto = { getCrypto: () => null, createRoom: vi.fn() } as unknown as MatrixClient;
    await expect(createSpace(noCrypto, 'Team')).rejects.toThrow('Rust Crypto');
    expect(noCrypto.createRoom).not.toHaveBeenCalled();
  });
});
