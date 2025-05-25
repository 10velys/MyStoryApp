const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

if (!isDev) {
  try {
    importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
  } catch (error) {
    console.log('[SW] Failed to load Workbox, using fallback caching');
  }
}

if (!isDev && typeof workbox !== 'undefined' && workbox) {
  console.log('[SW] Workbox loaded successfully');
  
  workbox.setConfig({ debug: false });
  
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  workbox.precaching.cleanupOutdatedCaches();
  
  workbox.routing.registerNavigationRoute(
    workbox.precaching.getCacheKeyForURL('/index.html'), {
      denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
    }
  );
  
  workbox.routing.registerRoute(
    /^https:\/\/cdnjs\.cloudflare\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'external-libraries',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    /^https:\/\/unpkg\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'unpkg-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
    })
  );
  
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.gstatic\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    /^https:\/\/api\.mapbox\.com/,
    new workbox.strategies.CacheFirst({
      cacheName: 'mapbox-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    /\.(?:png|gif|jpg|jpeg|svg|webp)$/i,
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200, 
          maxAgeSeconds: 60 * 60 * 24 * 90, 
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'all-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 300,
          maxAgeSeconds: 60 * 60 * 24 * 90, 
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.includes('/photo') || 
                url.pathname.includes('/image') || 
                url.pathname.includes('/avatar') ||
                url.pathname.includes('/story') ||
                url.searchParams.has('photo') ||
                url.searchParams.has('image'),
    new workbox.strategies.CacheFirst({
      cacheName: 'api-images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 180, 
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    /\/api\//,
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );
  
  workbox.routing.registerRoute(
    /\.css$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'stylesheets',
    })
  );
  
  console.log('[SW] Workbox caching strategies registered');
  
} else {
  console.log('[SW] Using basic caching (development mode or Workbox unavailable)');
  
  const CACHE_NAME = isDev ? 'story-app-dev-v1' : 'story-app-fallback-v1';
  const urlsToCache = [
    '/',
    '/index.html',
    '/app.bundle.js',
    '/styles.css',
    '/favicon.png',
    '/app.webmanifest'
  ];
  
  self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker');
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[SW] Opened cache');
          return cache.addAll(urlsToCache).catch((error) => {
            console.log('[SW] Cache addAll failed, trying individual adds');
            return Promise.all(
              urlsToCache.map(url => {
                return cache.add(url).catch((err) => {
                  console.log(`[SW] Failed to cache ${url}:`, err);
                });
              })
            );
          });
        })
        .then(() => {
          console.log('[SW] Cache populated');
          return self.skipWaiting();
        })
        .catch((error) => {
          console.error('[SW] Install failed:', error);
        })
    );
  });

  self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) {
      return;
    }
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[SW] Found in cache:', event.request.url);
            return response;
          }

          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          }).catch(() => {
            if (event.request.destination === 'image') {
              return new Response(
                `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#f5f5f5"/>
                      <stop offset="100%" style="stop-color:#e0e0e0"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#bg)"/>
                  <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="32">
                    📷
                  </text>
                  <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="Arial, sans-serif" font-size="14">
                    Image not available offline
                  </text>
                </svg>`,
                {
                  headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'no-cache'
                  }
                }
              );
            }
            
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
        })
    );
  });
}

