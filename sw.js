const CACHE_NAME = 'pengeluaranqu-v1.0.0';
const STATIC_CACHE = 'pengeluaranqu-static-v1.0.0';
const DYNAMIC_CACHE = 'pengeluaranqu-dynamic-v1.0.0';

// Files to cache
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/ui.js',
    '/js/charts.js',
    '/manifest.json',
    '/icons/icon-192x192.svg',
    '/icons/icon-512x512.svg',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Files that should always be fetched from network
const NETWORK_FIRST = [
    '/api/',
    '/sync/'
];

// Files that can be served from cache first
const CACHE_FIRST = [
    '/css/',
    '/js/',
    '/icons/',
    '/screenshots/'
];

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests (except CDN resources)
    if (url.origin !== location.origin && !url.href.includes('cdn.jsdelivr.net')) {
        return;
    }
    
    event.respondWith(
        handleFetch(request)
    );
});

// Handle fetch requests
async function handleFetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
        // Network first strategy for API calls
        if (NETWORK_FIRST.some(path => pathname.startsWith(path))) {
            return await networkFirst(request);
        }
        
        // Cache first strategy for static assets
        if (CACHE_FIRST.some(path => pathname.startsWith(path))) {
            return await cacheFirst(request);
        }
        
        // For HTML pages, use stale-while-revalidate
        if (pathname === '/' || pathname.endsWith('.html')) {
            return await staleWhileRevalidate(request);
        }
        
        // Default to cache first
        return await cacheFirst(request);
        
    } catch (error) {
        console.error('Service Worker: Fetch failed', error);
        
        // Return offline fallback
        if (pathname === '/' || pathname.endsWith('.html')) {
            return await caches.match('/index.html');
        }
        
        // Return generic offline response
        return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Cache first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    // Always try to fetch from network in background
    const networkResponsePromise = fetch(request)
        .then(async (networkResponse) => {
            if (networkResponse.ok) {
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch((error) => {
            console.warn('Service Worker: Network fetch failed', error);
        });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Wait for network response if no cache
    return await networkResponsePromise;
}

// Background sync
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'expense-sync') {
        event.waitUntil(syncExpenses());
    }
});

// Sync expenses when online
async function syncExpenses() {
    try {
        // This would sync with a backend API if available
        console.log('Service Worker: Syncing expenses...');
        
        // For now, just notify clients that sync is available
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_AVAILABLE',
                message: 'Sinkronisasi tersedia'
            });
        });
    } catch (error) {
        console.error('Service Worker: Sync failed', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Reminder: Jangan lupa catat pengeluaran hari ini!',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-192x192.svg',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open-app',
                title: 'Buka Aplikasi',
                icon: '/icons/icon-192x192.svg'
            },
            {
                action: 'dismiss',
                title: 'Tutup',
                icon: '/icons/icon-192x192.svg'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Pengeluaranqu', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event);
    
    event.notification.close();
    
    if (event.action === 'open-app' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // Focus existing window if available
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Message from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'REQUEST_SYNC':
            // Register background sync
            self.registration.sync.register('expense-sync');
            break;
        case 'CACHE_URLS':
            // Cache specific URLs
            const urls = event.data.urls;
            cacheUrls(urls);
            break;
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await Promise.all(
            urls.map(url => {
                return fetch(url)
                    .then(response => {
                        if (response.ok) {
                            return cache.put(url, response);
                        }
                    })
                    .catch(error => {
                        console.warn('Service Worker: Failed to cache URL', url, error);
                    });
            })
        );
        console.log('Service Worker: URLs cached successfully');
    } catch (error) {
        console.error('Service Worker: Failed to cache URLs', error);
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);
    
    if (event.tag === 'daily-reminder') {
        event.waitUntil(sendDailyReminder());
    }
});

// Send daily reminder
async function sendDailyReminder() {
    try {
        const now = new Date();
        const hour = now.getHours();
        
        // Send reminder at 6 PM
        if (hour === 18) {
            await self.registration.showNotification('Pengeluaranqu', {
                body: 'Jangan lupa catat pengeluaran hari ini!',
                icon: '/icons/icon-192x192.svg',
                badge: '/icons/icon-192x192.svg',
                tag: 'daily-reminder'
            });
        }
    } catch (error) {
        console.error('Service Worker: Failed to send daily reminder', error);
    }
}

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
    event.preventDefault();
});

// Handle errors
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});