// Trinity Mark 360 service worker: the app opens instantly and works without a connection.
// Pages: network first, falling back to the saved copy. Built files (hashed names) and icons: saved copy first.
// Database calls (Supabase) always go to the network.
const CACHE = 'tm360-v1';
const SHELL = ['/', '/manifest.webmanifest', '/trinity-mark-logo.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('/', copy));
      return res;
    }).catch(() => caches.match('/')));
    return;
  }

  if (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname) || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
