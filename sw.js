// 골프 스케줄러 service worker — network-first (항상 최신, 오프라인 시 캐시 폴백)
const CACHE = "golf-scheduler-v10";
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
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // 날씨/지오코딩/라우팅 API는 항상 네트워크, 캐시하지 않음
  if (url.hostname.includes("open-meteo.com") || url.hostname.includes("openstreetmap.org") ||
      url.hostname.includes("data.go.kr") || url.hostname.includes("project-osrm.org")) {
    return; // 기본 네트워크 동작
  }
  // 앱 파일: 네트워크 우선 → 최신 유지, 오프라인일 때만 캐시 폴백
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
