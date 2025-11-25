// services/notificationService.js
// Browser push notification service

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.registration = null;
  }

  // Check if browser supports notifications
  isSupported() {
    // Service Worker requires HTTPS (or localhost)
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    
    if (!isSecureContext) {
      console.warn('⚠️ Browser notifications require HTTPS. Current site is HTTP.');
      return false;
    }
    
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      console.warn('⚠️ Browser notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        await this.registerServiceWorker();
        return true;
      } else if (permission === 'denied') {
        console.warn('❌ Notification permission denied');
        return false;
      } else {
        console.log('⏸️ Notification permission dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Register service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ Service Worker registered:', this.registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  // Show browser notification
  async showNotification(notification) {
    if (!this.isSupported()) {
      console.warn('⚠️ Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return;
    }

    try {
      // Get icon based on notification type
      const icon = this.getNotificationIcon(notification.type);
      const title = this.getNotificationTitle(notification.type);
      const body = notification.message;

      // If service worker is available, use it
      if (this.registration && this.registration.active) {
        this.registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title,
            body,
            icon,
            tag: notification._id || `notif-${Date.now()}`,
            data: notification,
          },
        });
      } else {
        // Fallback to direct notification
        const notif = new Notification(title, {
          body,
          icon,
          badge: '/logo192.png',
          tag: notification._id || `notif-${Date.now()}`,
          requireInteraction: false,
          vibrate: [200, 100, 200],
        });

        // Auto-close after 5 seconds
        setTimeout(() => notif.close(), 5000);

        notif.onclick = () => {
          window.focus();
          notif.close();
          // Navigate to notifications page
          window.location.href = '/notifications';
        };
      }

      console.log('🔔 Browser notification shown:', title);
    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  // Get notification title based on type
  getNotificationTitle(type) {
    switch (type) {
      case 'journey_liked':
      case 'detail_liked':
        return '❤️ New Like';
      case 'journey_commented':
      case 'comment_replied':
        return '💬 New Comment';
      case 'journey_bookmarked':
        return '🔖 New Bookmark';
      case 'new_follower':
        return '👤 New Follower';
      default:
        return '🔔 New Notification';
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    // You can customize this to return different icons
    return '/logo192.png';
  }

  // Check current permission status
  getPermission() {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;

