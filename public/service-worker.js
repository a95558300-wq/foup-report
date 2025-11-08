// public/service-worker.js
self.addEventListener("install", () => {
  console.log("Service Worker installed.");
});

self.addEventListener("fetch", () => {
  // Fetch 이벤트는 여기서 특별히 안 써도 됨
});
