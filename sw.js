const CACHE = 'mis-finanzas-pwa-v1';
const SHELL = new URL('./index.html', self.location.href).href;
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png']
  .map(path => new URL(path, self.location.href).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([SHELL, ...ASSETS])));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('mis-finanzas-pwa-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && url.href.startsWith(self.registration.scope)) {
    event.respondWith(fetch(request).then(response => {
      if (response.ok && !url.search) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(SHELL, copy)).catch(() => {}));
      }
      return response;
    }).catch(async () => (await caches.match(SHELL)) || Response.error()));
  } else if (ASSETS.includes(url.href)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
