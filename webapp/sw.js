// service-worker.js - ПОЛНЫЙ SERVICE WORKER ДЛЯ PWA
const CACHE_NAME = 'anb-academy-v2.0.0';
const API_CACHE_NAME = 'anb-academy-api-v1';
const STATIC_CACHE_NAME = 'anb-academy-static-v1';

// Время жизни кэша (в секундах)
const CACHE_TTL = {
  static: 60 * 60 * 24 * 30, // 30 дней
  api: 60 * 60 * 2, // 2 часа
  images: 60 * 60 * 24 * 7, // 7 дней
};

// Критические ресурсы для предварительного кэширования
const PRECACHE_URLS = [
  '/',
  '/webapp/index.html',
  '/webapp/style.css',
  '/webapp/app.js',
  '/webapp/assets/favicon.ico',
  '/webapp/assets/apple-touch-icon.png',
  '/manifest.json',
];

// Ресурсы для кэширования при запросе
const RUNTIME_CACHE_URLS = [
  '/api/health',
  '/api/content',
  '/webapp/assets/',
];

// API endpoints которые нужно кэшировать
const API_CACHE_ENDPOINTS = [
  '/api/content',
  '/api/courses',
  '/api/podcasts',
  '/api/streams',
];

// Install event - предварительное кэширование
self.addEventListener('install', (event) => {
  console.log('🎯 Service Worker: Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Предварительное кэширование');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Установка завершена');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Ошибка установки', error);
      })
  );
});

// Activate event - очистка старых кэшей
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Активация');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые версии кэша
          if (cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME) {
            console.log('🗑️ Service Worker: Удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker: Активация завершена');
      return self.clients.claim();
    })
  );
});

// Fetch event - стратегии кэширования
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Пропускаем неподдерживаемые схемы
  if (request.url.startsWith('chrome-extension://') || 
      request.url.includes('extension') ||
      !(request.url.indexOf('http') === 0)) {
    return;
  }

  // Стратегии для разных типов запросов
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/webapp/assets/')) {
    event.respondWith(handleStaticRequest(request));
  } else if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// Стратегия для API запросов: Network First с fallback к кэшу
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Пробуем сеть сначала
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Кэшируем успешные ответы
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      
      // Устанавливаем TTL для кэша
      setTimeout(() => {
        cache.delete(request);
      }, CACHE_TTL.api * 1000);
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Fallback к кэшу
    console.log('🌐 API: Используем кэшированную версию', request.url);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Возвращаем заглушку для оффлайн режима
    return new Response(
      JSON.stringify({
        error: 'Оффлайн режим',
        message: 'Нет подключения к интернету',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Стратегия для статических ресурсов: Cache First
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Обновляем кэш в фоне
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  // Если нет в кэше, загружаем из сети
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Оффлайн режим', { status: 503 });
  }
}

// Стратегия для изображений: Cache First с обновлением
async function handleImageRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Обновляем кэш в фоне для изображений
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Возвращаем placeholder для изображений
    return fetch('/webapp/assets/placeholder.jpg');
  }
}

// Стратегия по умолчанию: Network First
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Для HTML запросов возвращаем оффлайн страницу
    if (request.destination === 'document') {
      return caches.match('/webapp/offline.html');
    }
    
    return new Response('Сеть недоступна', { status: 503 });
  }
}

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Фоновая синхронизация', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Периодическая синхронизация
self.addEventListener('periodicsync', (event) => {
  console.log('🔄 Service Worker: Периодическая синхронизация', event.tag);
  
  if (event.tag === 'content-update') {
    event.waitUntil(updateContentCache());
  }
});

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push уведомление');
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Новое уведомление от Академии АНБ',
    icon: '/webapp/assets/icon-192x192.png',
    badge: '/webapp/assets/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть',
        icon: '/webapp/assets/checkmark.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/webapp/assets/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Академия АНБ', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Клик по уведомлению', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Ищем открытое окно
        for (const client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Открываем новое окно
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Фоновая синхронизация контента
async function doBackgroundSync() {
  try {
    console.log('🔄 Фоновая синхронизация контента...');
    
    const cache = await caches.open(API_CACHE_NAME);
    const urlsToUpdate = [
      '/api/content',
      '/api/courses?limit=5',
      '/api/podcasts?limit=5'
    ];
    
    for (const url of urlsToUpdate) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`✅ Синхронизирован: ${url}`);
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка синхронизации ${url}:`, error);
      }
    }
    
    // Отправляем уведомление о завершении
    if (self.registration && self.registration.showNotification) {
      await self.registration.showNotification('Академия АНБ', {
        body: 'Контент успешно обновлен',
        icon: '/webapp/assets/icon-192x192.png',
        tag: 'sync-complete'
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка фоновой синхронизации:', error);
  }
}

// Обновление кэша контента
async function updateContentCache() {
  console.log('🔄 Обновление кэша контента...');
  
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse);
            console.log(`✅ Обновлен кэш: ${request.url}`);
          }
        } catch (error) {
          console.warn(`⚠️ Не удалось обновить: ${request.url}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка обновления кэша:', error);
  }
}

// Фоновая проверка сети
async function checkNetworkStatus() {
  try {
    const response = await fetch('/api/health', { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Обновление кэша в фоне
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Игнорируем ошибки фонового обновления
  }
}

// Обработка сообщений от главного потока
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        payload: {
          cacheName: CACHE_NAME,
          version: '2.0.0'
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      clearOldCaches();
      break;
      
    case 'UPDATE_CONTENT':
      updateContentCache();
      break;
      
    case 'CHECK_NETWORK':
      checkNetworkStatus().then((isOnline) => {
        event.ports[0].postMessage({
          type: 'NETWORK_STATUS',
          payload: { isOnline }
        });
      });
      break;
      
    default:
      console.log('Service Worker: Неизвестный тип сообщения', type);
  }
});

// Очистка старых кэшей
async function clearOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletions = cacheNames.map(cacheName => caches.delete(cacheName));
    
    await Promise.all(deletions);
    console.log('✅ Все кэши очищены');
    
    // Перезагружаем предварительный кэш
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    
  } catch (error) {
    console.error('❌ Ошибка очистки кэшей:', error);
  }
}

// Периодические задачи
setInterval(() => {
  // Проверка сети каждые 5 минут
  checkNetworkStatus().then(isOnline => {
    if (isOnline) {
      // Обновляем кэш при появлении сети
      updateContentCache();
    }
  });
}, 5 * 60 * 1000);

// Очистка устаревших кэшей каждые 24 часа
setInterval(() => {
  clearOldCaches();
}, 24 * 60 * 60 * 1000);

console.log('🎯 Service Worker: Загружен и готов к работе');
