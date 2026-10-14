import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import {
  ActivityLog,
  AppNotification,
  Booking,
  CommissionRequest,
  DateOverride,
  Guard,
  Marketer,
  MarketerPermissions,
  MessageTemplates,
  Property,
  PropertySection,
  ToastData,
  UserAccount,
  UserRole,
} from '../types';
import { STORAGE_KEYS, StorageService } from '../lib/storage';
import {
  INITIAL_BOOKINGS,
  INITIAL_GUARD,
  INITIAL_LOGS,
  INITIAL_MARKETERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PROPERTIES,
  INITIAL_TEMPLATES,
  INITIAL_USER_ACCOUNTS,
} from '../data/mock';
import {
  getBrowserNotificationPermission,
  playChimeSound,
  requestBrowserNotificationPermission,
  triggerSystemNotification,
} from '../lib/sound';
import {
  getSavedSpreadsheetInfo,
  appendBookingToSheet,
} from '../services/googleSheetsService';

export type ActiveTab = 'calendar' | 'bookings' | 'dashboard' | 'properties' | 'marketers' | 'more';
export type AuthModalMode = 'quick_select' | 'login' | 'change_password' | 'roles';

export interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userRole: UserRole;
  currentMarketerId: string;
  currentMarketer: Marketer | null;
  guard: Guard;
  isAdmin: boolean;
  isGuard: boolean;
  activePermissions: MarketerPermissions;
  switchUser: (role: UserRole, marketerId?: string) => void;
  updateGuardProfile: (data: Partial<Guard>) => void;
  userAccounts: UserAccount[];
  currentUserAccount: UserAccount;
  loginWithGmailAndPassword: (email: string, pass: string) => { success: boolean; message: string };
  loginWithGoogleQuick: (accountId: string) => void;
  changePassword: (accountId: string, newPass: string) => { success: boolean; message: string };
  updateUserAccount: (accountId: string, data: Partial<UserAccount>) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: AuthModalMode;
  setAuthModalMode: (mode: AuthModalMode) => void;
  openAuthModal: (mode?: AuthModalMode) => void;

  canCreateContract: boolean;
  canEditDeposit: boolean;
  canViewCalendar: boolean;
  canViewProperties: boolean;
  canViewDashboard: boolean;
  canViewMarketers: boolean;
  canManageTemplates: boolean;
  canViewRentalContract: boolean;
  canViewActivityLogs: boolean;

  grantAllMarketersContractAndDepositPermissions: () => void;
  updateWaitingDepositAmount: (propertyId: string, dates: string[], amount: number) => void;

  properties: Property[];
  selectedPropertyId: string;
  selectedProperty: Property;
  setSelectedPropertyId: (id: string) => void;
  updateProperty: (id: string, data: Partial<Property>) => void;
  updatePropertySection: (propertyId: string, sectionId: string, data: Partial<PropertySection>) => void;
  togglePropertyPublished: (propertyId: string) => void;

  marketers: Marketer[];
  updateMarketerPermissions: (id: string, perms: Partial<MarketerPermissions>) => void;
  updateMarketerProfile: (id: string, data: Partial<Marketer>) => void;
  addMarketer: (data: { name: string; email: string; phone: string; nationalId?: string; bankAccount?: string; bankName?: string }) => void;
  addAdminAccount: (data: { name: string; email: string; phone?: string }) => { success: boolean; message: string; password?: string };
  setMarketerAccountRole: (marketerId: string, role: UserRole) => { success: boolean; message: string };
  payMarketerCommission: (bookingId: string) => void;
  payoutAllMarketerCommissions: (marketerId: string) => void;

  bookings: Booking[];
  filteredBookings: Booking[];
  todayArrivals: Booking[];
  todayDepartures: Booking[];
  addBooking: (booking: Partial<Booking> & { propertyId: string; customerName: string; customerPhone: string; checkInDate: string; checkOutDate: string }) => Booking;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  cancelBooking: (id: string) => void;
  sendCheckoutReminder: (bookingId: string) => { whatsappUrl: string; message: string };
  sendPaymentCompletionRequest: (bookingId: string) => { whatsappUrl: string; message: string };
  markCheckedOut: (bookingId: string) => void;
  guardMarkArrived: (bookingId: string) => void;
  guardReceiveInsurance: (bookingId: string) => void;
  guardRequestInsuranceReturn: (bookingId: string) => void;
  returnInsuranceDeposit: (bookingId: string) => void;
  completeBookingPayment: (bookingId: string, receiptName: string, receiptDataUrl?: string) => void;

  dateOverrides: Record<string, DateOverride>;
  setDateOverride: (propertyId: string, date: string, override: Partial<DateOverride>, sectionId?: string) => void;
  setDateOverridesBulk: (propertyId: string, dates: string[], override: Partial<DateOverride>, sectionId?: string) => void;
  applySeasonalPricingPattern: (propertyId: string, dates: string[], season: keyof Property['seasonalPricing'], sectionId?: string) => void;

  requestDeposit: (params: {
    propertyId: string;
    dates: string[];
    customerName: string;
    customerPhone: string;
    depositAmount: number;
    totalPrice: number;
    nightsCount: number;
    marketerId?: string;
    commissionRatePercent?: number;
    sectionName?: string;
  }) => { whatsappUrl: string; message: string };
  cancelDepositWait: (propertyId: string, dates: string[]) => void;
  confirmBookingWithReceipt: (params: {
    propertyId: string;
    dates: string[];
    customerName: string;
    customerPhone: string;
    depositPaid: number;
    totalPrice: number;
    remainingAmount: number;
    insuranceAmount: number;
    receiptFileName: string;
    receiptDataUrl?: string;
    marketerId?: string;
    commissionRatePercent?: number;
    notes?: string;
    sectionId?: string;
    sectionName?: string;
  }) => { booking: Booking; whatsappContractUrl: string; contractText: string };

  notifications: AppNotification[];
  filteredNotifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => void;

  commissionRequests: CommissionRequest[];
  getEligibleCommissionBookings: (marketerId: string, fromDate: string, toDate: string) => Booking[];
  createCommissionRequest: (params: { fromDate: string; toDate: string }) => { ok: boolean; message: string };
  markCommissionTransferred: (requestId: string, receiptFileName?: string, receiptDataUrl?: string) => void;
  rejectCommissionRequest: (requestId: string, note?: string) => void;
  markCommissionRequestSeen: (requestId: string) => void;

  activityLogs: ActivityLog[];
  logActivity: (actorName: string, actorRole: string, action: string, details: string) => void;

  bookingModalOpen: boolean;
  setBookingModalOpen: (open: boolean) => void;
  preselectedDateForBooking: string | null;
  setPreselectedDateForBooking: (date: string | null) => void;
  preselectedSectionForBooking: string | null;
  setPreselectedSectionForBooking: (sectionId: string | null) => void;

  messageTemplates: MessageTemplates;
  updateMessageTemplates: (templates: Partial<MessageTemplates>) => void;
  resetMessageTemplates: () => void;
  templatesModalOpen: boolean;
  setTemplatesModalOpen: (open: boolean) => void;
  activeTemplateTab: keyof MessageTemplates;
  openTemplatesModal: (tab?: keyof MessageTemplates) => void;

  resetAllData: () => void;
  nowTimestamp: number;

  browserNotificationPermission: NotificationPermission | 'unsupported';
  requestBrowserNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  activeToast: ToastData | null;
  dismissToast: () => void;
  triggerBrowserNotification: (title: string, body: string, type?: ToastData['type']) => void;
  sendTestNotification: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const fillTemplate = (template: string, vars: Record<string, string | number | undefined>): string => {
  let result = template;
  Object.entries(vars).forEach(([k, v]) => {
    const regex = new RegExp(`{\\s*${k}\\s*}`, 'g');
    result = result.replace(regex, String(v ?? ''));
  });
  return result;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [userRole, setUserRole] = useState<UserRole>(() =>
    StorageService.getString(STORAGE_KEYS.USER_ROLE, 'admin') as UserRole
  );
  const [currentMarketerId, setCurrentMarketerId] = useState<string>(() =>
    StorageService.getString(STORAGE_KEYS.MARKETER_ID, 'm1')
  );

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = StorageService.get<UserAccount[]>(STORAGE_KEYS.USER_ACCOUNTS, INITIAL_USER_ACCOUNTS);
    const list = [...saved];
    INITIAL_USER_ACCOUNTS.forEach((acc) => {
      if (!list.some((it) => it.id === acc.id)) list.push(acc);
    });
    return list;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('quick_select');

  const [guard, setGuard] = useState<Guard>(() =>
    StorageService.get<Guard>(STORAGE_KEYS.GUARD, INITIAL_GUARD)
  );

  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = StorageService.get<Property[]>(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
    const hasOldAlmaNaya = saved.some((p) => p.id === 'alma' || p.id === 'naya');
    const hamranSaved = saved.find((p) => p.id === 'hamran');
    const hamranHasBothUnits = hamranSaved?.sections && hamranSaved.sections.some((s) => s.id === 'hamran-alma');

    if (hasOldAlmaNaya || !hamranHasBothUnits) {
      StorageService.set(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
      return INITIAL_PROPERTIES;
    }

    const updated = saved.map((prop) => {
      const init = INITIAL_PROPERTIES.find((p) => p.id === prop.id);
      if (init?.sections) {
        if (!prop.sections || prop.sections.length === 0 || prop.id === 'al-taraf' || prop.id === 'hamran') {
          return { ...prop, sections: init.sections, subUnitsCount: init.subUnitsCount, subtitle: init.subtitle };
        }
      }
      return prop;
    });
    StorageService.set(STORAGE_KEYS.PROPERTIES, updated);
    return updated;
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(() => {
    const savedId = StorageService.getString(STORAGE_KEYS.SELECTED_PROPERTY, 'al-taraf');
    if (savedId === 'alma' || savedId === 'naya') {
      StorageService.set(STORAGE_KEYS.SELECTED_PROPERTY, 'hamran');
      return 'hamran';
    }
    return savedId;
  });

  const [marketers, setMarketers] = useState<Marketer[]>(() =>
    StorageService.get<Marketer[]>(STORAGE_KEYS.MARKETERS, INITIAL_MARKETERS)
  );

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = StorageService.get<Booking[]>(STORAGE_KEYS.BOOKINGS, INITIAL_BOOKINGS);
    let migrated = false;
    const result = saved.map((b) => {
      if (b.propertyId === 'alma') {
        migrated = true;
        return {
          ...b,
          propertyId: 'hamran',
          propertyName: 'حمران',
          sectionId: 'hamran-alma',
          sectionName: 'وحدة الما',
        };
      }
      if (b.propertyId === 'naya') {
        migrated = true;
        return {
          ...b,
          propertyId: 'hamran',
          propertyName: 'حمران',
          sectionId: 'hamran-naya',
          sectionName: 'وحدة نايا',
        };
      }
      if (b.propertyId === 'al-taraf') {
        if (b.sectionId === 'section-1' && b.sectionName !== 'قسم واحد') {
          migrated = true;
          return { ...b, sectionName: 'قسم واحد' };
        }
        if (b.sectionId === 'section-2' && b.sectionName !== 'قسمين') {
          migrated = true;
          return { ...b, sectionName: 'قسمين' };
        }
      }
      return b;
    });
    if (migrated) {
      StorageService.set(STORAGE_KEYS.BOOKINGS, result);
    }
    return result;
  });

  const [dateOverrides, setDateOverrides] = useState<Record<string, DateOverride>>(() =>
    StorageService.get<Record<string, DateOverride>>(STORAGE_KEYS.OVERRIDES, {})
  );

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    StorageService.get<ActivityLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS)
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    StorageService.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [commissionRequests, setCommissionRequests] = useState<CommissionRequest[]>(() =>
    StorageService.get<CommissionRequest[]>(STORAGE_KEYS.COMMISSION_REQUESTS, [])
  );

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedDateForBooking, setPreselectedDateForBooking] = useState<string | null>(null);
  const [preselectedSectionForBooking, setPreselectedSectionForBooking] = useState<string | null>(null);

  const [messageTemplates, setMessageTemplates] = useState<MessageTemplates>(() =>
    StorageService.get<MessageTemplates>(STORAGE_KEYS.TEMPLATES, INITIAL_TEMPLATES)
  );

  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<keyof MessageTemplates>('depositRequest');

  const [browserNotificationPermission, setBrowserNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    getBrowserNotificationPermission()
  );

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val !== null ? val === 'true' : true;
  });

  const [activeToast, setActiveToast] = useState<ToastData | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Keep nowTimestamp updated every 1s for the 15-minute countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save states to StorageService
  useEffect(() => {
    StorageService.set(STORAGE_KEYS.USER_ROLE, userRole);
    StorageService.set(STORAGE_KEYS.MARKETER_ID, currentMarketerId);
  }, [userRole, currentMarketerId]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.GUARD, guard);
  }, [guard]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.PROPERTIES, properties);
  }, [properties]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.SELECTED_PROPERTY, selectedPropertyId);
  }, [selectedPropertyId]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.MARKETERS, marketers);
  }, [marketers]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.BOOKINGS, bookings);
  }, [bookings]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.OVERRIDES, dateOverrides);
  }, [dateOverrides]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.LOGS, activityLogs);
  }, [activityLogs]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.USER_ACCOUNTS, userAccounts);
  }, [userAccounts]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.COMMISSION_REQUESTS, commissionRequests);
  }, [commissionRequests]);

  useEffect(() => {
    StorageService.set(STORAGE_KEYS.TEMPLATES, messageTemplates);
  }, [messageTemplates]);

  const logActivity = useCallback((actorName: string, actorRole: string, action: string, details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleString('ar-SA', { hour12: false }),
      actorName,
      actorRole,
      action,
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  }, []);

  // Check expiration of 15-minute deposit holds
  useEffect(() => {
    let hasChanges = false;
    const updated = { ...dateOverrides };

    Object.entries(dateOverrides).forEach(([key, override]) => {
      if (
        override.status === 'waiting_deposit' &&
        override.waitingDepositExpiresAt &&
        override.waitingDepositExpiresAt <= nowTimestamp
      ) {
        hasChanges = true;
        updated[key] = {
          ...override,
          status: 'available',
          waitingDepositExpiresAt: undefined,
          waitingCustomerName: undefined,
          waitingCustomerPhone: undefined,
          waitingDepositAmount: undefined,
        };

        const [propId, dateKey] = key.split('_');
        const propName = properties.find((p) => p.id === propId)?.name || propId;

        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}-${Math.random()}`,
            title: 'انتهت مهلة تحويل العربون (15 دقيقة)',
            description: `انتهى عداد مهلة العربون لعقار ${propName} في تاريخ ${dateKey}، وعاد اليوم متاحاً للحجز تلقائياً (اللون الأخضر).`,
            timestamp: 'الآن',
            read: false,
            type: 'deposit_expired',
            targetAudience: 'all',
          },
          ...prev,
        ]);

        logActivity(
          'النظام التلقائي',
          'system',
          'انتهاء مهلة العربون',
          `انتهت مهلة الـ 15 دقيقة لتحويل العربون لعقار ${propName} في تاريخ ${dateKey}، وعاد التاريخ متاحاً.`
        );
      }
    });

    if (hasChanges) {
      setDateOverrides(updated);
    }
  }, [nowTimestamp, dateOverrides, properties, logActivity]);

  const isAdmin = userRole === 'admin';
  const isGuard = userRole === 'guard';

  const currentMarketer = useMemo(() => {
    return marketers.find((m) => m.id === currentMarketerId) || marketers[0] || null;
  }, [marketers, currentMarketerId]);

  const activePermissions = useMemo<MarketerPermissions>(() => {
    if (isAdmin) {
      return {
        canCreateBooking: true,
        canEditPrices: true,
        canViewAllBookings: true,
        canBlockDates: true,
        canViewCustomerContacts: true,
        canExportReports: true,
        canViewFinancials: true,
        canCreateContract: true,
        canEditDeposit: true,
        canViewCalendar: true,
        canViewProperties: true,
        canViewDashboard: true,
        canViewMarketers: true,
        canManageTemplates: true,
        canViewRentalContract: true,
        canViewActivityLogs: true,
      };
    }
    if (isGuard) {
      return {
        canCreateBooking: false,
        canEditPrices: false,
        canViewAllBookings: false,
        canBlockDates: false,
        canViewCustomerContacts: true,
        canExportReports: false,
        canViewFinancials: false,
        canCreateContract: false,
        canEditDeposit: false,
        canViewCalendar: false,
        canViewProperties: false,
        canViewDashboard: true,
        canViewMarketers: false,
        canManageTemplates: false,
        canViewRentalContract: false,
        canViewActivityLogs: false,
      };
    }
    return (
      currentMarketer?.permissions || {
        canCreateBooking: true,
        canEditPrices: false,
        canViewAllBookings: false,
        canBlockDates: false,
        canViewCustomerContacts: true,
        canExportReports: false,
        canViewFinancials: false,
        canCreateContract: true,
        canEditDeposit: true,
        canViewCalendar: true,
        canViewProperties: true,
        canViewDashboard: true,
        canViewMarketers: true,
        canManageTemplates: true,
        canViewRentalContract: true,
        canViewActivityLogs: true,
      }
    );
  }, [isAdmin, isGuard, currentMarketer]);

  const canCreateContract = isAdmin || !!activePermissions.canCreateContract;
  const canEditDeposit = isAdmin || !!activePermissions.canEditDeposit;
  const canViewCalendar = isAdmin || activePermissions.canViewCalendar !== false;
  const canViewProperties = isAdmin || activePermissions.canViewProperties !== false;
  const canViewDashboard = isAdmin || activePermissions.canViewDashboard !== false;
  const canViewMarketers = isAdmin || activePermissions.canViewMarketers !== false;
  const canManageTemplates = isAdmin || activePermissions.canManageTemplates !== false;
  const canViewRentalContract = isAdmin || activePermissions.canViewRentalContract !== false;
  const canViewActivityLogs = isAdmin || activePermissions.canViewActivityLogs !== false;

  const currentUserAccount = useMemo(() => {
    if (isAdmin) {
      return userAccounts.find((a) => a.role === 'admin') || INITIAL_USER_ACCOUNTS[0];
    }
    if (isGuard) {
      return userAccounts.find((a) => a.role === 'guard') || INITIAL_USER_ACCOUNTS[2];
    }
    return (
      userAccounts.find((a) => a.marketerId === currentMarketerId) ||
      userAccounts.find((a) => a.id === currentMarketerId) ||
      userAccounts.find((a) => a.role === 'marketer') ||
      INITIAL_USER_ACCOUNTS[3]
    );
  }, [userAccounts, isAdmin, isGuard, currentMarketerId]);

  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId) || properties[0];
  }, [properties, selectedPropertyId]);

  const filteredBookings = useMemo(() => {
    if (isAdmin || activePermissions.canViewAllBookings) {
      return bookings;
    }
    return bookings.filter((b) => b.marketerId === currentMarketerId);
  }, [bookings, isAdmin, activePermissions.canViewAllBookings, currentMarketerId]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayArrivals = useMemo(() => {
    return bookings.filter(
      (b) =>
        (b.checkInDate === todayStr || b.id === 'bk-today-in' || b.checkInDate === '2026-10-06') &&
        b.status !== 'cancelled'
    );
  }, [bookings, todayStr]);

  const todayDepartures = useMemo(() => {
    return bookings.filter(
      (b) =>
        (b.checkOutDate === todayStr || b.id === 'bk-today-out' || b.checkOutDate === '2026-10-06') &&
        b.status !== 'cancelled'
    );
  }, [bookings, todayStr]);

  // Notifications filtering strictly by targetAudience and role
  const filteredNotifications = useMemo(() => {
    if (isAdmin) {
      return notifications;
    }
    if (isGuard) {
      return notifications.filter(
        (n) => n.targetAudience === 'all' || n.targetAudience === 'admin_and_guard'
      );
    }
    // Marketer
    return notifications.filter(
      (n) =>
        n.targetAudience !== 'admin_only' &&
        n.targetAudience !== 'admin_and_guard' &&
        (!n.targetMarketerId || n.targetMarketerId === currentMarketerId)
    );
  }, [notifications, isAdmin, isGuard, currentMarketerId]);

  const unreadNotificationsCount = useMemo(() => {
    return filteredNotifications.filter((n) => !n.read).length;
  }, [filteredNotifications]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(next));
      if (next) playChimeSound(true);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const triggerBrowserNotification = useCallback(
    (title: string, body: string, type: ToastData['type'] = 'booking') => {
      setActiveToast({
        id: `toast-${Date.now()}-${Math.random()}`,
        title,
        body,
        type,
      });
      if (isSoundEnabled) {
        playChimeSound(true);
      }
      triggerSystemNotification(title, {
        body,
        playSound: false,
        tag: `amasa-booking-${Date.now()}`,
      });
    },
    [isSoundEnabled]
  );

  const sendTestNotification = useCallback(() => {
    triggerBrowserNotification(
      '🔔 تجربة نظام تنبيهات المتصفح (Web Notification)',
      'هذا تنبيه تجريبي لتأكيد وصول إشعارات الحجوزات ودفع العربون فوراً للموظفين مع نغمة التنبيه الموسيقية!',
      'deposit_confirmed'
    );
  }, [triggerBrowserNotification]);

  const switchUser = useCallback(
    (role: UserRole, marketerId?: string) => {
      setUserRole(role);
      if (marketerId) {
        setCurrentMarketerId(marketerId);
      }
      const roleName =
        role === 'admin'
          ? 'الإدارة (المدير العام)'
          : role === 'guard'
          ? guard.name
          : marketers.find((m) => m.id === marketerId)?.name || 'مسوق';

      logActivity(
        roleName,
        role,
        'تبديل الحساب',
        `تم تسجيل الدخول بصلاحية: ${role === 'admin' ? 'الإدارة' : role === 'guard' ? 'الحارس' : 'مسوق'}`
      );
    },
    [guard.name, marketers, logActivity]
  );

  const updateGuardProfile = useCallback(
    (data: Partial<Guard>) => {
      if (!isAdmin) return;
      setGuard((prev) => ({ ...prev, ...data }));
      logActivity('الإدارة', 'admin', 'تحديث بيانات الحارس', `تم تحديث بيانات الحارس ${data.name || guard.name}`);
    },
    [isAdmin, guard.name, logActivity]
  );

  const loginWithGmailAndPassword = useCallback(
    (email: string, pass: string) => {
      const target = email.trim().toLowerCase();
      const account = userAccounts.find((u) => u.email.trim().toLowerCase() === target);
      if (!account) {
        return {
          success: false,
          message: 'البريد الإلكتروني غير مسجل في النظام. تأكد من إدخال بريد Gmail الصحيح.',
        };
      }
      if (account.password && account.password !== pass) {
        return {
          success: false,
          message: 'كلمة المرور غير صحيحة. يمكنك إنشاء كلمة سر جديدة أو استعادتها.',
        };
      }
      setUserRole(account.role);
      if (account.marketerId) {
        setCurrentMarketerId(account.marketerId);
      }
      logActivity(
        account.name,
        account.role,
        'تسجيل الدخول عبر Gmail',
        `تم تسجيل الدخول بنجاح عبر بريد Gmail (${account.email}) بصلاحية: ${
          account.role === 'admin' ? 'الإدارة' : account.role === 'guard' ? 'الحارس' : 'مسوق'
        }`
      );
      triggerBrowserNotification(
        '👋 مرحباً بك في AMASA',
        `تم تسجيل الدخول بنجاح بحساب (${account.name})`,
        'system'
      );
      return {
        success: true,
        message: `مرحباً بك ${account.name}، تم تسجيل الدخول بنجاح!`,
      };
    },
    [userAccounts, logActivity, triggerBrowserNotification]
  );

  const loginWithGoogleQuick = useCallback(
    (accountId: string) => {
      const account = userAccounts.find((u) => u.id === accountId);
      if (account) {
        setUserRole(account.role);
        if (account.marketerId) {
          setCurrentMarketerId(account.marketerId);
        }
        logActivity(account.name, account.role, 'دخول سريع عبر Google', `تم تسجيل الدخول السريع بحساب (${account.email})`);
        triggerBrowserNotification('👋 مرحباً بك في AMASA', `تم تسجيل الدخول بحساب (${account.name})`, 'system');
      }
    },
    [userAccounts, logActivity, triggerBrowserNotification]
  );

  const changePassword = useCallback(
    (accountId: string, newPass: string) => {
      if (!newPass || newPass.trim().length < 2) {
        return { success: false, message: 'يرجى كتابة كلمة مرور صالحة (مكونة من خانتين على الأقل).' };
      }
      let accName = '';
      const emailLower = accountId.trim().toLowerCase();

      setUserAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === accountId || acc.email.trim().toLowerCase() === emailLower) {
            accName = acc.name;
            return { ...acc, password: newPass, updatedAt: new Date().toISOString() };
          }
          return acc;
        })
      );

      setMarketers((prev) =>
        prev.map((m) => {
          if (m.id === accountId || m.email.trim().toLowerCase() === emailLower) {
            return { ...m, password: newPass };
          }
          return m;
        })
      );

      if (guard.id === accountId || guard.email.trim().toLowerCase() === emailLower) {
        setGuard((prev) => ({ ...prev, password: newPass }));
      }

      logActivity(accName || 'المستخدم', userRole, 'تحديث كلمة المرور', `تم تعيين كلمة مرور جديدة ومخصصة للحساب: ${accName || emailLower}`);
      triggerBrowserNotification('🔑 تحديث كلمة المرور', `تم حفظ وتعيين كلمة المرور الجديدة للحساب (${accName || emailLower}) بنجاح!`, 'system');
      return { success: true, message: `تم تحديث كلمة المرور للحساب ${accName || emailLower} بنجاح!` };
    },
    [guard.id, guard.email, userRole, logActivity, triggerBrowserNotification]
  );

  const updateUserAccount = useCallback((accountId: string, data: Partial<UserAccount>) => {
    setUserAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, ...data, updatedAt: new Date().toISOString() } : acc))
    );
  }, []);

  const logout = useCallback(() => {
    setUserRole('admin');
    setIsAuthModalOpen(true);
    setAuthModalMode('login');
    logActivity('المستخدم', 'admin', 'تسجيل الخروج', 'تم تسجيل الخروج من الحساب');
  }, [logActivity]);

  const openAuthModal = useCallback((mode: AuthModalMode = 'quick_select') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const grantAllMarketersContractAndDepositPermissions = useCallback(() => {
    setMarketers((prev) =>
      prev.map((m) => ({
        ...m,
        permissions: {
          ...m.permissions,
          canCreateContract: true,
          canEditDeposit: true,
        },
      }))
    );
    logActivity(
      'الإدارة',
      'admin',
      'تفعيل صلاحيات العقود والعربون',
      'تم منح وتفعيل صلاحيات إنشاء العقد وتعديل العربون لجميع الموظفين والمسوقين'
    );
    triggerBrowserNotification(
      '📜 صلاحيات الموظفين المحدثة',
      'تم منح وتفعيل صلاحيات إنشاء العقود وتعديل العربون لجميع الموظفين بنجاح',
      'permission'
    );
  }, [logActivity, triggerBrowserNotification]);

  const updateWaitingDepositAmount = useCallback(
    (propertyId: string, dates: string[], amount: number) => {
      setDateOverrides((prev) => {
        const next = { ...prev };
        dates.forEach((d) => {
          const k = `${propertyId}_${d}`;
          if (next[k]) {
            next[k] = { ...next[k], waitingDepositAmount: amount };
          }
        });
        return next;
      });

      logActivity(
        isAdmin ? 'الإدارة' : currentMarketer?.name || 'موظف',
        userRole,
        'تعديل مبلغ العربون قبل التأكيد',
        `تم تعديل مبلغ العربون المطلوب إلى ${amount} ريال للتواريخ المعلقة (${dates.join(', ')})`
      );

      triggerBrowserNotification(
        '✏️ تم تعديل مبلغ العربون',
        `تم تحديث مبلغ العربون إلى ${amount} ريال قبل تأكيد الحجز`,
        'deposit_request'
      );
    },
    [isAdmin, currentMarketer?.name, userRole, logActivity, triggerBrowserNotification]
  );

  const updateProperty = useCallback(
    (id: string, data: Partial<Property>) => {
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
      logActivity(isAdmin ? 'الإدارة' : currentMarketer?.name || 'مسوق', userRole, 'تحديث بيانات عقار', `تم تحديث تفاصيل العقار: ${properties.find((p) => p.id === id)?.name || id}`);
    },
    [isAdmin, currentMarketer?.name, userRole, properties, logActivity]
  );

  const updatePropertySection = useCallback(
    (propertyId: string, sectionId: string, data: Partial<PropertySection>) => {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id !== propertyId) return p;
          const nextSections = (p.sections || []).map((sec) =>
            sec.id === sectionId ? { ...sec, ...data } : sec
          );
          return { ...p, sections: nextSections };
        })
      );
      const propObj = properties.find((p) => p.id === propertyId);
      const secObj = propObj?.sections?.find((s) => s.id === sectionId);
      const secName = secObj?.name || (sectionId === 'hamran-alma' ? 'وحدة الما' : sectionId === 'hamran-naya' ? 'وحدة نايا' : 'القسم');
      logActivity(
        isAdmin ? 'الإدارة' : currentMarketer?.name || 'مسوق',
        userRole,
        'تحديث معلومات وسعر القسم',
        `تم تحديث مواصفات وسعر ${secName} لعقار ${propObj?.name || 'العقار'} بنجاح`
      );
    },
    [isAdmin, currentMarketer?.name, userRole, logActivity, properties]
  );

  const togglePropertyPublished = useCallback(
    (propertyId: string) => {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === propertyId) {
            const nextPublished = !p.isPublished;
            logActivity(
              'الإدارة',
              'admin',
              nextPublished ? 'فتح العقار لجميع الأيام' : 'إيقاف العقار كامل لجميع الأيام',
              nextPublished
                ? `تم فتح العقار (${p.name}) كامل لجميع الأيام واستكمال إنشاء الحجوزات`
                : `تم إيقاف العقار (${p.name}) كامل لجميع الأيام وتعطيل إنشاء الحجوزات`
            );
            return { ...p, isPublished: nextPublished };
          }
          return p;
        })
      );
    },
    [logActivity]
  );

  const updateMarketerPermissions = useCallback((id: string, perms: Partial<MarketerPermissions>) => {
    setMarketers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, permissions: { ...m.permissions, ...perms } } : m))
    );
  }, []);

  const updateMarketerProfile = useCallback(
    (id: string, data: Partial<Marketer>) => {
      setMarketers((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...data,
                contract: data.contract ? { ...m.contract, ...data.contract } : m.contract,
              }
            : m
        )
      );
      setUserAccounts((prev) =>
        prev.map((acc) =>
          acc.id === id || acc.marketerId === id
            ? {
                ...acc,
                name: data.name ?? acc.name,
                email: data.email ?? acc.email,
                phone: data.phone ?? acc.phone,
              }
            : acc
        )
      );
      logActivity('الإدارة', 'admin', 'تحديث بيانات المسوق', `تم تحديث الملف الشخصي وبيانات العقد للمسوق: ${data.name || id}`);
    },
    [logActivity]
  );

  const addMarketer = useCallback(
    (data: { name: string; email: string; phone: string; nationalId?: string; bankAccount?: string; bankName?: string }) => {
      const code = `MK-${100 + marketers.length + 1}`;
      const today = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const newMarketer: Marketer = {
        id: `m${Date.now()}`,
        name: data.name,
        email: data.email,
        password: '123',
        phone: data.phone,
        bankAccount: data.bankAccount || '',
        bankName: data.bankName || 'مصرف الراجحي',
        nationalId: data.nationalId || '1000000000',
        avatar: `https://images.unsplash.com/photo-${1530000000000 + marketers.length}?auto=format&fit=crop&w=200&q=80`,
        code,
        commissionRate: 0.05,
        joinDate: today,
        contract: {
          contractNumber: `MKT-CTR-2026-${100 + marketers.length + 1}`,
          contractDate: today,
          expiryDate: expiry,
          commissionRatePercent: 5,
          status: 'active',
          firstParty: 'إدارة استراحات وشاليهات ماسة (AMASA)',
          firstPartyRepresentative: 'المدير العام التنفيذي',
          secondParty: data.name,
          secondPartyPhone: data.phone,
          secondPartyEmail: data.email,
          secondPartyNationalId: data.nationalId || '1000000000',
          terms: [
            'يستحق المسوق عمولة تسويق ثابتة قدرها 5% من القيمة الإجمالية لكل حجز مؤكد ومكتمل يتم إبرامه عبر رمزه التسويقي المعتمد.',
            'يتم تحويل العمولات المستحقة دورياً وفورياً إلى الحساب البنكي المعتمد للمسوق.',
            'يلتزم المسوق بالترويج بالأسعار الرسمية المعتمدة والحفاظ على سرية وخصوصية بيانات العملاء.',
            'يمنح المسوق صلاحية إصدار عقود الإيجار المعتمدة وتعديل مبالغ العربون المبدئي لتسهيل الحجوزات.',
          ],
          isSigned: true,
          signedDate: today,
          notes: 'عقد وساطة وتسويق موثق إلكترونياً',
        },
        permissions: {
          canCreateBooking: true,
          canEditPrices: false,
          canViewAllBookings: false,
          canBlockDates: false,
          canViewCustomerContacts: true,
          canExportReports: true,
          canViewFinancials: false,
          canCreateContract: true,
          canEditDeposit: true,
          canViewCalendar: true,
          canViewProperties: true,
          canViewDashboard: true,
          canViewMarketers: true,
          canManageTemplates: true,
          canViewRentalContract: true,
          canViewActivityLogs: true,
        },
      };

      setMarketers((prev) => [...prev, newMarketer]);
      setUserAccounts((prev) => [
        ...prev,
        {
          id: newMarketer.id,
          role: 'marketer',
          marketerId: newMarketer.id,
          name: data.name,
          email: data.email,
          password: '123',
          phone: data.phone,
          avatar: newMarketer.avatar,
          createdAt: new Date().toISOString(),
        },
      ]);

      logActivity('الإدارة', 'admin', 'إضافة مسوق جديد', `تم تسجيل المسوق الجديد: ${data.name} بنسبة عمولة 5% وإصدار العقد الرسمي`);
    },
    [marketers.length, logActivity]
  );

  const addAdminAccount = useCallback(
    (data: { name: string; email: string; phone?: string }) => {
      const emailNorm = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@gmail\.com$/i.test(emailNorm)) {
        return { success: false, message: 'أدخل بريد Gmail صحيحاً (name@gmail.com).' };
      }
      if (userAccounts.some((acc) => acc.email.toLowerCase() === emailNorm)) {
        return { success: false, message: 'هذا البريد مسجل مسبقاً لحساب آخر.' };
      }

      const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      const autoPass = Array.from(arr, (b) => chars[b % chars.length]).join('');

      setUserAccounts((prev) => [
        ...prev,
        {
          id: `admin-${Date.now()}`,
          role: 'admin',
          name: data.name,
          email: emailNorm,
          password: autoPass,
          phone: data.phone,
          createdAt: new Date().toISOString(),
        },
      ]);

      logActivity('الإدارة', 'admin', 'إضافة عضو إدارة', `تم إضافة عضو إدارة بكامل الصلاحيات: ${data.name}`);
      return { success: true, message: 'تمت إضافة عضو الإدارة بكامل الصلاحيات', password: autoPass };
    },
    [userAccounts, logActivity]
  );

  const setMarketerAccountRole = useCallback(
    (marketerId: string, newRole: UserRole) => {
      const acc = userAccounts.find((a) => a.marketerId === marketerId || a.id === marketerId);
      const marketerObj = marketers.find((m) => m.id === marketerId);
      if (!acc || !marketerObj) {
        return { success: false, message: 'لم يتم العثور على حساب هذا المسوق.' };
      }
      if (acc.role === newRole) {
        return { success: true, message: newRole === 'admin' ? 'الحساب إدارة بالفعل.' : 'الحساب مسوق بالفعل.' };
      }

      setUserAccounts((prev) => prev.map((a) => (a.id === acc.id ? { ...a, role: newRole } : a)));

      logActivity(
        'الإدارة',
        'admin',
        newRole === 'admin' ? 'ترقية مسوق إلى إدارة' : 'إرجاع عضو إدارة إلى مسوق',
        newRole === 'admin'
          ? `تمت ترقية ${marketerObj.name} إلى الإدارة بكامل الصلاحيات.`
          : `تم إرجاع ${marketerObj.name} إلى صلاحيات مسوق.`
      );

      return {
        success: true,
        message:
          newRole === 'admin'
            ? `تمت ترقية ${marketerObj.name} إلى الإدارة.`
            : `تم إرجاع ${marketerObj.name} إلى مسوق.`,
      };
    },
    [userAccounts, marketers, logActivity]
  );

  const setDateOverride = useCallback((propertyId: string, date: string, override: Partial<DateOverride>, sectionId?: string) => {
    const k = sectionId && sectionId !== 'all' ? `${propertyId}_${sectionId}_${date}` : `${propertyId}_${date}`;
    setDateOverrides((prev) => ({ ...prev, [k]: { ...prev[k], ...override } }));
  }, []);

  const setDateOverridesBulk = useCallback((propertyId: string, dates: string[], override: Partial<DateOverride>, sectionId?: string) => {
    setDateOverrides((prev) => {
      const next = { ...prev };
      dates.forEach((d) => {
        const k = sectionId && sectionId !== 'all' ? `${propertyId}_${sectionId}_${d}` : `${propertyId}_${d}`;
        next[k] = { ...next[k], ...override };
      });
      return next;
    });
  }, []);

  const applySeasonalPricingPattern = useCallback(
    (propertyId: string, dates: string[], season: keyof Property['seasonalPricing'], sectionId?: string) => {
      const prop = properties.find((p) => p.id === propertyId) || selectedProperty;
      let price = prop.seasonalPricing[season] || prop.basePriceWeekday;
      if (sectionId && sectionId !== 'all') {
        const sec = prop.sections?.find((s) => s.id === sectionId);
        if (sec) {
          if (season === 'weekday') price = sec.priceWeekday;
          else if (season === 'weekend') price = sec.priceWeekend;
          else if (season === 'summer') price = Math.round(sec.priceWeekday * 1.1);
          else if (season === 'eid') price = Math.round(sec.priceWeekend * 1.5);
          else if (season === 'vacation') price = Math.round(sec.priceWeekday * 1.25);
        }
      }
      setDateOverridesBulk(propertyId, dates, { price, season }, sectionId);
    },
    [properties, selectedProperty, setDateOverridesBulk]
  );

  const requestDeposit = useCallback(
    ({
      propertyId,
      dates,
      customerName,
      customerPhone,
      depositAmount,
      totalPrice,
      nightsCount,
      marketerId,
      commissionRatePercent,
      sectionName,
    }: {
      propertyId: string;
      dates: string[];
      customerName: string;
      customerPhone: string;
      depositAmount: number;
      totalPrice: number;
      nightsCount: number;
      marketerId?: string;
      commissionRatePercent?: number;
      sectionName?: string;
    }) => {
      const prop = properties.find((p) => p.id === propertyId) || selectedProperty;
      const displayName = sectionName ? `${prop.name} (${sectionName})` : prop.name;
      const targetMarketer = marketers.find((m) => m.id === (marketerId || currentMarketerId));
      const expiresAt = Date.now() + 900 * 1000; // 15 minutes = 900 seconds
      const todayStr = new Date().toISOString().split('T')[0];
      const validDates = dates.filter((d) => d >= todayStr);
      if (validDates.length === 0) {
        return { whatsappUrl: '', message: '' };
      }

      setDateOverrides((prev) => {
        const next = { ...prev };
        validDates.forEach((d) => {
          const k = `${propertyId}_${d}`;
          next[k] = {
            ...next[k],
            status: 'waiting_deposit',
            waitingDepositExpiresAt: expiresAt,
            waitingCustomerName: customerName,
            waitingCustomerPhone: customerPhone,
            waitingDepositAmount: depositAmount,
            waitingMarketerName: targetMarketer?.name,
            waitingMarketerId: targetMarketer?.id,
            waitingCommissionRate: commissionRatePercent === 7 ? 7 : 5,
          };
        });
        return next;
      });

      const notifDesc = `⚠️ طلب عربون جديد لعقار (${displayName}) للعميل ${customerName} بمبلغ ${depositAmount} ريال. التواريخ معلقة باللون الأصفر لمدة 15 دقيقة للتحويل!`;

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `طلب عربون جديد (مهلة 15 دقيقة) - ${displayName}`,
          description: notifDesc,
          timestamp: 'الآن',
          read: false,
          type: 'deposit_request',
          targetAudience: 'all',
        },
        ...prev,
      ]);

      triggerBrowserNotification(
        `⏳ طلب عربون جديد (مهلة 15 دقيقة) - ${displayName}`,
        `تم طلب عربون بقيمة ${depositAmount} ريال للعميل ${customerName} لعقار ${displayName} لحفظ الحجز فوراً`,
        'deposit_request'
      );

      const msg = fillTemplate(messageTemplates.depositRequest, {
        اسم_العميل: customerName,
        رقم_الجوال: customerPhone,
        اسم_العقار: displayName,
        عدد_الليالي: nightsCount,
        مبلغ_العربون: depositAmount,
        المبلغ_الإجمالي: totalPrice,
        المبلغ_المتبقي: totalPrice - depositAmount,
        مبلغ_التأمين: prop.insuranceAmount,
        اسم_البنك: prop.bankName,
        اسم_الحساب: prop.accountHolder,
        رقم_الآيبان: prop.iban,
        مهلة_الدفع: '15 دقيقة',
      });

      const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^0/, '966');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      return { whatsappUrl, message: msg };
    },
    [properties, selectedProperty, marketers, currentMarketerId, messageTemplates, triggerBrowserNotification]
  );

  const cancelDepositWait = useCallback((propertyId: string, dates: string[]) => {
    setDateOverrides((prev) => {
      const next = { ...prev };
      dates.forEach((d) => {
        const k = `${propertyId}_${d}`;
        next[k] = {
          ...next[k],
          status: 'available',
          waitingDepositExpiresAt: undefined,
          waitingCustomerName: undefined,
          waitingCustomerPhone: undefined,
          waitingDepositAmount: undefined,
        };
      });
      return next;
    });
  }, []);

  const confirmBookingWithReceipt = useCallback(
    ({
      propertyId,
      dates,
      customerName,
      customerPhone,
      depositPaid,
      totalPrice,
      remainingAmount,
      insuranceAmount,
      receiptFileName,
      receiptDataUrl,
      marketerId,
      commissionRatePercent,
      notes,
      sectionId,
      sectionName,
    }: {
      propertyId: string;
      dates: string[];
      customerName: string;
      customerPhone: string;
      depositPaid: number;
      totalPrice: number;
      remainingAmount: number;
      insuranceAmount: number;
      receiptFileName: string;
      receiptDataUrl?: string;
      marketerId?: string;
      commissionRatePercent?: number;
      notes?: string;
      sectionId?: string;
      sectionName?: string;
    }) => {
      const prop = properties.find((p) => p.id === propertyId) || selectedProperty;
      const displayName = sectionName ? `${prop.name} (${sectionName})` : prop.name;
      const targetMarketer = marketers.find((m) => m.id === (marketerId || currentMarketerId));

      const todayStr = new Date().toISOString().split('T')[0];
      const validDates = dates.filter((d) => d >= todayStr);
      const sortedDates = [...(validDates.length > 0 ? validDates : dates)].sort();
      const checkInDate = sortedDates[0];
      const lastNight = sortedDates[sortedDates.length - 1];
      const checkOutDateObj = new Date(lastNight);
      checkOutDateObj.setDate(checkOutDateObj.getDate() + 1);
      const checkOutDate = checkOutDateObj.toISOString().split('T')[0];

      const nightsCount = sortedDates.length;
      const nightlyPrice = Math.round(totalPrice / Math.max(1, nightsCount));
      const rate = commissionRatePercent === 7 ? 7 : 5;
      const commissionAmount = targetMarketer ? Math.round(totalPrice * (rate / 100)) : 0;

      const checkInDateObj = new Date(checkInDate);
      const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

      const inDayName = daysAr[checkInDateObj.getDay()];
      const inDayNum = checkInDateObj.getDate();
      const inMonthNum = checkInDateObj.getMonth() + 1;
      const inMonthName = monthsAr[checkInDateObj.getMonth()];
      const inYear = checkInDateObj.getFullYear();

      const outDayName = daysAr[checkOutDateObj.getDay()];
      const outDayNum = checkOutDateObj.getDate();
      const outMonthNum = checkOutDateObj.getMonth() + 1;
      const outMonthName = monthsAr[checkOutDateObj.getMonth()];
      const outYear = checkOutDateObj.getFullYear();

      const termsText = prop.contractTerms.map((t, idx) => `${idx + 1}. ${t}`).join('\n');

      let contractText = fillTemplate(messageTemplates.contract, {
        اسم_العقار: prop.name === 'كوخ البيلسان' ? 'كوخ زهرة البيلسان 🏕️' : `${displayName} 🏕️`,
        اسم_العميل: customerName,
        رقم_الجوال: customerPhone,
        تاريخ_الدخول: `${inDayName} ${inDayNum} ${inMonthName} ( ${inMonthNum} ) ${inYear} م`,
        وقت_الدخول: prop.checkInTimeText,
        تاريخ_الخروج: `${outDayName} ${outDayNum} ${outMonthName} ( ${outMonthNum} ) ${outYear} م`,
        وقت_الخروج: prop.checkOutTimeText,
        المبلغ_الإجمالي: totalPrice,
        مبلغ_العربون: depositPaid,
        المبلغ_المتبقي: remainingAmount,
        مبلغ_التأمين: insuranceAmount,
        شروط_العقد: termsText,
      });

      if (!contractText.includes('الشروط والأحكام') && !contractText.includes(termsText)) {
        contractText += `\n\n📌 الشروط والأحكام:\n${termsText}`;
      }

      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        bookingNumber: `BK-2026-${100 + bookings.length + 1}`,
        propertyId,
        propertyName: displayName,
        sectionId,
        sectionName,
        customerName,
        customerPhone,
        checkInDate,
        checkOutDate,
        nightsCount,
        nightlyPrice,
        totalPrice,
        taxAmount: 0,
        discount: 0,
        depositPaid,
        remainingAmount,
        insuranceAmount,
        depositReceiptUrl: receiptDataUrl || receiptFileName,
        marketerId: targetMarketer?.id,
        marketerName: targetMarketer?.name,
        marketerCommission: commissionAmount,
        commissionRatePercent: rate,
        bookingType: rate === 7 ? 'full' : 'partial',
        commissionStatus: 'pending',
        status: 'confirmed',
        createdAt: new Date().toISOString().split('T')[0],
        notes: notes || `تم تأكيد الحجز بإرفاق الإيصال: ${receiptFileName}`,
        contractSigned: true,
        contractMessage: contractText,
        checkedOut: false,
        insuranceReturned: false,
      };

      setBookings((prev) => [newBooking, ...prev]);

      // Turn dates RED (booked)
      setDateOverrides((prev) => {
        const next = { ...prev };
        sortedDates.forEach((d) => {
          const k = `${propertyId}_${d}`;
          next[k] = {
            ...next[k],
            status: 'booked',
            waitingDepositExpiresAt: undefined,
            waitingCustomerName: undefined,
            waitingCustomerPhone: undefined,
            waitingDepositAmount: undefined,
          };
        });
        return next;
      });

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `🎉 تأكيد حجز جديد - ${prop.name}`,
          description: `تم تأكيد الحجز ${newBooking.bookingNumber} للعميل ${customerName} واستلام الإيصال (${receiptFileName}) وإرسال العقد عبر واتساب`,
          timestamp: 'الآن',
          read: false,
          type: 'deposit_confirmed',
          targetAudience: 'all',
          linkToBookingId: newBooking.id,
        },
        ...prev,
      ]);

      triggerBrowserNotification(
        `💰 تأكيد دفع عربون - ${prop.name}`,
        `تم استلام وتأكيد سداد العربون (${depositPaid} ريال) للعميل ${customerName} (${newBooking.bookingNumber}) واعتماد العقد!`,
        'deposit_confirmed'
      );

      const cleanPhone = customerPhone.replace(/\D/g, '').replace(/^0/, '966');
      const whatsappContractUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(contractText)}`;

      return { booking: newBooking, whatsappContractUrl, contractText };
    },
    [properties, selectedProperty, marketers, currentMarketerId, bookings.length, messageTemplates.contract, triggerBrowserNotification]
  );

  const addBooking = useCallback(
    (params: Partial<Booking> & { propertyId: string; customerName: string; customerPhone: string; checkInDate: string; checkOutDate: string }) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const validCheckIn = params.checkInDate < todayStr ? todayStr : params.checkInDate;
      const validCheckOut =
        params.checkOutDate <= validCheckIn
          ? new Date(new Date(validCheckIn).getTime() + 86400000).toISOString().split('T')[0]
          : params.checkOutDate;

      const prop = properties.find((p) => p.id === params.propertyId) || selectedProperty;
      const marketerId = params.marketerId || (isAdmin ? undefined : currentMarketerId);
      const marketerObj = marketers.find((m) => m.id === marketerId);
      const netTotal = (params.totalPrice || prop.basePriceWeekday) - (params.discount || 0);
      const rate = params.commissionRatePercent === 7 ? 7 : 5;
      const commission = marketerObj ? Math.round(netTotal * (rate / 100)) : 0;
      const deposit = params.depositPaid || prop.defaultDeposit;
      const remaining = params.remainingAmount !== undefined ? params.remainingAmount : netTotal - deposit;
      const insurance = params.insuranceAmount || prop.insuranceAmount;

      const newBooking: Booking = {
        id: `bk-${Date.now()}`,
        bookingNumber: `BK-2026-${100 + bookings.length + 1}`,
        propertyId: params.propertyId,
        propertyName: prop.name,
        sectionId: params.sectionId,
        sectionName: params.sectionName,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerNationalId: params.customerNationalId || `10${Math.floor(10000000 + Math.random() * 90000000)}`,
        checkInDate: validCheckIn,
        checkOutDate: validCheckOut,
        nightsCount: params.nightsCount || 1,
        nightlyPrice: params.nightlyPrice || prop.basePriceWeekday,
        totalPrice: netTotal,
        taxAmount: 0,
        discount: params.discount || 0,
        depositPaid: deposit,
        remainingAmount: remaining,
        insuranceAmount: insurance,
        marketerId: marketerObj?.id,
        marketerName: marketerObj?.name,
        marketerCommission: commission,
        commissionRatePercent: rate,
        bookingType: rate === 7 ? 'full' : 'partial',
        commissionStatus: 'pending',
        status: 'confirmed',
        createdAt: new Date().toISOString().split('T')[0],
        notes: params.notes || '',
        contractSigned: true,
        checkedOut: false,
        insuranceReturned: false,
      };

      setBookings((prev) => [newBooking, ...prev]);

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `🎉 حجز جديد - ${prop.name}`,
          description: `تم استلام حجز جديد برقم ${newBooking.bookingNumber} للعميل ${params.customerName} بقيمة ${netTotal} ر.س`,
          timestamp: 'الآن',
          read: false,
          type: 'booking',
          targetAudience: 'all',
          linkToBookingId: newBooking.id,
        },
        ...prev,
      ]);

      triggerBrowserNotification(
        `🎉 استلام حجز جديد - ${prop.name}`,
        `تم استلام حجز جديد (${newBooking.bookingNumber}) للعميل ${params.customerName} بقيمة ${netTotal} ر.س ومسوق: ${marketerObj?.name || 'مباشر'}`,
        'booking'
      );

      // Auto-sync to connected Google Sheets / AppSheet if enabled
      try {
        const sheetInfo = getSavedSpreadsheetInfo();
        if (sheetInfo.connected && sheetInfo.autoSync && sheetInfo.spreadsheetId) {
          appendBookingToSheet(sheetInfo.spreadsheetId, newBooking).catch((err) => {
            console.warn('Auto-sync to Google Sheets failed:', err);
          });
        }
      } catch (err) {
        console.warn('Auto-sync check failed:', err);
      }

      return newBooking;
    },
    [properties, selectedProperty, isAdmin, currentMarketerId, marketers, bookings.length, triggerBrowserNotification]
  );

  const updateBookingStatus = useCallback((id: string, status: Booking['status']) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const nextCommStatus = status === 'completed' && b.marketerId ? 'ready_for_payout' : b.commissionStatus;
          return { ...b, status, commissionStatus: nextCommStatus };
        }
        return b;
      })
    );
  }, []);

  const cancelBooking = useCallback(
    (id: string) => {
      updateBookingStatus(id, 'cancelled');
    },
    [updateBookingStatus]
  );

  const payMarketerCommission = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, commissionStatus: 'paid' } : b))
    );
  }, []);

  const payoutAllMarketerCommissions = useCallback((marketerId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.marketerId === marketerId &&
        (b.commissionStatus === 'ready_for_payout' || b.commissionStatus === 'pending')
          ? { ...b, commissionStatus: 'paid' }
          : b
      )
    );
  }, []);

  const sendCheckoutReminder = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      const prop = properties.find((p) => p.id === bk?.propertyId) || selectedProperty;
      const rawTpl =
        messageTemplates.checkoutReminder ||
        'عذرا عن الازعاج ومنعا للاحراج تذكير خروج الساعة 2 م وذلك تفاديا عن خصم مبلغ من التامين كما هو موضح بالعقد';

      const msg = fillTemplate(rawTpl, {
        اسم_العميل: bk?.customerName || '',
        رقم_الجوال: bk?.customerPhone || '',
        اسم_العقار: bk?.propertyName || prop.name,
        وقت_الخروج: prop.checkOutTimeText || 'الساعة 2 م',
      });

      const cleanPhone = (bk?.customerPhone || '0550000000').replace(/\D/g, '').replace(/^0/, '966');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : currentMarketer?.name || 'موظف',
        userRole,
        'إرسال تذكير خروج',
        `تم إرسال تذكير الخروج عبر واتساب للعميل ${bk?.customerName} لعقار ${bk?.propertyName}`
      );

      return { whatsappUrl, message: msg };
    },
    [bookings, properties, selectedProperty, messageTemplates.checkoutReminder, logActivity, isAdmin, isGuard, guard.name, currentMarketer?.name, userRole]
  );

  const sendPaymentCompletionRequest = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk) return { whatsappUrl: '', message: '' };
      const prop = properties.find((p) => p.id === bk.propertyId) || selectedProperty;

      const msg = fillTemplate(messageTemplates.paymentCompletion, {
        اسم_العميل: bk.customerName,
        رقم_الجوال: bk.customerPhone,
        اسم_العقار: bk.propertyName,
        رقم_الحجز: bk.bookingNumber,
        تاريخ_الدخول: bk.checkInDate,
        وقت_الدخول: prop.checkInTimeText,
        تاريخ_الخروج: bk.checkOutDate,
        وقت_الخروج: prop.checkOutTimeText,
        عدد_الليالي: bk.nightsCount,
        المبلغ_الإجمالي: bk.totalPrice,
        مبلغ_العربون: bk.depositPaid,
        المبلغ_المتبقي: bk.remainingAmount,
        مبلغ_التأمين: bk.insuranceAmount,
        اسم_البنك: prop.bankName,
        اسم_الحساب: prop.accountHolder,
        رقم_الآيبان: prop.iban,
      });

      const cleanPhone = (bk.customerPhone || '0550000000').replace(/\D/g, '').replace(/^0/, '966');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : currentMarketer?.name || 'موظف',
        userRole,
        'إرسال طلب إكمال الدفع',
        `تم إرسال طلب سداد المتبقي (${bk.remainingAmount} ريال) عبر واتساب للعميل ${bk.customerName} لحجز ${bk.bookingNumber}`
      );

      return { whatsappUrl, message: msg };
    },
    [bookings, properties, selectedProperty, messageTemplates.paymentCompletion, logActivity, isAdmin, isGuard, guard.name, currentMarketer?.name, userRole]
  );

  const markCheckedOut = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk) return;
      const timeStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, checkedOut: true, checkedOutAt: timeStr, status: 'completed' }
            : b
        )
      );

      setNotifications((prev) => [
        ...(bk.marketerId
          ? [
              {
                id: `notif-empcheckout-${Date.now()}`,
                title: `🚪 خرج العميل - ${bk.propertyName}`,
                description: `خرج العميل (${bk.customerName}) من عقار ${bk.propertyName} في تمام الساعة ${timeStr}.`,
                timestamp: 'الآن',
                read: false,
                type: 'checkout' as const,
                targetAudience: 'marketer' as const,
                targetMarketerId: bk.marketerId,
                linkToBookingId: bk.id,
              },
            ]
          : []),
        {
          id: `notif-checkout-${Date.now()}`,
          title: `🚪 تم خروج النزيل - ${bk.propertyName}`,
          description: `أكد النزيل (${bk.customerName}) خروجه من عقار ${bk.propertyName} في تمام الساعة ${timeStr} وجاري معاينة المكان من قبل الحارس.`,
          timestamp: 'الآن',
          read: false,
          type: 'checkout' as const,
          targetAudience: 'admin_and_guard' as const,
          linkToBookingId: bk.id,
        },
        ...prev,
      ]);

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : 'موظف',
        userRole,
        'تسجيل خروج النزيل',
        `تم تسجيل خروج العميل ${bk.customerName} من عقار ${bk.propertyName} وإشعار الحارس والإدارة والموظف.`
      );
    },
    [bookings, logActivity, isAdmin, isGuard, guard.name, userRole]
  );

  const guardMarkArrived = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk || bk.guestArrived) return;
      const timeStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, guestArrived: true, guestArrivedAt: timeStr } : b
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-arrived-${Date.now()}`,
          title: `📍 وصل العميل - ${bk.propertyName}`,
          description: `أبلغ الحارس بوصل العميل (${bk.customerName}) إلى عقار ${bk.propertyName} في تمام الساعة ${timeStr}.`,
          timestamp: 'الآن',
          read: false,
          type: 'booking',
          targetAudience: bk.marketerId ? 'marketer' : 'admin_only',
          targetMarketerId: bk.marketerId,
          linkToBookingId: bk.id,
        },
        ...prev,
      ]);

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : 'موظف',
        userRole,
        'تنبيه الموظف بوصول العميل',
        `تم إرسال تنبيه للموظف بوصول العميل ${bk.customerName} إلى عقار ${bk.propertyName}.`
      );
    },
    [bookings, logActivity, isAdmin, isGuard, guard.name, userRole]
  );

  const guardReceiveInsurance = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk || bk.insuranceReceivedCash) return;
      const timeStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, insuranceReceivedCash: true, insuranceReceivedAt: timeStr } : b
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-insrecv-${Date.now()}`,
          title: `💵 تم استلام التأمين كاش - ${bk.propertyName}`,
          description: `استلم الحارس مبلغ التأمين (${bk.insuranceAmount} ريال) كاش من العميل ${bk.customerName} عند دخوله عقار ${bk.propertyName} في تمام الساعة ${timeStr}.`,
          timestamp: 'الآن',
          read: false,
          type: 'insurance',
          targetAudience: bk.marketerId ? 'marketer' : 'admin_only',
          targetMarketerId: bk.marketerId,
          linkToBookingId: bk.id,
        },
        ...prev,
      ]);

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : 'موظف',
        userRole,
        'تنبيه الموظف باستلام التأمين كاش',
        `تم إرسال تنبيه للموظف باستلام تأمين العميل ${bk.customerName} كاش (${bk.insuranceAmount} ريال).`
      );
    },
    [bookings, logActivity, isAdmin, isGuard, guard.name, userRole]
  );

  const guardRequestInsuranceReturn = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk || bk.insuranceReturnRequested) return;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, insuranceReturnRequested: true } : b))
      );

      setNotifications((prev) => [
        {
          id: `notif-insreturnreq-${Date.now()}`,
          title: `🔔 جاهز لإعادة التأمين - ${bk.propertyName}`,
          description: `خرج العميل (${bk.customerName}) من عقار ${bk.propertyName} والتأمين (${bk.insuranceAmount} ريال) جاهز للإعادة بعد معاينة العقار.`,
          timestamp: 'الآن',
          read: false,
          type: 'insurance',
          targetAudience: bk.marketerId ? 'marketer' : 'admin_only',
          targetMarketerId: bk.marketerId,
          linkToBookingId: bk.id,
        },
        ...prev,
      ]);

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : 'موظف',
        userRole,
        'تنبيه الموظف لإعادة التأمين',
        `تم إرسال تنبيه للموظف لإعادة تأمين العميل ${bk.customerName} (${bk.insuranceAmount} ريال).`
      );
    },
    [bookings, logActivity, isAdmin, isGuard, guard.name, userRole]
  );

  const returnInsuranceDeposit = useCallback(
    (bookingId: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk) return;
      const timeStr = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, insuranceReturned: true, insuranceReturnedAt: timeStr } : b
        )
      );

      setNotifications((prev) => [
        ...(bk.marketerId
          ? [
              {
                id: `notif-empinsret-${Date.now()}`,
                title: `💵 تمت إعادة التأمين كاش للعميل - ${bk.propertyName}`,
                description: `أعاد الحارس مبلغ التأمين (${bk.insuranceAmount} ريال) كاش للعميل ${bk.customerName} بعد معاينة عقار ${bk.propertyName} في تمام الساعة ${timeStr}.`,
                timestamp: 'الآن',
                read: false,
                type: 'insurance' as const,
                targetAudience: 'marketer' as const,
                targetMarketerId: bk.marketerId,
                linkToBookingId: bk.id,
              },
            ]
          : []),
        {
          id: `notif-insurance-${Date.now()}`,
          title: `💵 تم تسليم وإرجاع التأمين - ${bk.propertyName}`,
          description: `تم استرجاع وتسليم مبلغ التأمين (${bk.insuranceAmount} ريال) للعميل ${bk.customerName} بعد فحص عقار ${bk.propertyName} والتأكد من خلوه من أي تلفيات.`,
          timestamp: 'الآن',
          read: false,
          type: 'insurance' as const,
          targetAudience: 'admin_only' as const,
          linkToBookingId: bk.id,
        },
        ...prev,
      ]);

      logActivity(
        isAdmin ? 'الإدارة' : isGuard ? guard.name : 'موظف',
        userRole,
        'تسليم التأمين للعميل',
        `تم تسليم مبلغ التأمين (${bk.insuranceAmount} ريال) للعميل ${bk.customerName} وإشعار الإدارة والموظف.`
      );
    },
    [bookings, logActivity, isAdmin, isGuard, guard.name, userRole]
  );

  const completeBookingPayment = useCallback(
    (bookingId: string, receiptName: string, receiptDataUrl?: string) => {
      const bk = bookings.find((b) => b.id === bookingId);
      if (!bk) return;

      const actor = isAdmin ? 'الإدارة' : isGuard ? guard.name : currentMarketer?.name || 'موظف';
      const dateStr = new Date().toISOString().split('T')[0];

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                depositPaid: b.depositPaid + b.remainingAmount,
                remainingAmount: 0,
                paymentCompleted: true,
                paymentReceiptName: receiptName,
                paymentReceiptDataUrl: receiptDataUrl,
                paymentCompletedAt: dateStr,
                paymentCompletedBy: actor,
              }
            : b
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-payment-${Date.now()}`,
          title: `✅ تم إكمال الدفع - ${bk.propertyName}`,
          description: `أكمل العميل ${bk.customerName} سداد المبلغ المتبقي (${bk.remainingAmount} ريال) لحجز ${bk.bookingNumber} بإيصال بنكي مرفق (${receiptName}) - سجّله ${actor}.`,
          timestamp: 'الآن',
          read: false,
          type: 'booking',
          targetAudience: 'admin_only',
          linkToBookingId: bk.id,
        },
        ...prev,
      ]);

      logActivity(
        actor,
        userRole,
        'إكمال دفع حجز بإيصال بنكي',
        `تم إكمال دفع حجز ${bk.bookingNumber} للعميل ${bk.customerName} وإرفاق الإيصال: ${receiptName}.`
      );
    },
    [bookings, isAdmin, isGuard, guard.name, currentMarketer?.name, userRole, logActivity]
  );

  const markNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const getEligibleCommissionBookings = useCallback(
    (marketerId: string, fromDate: string, toDate: string): Booking[] => {
      const pendingReqBookingIds = new Set(
        commissionRequests.filter((r) => r.status === 'pending').flatMap((r) => r.bookingIds)
      );

      return bookings.filter(
        (b) =>
          b.marketerId === marketerId &&
          (b.status === 'confirmed' || b.status === 'completed') &&
          b.commissionStatus !== 'paid' &&
          !pendingReqBookingIds.has(b.id) &&
          b.checkInDate >= fromDate &&
          b.checkInDate <= toDate
      );
    },
    [bookings, commissionRequests]
  );

  const createCommissionRequest = useCallback(
    ({ fromDate, toDate }: { fromDate: string; toDate: string }) => {
      const targetMarketer = marketers.find((m) => m.id === currentMarketerId);
      if (!targetMarketer) {
        return { ok: false, message: 'لم يتم العثور على حساب الموظف' };
      }
      if (!fromDate || !toDate || fromDate > toDate) {
        return { ok: false, message: 'اختر فترة زمنية صحيحة (تاريخ البداية قبل النهاية)' };
      }

      const eligible = getEligibleCommissionBookings(targetMarketer.id, fromDate, toDate);
      if (eligible.length === 0) {
        return { ok: false, message: 'لا توجد حجوزات مؤكدة مستحقة العمولة في هذه الفترة' };
      }

      const totalComm = eligible.reduce((sum, b) => sum + (b.marketerCommission || 0), 0);
      const newReq: CommissionRequest = {
        id: `creq-${Date.now()}`,
        marketerId: targetMarketer.id,
        marketerName: targetMarketer.name,
        fromDate,
        toDate,
        bookingIds: eligible.map((b) => b.id),
        amount: totalComm,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      };

      setCommissionRequests((prev) => [newReq, ...prev]);

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `طلب صرف عمولة جديد - ${targetMarketer.name}`,
          description: `طلب الموظف ${targetMarketer.name} صرف عمولة ${totalComm} ريال عن ${eligible.length} حجز للفترة من ${fromDate} إلى ${toDate}. بانتظار التدقيق.`,
          timestamp: 'الآن',
          read: false,
          type: 'commission',
          targetAudience: 'admin_only',
        },
        ...prev,
      ]);

      return {
        ok: true,
        message: `تم إرسال طلب العمولة (${totalComm} ريال) للإدارة للتدقيق`,
      };
    },
    [marketers, currentMarketerId, getEligibleCommissionBookings]
  );

  const markCommissionTransferred = useCallback(
    (requestId: string, receiptFileName?: string, receiptDataUrl?: string) => {
      const req = commissionRequests.find((r) => r.id === requestId);
      if (!req) return;

      setCommissionRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'transferred',
                processedAt: new Date().toISOString().split('T')[0],
                receiptFileName,
                receiptDataUrl,
                seenByMarketer: false,
              }
            : r
        )
      );

      // Mark associated bookings as paid
      setBookings((prev) =>
        prev.map((b) =>
          req.bookingIds.includes(b.id) ? { ...b, commissionStatus: 'paid' } : b
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'تم تحويل عمولتك',
          description: `حوّلت الإدارة عمولتك (${req.amount} ريال) للفترة من ${req.fromDate} إلى ${req.toDate}. يمكنك الاطلاع على إيصال التحويل البنكي من صفحة المزيد.`,
          timestamp: 'الآن',
          read: false,
          type: 'commission',
          targetAudience: 'marketer',
          targetMarketerId: req.marketerId,
        },
        ...prev,
      ]);
    },
    [commissionRequests]
  );

  const rejectCommissionRequest = useCallback(
    (requestId: string, note?: string) => {
      const req = commissionRequests.find((r) => r.id === requestId);
      if (!req) return;

      setCommissionRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'rejected',
                processedAt: new Date().toISOString().split('T')[0],
                adminNote: note || '',
                seenByMarketer: false,
              }
            : r
        )
      );

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'تم رفض طلب العمولة',
          description: `تم رفض طلب العمولة للفترة من ${req.fromDate} إلى ${req.toDate}.${note ? ' السبب: ' + note : ''}`,
          timestamp: 'الآن',
          read: false,
          type: 'commission',
          targetAudience: 'marketer',
          targetMarketerId: req.marketerId,
        },
        ...prev,
      ]);
    },
    [commissionRequests]
  );

  const markCommissionRequestSeen = useCallback((requestId: string) => {
    setCommissionRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, seenByMarketer: true } : r))
    );
  }, []);

  const updateMessageTemplates = useCallback((templates: Partial<MessageTemplates>) => {
    setMessageTemplates((prev) => ({ ...prev, ...templates }));
  }, []);

  const resetMessageTemplates = useCallback(() => {
    setMessageTemplates(INITIAL_TEMPLATES);
  }, []);

  const openTemplatesModal = useCallback((tab?: keyof MessageTemplates) => {
    if (tab) setActiveTemplateTab(tab);
    setTemplatesModalOpen(true);
  }, []);

  const resetAllData = useCallback(() => {
    StorageService.clear();
    setProperties(INITIAL_PROPERTIES);
    setMarketers(INITIAL_MARKETERS);
    setGuard(INITIAL_GUARD);
    setBookings(INITIAL_BOOKINGS);
    setDateOverrides({});
    setActivityLogs(INITIAL_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setMessageTemplates(INITIAL_TEMPLATES);
    setUserRole('admin');
    setCurrentMarketerId('m1');
    setSelectedPropertyId('al-taraf');
    setActiveTab('calendar');
  }, []);

  const requestBrowserNotificationPermissionHandler = useCallback(async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserNotificationPermission(res);
    if (res === 'granted') {
      triggerBrowserNotification(
        '🔔 تم تفعيل إشعارات المتصفح بنجاح!',
        'ستصلك تنبيهات فورية عند وصول أي حجز جديد أو تأكيد دفع عربون لتنبيه الموظفين والمسوقين فوراً.',
        'deposit_confirmed'
      );
    }
    return res;
  }, [triggerBrowserNotification]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        userRole,
        currentMarketerId,
        currentMarketer,
        guard,
        isAdmin,
        isGuard,
        activePermissions,
        switchUser,
        updateGuardProfile,
        userAccounts,
        currentUserAccount,
        loginWithGmailAndPassword,
        loginWithGoogleQuick,
        changePassword,
        updateUserAccount,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,

        canCreateContract,
        canEditDeposit,
        canViewCalendar,
        canViewProperties,
        canViewDashboard,
        canViewMarketers,
        canManageTemplates,
        canViewRentalContract,
        canViewActivityLogs,

        grantAllMarketersContractAndDepositPermissions,
        updateWaitingDepositAmount,

        properties,
        selectedPropertyId,
        selectedProperty,
        setSelectedPropertyId,
        updateProperty,
        updatePropertySection,
        togglePropertyPublished,

        marketers,
        updateMarketerPermissions,
        updateMarketerProfile,
        addMarketer,
        addAdminAccount,
        setMarketerAccountRole,
        payMarketerCommission,
        payoutAllMarketerCommissions,

        bookings,
        filteredBookings,
        todayArrivals,
        todayDepartures,
        addBooking,
        updateBookingStatus,
        cancelBooking,
        sendCheckoutReminder,
        sendPaymentCompletionRequest,
        markCheckedOut,
        guardMarkArrived,
        guardReceiveInsurance,
        guardRequestInsuranceReturn,
        returnInsuranceDeposit,
        completeBookingPayment,

        dateOverrides,
        setDateOverride,
        setDateOverridesBulk,
        applySeasonalPricingPattern,

        requestDeposit,
        cancelDepositWait,
        confirmBookingWithReceipt,

        notifications,
        filteredNotifications,
        unreadNotificationsCount,
        markNotificationsAsRead,

        commissionRequests,
        getEligibleCommissionBookings,
        createCommissionRequest,
        markCommissionTransferred,
        rejectCommissionRequest,
        markCommissionRequestSeen,

        activityLogs,
        logActivity,

        bookingModalOpen,
        setBookingModalOpen,
        preselectedDateForBooking,
        setPreselectedDateForBooking,
        preselectedSectionForBooking,
        setPreselectedSectionForBooking,

        messageTemplates,
        updateMessageTemplates,
        resetMessageTemplates,
        templatesModalOpen,
        setTemplatesModalOpen,
        activeTemplateTab,
        openTemplatesModal,

        resetAllData,
        nowTimestamp,

        browserNotificationPermission,
        requestBrowserNotificationPermission: requestBrowserNotificationPermissionHandler,
        isSoundEnabled,
        toggleSound,
        activeToast,
        dismissToast,
        triggerBrowserNotification,
        sendTestNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
