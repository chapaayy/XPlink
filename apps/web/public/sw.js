/* XPlink offline shell v1. No Matrix API, sessions, credentials or ciphertext are cached. */
const SHELL_CACHE = 'xplink-public-shell-v1';
const SHELL_FILES = ['/offline.html', '/icons/xplink-192.png', '/icons/xplink-512.png'];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('xplink-public-shell-') && name !== SHELL_CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.mode !== 'navigate' || request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    ['/_matrix/', '/livekit/', '/_synapse/', '/api/'].some((prefix) =>
      url.pathname.startsWith(prefix),
    )
  )
    return;
  event.respondWith(
    fetch(request, { cache: 'no-store' }).catch(async () => {
      const cache = await caches.open(SHELL_CACHE);
      return (await cache.match('/offline.html')) || Response.error();
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const app = clients.find((client) => new URL(client.url).origin === self.location.origin);
      if (app) return app.focus();
      return self.clients.openWindow('/');
    }),
  );
});
