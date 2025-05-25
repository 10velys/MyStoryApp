import CONFIG from "../config";
import { subscribeNotification, unsubscribeNotification } from "../data/api";

class NotificationHelper {
  constructor() {
    this.subscription = null;
    this.isSubscribed = false;
    this.swRegistration = null;
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    if (!('PushManager' in window)) {
      console.warn('Push messaging not supported');
      return false;
    }

    try {
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve());
          navigator.serviceWorker.register('/service-worker.js').catch(err => {
            console.error('Service worker registration failed:', err);
          });
        });
        console.log("[NotificationHelper] Service worker controller is ready");
      }
      
      this.swRegistration = await navigator.serviceWorker.ready;
      console.log("[NotificationHelper] Service worker is ready");
      
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = !(this.subscription === null);
      
      console.log("[NotificationHelper] Initialized - isSubscribed:", this.isSubscribed);
      this.updateUI();
      
      this._setupNavigationListener();
      
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  _setupNavigationListener() {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[NotificationHelper] Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'NAVIGATE') {
          const targetHash = event.data.hash;
          const storyId = event.data.storyId;
          
          console.log('[NotificationHelper] Navigation request - hash:', targetHash, 'storyId:', storyId);
          
          if (targetHash) {
            console.log('[NotificationHelper] Navigating to:', targetHash);
            window.location.hash = targetHash;
            
            if (window.appInstance && window.appInstance.renderPage) {
              setTimeout(() => {
                window.appInstance.renderPage();
              }, 100);
            }
          }
        }
      });
    }
  }

  async subscribeUser() {
    console.log("[NotificationHelper] Starting subscription process");
    
    if (!this.swRegistration) {
      console.error('Service Worker not ready');
      alert('Service Worker belum siap. Silakan refresh halaman.');
      return false;
    }

    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        alert('Permission untuk notifikasi diperlukan untuk fitur ini');
        return false;
      }

      console.log("[NotificationHelper] Permission granted, subscribing...");
      
      const applicationServerKey = this.urlB64ToUint8Array(CONFIG.WEB_PUSH_VAPID_PUBLIC_KEY);
      console.log("[NotificationHelper] Using application server key:", CONFIG.WEB_PUSH_VAPID_PUBLIC_KEY);
      
      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log("[NotificationHelper] Push subscription created:", 
                  JSON.stringify({
                    endpoint: this.subscription.endpoint,
                    keys: {
                      p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
                      auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
                    }
                  }, null, 2)
                );

      const auth = this.getAuthData();
      if (auth && auth.token) {
        console.log("[NotificationHelper] Sending subscription to server...");
        
        const subscription_data = {
          endpoint: this.subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
          }
        };
        
        console.log("[NotificationHelper] Subscription data being sent:", JSON.stringify(subscription_data, null, 2));
        
        const result = await subscribeNotification({
          endpoint: this.subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
            auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
          },
          token: auth.token
        });

        console.log("[NotificationHelper] Server response:", result);

        if (result.error) {
          console.error('Failed to subscribe on server:', result.message);
          await this.subscription.unsubscribe();
          this.subscription = null;
          this.isSubscribed = false;
          alert('Gagal mendaftar notifikasi di server. Silakan coba lagi.');
          this.updateUI();
          return false;
        }
        
        this.isSubscribed = true;
        console.log('Successfully subscribed to notifications');
        alert('Berhasil mendaftar notifikasi! Anda akan mendapat pemberitahuan untuk story baru.');
      } else {
        console.error("[NotificationHelper] No auth token available");
        alert('Tidak ada token autentikasi. Silakan login ulang.');
        return false;
      }

      this.updateUI();
      return true;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      this.isSubscribed = false;
      this.subscription = null;
      this.updateUI();
      alert('Gagal mendaftar notifikasi. Pastikan browser mendukung notifikasi.');
      return false;
    }
  }

  async unsubscribeUser() {
    console.log("[NotificationHelper] Starting unsubscribe process");
    
    if (!this.subscription) {
      console.log('No subscription to unsubscribe');
      return true;
    }

    try {
      const auth = this.getAuthData();
      if (auth && auth.token) {
        console.log("[NotificationHelper] Unsubscribing from server...");
        
        const result = await unsubscribeNotification({
          endpoint: this.subscription.endpoint,
          token: auth.token
        });
        
        console.log("[NotificationHelper] Unsubscribe server response:", result);
        
        if (result.error) {
          console.warn('Failed to unsubscribe on server, but proceeding with local unsubscribe');
        }
      }

      await this.subscription.unsubscribe();
      this.subscription = null;
      this.isSubscribed = false;
      console.log('Successfully unsubscribed from notifications');
      alert('Berhasil berhenti berlangganan notifikasi.');
      this.updateUI();
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      this.subscription = null;
      this.isSubscribed = false;
      this.updateUI();
      alert('Gagal berhenti berlangganan. Coba lagi nanti.');
      return false;
    }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn("[NotificationHelper] Notifications not supported");
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      console.log("[NotificationHelper] Notification permission already granted");
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.log("[NotificationHelper] Notification permission denied");
      return 'denied';
    }

    console.log("[NotificationHelper] Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("[NotificationHelper] Permission result:", permission);
    return permission;
  }

  updateUI() {
    const subscribeButton = document.getElementById('subscribe-notification-btn');
    const subscribeNavItem = document.getElementById('subscribe-nav-item');
    
    console.log("[NotificationHelper] Updating UI - button:", !!subscribeButton, "navItem:", !!subscribeNavItem);
    
    if (!subscribeButton || !subscribeNavItem) {
      console.warn("[NotificationHelper] Subscribe button or nav item not found");
      return;
    }

    const authData = this.getAuthData();
    const shouldShow = this.isPushSupported() && authData;
    
    console.log("[NotificationHelper] Should show notification button:", shouldShow, "isSubscribed:", this.isSubscribed);

    if (shouldShow) {
      subscribeNavItem.style.display = 'block';
      
      if (this.isSubscribed) {
        subscribeButton.innerHTML = '<i class="fas fa-bell-slash"></i> Unsubscribe';
        subscribeButton.title = 'Unsubscribe dari notifikasi';
      } else {
        subscribeButton.innerHTML = '<i class="fas fa-bell"></i> Subscribe';
        subscribeButton.title = 'Subscribe untuk notifikasi story baru';
      }
    } else {
      subscribeNavItem.style.display = 'none';
    }
  }

  isPushSupported() {
    const supported = ('serviceWorker' in navigator && 'PushManager' in window);
    console.log("[NotificationHelper] Push supported:", supported);
    return supported;
  }

  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return window.btoa(binary);
  }

  getAuthData() {
    const authData = localStorage.getItem(CONFIG.AUTH_KEY);
    const result = authData ? JSON.parse(authData) : null;
    console.log("[NotificationHelper] Auth data available:", !!result);
    return result;
  }

  async toggleSubscription() {
    console.log("[NotificationHelper] Toggle subscription - current state:", this.isSubscribed);
    
    if (this.isSubscribed) {
      await this.unsubscribeUser();
    } else {
      await this.subscribeUser();
    }
  }

  async handleNewStory(story) {
    console.log("[NotificationHelper] Handling new story:", story);
    
    if (!this.isSubscribed || !this.swRegistration) {
      console.log("[NotificationHelper] Not subscribed or no service worker, skipping notification");
      return;
    }

    try {
      await this.sendTestNotification(story);
    } catch (error) {
      console.error("[NotificationHelper] Error handling new story:", error);
    }
  }

  async sendTestNotification(story) {
    console.log("[NotificationHelper] === DETAILED STORY DEBUG ===");
    console.log("[NotificationHelper] Raw story object:", story);
    console.log("[NotificationHelper] Story keys:", Object.keys(story));
    console.log("[NotificationHelper] Story.id:", story.id);
    console.log("[NotificationHelper] Story.id type:", typeof story.id);
    console.log("[NotificationHelper] Story.id stringified:", JSON.stringify(story.id));
    
    if (!this.swRegistration) {
      console.error("[NotificationHelper] Service Worker not available");
      return;
    }

    if (!story.id) {
      console.error("[NotificationHelper] Story ID is missing or undefined");
      console.log("[NotificationHelper] Available story properties:", Object.keys(story));
      return;
    }

    try {
      const title = "Story Baru!";
      let body = story.description || "Ada story baru yang ditambahkan";
      
      if (story.description && story.description.length > 100) {
        body = story.description.substring(0, 100) + "...";
      }
      
      if (story.name) {
        body = `${story.name}: ${body}`;
      }

      // Ensure story ID is a string and not undefined
      const storyIdString = story.id ? String(story.id) : null;
      console.log("[NotificationHelper] Final storyId string:", storyIdString);
      
      if (!storyIdString) {
        console.error("[NotificationHelper] Cannot convert story ID to string");
        return;
      }
      
      const notificationData = {
        title: title,
        body: body,
        description: story.description,
        author: story.name,
        storyId: storyIdString,
        photoUrl: story.photoUrl
      };

      console.log("[NotificationHelper] Complete notification data:", JSON.stringify(notificationData, null, 2));

      if (this.swRegistration.active) {
        console.log("[NotificationHelper] Sending message to active service worker");
        this.swRegistration.active.postMessage({
          type: 'SIMULATE_PUSH',
          data: notificationData
        });
        console.log("[NotificationHelper] Message sent to service worker successfully");
      } else {
        console.error("[NotificationHelper] No active service worker found");
        console.log("[NotificationHelper] Service worker state:", this.swRegistration.installing ? 'installing' : this.swRegistration.waiting ? 'waiting' : 'none');
      }
    } catch (error) {
      console.error("[NotificationHelper] Error sending test notification:", error);
    }
  }
}

export default new NotificationHelper();