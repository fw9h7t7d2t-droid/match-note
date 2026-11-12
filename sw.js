// オフライン対応：アプリ本体は先に保存、グラフ部品とフォントは初回表示時に保存
const VERSION = "v1";
const CACHE = "match-analysis-" + VERSION;
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {mode: u.startsWith("http") ? "no-cors" : "same-origin"})).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // アプリ本体：ネット優先（更新を反映）→ 圏外なら保存版
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
    return;
  }
  // 外部（グラフ部品・フォント）：保存版優先
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return res; })));
});
