/**
 * MooEarth Live — Native Browser Notification Engine
 * Standardizes HTML5 permission requests, PWA push registration, and streak retention alerts.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Request permission for HTML5 Web Notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'default';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('mooearth_notifications_enabled', 'true');
    }
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
  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192.svg',
        badge: '/favicon.ico',
        ...options,
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

/**
 * Schedule or verify daily streak reminder
 */
export function scheduleStreakReminder(streakDays: number = 1) {
  if (typeof window === 'undefined') return;
  const isEnabled = localStorage.getItem('mooearth_notifications_enabled') === 'true';
  if (!isEnabled || Notification.permission !== 'granted') return;

  // Check if reminder was already scheduled/triggered today
  const today = new Date().toISOString().split('T')[0];
  const lastReminder = localStorage.getItem('mooearth_last_reminder_date');
  if (lastReminder === today) return;

  // Calculate milliseconds until 20:00 UTC (evening reminder before midnight expiration)
  const now = new Date();
  const target = new Date();
  target.setUTCHours(20, 0, 0, 0);

  let msUntilTarget = target.getTime() - now.getTime();
  if (msUntilTarget <= 0) {
    // If past 20:00 UTC, schedule for in 30 minutes if played earlier
    msUntilTarget = 30 * 60 * 1000;
  }

  // Register in-session timer
  setTimeout(() => {
    sendLocalNotification('🔥 Daily Earth Streak Alert!', {
      body: `Your ${streakDays}-day streak expires in 4 hours! Don't let your global record reset.`,
      tag: 'streak-reminder',
    });
    localStorage.setItem('mooearth_last_reminder_date', today);
  }, Math.min(msUntilTarget, 2147483647));
}
