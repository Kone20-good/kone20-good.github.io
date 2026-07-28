// 골프 스케줄러 service worker — offline app shell caching.
// deploy pipeline verified 2026-07-28 (edit→push→Pages)
const CACHE = "golf-scheduler-v5";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-180.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never cache weather / geocoding API calls — always go to network.
  if (url.hostname.includes("open-meteo.com") || url.hostname.includes("openstreetmap.org") || url.hostname.includes("data.go.kr") || url.hostname.includes("project-osrm.org")) {
    return; // default network behavior
  }
  // App shell: cache-first, fall back to network, then cache the response.
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => hit)
    )
  );
});
