// Service Worker для PWA - Калистеника
// Это позволяет приложению работать офлайн

const CACHE_NAME = 'calisthenics-app-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install event - кэшируем файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэш открыт');
        return cache.addAll(urlsToCache).catch(() => {
          console.log('Некоторые файлы не удалось кэшировать (это нормально для PWA)');
        });
      })
  );
  self.skipWaiting();
});

// Activate event - очищаем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', event => {
  // Только для GET запросов
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Сохраняем в кэш новые файлы
        if (response && response.status === 200 && response.type !== 'error') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Если нет интернета, возвращаем из кэша
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Если ничего нет, возвращаем главную страницу
            return caches.match('./index.html');
          });
      })
  );
});

// Message event - для общения с приложением
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker загружен');
