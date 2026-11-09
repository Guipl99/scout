const CACHE_NAME = 'scout-v296';
const STATIC_ASSETS = [
  '/scout/',
  '/scout/index.html',
  '/scout/manifest.json',
  '/scout/assets/crm.js',
  '/scout/assets/crm.css',
  '/scout/assets/i18n.js',
  '/scout/assets/brand.css',
  '/scout/assets/settings.js',
  '/scout/assets/app.js',
  '/scout/assets/app.css',
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
        status: 503, headers: {'Content-Type': 'application/json'}
      }))
    );
    return;
  }

  // App shell — network first, cache en fallback offline uniquement
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

// Notifications push envoyées par Scout (chats, AO filaires, signaux, visites)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Scout', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Scout', {
    body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag, icon: '/scout/icon-192.png', badge: '/scout/icon-192.png',
    data: { url: d.url || '/scout/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/scout/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.includes('/scout/') && 'focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
