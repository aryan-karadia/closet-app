// Service worker for offline wardrobe and saved outfit viewing (refs ISSUE-27).
// Cache first only for icons and the manifest. Everything else, especially
// Next.js build output under /_next/ and HTML documents, is network only
// in this worker. Caching /_next/ in dev caused a hard failure: the worker
// served old HTML that asked for chunks from a previous dev build, which
// no longer existed, so every chunk 404d and the app stayed on Loading.
// Never store a non-ok response, so a 404 is never cached and replayed.
// No Play Store publishing in MVP.
// No em dashes are used in this file.
const CACHE = 'closet-v2';
const SHELL = ['/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/_next/')) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    return;
  }
});
