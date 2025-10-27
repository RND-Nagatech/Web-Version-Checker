const CACHE_NAME = 'web-version-checker-v6';
const STATIC_CACHE = 'static-v6';
const DYNAMIC_CACHE = 'dynamic-v6';
const urlsToCache = [
  '/offline.html', // Priority: offline page first
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  // File statis hasil build akan dicache dinamis di bawah
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Cache static URLs
      await cache.addAll(urlsToCache);
      // Cari dan cache semua file di /assets/ (JS, CSS, dll)
      try {
        const assetsResp = await fetch('/');
        const assetsText = await assetsResp.text();
        // Regex cari semua /assets/xxx.js|css|svg|woff|ttf|... di index.html
        const assetUrls = Array.from(assetsText.matchAll(/\"(\/assets\/[^"]+)\"/g)).map(m => m[1]);
        for (const assetUrl of assetUrls) {
          try {
            await cache.add(assetUrl);
          } catch (e) {
            console.warn('Gagal cache asset:', assetUrl, e);
          }
        }
      } catch (e) {
        console.warn('Gagal fetch & cache assets:', e);
      }
      await self.skipWaiting();
      console.log('All static and asset resources cached successfully');
    })()
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Handle different types of requests
  if (event.request.destination === 'document' || 
      url.pathname === '/' || 
      url.pathname === '/index.html' || 
      event.request.mode === 'navigate') {
    // For HTML documents, navigation requests
    event.respondWith(handleDocumentRequest(event.request));
  } else if (url.pathname.includes('/api/')) {
    // For API requests, use network-first with cache fallback
    event.respondWith(handleApiRequest(event.request));
  } else {
    // For other resources, use cache-first
    event.respondWith(handleResourceRequest(event.request));
  }
});

// Handle HTML document requests
async function handleDocumentRequest(request) {
  const url = new URL(request.url);
  
  // Cache-first, then network fallback for HTML documents
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Try network if not in cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    // If network fails, fallback to cache (should not happen here)
    return await caches.match('/index.html');
  } catch (error) {
    // If all fails, fallback to cached index.html
    return await caches.match('/index.html');
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Try network first for API calls
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    
    // If network fails, return offline error
    return new Response(JSON.stringify({
      error: 'Offline - tidak dapat terhubung ke server',
      offline: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.log('API request failed:', error);
    return new Response(JSON.stringify({
      error: 'Offline - tidak dapat terhubung ke server',
      offline: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle other resource requests
async function handleResourceRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving resource from cache:', request.url);
      return cachedResponse;
    }
    
    // If not cached, try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok && shouldCache(request.url)) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Resource request failed:', error);
    return new Response('Offline', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Helper function to determine if a resource should be cached
function shouldCache(url) {
  // Cache static assets
  if (url.includes('.js') || url.includes('.css') || url.includes('.tsx') || url.includes('.svg')) {
    return true;
  }
  // Cache main pages
  if (url.endsWith('/') || url.includes('index.html') || url.includes('manifest.json')) {
    return true;
  }
  return false;
}

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim(); // Take control of all clients
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline data sync when connection is restored
  return new Promise((resolve) => {
    // Add your offline sync logic here
    resolve();
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Web Version Checker', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
