import { getActiveRoute } from "../routes/url-parser";
import routes from "../routes/routes";
import AuthHelper from "../utils/auth";
import NotificationHelper from "../utils/notification-helper";

class App {
  constructor({ content, drawerButton, navigationDrawer }) {
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;
    this._currentPage = null;
    this._lastActiveRoute = null;

    this._initialAppShell();
    
    window.appInstance = this;
  }

  _initialAppShell() {
    let drawerJustOpened = false;

    this._drawerButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      console.log('[App] Hamburger button clicked');
      
      this._navigationDrawer.classList.toggle("open");
      
      const isOpen = this._navigationDrawer.classList.contains("open");
      console.log('[App] Drawer is now:', isOpen ? 'open' : 'closed');
      
      if (isOpen) {
        drawerJustOpened = true;
        setTimeout(() => {
          drawerJustOpened = false;
        }, 100);
      }
    });

    this._setupSkipToContent();

    document.addEventListener("click", (event) => {
      if (drawerJustOpened) {
        console.log('[App] Skipping close - drawer just opened');
        return;
      }
      
      if (
        this._navigationDrawer.classList.contains("open") &&
        !this._navigationDrawer.contains(event.target) &&
        !this._drawerButton.contains(event.target)
      ) {
        this._navigationDrawer.classList.remove("open");
        console.log('[App] Drawer closed by outside click');
      }
    });

    this._hideRedundantAddStoryButton();
    this._initRouter();
    AuthHelper.updateAuthButton();
    
    this._initServiceWorker();

    this._addOfflineIndicator();
    window.addEventListener('online', () => {
      this._updateOfflineStatus(false);
      this._syncPendingData();
    });

    window.addEventListener('offline', () => {
      this._updateOfflineStatus(true);
    });

    this._updateOfflineStatus(!navigator.onLine);
  }

  async _initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('[App] Service Worker registered successfully');
        
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[App] Message from service worker:', event.data);
          
          if (event.data && event.data.type === 'NOTIFICATION_CLICK' && event.data.navigate) {
            const storyId = event.data.storyId;
            const targetUrl = event.data.targetUrl;
            
            console.log('[App] Handling notification click navigation');
            console.log('[App] Story ID:', storyId);
            console.log('[App] Target URL:', targetUrl);
            
            if (storyId && storyId !== 'undefined' && storyId !== 'null') {
              const targetHash = `#/story/${storyId}`;
              console.log('[App] Navigating to:', targetHash);
              
              window.location.hash = targetHash;
              
              setTimeout(() => {
                this.renderPage().catch(error => {
                  console.error('[App] Navigation failed:', error);
                });
              }, 100);
            }
          }
        });
        
        await NotificationHelper.init();

        const registration = await navigator.serviceWorker.ready;
        registration.update();
      } catch (error) {
        console.error('[App] Service Worker registration failed:', error);
      }
    }
  }

  _setupSkipToContent() {
    const oldSkipLinks = Array.from(document.querySelectorAll(".skip-link"));
    if (oldSkipLinks.length > 1) {
      oldSkipLinks.slice(1).forEach((link) => link.remove());
    }

    const skipLink = document.querySelector(".skip-link");

    if (skipLink) {
      const skipLinkClone = skipLink.cloneNode(true);
      skipLink.parentNode.replaceChild(skipLinkClone, skipLink);

      skipLinkClone.setAttribute("href", "javascript:void(0)");

      skipLinkClone.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          skipLinkClone.blur();

          const mainContent = document.querySelector("#main-content");
          if (mainContent) {
            mainContent.setAttribute("tabindex", "-1");
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: "smooth" });
          }

          const currentRoute = getActiveRoute();
          if (currentRoute) {
            const correctURL =
              window.location.pathname +
              window.location.search +
              "#" +
              currentRoute;
            if (window.location.href !== correctURL) {
              window.history.replaceState(null, document.title, correctURL);
              sessionStorage.setItem("lastActiveRoute", currentRoute);
            }
          } else {
            const homeURL =
              window.location.pathname + window.location.search + "#/home";
            window.history.replaceState(null, document.title, homeURL);
            sessionStorage.setItem("lastActiveRoute", "home");
          }

          return false;
        },
        { capture: true }
      );
    }
  }

  _hideRedundantAddStoryButton() {
    const addStoryButton = document.querySelector('a[href="#/add"]');
    if (addStoryButton && addStoryButton.closest("nav")) {
      addStoryButton.style.display = "none";
    }
  }

  _initRouter() {
    window.addEventListener("DOMContentLoaded", () => {
      if (
        !window.location.hash ||
        window.location.hash === "#/" ||
        window.location.hash === "#"
      ) {
        window.location.hash = "#/login";
        return;
      }

      this._handleRouteRedirects();
      this.renderPage();
    });

    window.addEventListener("hashchange", (event) => {
      if (event.oldURL === event.newURL) {
        return;
      }

      const activeRoute = getActiveRoute();

      if (activeRoute === this._lastActiveRoute) {
        this._currentPage = null;
      }

      const isRedirected = this._handleRouteRedirects();
      if (!isRedirected) {
        this.renderPage();
      }
    });
  }

  _addOfflineIndicator() {
    const existingIndicator = document.getElementById('offline-indicator');
    if (!existingIndicator) {
      const indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.className = 'offline-indicator';
      indicator.innerHTML = 'Anda sedang offline. Beberapa fitur mungkin terbatas.';
      indicator.style.display = 'none';
      
      document.body.insertBefore(indicator, document.body.firstChild);
    }
  }

  _updateOfflineStatus(isOffline) {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = isOffline ? 'block' : 'none';
    }
    
    if (isOffline) {
      document.body.classList.add('offline-mode');
    } else {
      document.body.classList.remove('offline-mode');
    }
  }

  async _syncPendingData() {
    if (!navigator.onLine) return;
    
    try {
      const { syncPendingStories } = await import('../data/api');
      const token = AuthHelper.getAuth()?.token || '';
      
      if (token) {
        await syncPendingStories(token);
      }
    } catch (error) {
      console.error('Error syncing pending data:', error);
    }
  }

  _handleRouteRedirects() {
    const hash = window.location.hash;

    if (hash === "#/" || hash === "#") {
      window.location.hash = "#/login";
      return true;
    }

    if (hash === "#/logout") {
      AuthHelper.clearAuth();
      window.location.hash = "#/login";
      return true;
    }

    if (
      (hash === "#/home" ||
        hash.startsWith("#/add") ||
        hash.startsWith("#/story/") ||
        hash.startsWith("#/bookmarks")) &&
      !AuthHelper.isUserSignedIn()
    ) {
      console.log('[App] Redirect to login - protected route without auth');
      window.location.hash = "#/login";
      return true;
    }

    if (
      (hash === "#/login" || hash === "#/register") &&
      AuthHelper.isUserSignedIn()
    ) {
      window.location.hash = "#/home";
      return true;
    }

    return false;
  }

  async renderPage() {
    try {
      const activeRoute = getActiveRoute();

      if (activeRoute === "/" || activeRoute === "") {
        window.location.hash = "#/login";
        return;
      }

      if (activeRoute === "/logout") {
        AuthHelper.clearAuth();
        window.location.hash = "#/login";
        return;
      }

      if (
        (activeRoute === "/home" ||
          activeRoute === "/add" ||
          activeRoute === "/bookmarks" ||
          activeRoute.startsWith("/story/")) &&
        !AuthHelper.isUserSignedIn()
      ) {
        window.location.hash = "#/login";
        return;
      }

      if (
        (activeRoute === "/login" || activeRoute === "/register") &&
        AuthHelper.isUserSignedIn()
      ) {
        window.location.hash = "#/home";
        return;
      }

      let page = routes[activeRoute];

      if (!page && activeRoute.startsWith("/story/")) {
        page = routes["/story/:id"];
      }

      if (!page) {
        if (activeRoute !== "/404") {
          console.log('[App] Unknown route, redirecting to 404:', activeRoute);
          window.location.hash = "#/404";
          return;
        } else {
          page = routes["/404"];
          if (!page) {
            console.error('[App] 404 route not found in routes config');
            this._content.innerHTML = `
              <div style="text-align: center; padding: 4rem; max-width: 600px; margin: 0 auto;">
                <h1 style="font-size: 3rem; color: #4A6572; margin-bottom: 1rem;">404</h1>
                <h2 style="color: #374151; margin-bottom: 1rem;">Page Not Found</h2>
                <p style="color: #6B7280; margin-bottom: 2rem;">The page you're looking for doesn't exist.</p>
                <a href="#/home" style="display: inline-block; background: #4A6572; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px;">Go Home</a>
              </div>
            `;
            return;
          }
        }
      }

      if (
        this._currentPage &&
        typeof this._currentPage.destroy === "function"
      ) {
        this._currentPage.destroy();
      }

      this._currentPage = page;
      this._lastActiveRoute = activeRoute;

      this._content.classList.add("fade-out");
      await this._waitForTransition(100);

      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          this._content.innerHTML = await page.render();
          this._content.classList.remove("fade-out");
          await page.afterRender();
        });
      } else {
        this._content.innerHTML = await page.render();
        this._content.classList.remove("fade-out");
        await page.afterRender();
      }

      this._navigationDrawer.classList.remove("open");
      window.scrollTo(0, 0);
      this._setupSkipToContent();
      AuthHelper.updateAuthButton();

      const isLoggedIn = AuthHelper.isUserSignedIn();
      this._updateAuthElements(isLoggedIn);
    } catch (error) {
      console.error("[App] Error rendering page:", error);
      this._content.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
          <h2 style="color: #dc2626;">Something went wrong</h2>
          <p style="margin: 1rem 0;">Please try again later.</p>
          <button onclick="window.location.reload()" style="background: #4A6572; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  }

  _updateAuthElements(isLoggedIn) {
    const loginNavItem = document.getElementById("login-nav-item");
    const profileNavItem = document.getElementById("profile-nav-item");
    const subscribeNavItem = document.getElementById("subscribe-nav-item");

    if (isLoggedIn) {
      if (loginNavItem) loginNavItem.style.display = "none";
      if (profileNavItem) profileNavItem.style.display = "block";
      if (subscribeNavItem) subscribeNavItem.style.display = "block";
      
      setTimeout(async () => {
        try {
          for (let i = 0; i < 10; i++) {
            const subscribeButton = document.getElementById('subscribe-notification-btn');
            if (subscribeButton) {
              console.log('[App] Subscribe button found, initializing...');
              await NotificationHelper.init();
              NotificationHelper.updateUI();
              this._setupNotificationToggle();
              break;
            }
            console.log(`[App] Subscribe button not found, retry ${i + 1}/10`);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error('[App] Error initializing notifications:', error);
        }
      }, 100);
    } else {
      if (loginNavItem) loginNavItem.style.display = "block";
      if (profileNavItem) profileNavItem.style.display = "none";
      if (subscribeNavItem) subscribeNavItem.style.display = "none";
    }
  }

  _setupNotificationToggle() {
    const subscribeButton = document.getElementById('subscribe-notification-btn');
    
    if (!subscribeButton) {
      console.warn('[App] Subscribe button not found in _setupNotificationToggle');
      return;
    }

    console.log('[App] Setting up notification toggle for button:', subscribeButton);

    const existingHandler = subscribeButton._notificationHandler;
    if (existingHandler) {
      subscribeButton.removeEventListener('click', existingHandler);
      console.log('[App] Removed existing notification handler');
    }

    const handler = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[App] Subscribe button clicked - starting process');
      
      const originalText = subscribeButton.innerHTML;
      subscribeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
      subscribeButton.disabled = true;
      
      try {
        if (!('Notification' in window)) {
          throw new Error('Browser tidak mendukung notifikasi');
        }

        console.log('[App] Current notification permission:', Notification.permission);
        
        if (Notification.permission === 'default') {
          console.log('[App] Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('[App] Permission result:', permission);
          
          if (permission !== 'granted') {
            alert('Permission notifikasi diperlukan untuk fitur ini');
            return;
          }
        }
        
        if (Notification.permission === 'denied') {
          alert('Permission notifikasi ditolak. Silakan aktifkan di pengaturan browser.');
          return;
        }

        console.log('[App] Permission granted, proceeding with toggle subscription');
        
        if (!NotificationHelper.swRegistration) {
          console.log('[App] Service worker not ready, initializing...');
          const initResult = await NotificationHelper.init();
          if (!initResult) {
            throw new Error('Failed to initialize service worker');
          }
        }
        
        await NotificationHelper.toggleSubscription();
        console.log('[App] Toggle subscription completed successfully');
        
      } catch (error) {
        console.error('[App] Error toggling notification subscription:', error);
        
        if (error.name === 'NotAllowedError') {
          alert('Permission notifikasi ditolak. Silakan aktifkan di pengaturan browser.');
        } else if (error.name === 'NotSupportedError') {
          alert('Browser Anda tidak mendukung push notification.');
        } else {
          alert('Terjadi kesalahan: ' + error.message);
        }
      } finally {
        subscribeButton.disabled = false;
        if (subscribeButton.innerHTML.includes('Loading')) {
          subscribeButton.innerHTML = originalText;
        }
        console.log('[App] Notification toggle process finished');
      }
    };
    
    subscribeButton._notificationHandler = handler;
    subscribeButton.addEventListener('click', handler);
    
    console.log('[App] Notification toggle event listener attached successfully');
  }

  _waitForTransition(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default App;