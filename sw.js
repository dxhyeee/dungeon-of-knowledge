// 서비스 워커 버전 및 캐시할 파일 목록 정의
const CACHE_NAME = 'dungeon-of-knowledge-cache-v1';
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

// 2. 요청 가로채기 (Fetch)
// 앱에서 발생하는 모든 네트워크 요청을 가로채서,
// 캐시에 저장된 파일이 있다면 네트워크 대신 캐시에서 바로 응답합니다.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 파일이 있으면 캐시에서 제공하고,
        if (response) {
          return response;
        }
        // 없으면 네트워크를 통해 요청합니다.
        return fetch(event.request);
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});