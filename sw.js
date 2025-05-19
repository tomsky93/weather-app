const VERSION = 'v3';
const STATIC_CACHE = `static-${VERSION}`;
const DYNAMIC_CACHE = `dynamic-${VERSION}`;
const STATIC_ASSETS = [
  '/', '/index.html', '/form.html', '/weather_forecast.html', '/offline.html',
  '/style.css', '/script.js', '/manifest.json',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/favicon.ico'
];


self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.origin === 'https://api.openweathermap.org') {
    e.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const network = fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          });
          return cached || network;
        })
      )
    );
    return;
  }

  if (url.origin === location.origin && STATIC_ASSETS.includes(url.pathname)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => res)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request)
      .then(cached => {
        const network = fetch(e.request).then(res => {
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(e.request, res.clone()));
          return res;
        });
        return cached || network;
      })
  );
});
