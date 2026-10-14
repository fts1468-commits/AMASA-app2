/**
 * AMASA Audio & Notification Dispatcher
 * Plays pleasant Web Audio chime for booking alerts and triggers browser notifications
 */

export const isBrowserNotificationSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

export const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
};

export const playChimeSound = (enabled = true): void => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const playTone = (freq: number, startOffset: number, duration: number, gainLevel: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.linearRampToValueAtTime(gainLevel, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    // Harmonic pleasant notification chime (F#5, A#5, C#6)
    playTone(739.99, 0, 0.25, 0.18);
    playTone(932.33, 0.1, 0.35, 0.22);
    playTone(1108.73, 0.2, 0.5, 0.25);
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
};

export const triggerSystemNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    playSound?: boolean;
    onClick?: () => void;
  }
): boolean => {
  if (options?.playSound !== false) {
    playChimeSound(true);
  }

  if (!isBrowserNotificationSupported()) return false;
  if (Notification.permission === 'granted') {
    try {
      const defaultIcon = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=192&q=80';
      const notif = new Notification(title, {
        body: options?.body,
        icon: options?.icon || defaultIcon,
        badge: defaultIcon,
        tag: options?.tag || `amasa-notif-${Date.now()}`,
        dir: 'rtl',
        lang: 'ar',
      });

      notif.onclick = () => {
        try {
          window.focus();
          options?.onClick?.();
        } catch {}
        notif.close();
      };

      setTimeout(() => {
        try {
          notif.close();
        } catch {}
      }, 7000);

      return true;
    } catch (err) {
      console.warn('Failed to display browser notification:', err);
      return false;
    }
  }

  return false;
};
