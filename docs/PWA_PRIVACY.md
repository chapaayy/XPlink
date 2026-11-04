# PWA privacy contract — Stage 5

CacheStorage разрешает только `/offline.html`, `/icons/xplink-192.png`, `/icons/xplink-512.png` под одним версионированным публичным именем кеша. Старые версии публичного кеша удаляются. Никакие документы с активной учётной записью, JS bundle, Matrix API, media, recovery key, token или crypto IndexedDB не попадают в cache.

Сервисный работник не обрабатывает обычные API fetch; только navigation GET в собственном origin. При живой сети всегда сначала network fetch с `no-store`. При сбое — offline.html с честным сообщением об отсутствии переписки.

В production SW регистрируется только при secure context, в dev — вручную браузерным тестом, чтобы не повредить Vite HMR. Chromium install criteria требуют 192x192, 512x512, start_url, standalone и имя приложения. iOS Safari может использовать ручное «На экран Домой».

Нет Web Push, push secret или backend plaintext. Пользовательская настройка хранит только один opt-in бит в localStorage; заголовок и текст системного уведомления неизменные, без персональных или Matrix идентификаторов.

Проверки: `tests/e2e/stage5-pwa-mobile.spec.ts` и `notification-policy.test.ts`; финальная приёмка после прохождения GitHub Actions и ручного iOS/Android UX.
