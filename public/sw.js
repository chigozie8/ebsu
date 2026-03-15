// EBSUMSA Service Worker v2
// Strategies:
//   • App shell (HTML/JS/CSS)  → Cache-first (served instantly, updated in background)
//   • Images / fonts           → Stale-while-revalidate (instant + stays fresh)
//   • Firebase / API calls     → Network-only (never cache dynamic data)

const CACHE_VERSION = "ebsumsa-v2";
const IMAGE_CACHE   = "ebsumsa-images-v2";

const APP_SHELL = [
  "/",
  "/index.html",
  "/logo.png",
  "/manifest.json",
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ─── Activate — prune old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const VALID = new Set([CACHE_VERSION, IMAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !VALID.has(k)).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Domains we must never intercept — let them go straight to the network. */
const BYPASS_DOMAINS = [
  "firebaseapp.com",
  "googleapis.com",
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "firebase.google.com",
  "firebasestorage.googleapis.com",
  "supabase.co",
  "puter.com",
];

function isBypass(url) {
  return BYPASS_DOMAINS.some((d) => url.hostname.includes(d));
}

function isImage(url) {
  return /\.(png|jpe?g|gif|svg|ico|webp|avif)$/i.test(url.pathname);
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf)$/i.test(url.pathname);
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Bypass — dynamic/API domains
  if (isBypass(url)) return;

  // 2. Images → stale-while-revalidate (serve cache instantly, refresh in bg)
  if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(event.request, IMAGE_CACHE));
    return;
  }

  // 3. JS / CSS / fonts → cache-first (hashed filenames = safe to cache forever)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, CACHE_VERSION));
    return;
  }

  // 4. Navigation + everything else → network-first with cache fallback
  event.respondWith(networkFirst(event.request));
});

// ─── Strategy: Cache-First ────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// ─── Strategy: Stale-While-Revalidate ────────────────────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Kick off a background network fetch regardless
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return cached version immediately; network response updates the cache
  return cached || networkFetch;
}

// ─── Strategy: Network-First ─────────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      // Only cache same-origin navigation responses
      if (new URL(request.url).origin === self.location.origin) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Final fallback: return the app shell for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/index.html");
    }
  }
}
