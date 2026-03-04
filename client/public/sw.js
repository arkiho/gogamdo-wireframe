/**
 * Kokamdo(고감도) Service Worker
 * - 오프라인 캐싱 (App Shell)
 * - 네트워크 우선 전략 (API 요청)
 * - 캐시 우선 전략 (정적 자산)
 */

const CACHE_NAME = 'kokamdo-v2';
const OFFLINE_URL = '/ops';

// 앱 셸 캐시 대상
const APP_SHELL = [
  '/',
  '/ops',
  '/ops/calendar',
];

// 설치: 앱 셸 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청: 네트워크 우선
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // GET 요청만 캐시
          if (request.method === 'GET' && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 정적 자산: 캐시 우선
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        });
      })
    );
    return;
  }

  // 네비게이션 요청: 네트워크 우선, 실패 시 오프라인 페이지
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 기타: 네트워크 우선
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: 'https://files.manuscdn.com/user_upload_by_module/session_file/98603122/SfHLuQGAjxPTrVWr.png',
    badge: 'https://files.manuscdn.com/user_upload_by_module/session_file/98603122/sxFLBDGEinEorgzx.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/ops',
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '고감도', options)
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/ops';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭
      return self.clients.openWindow(url);
    })
  );
});
