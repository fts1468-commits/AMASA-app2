export const STORAGE_KEYS = {
  USER_ROLE: 'gathern_user_role_v3',
  MARKETER_ID: 'gathern_marketer_id_v3',
  GUARD: 'gathern_guard_v3',
  PROPERTIES: 'gathern_properties_v3',
  SELECTED_PROPERTY: 'gathern_selected_property_v3',
  MARKETERS: 'gathern_marketers_v3',
  BOOKINGS: 'gathern_bookings_v3',
  OVERRIDES: 'gathern_overrides_v3',
  LOGS: 'gathern_logs_v3',
  NOTIFICATIONS: 'gathern_notifications_v3',
  TEMPLATES: 'gathern_message_templates_v3',
  USER_ACCOUNTS: 'amasa_user_accounts_v1',
  COMMISSION_REQUESTS: 'amasa_commission_requests_v1',
  AUTH: 'amasa_auth_v1',
  SOUND_ENABLED: 'gathern_sound_enabled_v3',
  RESET_TOKENS: 'amasa_reset_tokens_v1',
  CALENDAR_SYNC_STATUS: 'property_calendar_sync_status',
  CALENDAR_SYNC_URLS: 'property_calendar_sync_urls',
} as const;

export class StorageService {
  static get<T>(key: string, fallback: T): T {
    try {
      const val = localStorage.getItem(key);
      if (val === null || val === undefined) return fallback;
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }

  static getString(key: string, fallback: string): string {
    try {
      const val = localStorage.getItem(key);
      return val !== null && val !== undefined ? val : fallback;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn(`Storage save error for key ${key}:`, e);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Storage remove error for key ${key}:`, e);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  }
}
