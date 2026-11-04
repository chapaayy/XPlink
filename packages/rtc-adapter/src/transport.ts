import type { MatrixClient } from 'matrix-js-sdk';

export interface LiveKitTransport {
  type: 'livekit';
  livekit_service_url: string;
}
export interface RtcTransportResponse {
  rtc_transports: LiveKitTransport[];
}

export function isTrustedRtcUrl(value: string, homeserver: string): boolean {
  try {
    const url = new URL(value);
    const base = new URL(homeserver);
    if (url.username || url.password || url.hash) return false;
    // Never silently allow a downgrade in production. Loopback is a special
    // secure context supported by browsers for local testing only.
    return (
      (url.protocol === 'https:' && base.protocol === 'https:') ||
      (url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname) &&
        ['localhost', '127.0.0.1'].includes(base.hostname))
    );
  } catch {
    return false;
  }
}

/** Transport information is only requested from the configured Matrix server. */
export async function discoverRtcTransport(client: MatrixClient): Promise<LiveKitTransport> {
  const base = client.getHomeserverUrl();
  const token = client.getAccessToken();
  if (!token) throw new Error('RTC_NO_SESSION');
  const endpoint = new URL('/_matrix/client/unstable/org.matrix.msc4143/rtc/transports', base);
  const response = await fetch(endpoint, {
    headers: { Authorization: 'Bearer ' + token },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('RTC_TRANSPORT_UNAVAILABLE');
  const data: unknown = await response.json();
  const transports = (data as { rtc_transports?: unknown } | null)?.rtc_transports;
  if (!Array.isArray(transports)) throw new Error('RTC_TRANSPORT_UNAVAILABLE');
  const focus = transports.find(
    (item): item is LiveKitTransport =>
      typeof item === 'object' &&
      item !== null &&
      (item as { type?: unknown }).type === 'livekit' &&
      typeof (item as { livekit_service_url?: unknown }).livekit_service_url === 'string' &&
      isTrustedRtcUrl((item as { livekit_service_url: string }).livekit_service_url, base),
  );
  if (!focus) throw new Error('RTC_TRANSPORT_UNAVAILABLE');
  return focus;
}
