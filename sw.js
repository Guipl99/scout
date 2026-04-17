const CACHE_NAME = 'scout-drone-v25';
const STATIC_ASSETS = [
  '/scout/',
  '/scout/index.html',
  '/scout/manifest.json',
  '/scout/icon-192.png',
  '/scout/icon-512.png'
];

// Install — cache static assets
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Activate — clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  
  // Always network for API calls (Railway)
  if (url.hostname.includes('railway.app') || url.hostname.includes('up.railway')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({error: 'offline'}), {
        headers: {'Content-Type': 'application/json'}
      }))
    );
    return;
  }

  // App shell — network first, cache uniquement en fallback offline
  if (url.pathname.startsWith('/scout/')) {
    e.respondWith(
      fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Default: network first
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
