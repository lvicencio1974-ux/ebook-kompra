// Service worker de Ondas de Calma: guarda la app para usarla sin conexión.
const VERSION = "odc-v2";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("odc-") && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Audiometría vive en /audiometria/ con su propio service worker.
  if (url.origin === self.location.origin && url.pathname.includes("/audiometria/")) return;

  // Página: primero la red (para recibir actualizaciones), si falla la copia guardada.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Fuentes de Google y archivos propios: copia guardada y se refresca en segundo plano.
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (isFont || url.origin === self.location.origin) {
    e.respondWith(
      caches.open(VERSION).then(async cache => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then(res => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
