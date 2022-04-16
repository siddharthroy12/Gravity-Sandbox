const version = '1.0.0';

const contentToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/robot.txt',
  '/registerSW.js',
  '/apple-touch-icon.png',
  '/service-worker.js',
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
  console.log('Activate!');
});

self.addEventListener('fetch', function(e) {
  console.log('Fetch!', e.request);
  e.respondWith((async () => {
    const r = await caches.match(e.request);
    console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (r) { return r; }
    const response = await fetch(e.request);
    const cache = await caches.open(version);
    console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone());
    return response;
  })());
});
