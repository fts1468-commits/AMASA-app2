import { getAccessToken } from './googleAuth';
import { Booking, Property, Marketer } from '../types';

export const CONNECTED_SHEET_KEY = 'amasa_appsheet_spreadsheet_id';
export const CONNECTED_SHEET_NAME_KEY = 'amasa_appsheet_spreadsheet_name';
export const AUTO_SYNC_KEY = 'amasa_appsheet_auto_sync';

export interface AppSheetSyncStatus {
  connected: boolean;
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

/**
 * Get the saved connected spreadsheet info from local storage
 */
export const getSavedSpreadsheetInfo = (): AppSheetSyncStatus => {
  const spreadsheetId = localStorage.getItem(CONNECTED_SHEET_KEY);
  const spreadsheetName = localStorage.getItem(CONNECTED_SHEET_NAME_KEY) || 'نموذج بيانات AMASA و AppSheet';
  const autoSync = localStorage.getItem(AUTO_SYNC_KEY) === 'true';
  const lastSyncedAt = localStorage.getItem('amasa_appsheet_last_sync');

  return {
    connected: Boolean(spreadsheetId),
    spreadsheetId,
    spreadsheetName: spreadsheetId ? spreadsheetName : null,
    spreadsheetUrl: spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : null,
    lastSyncedAt,
    autoSync,
  };
};

/**
 * Save connected spreadsheet info
 */
export const saveSpreadsheetInfo = (id: string, name?: string) => {
  localStorage.setItem(CONNECTED_SHEET_KEY, id);
  if (name) localStorage.setItem(CONNECTED_SHEET_NAME_KEY, name);
  localStorage.setItem('amasa_appsheet_last_sync', new Date().toISOString());
};

/**
 * Disconnect sheet
 */
export const disconnectSpreadsheet = () => {
  localStorage.removeItem(CONNECTED_SHEET_KEY);
  localStorage.removeItem(CONNECTED_SHEET_NAME_KEY);
  localStorage.removeItem('amasa_appsheet_last_sync');
};

/**
 * Set auto-sync preference
 */
export const setAutoSyncPreference = (enabled: boolean) => {
  localStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
};

/**
 * Translate Booking Status to readable Arabic for AppSheet
 */
const formatBookingStatus = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'مؤكد ومكتمل';
    case 'waiting_deposit':
      return 'في انتظار العربون';
    case 'pending_payment':
      return 'بانتظار سداد المتبقي';
    case 'completed':
      return 'منتهي ومغادر';
    case 'cancelled':
      return 'ملغي';
    default:
      return 'قيد المعالجة';
  }
};

/**
 * Create a new structured Google Spreadsheet in the user's Google Drive
 * fully prepared for Google AppSheet
 */
