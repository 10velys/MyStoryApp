import CONFIG from "../config";

class Notification {
  static async requestPermission() {
    if (!("Notification" in window)) {
      console.error("This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  static checkPermission() {
    if (!("Notification" in window)) {
      return false;
    }

    return Notification.permission === "granted";
  }

  static showNotification(title, options = {}) {
    if (!this.checkPermission()) {
      console.error("Notification permission not granted");
      return;
    }

    return new Notification(title, options);
  }

  static async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.error("Service Worker not supported in this browser");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service Worker registered successfully:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }

  static _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  static async subscribeToPush(registration, vapidKey) {
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: this._urlBase64ToUint8Array(vapidKey),
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    return subscription;
  }

  static async unsubscribeFromPush(registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  }

  static async getSubscription(registration) {
    return await registration.pushManager.getSubscription();
  }

  static isPushSupported() {
    return ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  }

  static async simulatePushEvent(registration, data) {
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'SIMULATE_PUSH',
        data: data
      });
      return true;
    }
    return false;
  }

  static async showServiceWorkerNotification(registration, title, options) {
    return await registration.showNotification(title, options);
  }
}

export default Notification;