self.addEventListener("push", (event) => {
  console.log('[SW] ===== PUSH EVENT RECEIVED =====');
  console.log('[SW] Push event:', event);
  console.log('[SW] Has data:', !!event.data);
  
  if (event.data) {
    console.log('[SW] Raw push data:', event.data);
    console.log('[SW] Push data text:', event.data.text());
  }
  
  let title = "Story App";
  let body = "Ada story baru yang ditambahkan!";
  let storyId = null;
  let description = null;
  let author = null;
  let photoUrl = null;
  
  if (event.data) {
    try {
      const dataText = event.data.text();
      console.log('[SW] Push data text:', dataText);
      
      let data;
      try {
        data = JSON.parse(dataText);
        console.log('[SW] Push data parsed as JSON:', data);
      } catch (jsonError) {
        console.log('[SW] Push data is not JSON, treating as text');
        body = dataText.length > 100 ? dataText.substring(0, 100) + "..." : dataText;
      }
      
      if (data) {
        if (data.notification) {
          const notif = data.notification;
          title = notif.title || "Story Baru!";
          storyId = notif.storyId;
          author = notif.name || notif.author;
          description = notif.body || notif.description;
          photoUrl = notif.photoUrl || notif.image;
        } else {
          title = data.title || "Story Baru!";
          storyId = data.storyId || data.id;
          author = data.author || data.name;
          description = data.description || data.body;
          photoUrl = data.photoUrl || data.image;
        }
        
        if (description) {
          body = description.length > 100 ? description.substring(0, 100) + "..." : description;
        }
        
        if (author && body !== description) {
          body = `${author}: ${body}`;
        }
        
        console.log('[SW] Notification will show with:', { title, body, storyId, author });
      }
    } catch (error) {
      console.error('[SW] Error processing push data:', error);
      body = "Ada notifikasi baru";
    }
  }

  const notificationOptions = {
    body: body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    image: photoUrl || undefined,
    tag: "story-notification-" + (storyId || Date.now()),
    data: { 
      storyId: storyId,
      type: 'PUSH_NOTIFICATION',
      timestamp: Date.now()
    },
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Lihat Story',
        icon: '/favicon.png'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ],
    vibrate: [200, 100, 200]
  };

  console.log('[SW] Showing notification with options:', notificationOptions);

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch(err => console.error('[SW] Failed to show notification:', err))
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log('[SW] ===== NOTIFICATION CLICKED =====');
  console.log('[SW] event.notification.data:', event.notification.data);
  console.log('[SW] event.action:', event.action);
  
  event.notification.close();
  
  if (event.action === 'close') {
    console.log('[SW] Close action clicked');
    return;
  }
  
  const data = event.notification.data || {};
  const storyId = data.storyId;
  
  console.log('[SW] StoryId from notification:', storyId);
  console.log('[SW] StoryId type:', typeof storyId);
  
  const baseUrl = self.location.origin;
  let targetUrl;
  
  if (storyId && storyId !== 'undefined' && storyId !== 'null') {
    targetUrl = `${baseUrl}/#/story/${storyId}`;
  } else {
    targetUrl = `${baseUrl}/#/home`;
  }
  
  console.log('[SW] Target URL:', targetUrl);
  
  event.waitUntil(
    (async () => {
      try {
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        console.log('[SW] Found clients:', clients.length);
        
        if (clients.length > 0) {
          clients.sort((a, b) => {
            const aFocused = a.focused ? 1 : 0;
            const bFocused = b.focused ? 1 : 0;
            return bFocused - aFocused;
          });
          
          for (const client of clients) {
            const clientUrl = new URL(client.url);
            console.log('[SW] Checking client:', client.url, 'focused:', client.focused);
            
            if (clientUrl.origin === baseUrl) {
              console.log('[SW] Found matching app client');
              
              try {
                await client.focus();
                console.log('[SW] Client focused successfully');
                
                client.postMessage({
                  type: 'NOTIFICATION_CLICKED',
                  storyId: storyId,
                  targetUrl: targetUrl,
                  navigate: true
                });
                
                console.log('[SW] Navigation message sent to client');
                return;
              } catch (focusError) {
                console.log('[SW] Could not focus client:', focusError);
              }
            }
          }
        }
        
        console.log('[SW] No suitable client found, trying to open new window');
        await self.clients.openWindow(targetUrl);
        console.log('[SW] New window opened successfully');
        
      } catch (error) {
        console.error('[SW] All navigation attempts failed:', error);
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  console.log('[SW] ===== MESSAGE RECEIVED =====');
  console.log('[SW] event.data:', event.data);
  
  if (event.data && event.data.type === 'SIMULATE_PUSH') {
    const data = event.data.data || {};
    console.log('[SW] Simulating push with data:', data);
    
    const title = data.title || "Story App";
    let body = data.body || "Ada story baru!";
    const storyId = data.storyId;
    const description = data.description;
    const author = data.author || data.name;
    const photoUrl = data.photoUrl;
    
    console.log('[SW] StoryId from simulate message:', storyId, typeof storyId);
    
    if (description) {
      body = description.length > 100 ? description.substring(0, 100) + "..." : description;
    }
    
    if (author && body !== description) {
      body = `${author}: ${body}`;
    }
    
    const options = {
      body: body,
      icon: "/favicon.png",
      badge: "/favicon.png",
      image: photoUrl || undefined,
      tag: "story-notification-" + (storyId || Date.now()),
      data: { 
        storyId: storyId,
        timestamp: Date.now()
      },
      renotify: true,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'Lihat Story',
          icon: '/favicon.png'
        },
        {
          action: 'close',
          title: 'Tutup'
        }
      ],
      vibrate: [200, 100, 200]
    };
    
    console.log('[SW] Showing simulated notification with data.storyId:', options.data.storyId);
    
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[SW] Simulated notification shown successfully');
      })
      .catch(err => {
        console.error('[SW] Failed to show simulated notification:', err);
      });
  }
});