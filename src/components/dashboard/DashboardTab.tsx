import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  Users,
  Eye,
  MessageCircle,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  DollarSign,
  Calendar,
  X,
  Play,
  ArrowRight,
  TrendingUp,
  Clock,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';

interface GuardActionModalData {
  kind: 'arrive' | 'insrecv' | 'exit' | 'insret';
  booking: Booking;
}

export const DashboardTab: React.FC = () => {
  const {
    properties,
    bookings,
    filteredBookings,
    todayArrivals,
    todayDepartures,
    sendCheckoutReminder,
    markCheckedOut,
    returnInsuranceDeposit,
    guardMarkArrived,
    guardReceiveInsurance,
    guardRequestInsuranceReturn,
    setBookingModalOpen,
    setSelectedPropertyId,
    setActiveTab,
    updateBookingStatus,
    isAdmin,
    isGuard,
    currentMarketerId,
    completeBookingPayment,
    sendPaymentCompletionRequest,
  } = useApp();

  const [guardConfirm, setGuardConfirm] = useState<GuardActionModalData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [detailsTitle, setDetailsTitle] = useState('تفاصيل الحجز');

  // Complete payment modal state
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<{ name: string; dataUrl?: string } | null>(null);
  const [paymentFileError, setPaymentFileError] = useState<string | null>(null);

  // Insurance confirmation modal
  const [insuranceConfirmBooking, setInsuranceConfirmBooking] = useState<Booking | null>(null);

  // Receipt view modal
  const [viewReceiptBooking, setViewReceiptBooking] = useState<Booking | null>(null);

  // Filter & search
  const [activeFilter, setActiveFilter] = useState<'all' | 'arrivals' | 'departures' | 'waitingDeposit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAvailableProps, setShowAvailableProps] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Available today properties
  const availableTodayProperties = useMemo(() => {
    return properties.filter((prop) => {
      if (!prop.isPublished) return false;
      const isBooked = bookings.some(
        (b) =>
          b.propertyId === prop.id &&
          b.status !== 'cancelled' &&
          todayStr >= b.checkInDate &&
          todayStr < b.checkOutDate
      );
      return !isBooked;
    });
  }, [properties, bookings, todayStr]);

  const activeBookings = useMemo(() => {
    return filteredBookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'pending_payment' || b.status === 'waiting_deposit'
    );
  }, [filteredBookings]);

  // Marketer sees today's arrivals for their bookings only, Admin & Guard see all
  const visibleArrivals = useMemo(() => {
    if (isAdmin || isGuard) return todayArrivals;
    return todayArrivals.filter((b) => b.marketerId === currentMarketerId);
  }, [todayArrivals, isAdmin, isGuard, currentMarketerId]);

  const matchesSearch = (b: Booking) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      b.customerName.toLowerCase().includes(term) ||
      b.customerPhone.includes(term) ||
      b.propertyName.toLowerCase().includes(term) ||
      (b.marketerName && b.marketerName.toLowerCase().includes(term))
    );
  };

  const searchFilteredArrivals = useMemo(() => visibleArrivals.filter(matchesSearch), [visibleArrivals, searchTerm]);
  const searchFilteredDepartures = useMemo(() => todayDepartures.filter(matchesSearch), [todayDepartures, searchTerm]);
  const searchFilteredActive = useMemo(() => activeBookings.filter(matchesSearch), [activeBookings, searchTerm]);
  const waitingDepositBookings = useMemo(
    () => bookings.filter((b) => b.status === 'waiting_deposit').filter(matchesSearch),
    [bookings, searchTerm]
  );
  const completedBookingsCount = useMemo(
    () => bookings.filter((b) => b.status === 'completed').length,
    [bookings]
  );

  const handleCheckoutReminder = (bookingId: string) => {
    const { whatsappUrl } = sendCheckoutReminder(bookingId);
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
    showToast('تم فتح واتساب مع نص تذكير الخروج للعميل بنجاح');
  };

  const handlePaymentReminder = (bookingId: string) => {
    const { whatsappUrl } = sendPaymentCompletionRequest(bookingId);
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    }
    showToast('تم فتح واتساب مع نص تذكير الدفع للعميل');
  };

  const openPaymentModal = (b: Booking) => {
    setPaymentModalBooking(b);
    setPaymentReceiptFile(null);
    setPaymentFileError(null);
  };

  const handleReceiptFileChange = (file?: File) => {
    setPaymentFileError(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setPaymentFileError('حجم الملف كبير، يرجى اختيار ملف أقل من 2 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentReceiptFile({ name: file.name, dataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const submitPaymentCompletion = () => {
    if (!paymentModalBooking || !paymentReceiptFile) return;
    completeBookingPayment(paymentModalBooking.id, paymentReceiptFile.name, paymentReceiptFile.dataUrl);
    setPaymentModalBooking(null);
    setPaymentReceiptFile(null);
    showToast('تم حفظ الإيصال وتسجيل إكمال الدفع بنجاح');
  };

  const confirmInsuranceHandover = () => {
    if (insuranceConfirmBooking) {
      returnInsuranceDeposit(insuranceConfirmBooking.id);
      setInsuranceConfirmBooking(null);
      showToast('تم تسجيل تسليم التأمين للعميل بنجاح');
    }
  };

  const getWhatsAppDirectUrl = (phone: string, name: string, prop: string, type: 'arrival' | 'departure') => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '966' + clean.substring(1);
    else if (!clean.startsWith('966')) clean = '966' + clean;

    const text =
      type === 'arrival'
        ? `أهلاً بك أخي الكريم ${name}، يسعدنا استقبالكم اليوم في ${prop} الساعة 5 م. ونتمنى لكم إقامة ممتعة وسعيدة. لأي استفسار نحن بخدمتكم دائماً.`
        : `أهلاً بك أخي الكريم ${name}، نأمل أن تكونوا قضيتم أوقاتاً ممتعة في ${prop}. نود تذكيركم بموعد المغادرة الساعة 2 م، وسيتم تسليم مبلغ التأمين عند الخروج. شكراً لكم.`;

    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="pb-28 max-w-5xl mx-auto px-3 sm:px-4 pt-3 space-y-4">
      {/* Guard Confirmation Modal - تنبيه تأكيد الإرسال لتجنب الخطأ بالضغط */}
      {guardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Tajawal',sans-serif]" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 w-full max-w-md p-5 sm:p-6 space-y-4 text-right animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs ${
                  guardConfirm.kind === 'arrive'
                    ? 'bg-sky-600'
                    : guardConfirm.kind === 'insrecv'
                    ? 'bg-amber-600'
                    : guardConfirm.kind === 'exit'
                    ? 'bg-rose-600'
                    : 'bg-emerald-600'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    تنبيه تأكيد الإرسال
                  </h3>
                  <span className="text-[11px] text-purple-700 font-bold block">
                    {guardConfirm.kind === 'arrive'
                      ? 'إجراء: وصول العميل'
                      : guardConfirm.kind === 'insrecv'
                      ? 'إجراء: استلام التأمين كاش'
                      : guardConfirm.kind === 'exit'
                      ? 'إجراء: خروج العميل'
                      : 'إجراء: إعادة التأمين كاش'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setGuardConfirm(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Note - لتجنب الخطأ بالضغط */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-950 leading-relaxed font-semibold">
                تنبيه لتجنب الخطأ بالضغط: هل أنت متأكد من رغبتك في إرسال هذا التنبيه للإدارة والموظف المسؤول؟
              </p>
            </div>

            {/* Target Booking Info Card */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500 font-medium">اسم العميل:</span>
                <span className="font-bold text-slate-900">{guardConfirm.booking.customerName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500 font-medium">العقار / الشاليه:</span>
                <span className="font-bold text-purple-900">{guardConfirm.booking.propertyName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-500 font-medium">رقم الجوال:</span>
                <span className="font-mono font-bold text-slate-800">{guardConfirm.booking.customerPhone}</span>
              </div>
              {(guardConfirm.kind === 'insrecv' || guardConfirm.kind === 'insret') && (
                <div className="flex items-center justify-between text-slate-700 pt-1.5 border-t border-slate-200/70">
                  <span className="text-slate-500 font-medium">مبلغ التأمين:</span>
                  <span className="font-mono font-bold text-amber-800">{guardConfirm.booking.insuranceAmount} ريال</span>
                </div>
              )}
            </div>

            {/* Explanation Message */}
            <p className="text-xs text-slate-600 leading-relaxed px-1">
              {guardConfirm.kind === 'arrive'
                ? `سيتم إرسال إشعار فوري للإدارة والموظف المسؤول بأن العميل (${guardConfirm.booking.customerName}) وصل لاستلام الاستراحة.`
                : guardConfirm.kind === 'insrecv'
                ? `سيتم إرسال إشعار فوري للإدارة والموظف المسؤول باستلامك مبلغ التأمين (${guardConfirm.booking.insuranceAmount} ريال) كاش.`
                : guardConfirm.kind === 'exit'
                ? `سيتم تسجيل خروج العميل (${guardConfirm.booking.customerName}) وإرسال إشعار للإدارة والموظف بأن العقار جاهز للمعاينة.`
                : `سيتم إرسال إشعار فوري للإدارة والموظف بتأكيد تسليم وإعادة مبلغ التأمين (${guardConfirm.booking.insuranceAmount} ريال) كاش للعميل.`}
            </p>

            {/* Action Buttons: إرسال and إلغاء */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  const { kind, booking: bk } = guardConfirm;
                  if (kind === 'arrive') {
                    guardMarkArrived(bk.id);
                    showToast('تم إرسال تنبيه وصول العميل للموظف والإدارة بنجاح ✓');
                  } else if (kind === 'insrecv') {
                    guardReceiveInsurance(bk.id);
                    showToast('تم إرسال تنبيه استلام التأمين كاش للموظف والإدارة بنجاح ✓');
                  } else if (kind === 'exit') {
                    markCheckedOut(bk.id);
                    guardRequestInsuranceReturn(bk.id);
                    showToast('تم إرسال تنبيه خروج العميل وجاهزية التأمين بنجاح ✓');
                  } else {
                    returnInsuranceDeposit(bk.id);
                    showToast('تم إرسال تنبيه إعادة التأمين كاش للعميل بنجاح ✓');
                  }
                  setGuardConfirm(null);
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-md flex items-center justify-center gap-2 btn-beam-shine transition-all"
              >
                <Send className="w-4 h-4" />
                <span>إرسال</span>
              </button>
              <button
                onClick={() => setGuardConfirm(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white p-3 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white hover:opacity-80 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="bg-transparent flex items-center justify-between pt-1 px-1">
        <div className="flex items-center gap-2">
          {!isGuard && (
            <button
              onClick={() => setBookingModalOpen(true)}
              className="btn-mauve-shiny font-bold py-2.5 px-4 rounded-2xl shadow-md flex items-center gap-1.5 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-200" />
              <span className="leading-none">حجز جديد</span>
            </button>
          )}

          <button
            onClick={() => showToast('تم تحديث البيانات الحية لكافة الاستراحات بنجاح')}
            className="w-10 h-10 rounded-2xl bg-white border border-purple-100/90 shadow-xs flex items-center justify-center text-slate-700 hover:text-purple-700 hover:bg-purple-50 transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-right">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-end gap-2">
            <span>{isGuard ? 'دخول وخروج اليوم' : 'لوحة التحكم المركزية'}</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium -mt-0.5">
            {isGuard
              ? 'متابعة وتأكيد وصول وخروج النزلاء واستلام وإعادة التأمين'
              : 'متابعة فورية وسريعة لكل عميل في صف واحد أفقي'}
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Today Arrivals */}
        <div
          onClick={() => setActiveFilter('arrivals')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'arrivals' ? 'border-sky-500 ring-2 ring-sky-200 bg-sky-50/20' : 'border-purple-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-sky-700">
            <span>دخول اليوم</span>
            <span className="w-2 h-2 rounded-full bg-sky-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">{visibleArrivals.length}</span>
            <span className="text-xs text-slate-400">نزيل</span>
          </div>
        </div>

        {/* Card 2: Today Departures */}
        <div
          onClick={() => setActiveFilter('departures')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'departures' ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20' : 'border-purple-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-700">
            <span>خروج اليوم</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">{todayDepartures.length}</span>
            <span className="text-xs text-slate-400">نزيل</span>
          </div>
        </div>

        {/* Card 3: Awaiting Deposit */}
        <div
          onClick={() => setActiveFilter('waitingDeposit')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'waitingDeposit' ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/20' : 'border-purple-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>بانتظار العربون</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-900">{waitingDepositBookings.length}</span>
            <span className="text-xs text-slate-400">معلق</span>
          </div>
        </div>

        {/* Card 4: Completed Bookings */}
        <div
          onClick={() => setActiveFilter('all')}
          className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeFilter === 'all' ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50/20' : 'border-purple-100 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-700">
            <span>حجوزات مكتملة</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-purple-950">{completedBookingsCount}</span>
            <span className="text-xs text-slate-400">مكتمل</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-purple-100/90 flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث سريع بالاسم أو رقم الجوال..."
            className="w-full pl-8 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            كافة الحجوزات ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveFilter('arrivals')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'arrivals'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            دخول اليوم ({visibleArrivals.length})
          </button>
          <button
            onClick={() => setActiveFilter('departures')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'departures'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            خروج اليوم ({todayDepartures.length})
          </button>
          <button
            onClick={() => setActiveFilter('waitingDeposit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'waitingDeposit'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            انتظار العربون ({waitingDepositBookings.length})
          </button>
        </div>
      </div>

      {/* TODAY'S ARRIVALS TABLE */}
      {(activeFilter === 'arrivals' || activeFilter === 'all') && (
        <div className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-xs border border-purple-100/90 space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>مباشر اليوم</span>
            </div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <span className="text-purple-700 font-mono text-lg">➔</span>
              <span>حركات دخول اليوم ({searchFilteredArrivals.length})</span>
            </h3>
          </div>

          {searchFilteredArrivals.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/70 rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
              لا توجد حركات دخول مسجلة لليوم مطابقة للبحث
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-purple-100/80 bg-white shadow-xs">
              <div className="min-w-[620px] sm:min-w-0">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-purple-50/40 border-b border-purple-100/70 text-[11px] font-bold text-slate-500 text-center items-center">
                  <div className={isGuard ? "col-span-4 text-right pr-1" : "col-span-3 text-right pr-1"}>العميل والعقار</div>
                  {!isGuard && <div className="col-span-2 text-center">الحساب والمتبقي</div>}
                  {!isGuard && <div className="col-span-2 text-center">التأمين</div>}
                  <div className={isGuard ? 'col-span-8 text-center' : 'col-span-5 text-center'}>
                    {isGuard ? 'إجراءات الحارس المعتمدة' : 'إجراءات الحارس والتحكم'}
                  </div>
                </div>

                <div className="divide-y divide-purple-100/60">
                  {searchFilteredArrivals.map((bk) => (
                    <div
                      key={bk.id}
                      className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs hover:bg-purple-50/40 transition-colors"
                    >
                      {/* Col: Customer & Property info */}
                      <div className={isGuard ? "col-span-4 text-right" : "col-span-3 text-right"}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {bk.customerName.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate" title={bk.customerName}>
                              {bk.customerName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500">{bk.customerPhone}</span>
                              <span className="text-[10px] bg-purple-50 text-purple-800 px-1.5 rounded font-bold">
                                {bk.propertyName}
                              </span>
                              {!isGuard && (
                                <a
                                  href={getWhatsAppDirectUrl(bk.customerPhone, bk.customerName, bk.propertyName, 'arrival')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-5 h-5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center transition-colors"
                                  title="فتح واتساب العميل"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial info - hidden from Guard */}
                      {!isGuard && (
                        <div className="col-span-2 text-center">
                          {bk.remainingAmount > 0 ? (
                            <span className="font-bold text-purple-900 font-mono text-[11px] block">
                              متبقي: {bk.remainingAmount} ر.س
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-700 text-[11px] block">
                              مدفوع بالكامل ✓
                            </span>
                          )}

                          {bk.remainingAmount > 0 ? (
                            <button
                              onClick={() => openPaymentModal(bk)}
                              className="mt-0.5 px-2.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              إكمال الدفع
                            </button>
                          ) : bk.paymentReceiptName ? (
                            <button
                              onClick={() => setViewReceiptBooking(bk)}
                              className="mt-0.5 px-2.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>الإيصال</span>
                            </button>
                          ) : null}
                        </div>
                      )}

                      {/* Insurance column - hidden from Guard */}
                      {!isGuard && (
                        <div className="col-span-2 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {bk.insuranceAmount} ر.س
                          </span>
                          <button
                            onClick={() => !bk.insuranceReturned && setInsuranceConfirmBooking(bk)}
                            className={`mt-0.5 px-3 py-0.5 text-[10px] font-bold border rounded-full mx-auto flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              bk.insuranceReturned
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                : 'bg-purple-100 hover:bg-purple-200 border-purple-200 text-purple-800'
                            }`}
                          >
                            {bk.insuranceReturned ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>مستلم</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-2.5 h-2.5 fill-purple-700 text-purple-700" />
                                <span>تسليم</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div
                        className={
                          isGuard
                            ? 'col-span-8 text-center flex flex-wrap items-center justify-center gap-2'
                            : 'col-span-5 text-center flex flex-wrap items-center justify-center gap-1.5'
                        }
                      >
                        {/* Guard Button 1: وصل العميل */}
                        <button
                          type="button"
                          onClick={() => setGuardConfirm({ kind: 'arrive', booking: bk })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            bk.guestArrived
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600 shadow-xs'
                          }`}
                          title="إرسال تنبيه وصول العميل"
                        >
                          <span className={`w-2 h-2 rounded-full ${bk.guestArrived ? 'bg-emerald-500' : 'bg-white'}`} />
                          <span>{bk.guestArrived ? 'تم وصول العميل ✓' : 'وصل العميل'}</span>
                        </button>

                        {/* Guard Button 2: استلمت التأمين كاش */}
                        <button
                          type="button"
                          onClick={() => setGuardConfirm({ kind: 'insrecv', booking: bk })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            bk.insuranceReceivedCash
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
                          }`}
                          title="إرسال تنبيه استلام التأمين كاش"
                        >
                          <span className={`w-2 h-2 rounded-full ${bk.insuranceReceivedCash ? 'bg-emerald-500' : 'bg-white'}`} />
                          <span>{bk.insuranceReceivedCash ? 'تم استلام التأمين كاش ✓' : 'استلمت التأمين كاش'}</span>
                        </button>

                        {!isGuard && (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailsTitle('تفاصيل الحجز الكاملة');
                              setSelectedBookingForDetails(bk);
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-700" />
                            <span>تفاصيل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TODAY'S DEPARTURES TABLE */}
      {(activeFilter === 'departures' || activeFilter === 'all') && (
        <div className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-xs border border-purple-100/90 space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>مغادرة اليوم</span>
            </div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <span className="text-rose-600 font-mono text-lg">➔</span>
              <span>حركات خروج اليوم ({searchFilteredDepartures.length})</span>
            </h3>
          </div>

          {searchFilteredDepartures.length === 0 ? (
            <div className="text-center py-6 bg-slate-50/70 rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
              لا توجد حركات خروج مسجلة لليوم مطابقة للبحث
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-purple-100/80 bg-white shadow-xs">
              <div className="min-w-[620px] sm:min-w-0">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-rose-50/40 border-b border-rose-100/70 text-[11px] font-bold text-slate-500 text-center items-center">
                  <div className={isGuard ? "col-span-4 text-right pr-1" : "col-span-3 text-right pr-1"}>العميل والعقار</div>
                  {!isGuard && <div className="col-span-2 text-center">إغلاق وتصفية الحساب</div>}
                  {!isGuard && <div className="col-span-2 text-center">تصفية التأمين</div>}
                  <div className={isGuard ? 'col-span-8 text-center' : 'col-span-5 text-center'}>
                    {isGuard ? 'إجراءات الحارس عند الخروج' : 'إجراءات الحارس والتفاصيل'}
                  </div>
                </div>

                <div className="divide-y divide-purple-100/60">
                  {searchFilteredDepartures.map((bk) => (
                    <div
                      key={bk.id}
                      className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs hover:bg-rose-50/30 transition-colors"
                    >
                      {/* Customer info */}
                      <div className={isGuard ? "col-span-4 text-right" : "col-span-3 text-right"}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {bk.customerName.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate" title={bk.customerName}>
                              {bk.customerName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500">{bk.customerPhone}</span>
                              <span className="text-[10px] bg-purple-50 text-purple-800 px-1.5 rounded font-bold">
                                {bk.propertyName}
                              </span>
                              {!isGuard && (
                                <button
                                  type="button"
                                  onClick={() => handleCheckoutReminder(bk.id)}
                                  className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="إرسال تذكير خروج عبر واتساب"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                                  <span>تذكير</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial info - hidden from Guard */}
                      {!isGuard && (
                        <div className="col-span-2 text-center">
                          <span className="font-bold text-slate-800 font-mono text-[11px] block">
                            الإجمالي: {bk.totalPrice} ر.س
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailsTitle('إغلاق وتصفية حساب العميل');
                              setSelectedBookingForDetails(bk);
                            }}
                            className="mt-0.5 px-2.5 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            تصفية الحساب
                          </button>
                        </div>
                      )}

                      {/* Insurance info - hidden from Guard */}
                      {!isGuard && (
                        <div className="col-span-2 text-center">
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {bk.insuranceAmount} ر.س
                          </span>
                          <button
                            type="button"
                            onClick={() => returnInsuranceDeposit(bk.id)}
                            className={`mt-0.5 px-3 py-0.5 text-[10px] font-bold border rounded-full mx-auto flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                              bk.insuranceReturned
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
                            }`}
                          >
                            {bk.insuranceReturned ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>مسلّم</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-2.5 h-2.5 fill-rose-700 text-rose-700" />
                                <span>إرجاع</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div
                        className={
                          isGuard
                            ? 'col-span-8 text-center flex flex-wrap items-center justify-center gap-2'
                            : 'col-span-5 text-center flex flex-wrap items-center justify-center gap-1.5'
                        }
                      >
                        {/* Guard Button 1: خروج العميل */}
                        <button
                          type="button"
                          onClick={() => setGuardConfirm({ kind: 'exit', booking: bk })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            bk.checkedOut
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-xs'
                          }`}
                          title="إرسال تنبيه خروج العميل"
                        >
                          <span className={`w-2 h-2 rounded-full ${bk.checkedOut ? 'bg-slate-500' : 'bg-white'}`} />
                          <span>{bk.checkedOut ? 'تم خروج العميل ✓' : 'خروج العميل'}</span>
                        </button>

                        {/* Guard Button 2: إعادة التأمين */}
                        <button
                          type="button"
                          onClick={() => setGuardConfirm({ kind: 'insret', booking: bk })}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            bk.insuranceReturned
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-xs'
                          }`}
                          title="إرسال تنبيه إعادة التأمين"
                        >
                          <span className={`w-2 h-2 rounded-full ${bk.insuranceReturned ? 'bg-emerald-500' : 'bg-white'}`} />
                          <span>{bk.insuranceReturned ? 'تمت إعادة التأمين ✓' : 'إعادة التأمين'}</span>
                        </button>

                        {!isGuard && (
                          <button
                            type="button"
                            onClick={() => {
                              setDetailsTitle('تفاصيل الحجز والتسوية المالية');
                              setSelectedBookingForDetails(bk);
                            }}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-700" />
                            <span>تفاصيل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ALL ACTIVE BOOKINGS TABLE (Hidden for Guard) */}
      {!isGuard && activeFilter === 'all' && (
        <div className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-xs border border-purple-100/90 space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              سجل الحجوزات
            </span>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              <span>كافة الحجوزات النشطة ({searchFilteredActive.length})</span>
            </h3>
          </div>

          <div className="overflow-x-auto scrollbar-thin rounded-2xl border border-purple-100/80 bg-white shadow-xs">
            <div className="min-w-[620px] sm:min-w-0">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 text-center items-center">
                <div className="col-span-5 text-right pr-1">العميل والجوال والعقار</div>
                <div className="col-span-3 text-center">فترة الإقامة</div>
                <div className="col-span-2 text-center">الحساب المالي</div>
                <div className="col-span-2 text-center">التفاصيل</div>
              </div>

              <div className="divide-y divide-slate-100">
                {searchFilteredActive.map((bk) => (
                  <div
                    key={bk.id}
                    className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-xs hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="col-span-5 text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {bk.customerName.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{bk.customerName}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">{bk.customerPhone}</span>
                            <span className="text-[10px] bg-purple-50 text-purple-800 px-1.5 rounded font-bold">
                              {bk.propertyName}
                            </span>
                            <a
                              href={getWhatsAppDirectUrl(bk.customerPhone, bk.customerName, bk.propertyName, 'arrival')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-5 h-5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center transition-colors"
                              title="فتح واتساب العميل"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-3 text-center font-mono text-[10px] text-slate-600">
                      {bk.checkInDate} ← {bk.checkOutDate}
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="font-bold text-slate-900 font-mono text-[11px] block">{bk.totalPrice} ر.س</span>
                      <span className="text-[10px] text-emerald-700 block font-mono">
                        العربون: {bk.depositPaid} ر.س
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => {
                          setDetailsTitle('تفاصيل الحجز الكاملة');
                          setSelectedBookingForDetails(bk);
                        }}
                        className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        عرض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Today Chalets Section */}
      {!isGuard && (
        <div className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-xs border border-purple-100/90 space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
            <button
              onClick={() => setShowAvailableProps(!showAvailableProps)}
              className="px-3.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              {showAvailableProps ? 'إخفاء المتاح' : 'عرض المتاح'}
            </button>
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-700" />
              <span>المتاح اليوم ({availableTodayProperties.length})</span>
            </h3>
          </div>

          {showAvailableProps && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              {availableTodayProperties.map((prop) => (
                <div
                  key={prop.id}
                  onClick={() => {
                    setSelectedPropertyId(prop.id);
                    setActiveTab('calendar');
                  }}
                  className="p-3 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl border border-emerald-200/80 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-900 transition-colors">
                        {prop.name}
                      </h4>
                      <span className="text-[10px] text-slate-500">{prop.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left font-mono">
                      <span className="font-bold text-xs sm:text-sm text-emerald-800 block">
                        {prop.basePriceWeekday} ر.س
                      </span>
                      <span className="text-[9px] text-slate-400">سعر الليلة</span>
                    </div>
                    <span className="text-xs bg-purple-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs group-hover:bg-purple-800 transition-all">
                      حجز الآن
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete Payment Modal */}
      {paymentModalBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPaymentModalBooking(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
              <h4 className="font-bold text-sm text-purple-950">
                إكمال الدفع - {paymentModalBooking.customerName}
              </h4>
              <button
                onClick={() => setPaymentModalBooking(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الحجز:</span>
                <span className="font-mono font-bold">{paymentModalBooking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المبلغ المتبقي:</span>
                <span className="font-mono font-bold text-purple-900">
                  {paymentModalBooking.remainingAmount} ر.س
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-white border border-dashed border-purple-300 rounded-xl px-3 py-3 text-xs text-purple-900 font-bold hover:bg-purple-50/50 transition-colors">
              <Paperclip className="w-4 h-4 text-purple-700" />
              <span className="truncate">
                {paymentReceiptFile?.name || 'إرفاق إيصال التحويل البنكي (صورة أو PDF)'}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => handleReceiptFileChange(e.target.files?.[0])}
              />
            </label>

            {paymentFileError && (
              <p className="text-[10px] text-amber-700 font-bold">{paymentFileError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                disabled={!paymentReceiptFile}
                onClick={submitPaymentCompletion}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                حفظ وإكمال
              </button>
              <button
                onClick={() => setPaymentModalBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Handover Confirm Modal */}
      {insuranceConfirmBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInsuranceConfirmBooking(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-3.5 shadow-2xl border border-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-amber-800">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-sm">تأكيد تسليم التأمين</h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              هل تؤكد تسليم مبلغ التأمين{' '}
              <strong className="font-mono text-amber-800">({insuranceConfirmBooking.insuranceAmount} ر.س)</strong> للعميل{' '}
              <strong>{insuranceConfirmBooking.customerName}</strong>؟ سيُرسل إشعار بذلك للإدارة.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmInsuranceHandover}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                نعم، تم التسليم
              </button>
              <button
                onClick={() => setInsuranceConfirmBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingForDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedBookingForDetails(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <div>
                <h4 className="font-bold text-base text-slate-900">{detailsTitle}</h4>
                <span className="text-xs font-mono text-purple-700">{selectedBookingForDetails.bookingNumber}</span>
              </div>
              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="font-bold text-slate-900">{selectedBookingForDetails.customerName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">رقم الجوال:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBookingForDetails.customerPhone}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">العقار:</span>
                <span className="font-bold text-purple-900">{selectedBookingForDetails.propertyName}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">فترة الإقامة:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  من {selectedBookingForDetails.checkInDate} إلى {selectedBookingForDetails.checkOutDate} ({selectedBookingForDetails.nightsCount} ليالٍ)
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">المبلغ الإجمالي:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{selectedBookingForDetails.totalPrice} ر.س</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">العربون المدفوع:</span>
                <span className="font-bold text-emerald-700 font-mono">{selectedBookingForDetails.depositPaid} ر.س</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">المبلغ المتبقي للتحصيل:</span>
                <span className="font-bold text-purple-900 font-mono">{selectedBookingForDetails.remainingAmount} ر.س</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">مبلغ التأمين المسترد:</span>
                <span className="font-bold text-amber-700 font-mono">
                  {selectedBookingForDetails.insuranceAmount} ر.س ({selectedBookingForDetails.insuranceReturned ? 'تم التسليم' : 'معلق'})
                </span>
              </div>

              {selectedBookingForDetails.paymentReceiptName && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">إيصال إكمال الدفع:</span>
                  <button
                    onClick={() => setViewReceiptBooking(selectedBookingForDetails)}
                    className="font-bold text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>عرض الإيصال ({selectedBookingForDetails.paymentCompletedAt})</span>
                  </button>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">المسوق المعتمد:</span>
                <span className="font-bold text-slate-800">
                  {selectedBookingForDetails.marketerName || 'حجز مباشر'} ({selectedBookingForDetails.marketerCommission} ر.س)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={selectedBookingForDetails.remainingAmount <= 0}
                onClick={() => {
                  handlePaymentReminder(selectedBookingForDetails.id);
                  setSelectedBookingForDetails(null);
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {selectedBookingForDetails.remainingAmount <= 0 ? 'الدفع مكتمل ✓' : 'تذكير الدفع عبر واتساب'}
                </span>
              </button>

              <button
                onClick={() => setSelectedBookingForDetails(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {viewReceiptBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewReceiptBooking(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" />
                <span>إيصال إكمال الدفع - {viewReceiptBooking.bookingNumber}</span>
              </h4>
              <button onClick={() => setViewReceiptBooking(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              بواسطة {viewReceiptBooking.paymentCompletedBy || 'الموظف'} · <span className="font-mono">{viewReceiptBooking.paymentCompletedAt}</span>
            </div>

            {viewReceiptBooking.paymentReceiptDataUrl?.startsWith('data:image') ? (
              <img
                src={viewReceiptBooking.paymentReceiptDataUrl}
                alt="إيصال"
                className="w-full rounded-2xl border border-slate-200"
              />
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
                {viewReceiptBooking.paymentReceiptName || 'ملف الإيصال المرفق'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
