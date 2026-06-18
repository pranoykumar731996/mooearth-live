/**
 * MooEarth Live — Native Browser Notification Engine
 * Standardizes HTML5 permission requests and local push alerts.
 */

/**
 * Request permission for HTML5 Web Notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'default';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[Notifications] Failed to request permission:', err);
    return 'default';
  }
}

/**
 * Triggers a standard local browser notification if permitted
 */
export function sendLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.error('[Notifications] Error triggering notification:', err);
    }
  }
}
