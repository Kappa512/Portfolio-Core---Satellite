// Service worker dell'app Portfolio Core & Satellite.
// Strategia: prima la rete (sempre l'ultima versione, anche saltando la cache di GitHub Pages),
// la copia salvata serve solo quando sei offline. Non serve mai cambiare nome alla cache per
// vedere gli aggiornamenti; cambia CACHE solo se vuoi svuotare a forza le copie salvate.
const CACHE = 'portfolio-v1';
const FILES = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // il nuovo service worker parte subito, senza aspettare la chiusura delle schede
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))) // butta le vecchie copie
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // i font di Google li gestisce il browser
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.ok){
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
