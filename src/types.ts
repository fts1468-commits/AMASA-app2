export type UserRole = 'admin' | 'marketer' | 'guard';

export interface PropertySection {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  poolType: string;
  features: string[];
  images: string[];
  coverImage?: string;
  isAvailable?: boolean;
}

export interface SeasonalPricing {
  weekday: number;
  weekend: number;
  summer: number;
  eid: number;
  vacation: number;
}

export interface Property {
  id: string;
  name: string;
  code: string;
  subUnitsCount: number;
  subtitle: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isPublished: boolean;
  basePriceWeekday: number;
  basePriceWeekend: number;
  seasonalPricing: SeasonalPricing;
  sections?: PropertySection[];
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  poolType: string;
  coverImage: string;
  images: string[];
  features: string[];
  contractTerms: string[];
  iban: string;
  bankName: string;
  accountHolder: string;
  defaultDeposit: number;
  insuranceAmount: number;
  checkInTimeText: string;
  checkOutTimeText: string;
}

export interface MarketerPermissions {
  canCreateBooking: boolean;
  canEditPrices?: boolean;
  canViewAllBookings?: boolean;
  canBlockDates?: boolean;
  canViewCustomerContacts?: boolean;
  canExportReports?: boolean;
  canViewFinancials?: boolean;
  canCreateContract: boolean;
  canEditDeposit: boolean;
  canViewCalendar: boolean;
  canViewProperties: boolean;
  canViewDashboard: boolean;
  canViewMarketers: boolean;
  canManageTemplates: boolean;
  canViewRentalContract: boolean;
  canViewActivityLogs: boolean;
}

export interface MarketerContract {
  contractNumber: string;
  contractDate: string;
  expiryDate: string;
  commissionRatePercent: number;
  status: string;
  firstParty: string;
  firstPartyRepresentative: string;
  secondParty: string;
  secondPartyPhone: string;
  secondPartyEmail: string;
  secondPartyNationalId?: string;
  terms: string[];
  isSigned: boolean;
  signedDate: string;
  notes?: string;
}

export interface Marketer {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  avatar: string;
  code: string;
  commissionRate: number;
  joinDate: string;
  bankAccount: string;
  bankName: string;
  nationalId: string;
  contract: MarketerContract;
  permissions: MarketerPermissions;
}

export interface Guard {
  id: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  avatar: string;
  jobTitle?: string;
  nationalId?: string;
  startDate?: string;
  iban?: string;
  salary?: number;
}

export interface UserAccount {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  marketerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BookingStatus = 'pending' | 'waiting_deposit' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
export type CommissionStatus = 'pending' | 'ready_for_payout' | 'paid';

export interface BookingService {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  propertyId: string;
  propertyName: string;
  sectionId?: string;
  sectionName?: string;
  customerName: string;
  customerPhone: string;
  customerNationalId?: string;
  checkInDate: string;
  checkOutDate: string;
  nightsCount: number;
  nightlyPrice: number;
  totalPrice: number;
  taxAmount: number;
  discount: number;
  extraServices?: BookingService[];
  extraServicesTotal?: number;
  discountReason?: string;
  discountStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  discountRequestedAmount?: number;
  calendarPrice?: number;
  clientTotal?: number;
  depositPaid: number;
  remainingAmount: number;
  insuranceAmount: number;
  depositReceiptUrl?: string;
  marketerId?: string;
  marketerName?: string;
  marketerCommission: number;
  commissionRatePercent?: number;
  bookingType?: 'full' | 'partial';
  commissionStatus: CommissionStatus;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
  contractSigned: boolean;
  contractMessage?: string;
  checkedOut?: boolean;
  checkedOutAt?: string;
  insuranceReturned?: boolean;
  insuranceReturnedAt?: string;
  guestArrived?: boolean;
  guestArrivedAt?: string;
  insuranceReceivedCash?: boolean;
  insuranceReceivedAt?: string;
  insuranceReturnRequested?: boolean;
  paymentCompleted?: boolean;
  paymentReceiptName?: string;
  paymentReceiptDataUrl?: string;
  paymentCompletedAt?: string;
  paymentCompletedBy?: string;
}

export interface DateOverride {
  status?: 'available' | 'booked' | 'blocked' | 'waiting_deposit';
  price?: number;
  season?: string;
  seasonPeriod?: 'auto' | 'weekday' | 'weekend' | 'extended_holiday' | 'eid_summer';
  note?: string;
  adminFeePercent?: number;
  adminFeeAmount?: number;
  marketerCommissionPercent?: number;
  marketerCommissionAmount?: number;
  unitNetPrice?: number;
  umSeifCommission?: number;
  bookingId?: string;
  waitingDepositExpiresAt?: number;
  waitingCustomerName?: string;
  waitingCustomerPhone?: string;
  waitingDepositAmount?: number;
  waitingMarketerName?: string;
  waitingMarketerId?: string;
  waitingCommissionRate?: number;
}

export interface CommissionRequest {
  id: string;
  marketerId: string;
  marketerName: string;
  fromDate: string;
  toDate: string;
  bookingIds: string[];
  amount: number;
  status: 'pending' | 'transferred' | 'rejected';
  createdAt: string;
  processedAt?: string;
  receiptFileName?: string;
  receiptDataUrl?: string;
  adminNote?: string;
  seenByMarketer?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'booking' | 'deposit_request' | 'deposit_confirmed' | 'deposit_expired' | 'commission' | 'permission' | 'checkout' | 'insurance' | 'system';
  targetAudience?: 'all' | 'admin_only' | 'admin_and_guard' | 'marketer' | 'marketers';
  targetMarketerId?: string;
  linkToBookingId?: string;
}

export interface MessageTemplates {
  depositRequest: string;
  bookingConfirmation: string;
  paymentCompletion: string;
  contract: string;
  checkoutReminder: string;
  quickResponses?: Record<string, string>;
}

export interface ToastData {
  id: string;
  title: string;
  body: string;
  type: 'booking' | 'deposit_confirmed' | 'deposit_request' | 'commission' | 'permission' | 'checkout' | 'insurance' | 'system';
}

export interface OperatingSettings {
  adminFees: {
    weekday: number; // وسط الأسبوع
    weekend: number; // الويكند
    extendedHoliday: number; // الإجازات المطولة
    eidSummer: number; // الأعياد والإجازة الصيفية
  };
  weekendDays: number[]; // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
  adminFeeRecipient: string; // 'ام سيف'
  adminFeeRecipientId?: string; // 'm-um-seif'
  marketerCommissions: {
    partial: number; // جزئي بدون متابعة (5%)
    full: number; // كامل مع متابعة (7%)
  };
  achievementBonus: {
    enabled: boolean; // تفعيل استحقاق مكافأة الإنجاز
    monthlyTarget: number; // الهدف الشهري من الحجوزات (15)
    bonusRate: number; // نسبة المكافأة % (10%)
    calculationBase: 'commissions' | 'bookings_total'; // أساس احتساب المكافأة: مجموع عمولات المسوقة
  };
}

export const DEFAULT_OPERATING_SETTINGS: OperatingSettings = {
  adminFees: {
    weekday: 50,
    weekend: 100,
    extendedHoliday: 150,
    eidSummer: 200,
  },
  weekendDays: [4, 5], // Thursday (4) & Friday (5) as in screenshot
  adminFeeRecipient: 'ام سيف',
  adminFeeRecipientId: 'm-um-seif',
  marketerCommissions: {
    partial: 5,
    full: 7,
  },
  achievementBonus: {
    enabled: false,
    monthlyTarget: 15,
    bonusRate: 10,
    calculationBase: 'commissions',
  },
};
