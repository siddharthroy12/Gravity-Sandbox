const version = '1.3.1';

const contentToCache = [
  '/',
  '/index.html',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/assets/favicon.ico',
  '/assets/index.js',
  '/assets/index.css',
];

self.addEventListener('install', function(e) {
  e.waitUntil((async () => {
    const cache = await caches.open(version);
    console.log('[Service Worker] Caching all: app shell and content');
    await cache.addAll(contentToCache);
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => {
      if (key === version) { return; }
      return caches.delete(key);
    }))
  }));
});

self.addEventListener('fetch', function(e) {
  console.log('Fetch!', e.request);
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) { return r; }
    const response = await fetch(e.request);
    return response;
  })());
});
