// webapp/sw.js - УПРОЩЕННАЯ ВЕРСИЯ ДЛЯ РАБОТЫ
const CACHE_NAME = 'anb-academy-v2.0.0';
const PRECACHE_URLS = [
  '/webapp/',
  '/webapp/index.html',
  '/webapp/style.css',
  '/webapp/app.js',
  '/webapp/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🎯 Service Worker: Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Предварительное кэширование');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Активация');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Пропускаем неподдерживаемые схемы
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Возвращаем кэшированную версию или загружаем из сети
        return response || fetch(request)
          .then((fetchResponse) => {
            // Кэшируем только успешные ответы
            if (fetchResponse.ok && request.url.startsWith(self.location.origin)) {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            return fetchResponse;
          })
          .catch(() => {
            // Для HTML запросов возвращаем запасную страницу
            if (request.destination === 'document') {
              return caches.match('/webapp/index.html');
            }
            return new Response('Сеть недоступна', { status: 503 });
          });
      })
  );
});

// Сообщения от главного потока
self.addEventListener('message', (event) => {
  const { type } = event.data;
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
