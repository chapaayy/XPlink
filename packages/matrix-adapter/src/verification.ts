import type { MatrixClient } from 'matrix-js-sdk';
import type { ShowSasCallbacks, VerificationRequest, Verifier } from 'matrix-js-sdk/lib/crypto-api';

export interface SasDisplay {
  emoji: string[];
  decimal: number[];
}

/** Explicit human-to-human SAS comparison; never automatically confirms identities. */
export class VerificationFlow {
  private verifier: Verifier | null = null;
  private callbacks: ShowSasCallbacks | null = null;

  constructor(
    readonly request: VerificationRequest,
    private readonly changed: () => void,
  ) {
    request.on('change', changed);
  }

  get state(): number {
    return this.request.phase;
  }

  get sas(): SasDisplay | null {
    if (!this.callbacks) return null;
    return {
      emoji: this.callbacks.sas.emoji?.map((entry) => entry[0]) ?? [],
      decimal: [...(this.callbacks.sas.decimal ?? [])],
    };
  }

  async accept(): Promise<void> {
    await this.request.accept();
    this.changed();
  }

  async startSas(): Promise<void> {
    this.verifier = await this.request.startVerification('m.sas.v1');
    this.verifier.on('show_sas', (callbacks) => {
      this.callbacks = callbacks;
      this.changed();
    });
    this.verifier.on('cancel', () => this.changed());
    // Verification remains pending until both people compare and confirm SAS.
    void this.verifier.verify().catch(() => this.changed());
    this.changed();
  }

  async confirm(): Promise<void> {
    if (!this.callbacks) throw new Error('Сначала сравните код на обоих устройствах.');
    await this.callbacks.confirm();
    this.changed();
  }

  mismatch(): void {
    if (!this.callbacks) throw new Error('Код ещё не получен.');
    this.callbacks.mismatch();
    this.changed();
  }

  async cancel(): Promise<void> {
    await this.request.cancel();
    this.changed();
  }

  dispose(): void {
    this.request.off('change', this.changed);
  }
}

export async function requestOwnVerification(client: MatrixClient): Promise<VerificationRequest> {
  const crypto = client.getCrypto();
  if (!crypto) throw new Error('Rust Crypto недоступен.');
  return crypto.requestOwnUserVerification();
}

export async function requestPeerVerification(
  client: MatrixClient,
  userId: string,
  roomId: string,
): Promise<VerificationRequest> {
  const room = client.getRoom(roomId);
  const crypto = client.getCrypto();
  if (!room || !crypto || room.getMyMembership() !== 'join') {
    throw new Error('Для сверки личности нужен общий доступный канал.');
  }
  const devices = await crypto.getUserDeviceInfo([userId], true);
  const target = devices.get(userId);
  const deviceId = target?.keys().next().value;
  if (!deviceId) throw new Error('У собеседника нет доступных E2EE-устройств.');
  return crypto.requestDeviceVerification(userId, deviceId);
}
