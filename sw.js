const CACHE_NAME = 'core-satellite-v2';
const ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first per index.html (così un file aggiornato viene preso appena disponibile),
// cache-first per il resto (icone, manifest).
//
// { cache: 'no-store' } è la parte importante aggiunta qui: senza questa opzione,
// fetch() poteva comunque ricevere una risposta dalla cache HTTP del browser
// (quella gestita da GitHub Pages con le sue intestazioni Cache-Control), non
// dalla rete vera — quindi anche con la logica "network-first" si rischiava
// comunque di vedere una versione non aggiornatissima di index.html.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate' || req.url.endsWith('index.html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