export const createAppSheetSpreadsheet = async (
  title: string = 'AMASA - نموذج الحجوزات و Google AppSheet'
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  appSheetUrl: string;
}> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحساب Google أولاً عبر زر الربط.');
  }

  // 1. Create Spreadsheet with customized tabs
  const createPayload = {
    properties: {
      title,
      locale: 'ar_SA',
      autoRecalc: 'ON_CHANGE',
    },
    sheets: [
      {
        properties: {
          title: 'الحجوزات',
          gridProperties: { rowCount: 1000, columnCount: 26, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'حركات_الدخول_والخروج',
          gridProperties: { rowCount: 500, columnCount: 15, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'العقارات_والوحدات',
          gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'المسوقين_والعمولات',
          gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل إنشاء جدول البيانات في Google Drive');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Define Headers
  const bookingsHeaders = [
    'رقم_الحجز',
    'اسم_العميل',
    'رقم_الجوال',
    'الهوية_الوطنية',
    'العقار',
    'القسم',
    'تاريخ_الدخول',
    'تاريخ_الخروج',
    'عدد_الليالي',
    'سعر_الليلة',
    'إجمالي_المبلغ',
    'العربون_المدفوع',
    'المتبقي',
    'التأمين',
    'المسوق',
    'نسبة_العمولة',
    'عمولة_المسوق',
    'حالة_الحجز',
    'حالة_العمولة',
    'وصول_النزيل',
    'مغادرة_النزيل',
    'تاريخ_التسجيل',
    'ملاحظات',
    'ID_النظام',
  ];

  const movementsHeaders = [
    'تاريخ_الحركة',
    'رقم_الحجز',
    'اسم_النزيل',
    'رقم_الجوال',
    'العقار',
    'القسم',
    'تاريخ_الدخول',
    'تاريخ_الخروج',
    'وصول_النزيل',
    'وقت_الوصول',
    'استلام_التأمين_نقداً',
    'مغادرة_النزيل',
    'وقت_المغادرة',
    'إرجاع_التأمين',
    'ملاحظات',
  ];

  const propertiesHeaders = [
    'كود_العقار',
    'اسم_العقار',
    'الموقع',
    'سعر_وسط_الأسبوع',
    'سعر_نهاية_الأسبوع',
    'عدد_الوحدات',
    'السعة',
    'الغرف',
    'الحمامات',
    'المساحة_م2',
    'حساب_الآيبان',
  ];

  const marketersHeaders = [
    'كود_المسوق',
    'اسم_المسوق',
    'رقم_الجوال',
    'البريد_الإلكتروني',
    'نسبة_العمولة_المعتمدة',
    'رقم_الحساب_البنكي',
    'اسم_البنك',
    'حالة_العقد',
  ];

  // Set initial headers for all sheets
  const headerData = [
    { range: 'الحجوزات!A1:X1', values: [bookingsHeaders] },
    { range: 'حركات_الدخول_والخروج!A1:O1', values: [movementsHeaders] },
    { range: 'العقارات_والوحدات!A1:K1', values: [propertiesHeaders] },
    { range: 'المسوقين_والعمولات!A1:H1', values: [marketersHeaders] },
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headerData,
      }),
    }
  );

  saveSpreadsheetInfo(spreadsheetId, title);

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  // AppSheet creation URL with table pre-configured
  const appSheetUrl = `https://www.appsheet.com/Template/App/new?source=sheets`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    appSheetUrl,
  };
};

/**
 * Format a Booking object into row values
 */
export const bookingToRowValues = (booking: Booking): any[] => {
  return [
    booking.bookingNumber || '',
    booking.customerName || '',
    booking.customerPhone || '',
    booking.customerNationalId || '',
    booking.propertyName || '',
    booking.sectionName || '',
    booking.checkInDate || '',
    booking.checkOutDate || '',
    booking.nightsCount || 1,
    booking.nightlyPrice || 0,
    booking.totalPrice || 0,
    booking.depositPaid || 0,
    booking.remainingAmount || 0,
    booking.insuranceAmount || 0,
    booking.marketerName || 'الإدارة',
    `${booking.commissionRatePercent || 5}%`,
    booking.marketerCommission || 0,
    formatBookingStatus(booking.status),
    booking.commissionStatus === 'paid' ? 'تم الصرف' : 'معلقة',
    booking.guestArrived ? 'تم الوصول' : 'لم يصل',
    booking.checkedOut ? 'تمت المغادرة' : 'مقيم حالياً',
    booking.createdAt || '',
    booking.notes || '',
    booking.id || '',
  ];
};

/**
 * Sync all current app data (Bookings, Properties, Marketers) to the Google Sheet
 */
export const syncAllDataToSheet = async (
  spreadsheetId: string,
  bookings: Booking[],
  properties: Property[],
  marketers: Marketer[]
): Promise<{ count: number }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحساب Google أولاً.');
  }

  // 1. Prepare bookings rows
  const bookingsRows = bookings.map(bookingToRowValues);

  // 2. Prepare movements rows (checkin/out movements)
  const movementsRows = bookings.map((b) => [
    new Date().toISOString().split('T')[0],
    b.bookingNumber,
    b.customerName,
    b.customerPhone,
    b.propertyName,
    b.sectionName || '',
    b.checkInDate,
    b.checkOutDate,
    b.guestArrived ? 'نعم' : 'لا',
    b.guestArrivedAt || '',
    b.insuranceReceivedCash ? 'مستلم نقداً' : 'لم يستلم',
    b.checkedOut ? 'نعم' : 'لا',
    b.checkedOutAt || '',
    b.insuranceReturned ? 'تم الإرجاع' : 'لم يتم',
    b.notes || '',
  ]);

  // 3. Prepare properties rows
  const propertiesRows = properties.map((p) => [
    p.code,
    p.name,
    p.location,
    p.basePriceWeekday,
    p.basePriceWeekend,
    p.subUnitsCount,
    p.capacity,
    p.bedrooms,
    p.bathrooms,
    p.areaM2,
    p.iban,
  ]);

  // 4. Prepare marketers rows
  const marketersRows = marketers.map((m) => [
    m.code,
    m.name,
    m.phone,
    m.email,
    `${m.commissionRate || 5}%`,
    m.bankAccount,
    m.bankName,
    m.contract?.isSigned ? 'عقد موقع وساري' : 'بانتظار التوقيع',
  ]);

  // Clear existing rows (from row 2 down) and write fresh data
  const updatePayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `الحجوزات!A2:X${Math.max(2, bookingsRows.length + 1)}`,
        values: bookingsRows.length > 0 ? bookingsRows : [['']],
      },
      {
        range: `حركات_الدخول_والخروج!A2:O${Math.max(2, movementsRows.length + 1)}`,
        values: movementsRows.length > 0 ? movementsRows : [['']],
      },
      {
        range: `العقارات_والوحدات!A2:K${Math.max(2, propertiesRows.length + 1)}`,
        values: propertiesRows.length > 0 ? propertiesRows : [['']],
      },
      {
        range: `المسوقين_والعمولات!A2:H${Math.max(2, marketersRows.length + 1)}`,
        values: marketersRows.length > 0 ? marketersRows : [['']],
      },
    ],
  };

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل تحديث البيانات في Google Sheet');
  }

  localStorage.setItem('amasa_appsheet_last_sync', new Date().toISOString());
  return { count: bookings.length };
};

/**
 * Append or update a single booking row to the connected Google Sheet in real time
 */
export const appendBookingToSheet = async (
  spreadsheetId: string,
  booking: Booking
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) return;

  const rowValues = bookingToRowValues(booking);

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/الحجوزات!A:X:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  localStorage.setItem('amasa_appsheet_last_sync', new Date().toISOString());
};

/**
 * Read bookings list from the Google Sheet
 */
export const fetchBookingsFromSheet = async (
  spreadsheetId: string
): Promise<any[]> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('يرجى تسجيل الدخول بحساب Google أولاً.');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/الحجوزات!A2:X`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'فشل قراءة البيانات من Google Sheet');
  }

  const data = await res.json();
  return data.values || [];
};
