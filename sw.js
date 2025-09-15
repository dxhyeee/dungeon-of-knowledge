// 서비스 워커 버전 및 캐시할 파일 목록 정의
const CACHE_NAME = 'dungeon-of-knowledge-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.tsx',
  './manifest.json',
  'https://assets.aistudio.dev/projects/template/192x192.png'
];

// 1. 서비스 워커 설치 (Install)
// 앱이 처음 로드될 때 실행되어 핵심 파일들을 캐시에 저장합니다.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 요청 가로채기 (Fetch) - 네트워크 우선 전략
// 앱에서 발생하는 모든 네트워크 요청을 가로채서,
// 먼저 네트워크에서 최신 버전을 가져오려고 시도합니다.
// 실패할 경우에만 캐시에 저장된 버전을 사용합니다.
self.addEventListener('fetch', event => {
  // 브라우저 확장 프로그램 등에 의한 요청은 무시합니다.
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // 네트워크 요청이 성공하면, 응답을 캐시에 저장하고 사용자에게 반환합니다.
        return caches.open(CACHE_NAME).then(cache => {
          // 응답을 복제해야 합니다. 응답은 스트림이라 한 번만 사용할 수 있기 때문입니다.
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // 네트워크 요청이 실패하면(오프라인 상태 등), 캐시에서 응답을 찾습니다.
        return caches.match(event.request).then(cachedResponse => {
            return cachedResponse;
        });
      })
  );
});


// 3. 서비스 워커 활성화 (Activate)
// 새로운 버전의 서비스 워커가 설치되면,
// 이전 버전의 낡은 캐시를 삭제하여 앱을 최신 상태로 유지합니다.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
