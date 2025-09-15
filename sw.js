// 서비스 워커 버전 및 캐시할 파일 목록 정의
const CACHE_NAME = 'dungeon-of-knowledge-cache-v7';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.tsx',
  './manifest.json',
  'https://assets.aistudio.dev/projects/template/192x192.png'
];

// 1. 서비스 워커 설치 (Install) & 즉시 활성화
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // 새로운 서비스 워커가 설치되자마자 즉시 활성화되도록 강제합니다.
        return self.skipWaiting();
      })
  );
});

// 2. 서비스 워커 활성화 (Activate) & 이전 캐시 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 현재 캐시 이름과 다른 모든 낡은 캐시를 삭제합니다.
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        // 활성화된 서비스 워커가 즉시 페이지 제어권을 가져오도록 합니다.
        return self.clients.claim();
      });
    })
  );
});


// 3. 요청 가로채기 (Fetch) - 네트워크 우선 전략
self.addEventListener('fetch', event => {
  // 브라우저 확장 프로그램이나 POST 요청 등은 가로채지 않습니다.
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 네트워크 요청이 성공하면, 응답을 캐시에 저장하고 반환합니다.
        return caches.open(CACHE_NAME).then(cache => {
          // HTML 파일은 캐시하지 않아 항상 최신 버전을 받도록 합니다.
          if (event.request.headers.get('accept').includes('text/html')) {
             // Do not cache html files to avoid showing stale app shell.
          } else {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // 네트워크 요청이 실패하면 (오프라인 상태), 캐시에서 응답을 찾습니다.
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || new Response("Network error and no cache available", {
            status: 408,
            statusText: "Request Timeout",
            headers: { "Content-Type": "text/plain" },
          });
        });
      })
  );
});
