/* Service worker partagé par Gestion financière et Gestion école */
const V = 'gestion-v1';
const SHELL = ['./', './Gestion_financiere_ligne.html', './Gestion_ecole_en_ligne.html',
  './manifest-finance.json', './manifest-ecole.json', './icon-finance-192.png', './icon-ecole-192.png'];
const LIBS = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin, lib = LIBS.includes(u.hostname);
  if (!same && !lib) return;                       // Firestore / Auth : jamais interceptés
  if (r.mode === 'navigate' || (same && r.destination === 'document')) {   // pages : réseau d'abord, cache si hors ligne
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match('./Gestion_financiere_ligne.html'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => {         // le reste : cache d'abord, mis à jour en arrière-plan
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; }).catch(() => m);
    return m || net;
  }));
});
