// Service worker — Vérificateur de bulletins
// Incrémentez VERSION à chaque mise à jour du site pour forcer le rafraîchissement du cache.
const VERSION = "v2";
const CACHE = "bulletins-" + VERSION;
const SHELL = [
  "./", "./index.html",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Bibliothèques et polices : cache d'abord, réseau en secours.
  const isAsset = url.hostname !== self.location.hostname;
  if (isAsset) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => hit)));
    return;
  }
  // Pages du site : réseau d'abord (toujours à jour), cache si hors-ligne.
  e.respondWith(fetch(req).then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
    .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
});
u
