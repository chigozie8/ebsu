// EBSUMSA Service Worker
// Caches core app shell for offline access

const CACHE_NAME = "ebsumsa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/logo.png",
  "/manifest.json",
];

// Install — cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Skip Firebase, Firestore, and other API calls — always go to network
  const url = new URL(event.request.url);
  const skipDomains = [
    "firebaseapp.com",
    "googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com",
    "firebase.google.com",
    "firebasestorage.googleapis.com",
  ];
  if (skipDomains.some((d) => url.hostname.includes(d))) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (
          response.ok &&
          (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/) ||
            url.pathname === "/" ||
            url.pathname === "/index.html")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback — serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the app shell
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});
