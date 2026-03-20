const CACHE_NAME = "joogle-v1"
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/icon-192.svg",
  "/icon-512.svg",
  "/manifest.json",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (!event.request.url.startsWith("http")) return

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            if (event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, responseToCache)
            }
          })
          return response
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/index.html")
          }
          return new Response("Offline", { status: 503 })
        })
    }),
  )
})
