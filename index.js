import "../styles/styles.css";
import App from "./pages/app";
import AuthHelper from "./utils/auth";

class ImageCacheManager {
  constructor() {
    this.cacheName = 'story-images-v1';
    this.cachedUrls = new Set();
    this.init();
  }

  async init() {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheName);
        const requests = await cache.keys();
        requests.forEach(request => {
          this.cachedUrls.add(request.url);
        });
        console.log('[ImageCache] Loaded', this.cachedUrls.size, 'cached images');
      } catch (error) {
        console.error('[ImageCache] Failed to load cache:', error);
      }
    }
  }

  async cacheImage(imageUrl) {
    if (!imageUrl || this.cachedUrls.has(imageUrl)) {
      return;
    }

    try {
      const cache = await caches.open(this.cacheName);
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        await cache.put(imageUrl, response.clone());
        this.cachedUrls.add(imageUrl);
        console.log('[ImageCache] Cached:', imageUrl);
      }
    } catch (error) {
      console.log('[ImageCache] Failed to cache image:', imageUrl, error);
    }
  }

  async cacheVisibleImages() {
    const images = document.querySelectorAll('img[src]');
    const promises = [];

    images.forEach(img => {
      if (img.src && img.src.startsWith('http')) {
        const rect = img.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight + 1000;
        
        if (isVisible) {
          promises.push(this.cacheImage(img.src));
        }
      }
    });

    if (promises.length > 0) {
      console.log('[ImageCache] Caching', promises.length, 'visible images');
      await Promise.all(promises);
    }
  }

  async preloadStoryImages(stories) {
    if (!Array.isArray(stories)) return;

    const promises = stories
      .filter(story => story.photoUrl)
      .map(story => this.cacheImage(story.photoUrl));

    if (promises.length > 0) {
      console.log('[ImageCache] Preloading', promises.length, 'story images');
      await Promise.allSettled(promises);
    }
  }
}

function enhanceApiCalls(imageCacheManager) {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('/stories') || args[0].includes('/story'))) {
      
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        
        if (data && Array.isArray(data.listStory)) {
          imageCacheManager.preloadStoryImages(data.listStory);
        } else if (data && Array.isArray(data)) {
          imageCacheManager.preloadStoryImages(data);
        } else if (data && data.photoUrl) {
          imageCacheManager.cacheImage(data.photoUrl);
        }
      } catch (error) {
      }
    }
    
    return response;
  };
}

function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    }).then(registration => {
      console.log('[Main] Service Worker registered successfully:', registration);
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[Main] New service worker found');
        
        newWorker.addEventListener('statechange', () => {
          console.log('[Main] Service worker state changed:', newWorker.state);
          
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[Main] New service worker installed, update available');
              showUpdateNotification();
            } else {
              console.log('[Main] Service worker installed for the first time');
              showToast('App is ready for offline use!', 'success');
            }
          }
        });
      });
      
      registration.update();
      setInterval(() => {
        registration.update();
      }, 60000);
      
    }).catch(error => {
      console.error('[Main] Service Worker registration failed:', error);
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NOTIFICATION_CLICKED') {
        const storyId = event.data.storyId;
        
        if (storyId) {
          window.location.hash = `#/story/${storyId}`;
        } else {
          window.location.hash = '#/home';
        }
        
        if (window.focus) {
          window.focus();
        }
      }
    });
  }
}

function setupOfflineHandling(imageCacheManager) {
  if (!navigator.onLine) {
    document.body.classList.add('offline-mode');
    showToast('You are offline. Some features may be limited.', 'warning');
  }
  
  window.addEventListener('online', () => {
    document.body.classList.remove('offline-mode');
    showToast('You are back online!', 'success');
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_CACHE'
      });
    }
  });
  
  window.addEventListener('offline', () => {
    document.body.classList.add('offline-mode');
    showToast('You are offline. Some features may be limited.', 'warning');
  });

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      imageCacheManager.cacheVisibleImages();
    }, 500);
  });
}

function setupInstallPrompt() {
  window.addEventListener('appinstalled', () => {
    showToast('Application installed successfully!', 'success');
  });
  
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installButton = document.createElement('button');
    installButton.textContent = 'Install App';
    installButton.className = 'install-button';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      background-color: #4A6572;
      color: white;
      border: none;
      border-radius: 5px;
      z-index: 1000;
      cursor: pointer;
    `;
    
    document.body.appendChild(installButton);
    
    installButton.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.style.display = 'none';
    });
  });
}

function showUpdateNotification() {
  const updateNotification = document.createElement('div');
  updateNotification.className = 'update-notification';
  updateNotification.innerHTML = `
    <div class="update-content">
      <p>🚀 New version available!</p>
      <div class="update-actions">
        <button id="update-button">Update Now</button>
        <button id="dismiss-button">Later</button>
      </div>
    </div>
  `;
  updateNotification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 2px solid #4A6572;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 300px;
  `;
  
  document.body.appendChild(updateNotification);
  
  document.getElementById('update-button').addEventListener('click', () => {
    window.location.reload();
  });
  
  document.getElementById('dismiss-button').addEventListener('click', () => {
    updateNotification.remove();
  });
  
  setTimeout(() => {
    if (updateNotification.parentNode) {
      updateNotification.remove();
    }
  }, 10000);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#333'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }, 100);
}

document.addEventListener("DOMContentLoaded", async () => {
  AuthHelper.clearAuthOnStartup();

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  const imageCacheManager = new ImageCacheManager();
  
  setupServiceWorker();
  setupOfflineHandling(imageCacheManager);
  setupInstallPrompt();
  enhanceApiCalls(imageCacheManager);

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
    
    setTimeout(() => {
      imageCacheManager.cacheVisibleImages();
    }, 500);
  });

  setTimeout(() => {
    imageCacheManager.cacheVisibleImages();
  }, 1000);

  window.imageCacheManager = imageCacheManager;
});