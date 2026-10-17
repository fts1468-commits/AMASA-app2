import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDays,
  Download,
  Phone,
  Send,
  MapPin,
  Film,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  X,
  Copy,
  Check,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  Layers,
  UserCheck,
  ChevronDown,
  ShieldCheck,
  Plus,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingService } from '../../types';
import {
  getResolvedDatePrice,
  isDateBookedCrossProperty,
  isDateBlockedCrossProperty,
  getConsecutiveDatesRange,
  areDatesConsecutive,
  checkBookingRangeAvailability,
} from '../../lib/pricingService';

export const BookingsTab: React.FC = () => {
  const {
    properties,
    selectedPropertyId,
    selectedProperty,
    setSelectedPropertyId,
    bookings,
    dateOverrides,
    setDateOverridesBulk,
    requestDeposit,
    confirmBookingWithReceipt,
    requestBookingDiscount,
    respondToBookingDiscount,
    marketers,
    isAdmin,
    currentMarketerId,
    nowTimestamp,
    canCreateContract,
    canEditDeposit,
    updateWaitingDepositAmount,
    preselectedDateForBooking,
    setPreselectedDateForBooking,
    preselectedDatesForBooking,
    setPreselectedDatesForBooking,
    preselectedSectionForBooking,
    setPreselectedSectionForBooking,
    preselectedCommissionType,
    setPreselectedCommissionType,
  } = useApp();

  const [commissionType, setCommissionType] = useState<'full' | 'partial'>('partial');
  const todayStr = useMemo(() => {
    const now = new Date(nowTimestamp || Date.now());
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [nowTimestamp]);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return [`${y}-${m}-${d}`];
  });

  // Filter out any past dates from selectedDates automatically
  useEffect(() => {
    setSelectedDates((prev) => {
      const filtered = prev.filter((d) => d >= todayStr);
      return filtered.length > 0 ? filtered : [todayStr];
    });
  }, [todayStr]);

  // Sync selected dates from Calendar tab
  useEffect(() => {
    if (preselectedDatesForBooking && preselectedDatesForBooking.length > 0) {
      const valid = preselectedDatesForBooking.filter((d) => d >= todayStr);
      if (valid.length > 0) {
        setSelectedDates(valid);
        const d = new Date(valid[0]);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
      }
      setPreselectedDatesForBooking(null);
      setPreselectedDateForBooking(null);
      const el = document.getElementById('new-booking-form');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else if (preselectedDateForBooking) {
      if (preselectedDateForBooking >= todayStr) {
        setSelectedDates([preselectedDateForBooking]);
        const d = new Date(preselectedDateForBooking);
        setYear(d.getFullYear());
        setMonth(d.getMonth());
      }
      setPreselectedDateForBooking(null);
      const el = document.getElementById('new-booking-form');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [preselectedDatesForBooking, preselectedDateForBooking, todayStr, setPreselectedDatesForBooking, setPreselectedDateForBooking]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('05');
  const [depositAmount, setDepositAmount] = useState<number>(selectedProperty.defaultDeposit || 250);

  // Edit deposit modal
  const [editDepositModalOpen, setEditDepositModalOpen] = useState(false);
  const [tempDepositValue, setTempDepositValue] = useState<number>(selectedProperty.defaultDeposit || 250);

  // Modals for Info / Photos / Location / Contract
  const [infoModalType, setInfoModalType] = useState<'info' | 'photos' | 'location' | 'contract' | null>(null);

  // Receipt upload
  const [receiptFile, setReceiptFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  // Message preview / sent modal
  const [sentMessageData, setSentMessageData] = useState<{
    title: string;
    text: string;
    whatsappUrl: string;
    phone: string;
  } | null>(null);

  // Contract confirmed popup
  const [confirmedContractData, setConfirmedContractData] = useState<{
    contractText: string;
    whatsappUrl: string;
    bookingNumber: string;
  } | null>(null);

  const [calendarSize, setCalendarSize] = useState<'compact' | 'normal' | 'large'>('normal');
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    if (preselectedSectionForBooking) return preselectedSectionForBooking;
    if (selectedProperty.sections && selectedProperty.sections.length > 0) {
      return selectedProperty.sections[0].id;
    }
    return 'all';
  });

  useEffect(() => {
    if (preselectedSectionForBooking) {
      setActiveSectionId(preselectedSectionForBooking);
      setPreselectedSectionForBooking(null);
    } else if (selectedProperty.id === 'montaja-al-taraf' || selectedProperty.id === 'al-taraf' || selectedProperty.id === 'hamran') {
      if (activeSectionId === 'all' || !selectedProperty.sections?.some((s) => s.id === activeSectionId)) {
        setActiveSectionId(selectedProperty.sections?.[0]?.id || '');
      }
    } else if (selectedProperty.sections && selectedProperty.sections.length > 0) {
      if (!selectedProperty.sections.some((s) => s.id === activeSectionId) && activeSectionId !== 'all') {
        setActiveSectionId(selectedProperty.sections[0].id);
      }
    } else {
      setActiveSectionId('all');
    }
  }, [selectedPropertyId, selectedProperty, preselectedSectionForBooking, activeSectionId]);

  useEffect(() => {
    if (selectedProperty.defaultDeposit) {
      setDepositAmount(selectedProperty.defaultDeposit);
    }
  }, [selectedPropertyId, selectedProperty]);

  const activeSection = useMemo(() => {
    if (!selectedProperty.sections || selectedProperty.sections.length === 0 || activeSectionId === 'all') {
      return null;
    }
    return selectedProperty.sections.find((s) => s.id === activeSectionId) || null;
  }, [selectedProperty, activeSectionId]);

  const [blockedAlertMessage, setBlockedAlertMessage] = useState<string | null>(null);
  const blockedAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDateBooked = useCallback(
    (dateKey: string) => {
      return isDateBookedCrossProperty(selectedPropertyId, activeSection?.id, dateKey, bookings).isBooked;
    },
    [bookings, selectedPropertyId, activeSection]
  );

  const showBlockedAlert = useCallback(
    (msg = 'اليوم محجوز ومؤكد باللون الأحمر — لا يمكن أخذ حجز عليه') => {
      setBlockedAlertMessage(msg);
      if (blockedAlertTimeoutRef.current) clearTimeout(blockedAlertTimeoutRef.current);
      blockedAlertTimeoutRef.current = setTimeout(() => {
        setBlockedAlertMessage(null);
      }, 5000);
    },
    []
  );

  const sortedDates = useMemo(() => [...selectedDates].sort(), [selectedDates]);
  const checkInDate = sortedDates[0] || todayStr;
  const lastSelectedDate = sortedDates[sortedDates.length - 1] || checkInDate;

  const checkOutDate = useMemo(() => {
    const d = new Date(lastSelectedDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [lastSelectedDate]);

  const nightsCount = Math.max(1, selectedDates.length);

  const totalPrice = useMemo(() => {
    let sum = 0;
    sortedDates.forEach((d) => {
      sum += getResolvedDatePrice(selectedPropertyId, activeSection?.id, d, dateOverrides, properties);
    });
    return sum;
  }, [sortedDates, dateOverrides, selectedPropertyId, selectedProperty, activeSection, properties]);

  // Extra Services & Discount state (قسم خدمات حمران وطلب الخصم)
  const [extraServices, setExtraServices] = useState<BookingService[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);

  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('إلغاء الفطور');

  // Request discount modal for existing bookings
  const [discountModalBooking, setDiscountModalBooking] = useState<Booking | null>(null);
  const [modalDiscountAmount, setModalDiscountAmount] = useState<number>(100);
  const [modalDiscountReason, setModalDiscountReason] = useState<string>('إلغاء الفطور');

  const pendingDiscountBookings = useMemo(() => {
    return bookings.filter((b) => b.discountStatus === 'pending_approval');
  }, [bookings]);

  const extraServicesTotal = useMemo(() => {
    return extraServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [extraServices]);

  // Calendar price and basis for commission = totalPrice - discount (when requested/approved)
  // "سعر الحجز في التقويم وأساس العمولة: ٩٠٠ ريال"
  const calendarPrice = Math.max(0, totalPrice - (hasDiscount ? discountAmount : 0));

  // Client total in offer & contract = calendar price + extra services:
  // "إجمالي العميل في العرض والعقد: ١٬١٠٠ ريال"
  const clientTotal = calendarPrice + extraServicesTotal;
  const remainingAmount = Math.max(0, clientTotal - depositAmount);
  const insuranceAmount = selectedProperty.insuranceAmount || 300;

  // Waiting deposit hold on checkInDate
  const currentOverride = dateOverrides[`${selectedPropertyId}_${checkInDate}`];
  const isAwaitingDeposit =
    currentOverride?.status === 'waiting_deposit' &&
    !!currentOverride.waitingDepositExpiresAt &&
    currentOverride.waitingDepositExpiresAt > nowTimestamp;

  const depositSecondsLeft =
    isAwaitingDeposit && currentOverride?.waitingDepositExpiresAt
      ? Math.max(0, Math.floor((currentOverride.waitingDepositExpiresAt - nowTimestamp) / 1000))
      : 0;

  const isPhoneValid =
    customerPhone.trim() !== '' &&
    customerPhone.trim() !== '05' &&
    customerPhone.trim().length >= 9;

  const [selectedMarketerId, setSelectedMarketerId] = useState<string>(() => {
    if (!isAdmin && currentMarketerId) {
      return currentMarketerId;
    }
    return 'admin';
  });

  // Sync with awaiting deposit hold if present
  useEffect(() => {
    if (isAwaitingDeposit && currentOverride) {
      if (currentOverride.waitingMarketerId) {
        setSelectedMarketerId(currentOverride.waitingMarketerId);
      } else {
        setSelectedMarketerId('admin');
      }
      if (currentOverride.waitingCommissionRate === 7) {
        setCommissionType('full');
      } else if (currentOverride.waitingCommissionRate === 5) {
        setCommissionType('partial');
      }
    }
  }, [isAwaitingDeposit, currentOverride]);

  // Sync with preselected commission type from Calendar tab
  useEffect(() => {
    if (preselectedCommissionType) {
      setCommissionType(preselectedCommissionType);
      setPreselectedCommissionType(null);
    }
  }, [preselectedCommissionType, setPreselectedCommissionType]);

  const isManagement = selectedMarketerId === 'admin' || !selectedMarketerId;
  const selectedMarketer = useMemo(() => {
    if (isManagement) return null;
    return marketers.find((m) => m.id === selectedMarketerId) || null;
  }, [isManagement, marketers, selectedMarketerId]);

  const commissionPercent = isManagement
    ? 0
    : isAwaitingDeposit && currentOverride?.waitingCommissionRate !== undefined
    ? currentOverride.waitingCommissionRate
    : commissionType === 'full'
    ? 7
    : 5;

  // Commission is calculated on the price after discount!
  // "تُحسب العمولة على السعر بعد الخصم"
  const marketerCommission = isManagement
    ? 0
    : Math.round(calendarPrice * (commissionPercent / 100));

  const monthsAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const daysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const daysMatrix = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const items = [];

    for (let i = 0; i < firstDay; i++) {
      items.push(null);
    }

    for (let d = 1; d <= daysCount; d++) {
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthPadded}-${dayPadded}`;
      const dayDate = new Date(year, month, d);
      const isWk = dayDate.getDay() === 4 || dayDate.getDay() === 5;
      const ovKey = activeSection
        ? `${selectedPropertyId}_${activeSection.id}_${dateKey}`
        : `${selectedPropertyId}_${dateKey}`;
      const ov = dateOverrides[ovKey] || dateOverrides[`${selectedPropertyId}_${dateKey}`];
      const price = getResolvedDatePrice(selectedPropertyId, activeSection?.id, dateKey, dateOverrides, properties);

      const { isBooked: crossBooked, matchedBooking } = isDateBookedCrossProperty(
        selectedPropertyId,
        activeSection?.id,
        dateKey,
        bookings
      );
      const { isBlocked: crossBlocked, isWaitingDeposit } = isDateBlockedCrossProperty(
        selectedPropertyId,
        activeSection?.id,
        dateKey,
        dateOverrides
      );

      const isPast = dateKey < todayStr;
      const isToday = dateKey === todayStr;

      let status: 'available' | 'booked' | 'blocked' | 'waiting_deposit' = 'available';
      if (isPast) {
        status = 'blocked';
      } else if (!selectedProperty.isPublished || (activeSection && activeSection.isAvailable === false)) {
        status = 'blocked';
      } else if (crossBooked) {
        status = 'booked';
      } else if (isWaitingDeposit) {
        status = 'waiting_deposit';
      } else if (crossBlocked) {
        status = 'blocked';
      }

      items.push({
        dayNum: d,
        dateKey,
        price,
        status,
        override: ov,
        booking: matchedBooking,
        isPast,
        isToday,
      });
    }

    return items;
  }, [year, month, selectedPropertyId, selectedProperty, activeSection, bookings, dateOverrides, properties, todayStr]);

  const handleDateClick = (dateKey: string) => {
    // 1. Strictly disable past dates
    if (dateKey < todayStr) return;

    // 2. Strictly prevent double-booking on confirmed red days (Rule 1)
    if (isDateBooked(dateKey)) {
      showBlockedAlert('اليوم محجوز ومؤكد باللون الأحمر — لا يمكن أخذ حجز عليه');
      return;
    }

    // 3. Consecutive range selection (Rule 2 & 3)
    if (selectedDates.length === 0) {
      setSelectedDates([dateKey]);
      return;
    }

    if (selectedDates.length === 1) {
      const start = selectedDates[0];
      if (dateKey === start) return;

      const proposedRange = getConsecutiveDatesRange(start, dateKey);
      const check = checkBookingRangeAvailability(selectedPropertyId, activeSection?.id, proposedRange, bookings);
      if (!check.isFree) {
        showBlockedAlert(check.errorMessage || 'الحجز يتخلله أيام محجوزة');
        return;
      }
      setSelectedDates(proposedRange);
      return;
    }

    // Range has 2 or more dates
    const start = selectedDates[0];
    const end = selectedDates[selectedDates.length - 1];

    if (dateKey === end) {
      setSelectedDates(selectedDates.slice(0, -1));
      return;
    }

    if (dateKey === start) {
      setSelectedDates(selectedDates.slice(1));
      return;
    }

    if (dateKey > end) {
      const proposedRange = getConsecutiveDatesRange(start, dateKey);
      const check = checkBookingRangeAvailability(selectedPropertyId, activeSection?.id, proposedRange, bookings);
      if (!check.isFree) {
        showBlockedAlert(check.errorMessage || 'الحجز يتخلله أيام محجوزة');
        return;
      }
      setSelectedDates(proposedRange);
      return;
    }

    if (dateKey < start) {
      const proposedRange = getConsecutiveDatesRange(dateKey, end);
      const check = checkBookingRangeAvailability(selectedPropertyId, activeSection?.id, proposedRange, bookings);
      if (check.isFree) {
        setSelectedDates(proposedRange);
      } else {
        setSelectedDates([dateKey]);
      }
      return;
    }

    // Inside range: cut range to dateKey
    const proposedRange = getConsecutiveDatesRange(start, dateKey);
    setSelectedDates(proposedRange);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const openWhatsAppMessageModal = (text: string, title = 'إرسال عبر واتساب') => {
    const raw = customerPhone.trim();
    if (!raw || raw === '05' || raw.length < 9) {
      const url = `https://wa.me/966?text=${encodeURIComponent(text)}`;
      setSentMessageData({ title, text, whatsappUrl: url, phone: raw || '05' });
      return;
    }
    const clean = raw.replace(/\D/g, '').replace(/^0/, '966');
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
    setSentMessageData({ title, text, whatsappUrl: url, phone: raw });
    try {
      window.open(url, '_blank');
    } catch {}
  };

  // Quick WhatsApp Info
  const sendQuickInfo = () => {
    const msg = `مرحباً بك أخي الكريم ${customerName || ''}،
يسرنا تزويدكم بتفاصيل ومواصفات استراحة (${selectedProperty.name}):

🏕️ *المواصفات:*
• ${selectedProperty.subtitle}
• السعة: ${selectedProperty.capacity} فرد
• غرف النوم: ${selectedProperty.bedrooms} | دورات المياه: ${selectedProperty.bathrooms}
• المساحة: ${selectedProperty.areaM2} م² | المسبح: ${selectedProperty.poolType}
• وقت الدخول: ${selectedProperty.checkInTimeText} | وقت الخروج: ${selectedProperty.checkOutTimeText}
• سعر الليلة: ${selectedProperty.basePriceWeekday} ر.س (وسط الأسبوع) / ${selectedProperty.basePriceWeekend} ر.س (الويكند)
• التأمين المسترد: ${insuranceAmount} ريال

نتشرف بخدمتكم لحجز إقامتكم السعيدة!`;
    openWhatsAppMessageModal(msg);
  };

  // Quick WhatsApp Photos & Video
  const sendQuickPhotos = () => {
    const mediaLinks = selectedProperty.images?.length
      ? selectedProperty.images
          .map(
            (img, idx) =>
              `• ${
                img.includes('youtube.com') || img.includes('youtu.be') || img.includes('.mp4')
                  ? '🎥 فيديو'
                  : '📸 صورة'
              } ${idx + 1}: ${img}`
          )
          .join('\n')
      : `• رابط الألبوم: ${selectedProperty.coverImage}`;

    const msg = `أهلاً بك أخي الكريم ${customerName || ''}،
مرفق لكم ألبوم الصور والفيديو لاستراحة (${selectedProperty.name}):

📸 *روابط الصور والتغطيات:*
${mediaLinks}

نتمنى أن تنال إعجابكم ويسعدنا استقبال استفساراتكم! 🏕️`;
    openWhatsAppMessageModal(msg, 'إرسال الوسائط عبر واتساب');
  };

  // Quick WhatsApp Location
  const sendQuickLocation = () => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${selectedProperty.name} ${selectedProperty.location}`
    )}`;
    const msg = `مرحباً بك أخي الكريم ${customerName || ''}،
موقع ولوكيشن استراحة (${selectedProperty.name}):

📍 *العنوان:* ${selectedProperty.location}
🗺️ *رابط خرائط Google:*
${mapUrl}

نتمنى لكم رحلة وصول ميسرة وممتعة!`;
    openWhatsAppMessageModal(msg);
  };

  // Quick WhatsApp Full Property Data
  const sendFullPropertyData = () => {
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${selectedProperty.name} ${selectedProperty.location}`
    )}`;
    const msg = `مرحباً بك أخي الكريم ${customerName || ''}،
تفاصيل استراحة (${selectedProperty.name}) الكاملة:

🏕️ *معلومات المكان:* ${selectedProperty.subtitle}
• السعة: ${selectedProperty.capacity} فرد | غرف النوم: ${selectedProperty.bedrooms}
• المسبح: ${selectedProperty.poolType}
• وقت الدخول: ${selectedProperty.checkInTimeText} | وقت الخروج: ${selectedProperty.checkOutTimeText}

📍 *اللوكيشن على خرائط Google:*
${mapUrl}

📸 *ألبوم الصور:* ${selectedProperty.coverImage}

💰 *الأسعار:* ${totalPrice} ر.س (${nightsCount} ليالي) | التأمين: ${insuranceAmount} ر.س
يسعدنا تأكيد حجزكم فور تحويل العربون!`;
    openWhatsAppMessageModal(msg);
  };

  // 15-Minute Deposit Request
  const handleRequestDeposit = () => {
    if (selectedDates.some((d) => d < todayStr)) {
      alert('يمنع إنشاء أو قبول أي حجز على تواريخ فائتة. يرجى اختيار تاريخ اليوم أو تواريخ قادمة.');
      return;
    }

    if (!customerPhone.trim() || customerPhone === '05' || customerPhone.length < 9) {
      alert('فضلاً أدخل رقم جوال العميل بصيغة صحيحة (مثال: 0551234567)');
      return;
    }

    const { whatsappUrl, message } = requestDeposit({
      propertyId: selectedPropertyId,
      dates: selectedDates,
      customerName: customerName.trim() || 'عميل كريم',
      customerPhone,
      depositAmount,
      totalPrice,
      nightsCount,
      marketerId: isManagement ? undefined : selectedMarketerId,
      commissionRatePercent: isManagement ? 0 : commissionPercent,
      sectionName: activeSection?.name,
      extraServices,
      discount: hasDiscount ? discountAmount : 0,
      discountReason: hasDiscount ? discountReason : undefined,
    });

    setSentMessageData({
      title: 'طلب العربون (مهلة 15 دقيقة) عبر واتساب',
      text: message,
      whatsappUrl,
      phone: customerPhone,
    });

    window.open(whatsappUrl, '_blank');
  };

  // Receipt image processing
  const handleReceiptChange = (file?: File) => {
    setReceiptError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setReceiptError('اختر صورة للإيصال (JPG أو PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setReceiptError('تعذر قراءة الصورة، جرّب صورة أخرى.');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => setReceiptError('تعذر فتح الصورة.');
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setReceiptFile({ name: file.name, dataUrl: String(reader.result) });
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setReceiptFile({ name: file.name, dataUrl: canvas.toDataURL('image/jpeg', 0.8) });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const isConfirmReady =
    selectedDates.length > 0 &&
    !selectedDates.some((d) => d < todayStr) &&
    customerName.trim() !== '' &&
    isPhoneValid &&
    depositAmount > 0 &&
    !!receiptFile;

  // Confirm booking with receipt
  const handleConfirmWithReceipt = () => {
    if (selectedDates.some((d) => d < todayStr)) {
      alert('يمنع إنشاء أو قبول أي حجز على تواريخ فائتة.');
      return;
    }
    if (!isConfirmReady || !receiptFile) return;

    const { booking, whatsappContractUrl, contractText } = confirmBookingWithReceipt({
      propertyId: selectedPropertyId,
      dates: selectedDates,
      customerName: customerName.trim(),
      customerPhone,
      depositPaid: depositAmount,
      totalPrice,
      remainingAmount,
      insuranceAmount,
      receiptFileName: receiptFile.name,
      receiptDataUrl: receiptFile.dataUrl,
      marketerId: isManagement ? undefined : selectedMarketerId,
      commissionRatePercent: isManagement ? 0 : commissionPercent,
      sectionId: activeSection?.id,
      sectionName: activeSection?.name,
      extraServices,
      discount: hasDiscount ? discountAmount : 0,
      discountReason: hasDiscount ? discountReason : undefined,
      discountStatus: isAdmin
        ? (hasDiscount && discountAmount > 0 ? 'approved' : 'none')
        : (hasDiscount && discountAmount > 0 ? 'pending_approval' : 'none'),
      discountRequestedAmount: hasDiscount ? discountAmount : 0,
    });

    setConfirmedContractData({
      contractText,
      whatsappUrl: whatsappContractUrl,
      bookingNumber: booking.bookingNumber,
    });

    setReceiptFile(null);
    window.open(whatsappContractUrl, '_blank');
  };

  // Instant booking & contract creation
  const handleInstantBooking = () => {
    if (selectedDates.some((d) => d < todayStr)) {
      alert('يمنع إنشاء أو قبول أي حجز على تواريخ فائتة. يرجى اختيار تاريخ اليوم أو تواريخ قادمة.');
      return;
    }
    if (!isPhoneValid) {
      alert('فضلاً أدخل رقم جوال العميل لإرسال العقد عبر واتساب');
      return;
    }

    const { booking, whatsappContractUrl, contractText } = confirmBookingWithReceipt({
      propertyId: selectedPropertyId,
      dates: selectedDates,
      customerName: customerName.trim() || 'علي',
      customerPhone,
      depositPaid: depositAmount,
      totalPrice,
      remainingAmount,
      insuranceAmount,
      receiptFileName: 'حجز_فوري_معتمد.pdf',
      marketerId: isManagement ? undefined : selectedMarketerId,
      commissionRatePercent: isManagement ? 0 : commissionPercent,
      sectionId: activeSection?.id,
      sectionName: activeSection?.name,
      extraServices,
      discount: hasDiscount ? discountAmount : 0,
      discountReason: hasDiscount ? discountReason : undefined,
      discountStatus: isAdmin
        ? (hasDiscount && discountAmount > 0 ? 'approved' : 'none')
        : (hasDiscount && discountAmount > 0 ? 'pending_approval' : 'none'),
      discountRequestedAmount: hasDiscount ? discountAmount : 0,
    });

    setConfirmedContractData({
      contractText,
      whatsappUrl: whatsappContractUrl,
      bookingNumber: booking.bookingNumber,
    });

    window.open(whatsappContractUrl, '_blank');
  };

  const handleBlockSelectedDays = () => {
    if (selectedDates.length === 0) return;
    setDateOverridesBulk(selectedPropertyId, selectedDates, { status: 'blocked' });
    alert(`تم إغلاق الأيام المحددة (${selectedDates.length} يوم) لعقار ${selectedProperty.name}`);
  };

  const handleDownloadCsv = () => {
    const csvContent = `الاستراحة,${selectedProperty.name}\nتاريخ الدخول,${checkInDate}\nتاريخ الخروج,${checkOutDate}\nالليالي,${nightsCount}\nالسعر,${totalPrice}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `حجز_${selectedProperty.name}.csv`;
    link.click();
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-4 pt-1 space-y-4 font-['Tajawal',sans-serif]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#4A154B] via-[#5E17EB] to-[#43126C] rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between">
        <button
          onClick={handleDownloadCsv}
          className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white backdrop-blur-xs transition-colors cursor-pointer"
          title="تحميل تفاصيل الحجز CSV"
        >
          <Download className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <h2 className="text-base font-bold text-white tracking-tight">التقويم التفاعلي للحجوزات والأسعار</h2>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Property Select Dropdown */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-purple-100/90 flex items-center justify-between">
        <div className="relative flex-1">
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="w-full bg-[#FBF9FE] border border-purple-200/80 rounded-xl py-2 px-3 pr-4 pl-9 text-xs sm:text-sm font-bold text-[#2E1045] focus:outline-hidden focus:border-purple-500 appearance-none cursor-pointer"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs font-bold text-purple-900 mr-3 shrink-0">الاستراحة:</span>
      </div>

      {/* Unit Selector if property has multiple units (e.g. Hamran: Alma & Naya) */}
      {selectedProperty.sections && selectedProperty.sections.length > 0 && (
        <div className="bg-[#FAF7FD] p-3 rounded-2xl border border-purple-200/90 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              <span>
                {selectedProperty.id === 'montaja-al-taraf'
                  ? 'وحدات منتجع الترف (وحدتان مستقلتان ووحدتان مدمجتان تجمعان الأسعار تلقائياً):'
                  : selectedProperty.id === 'hamran'
                  ? 'الوحدة المستقلة داخل حمران:'
                  : `القسم المستقل داخل ${selectedProperty.name}:`}
              </span>
            </span>
            <span className="text-[10px] text-purple-700 font-bold bg-purple-100/70 px-2 py-0.5 rounded-md">
              {selectedProperty.id === 'montaja-al-taraf'
                ? '4 وحدات (مستقلة ومدمجة)'
                : `${selectedProperty.sections.length} وحدات مستقلة`}
            </span>
          </div>

          <div
            className={`grid grid-cols-2 ${
              selectedProperty.id === 'montaja-al-taraf'
                ? 'sm:grid-cols-4'
                : 'sm:grid-cols-2'
            } gap-1.5`}
          >
            {selectedProperty.sections.map((sec) => {
              const isSelected = activeSectionId === sec.id;
              const isCombo = sec.id.startsWith('resort-combo');
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-800 text-white border-purple-800 shadow-xs ring-1 ring-purple-600'
                      : 'bg-white text-slate-800 border-purple-200/80 hover:bg-purple-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="font-bold text-xs truncate">{sec.name}</span>
                    <span
                      className={`text-[9px] px-1 rounded font-bold shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isCombo
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isCombo ? 'مدمجة تلقائياً' : selectedProperty.id === 'montaja-al-taraf' ? 'وحدة مستقلة' : 'مستقلة'}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-90 truncate mt-0.5 font-mono">
                    {sec.priceWeekday} ر.س / الليلة
                  </span>
                </button>
              );
            })}

            {selectedProperty.id !== 'montaja-al-taraf' && selectedProperty.id !== 'al-taraf' && selectedProperty.id !== 'hamran' && (
              <button
                type="button"
                onClick={() => setActiveSectionId('all')}
                className={`p-2 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
                  activeSectionId === 'all'
                    ? 'bg-purple-800 text-white border-purple-800 shadow-xs ring-1 ring-purple-600'
                    : 'bg-white text-slate-800 border-purple-200/80 hover:bg-purple-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate">
                    كامل العقار
                  </span>
                  <span className={`text-[9px] px-1 rounded ${activeSectionId === 'all' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700 font-bold'}`}>
                    شامل
                  </span>
                </div>
                <span className="text-[10px] opacity-90 truncate mt-0.5 font-mono">
                  {selectedProperty.basePriceWeekday} ر.س / الليلة
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Customer Contacts Bar */}
      <div className="bg-gradient-to-r from-[#FBF8FE] to-[#F3EDFB] p-3 rounded-2xl border border-purple-200/90 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-purple-950">رقم جوال العميل للواتساب:</span>
            <span className="text-[9px] text-purple-600/80">يرتبط تلقائياً بكافة روابط الإرسال</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm justify-end">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="اسم العميل (اختياري)"
            dir="rtl"
            className="bg-white border border-purple-200/90 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-200 w-1/2"
          />
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            dir="ltr"
            className="bg-white border border-purple-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-purple-950 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-200 w-1/2 text-left"
          />
        </div>
      </div>

      {/* 4 Action Cards: Location, Photos, Contract, Full Data */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100/90 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Card 1: Info */}
          <div className="p-2.5 rounded-2xl bg-[#FAF8FD] hover:bg-purple-50/80 transition-all border border-purple-100 flex flex-col justify-between gap-2 text-center">
            <button onClick={() => setInfoModalType('info')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2E1045]">معلومات المكان</span>
            </button>
            <button
              onClick={sendQuickInfo}
              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#1E7E52] border border-emerald-200 py-1 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Send className="w-2.5 h-2.5" />
              <span>واتساب</span>
            </button>
          </div>

          {/* Card 2: Photos */}
          <div className="p-2.5 rounded-2xl bg-[#FAF8FD] hover:bg-purple-50/80 transition-all border border-purple-100 flex flex-col justify-between gap-2 text-center">
            <button onClick={() => setInfoModalType('photos')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2E1045]">الفيديو والصور</span>
            </button>
            <button
              onClick={sendQuickPhotos}
              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#1E7E52] border border-emerald-200 py-1 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Send className="w-2.5 h-2.5" />
              <span>واتساب</span>
            </button>
          </div>

          {/* Card 3: Location */}
          <div className="p-2.5 rounded-2xl bg-[#FAF8FD] hover:bg-purple-50/80 transition-all border border-purple-100 flex flex-col justify-between gap-2 text-center">
            <button onClick={() => setInfoModalType('location')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2E1045]">اللوكيشن</span>
            </button>
            <button
              onClick={sendQuickLocation}
              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#1E7E52] border border-emerald-200 py-1 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Send className="w-2.5 h-2.5" />
              <span>واتساب</span>
            </button>
          </div>

          {/* Card 4: Contract */}
          <div className="p-2.5 rounded-2xl bg-[#FAF8FD] hover:bg-purple-50/80 transition-all border border-purple-100 flex flex-col justify-between gap-2 text-center">
            <button onClick={() => setInfoModalType('contract')} className="flex flex-col items-center gap-1.5 cursor-pointer group">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2E1045]">استعراض العقد</span>
            </button>
            <button
              onClick={() => {
                const msg = `عقد استراحة ${selectedProperty.name}\nالعميل: ${customerName || 'عميل'}\nالشروط والأحكام:\n${selectedProperty.contractTerms.join('\n')}`;
                openWhatsAppMessageModal(msg, 'إرسال صيغة العقد عبر واتساب');
              }}
              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-[#1E7E52] border border-emerald-200 py-1 px-1.5 rounded-lg font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Send className="w-2.5 h-2.5" />
              <span>واتساب</span>
            </button>
          </div>
        </div>

        {/* Send all data at once button */}
        <div className="pt-2 border-t border-purple-100/80">
          <button
            onClick={sendFullPropertyData}
            className="btn-mauve-shiny w-full py-3 px-4 rounded-2xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>📲 إرسال معلومات المكان والصور واللوكيشن كاملة للعميل (واتساب)</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100/90 space-y-4">
        {/* Calendar sizing and Month controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-purple-50">
          <div className="flex items-center gap-1.5 bg-[#F8F5FD] p-1 rounded-xl border border-purple-100 self-stretch sm:self-auto justify-center">
            <span className="text-[10px] font-bold text-purple-900 px-1.5">حجم التقويم:</span>
            <button
              type="button"
              onClick={() => setCalendarSize('compact')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                calendarSize === 'compact' ? 'bg-purple-800 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-100/70'
              }`}
            >
              مدمج
            </button>
            <button
              type="button"
              onClick={() => setCalendarSize('normal')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                calendarSize === 'normal' ? 'bg-purple-800 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-100/70'
              }`}
            >
              قياسي
            </button>
            <button
              type="button"
              onClick={() => setCalendarSize('large')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                calendarSize === 'large' ? 'bg-purple-800 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-100/70'
              }`}
            >
              كبير ومريح
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 w-full sm:w-auto">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl border border-purple-100 hover:bg-purple-50 flex items-center justify-center text-purple-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-[#2E1045] min-w-[120px] text-center">
              {monthsAr[month]} {year}
            </h3>

            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl border border-purple-100 hover:bg-purple-50 flex items-center justify-center text-purple-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Double Booking & Range Warning Banner */}
        {blockedAlertMessage && (
          <div className="bg-rose-50 border-2 border-rose-300 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between text-rose-950 font-bold text-xs sm:text-sm animate-in fade-in slide-in-from-top-1 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                ⚠️
              </span>
              <div>
                <p className="font-extrabold text-rose-900">{blockedAlertMessage}</p>
                <p className="text-[11px] text-rose-700 font-medium">
                  يمنع النظام حجز الأيام المؤكدة بالأحمر أو اختيار فترات غير متصلة منعاً للتضارب.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBlockedAlertMessage(null)}
              className="w-7 h-7 rounded-lg bg-rose-200/70 hover:bg-rose-300 text-rose-900 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shrink-0"
              title="إغلاق التنبيه"
            >
              ✕
            </button>
          </div>
        )}

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {daysAr.map((d, idx) => (
            <span key={idx} className="text-xs font-bold text-purple-600/70 py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {daysMatrix.map((item, idx) => {
            const heightCls =
              calendarSize === 'compact' ? 'h-12 sm:h-14' : calendarSize === 'large' ? 'h-20 sm:h-24' : 'h-16 sm:h-18';

            if (!item) {
              return <div key={`empty-${idx}`} className={`${heightCls} rounded-2xl bg-[#FAF8FD]/50`} />;
            }

            const { isPast, isToday } = item;
            const isConfirmedBooked = item.status === 'booked' || !!item.booking;
            const isSelected = selectedDates.includes(item.dateKey);
            let colorCls = 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]';

            if (isPast) {
              colorCls = 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-55 cursor-not-allowed pointer-events-none';
            } else if (isConfirmedBooked) {
              colorCls = 'bg-[#FEE2E2] border-2 border-rose-500 text-rose-950 font-black shadow-xs hover:border-rose-600';
            } else if (item.status === 'waiting_deposit') {
              colorCls = 'bg-[#FEFCE8] border-[#FDE68A] text-[#854D0E]';
            } else if (item.status === 'blocked') {
              colorCls = 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]';
            }

            const todayClasses = isToday
              ? 'ring-3 ring-slate-950 border-2 border-slate-950 shadow-md scale-[1.02] z-10 !bg-white'
              : '';
            const selectedClasses = isSelected && !isToday
              ? 'ring-2 ring-[#7C3AED] ring-offset-1 bg-[#F5F3FF] border-[#7C3AED] font-black scale-102 shadow-xs'
              : isSelected && isToday
              ? 'ring-4 ring-[#7C3AED] ring-offset-1 !border-2 !border-slate-950 font-black scale-102 shadow-lg'
              : '';

            return (
              <div
                key={item.dateKey}
                onClick={() => {
                  if (isPast) return;
                  if (isConfirmedBooked) {
                    showBlockedAlert('اليوم محجوز ومؤكد باللون الأحمر — لا يمكن أخذ حجز عليه');
                    return;
                  }
                  handleDateClick(item.dateKey);
                }}
                aria-disabled={isPast || isConfirmedBooked}
                title={isConfirmedBooked ? 'اليوم محجوز ومؤكد باللون الأحمر — لا يمكن أخذ حجز عليه' : undefined}
                className={`${heightCls} rounded-2xl border flex flex-col items-center justify-between py-1.5 px-0.5 transition-all select-none relative ${colorCls} ${todayClasses} ${selectedClasses} ${
                  isPast
                    ? 'cursor-not-allowed pointer-events-none'
                    : isConfirmedBooked
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:scale-102'
                }`}
              >
                {/* Booked Locked Badge */}
                {isConfirmedBooked && !isToday && (
                  <span className="bg-rose-600 text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.2 rounded-xs shadow-xs -mt-0.5 flex items-center gap-0.5">
                    🔒 مؤكد
                  </span>
                )}
                {isToday ? (
                  <span className="bg-slate-950 text-white font-black text-[7px] sm:text-[8px] px-1.5 py-0.2 rounded-xs shadow-xs uppercase tracking-tight flex items-center gap-0.5 -mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    اليوم
                  </span>
                ) : null}

                <span
                  className={`leading-none ${
                    isToday
                      ? 'font-black text-slate-950 text-sm sm:text-base'
                      : isPast
                      ? 'font-medium text-slate-400 line-through decoration-slate-300'
                      : isConfirmedBooked
                      ? 'font-black text-rose-950'
                      : 'font-bold'
                  } ${calendarSize === 'large' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'}`}
                >
                  {item.dayNum}
                </span>

                <span
                  className={`font-mono leading-none ${
                    isPast
                      ? 'text-[9px] text-slate-400 font-medium'
                      : isToday
                      ? 'text-slate-950 font-black text-xs'
                      : isConfirmedBooked
                      ? 'text-rose-950 font-black text-[9px] sm:text-[10px]'
                      : calendarSize === 'large'
                      ? 'text-xs font-bold'
                      : 'text-[10px]'
                  }`}
                >
                  {isPast ? (item.booking ? 'محجوز' : 'فائت') : isConfirmedBooked ? 'محجوز مؤكد' : item.status === 'blocked' ? '--' : item.price}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-around gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-md bg-slate-950 border border-slate-900 text-[8px] text-white flex items-center justify-center font-black shadow-xs">
              ★
            </span>
            <span className="text-slate-950 font-black">تاريخ اليوم (بارز وغامق)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 text-slate-400 flex items-center justify-center text-[10px] line-through font-bold">
              —
            </span>
            <span className="text-slate-400 font-medium">أيام فائتة (معطلة تلقائياً)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]" />
            <span className="text-slate-600 font-medium">متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#FEE2E2] border-2 border-rose-500" />
            <span className="text-rose-950 font-bold">مؤكد أحمر (لا يمكن الحجز عليه)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#FEFCE8] border border-[#FDE68A]" />
            <span className="text-slate-600 font-medium">انتظار العربون</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#FFF1F2] border border-[#FECDD3]" />
            <span className="text-slate-600 font-medium">مغلق (صيانة)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-[#F5F3FF] border-2 border-[#7C3AED]" />
            <span className="text-purple-900 font-bold">محدد ({selectedDates.length})</span>
          </div>
        </div>
      </div>

      {/* Marketer Name & Booking Type Selector - اسم المسوق ونوع الحجز */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100/90 space-y-4 text-right">
        <div className="flex items-center justify-between border-b pb-3 border-purple-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#2E1045]">اسم المسوق ونوع الحجز</h4>
              <p className="text-[11px] text-slate-500">
                اختيار المسوق المسؤول وتحديد نوع الحجز واحتساب العمولة آلياً
              </p>
            </div>
          </div>
          {isManagement ? (
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold border border-slate-200">
              حجز إدارة (بدون عمولة)
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              عمولة {commissionPercent}% مستحقة
            </span>
          )}
        </div>

        {/* 1. حقل اسم المسوق: الإدارة - أسماء المسوقين */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
            <span>اسم المسوق</span>
            {isManagement && (
              <span className="text-[10px] text-purple-700 font-normal">
                الإدارة لا تأخذ عمولة
              </span>
            )}
          </label>
          <div className="relative">
            <select
              disabled={isAwaitingDeposit}
              value={selectedMarketerId}
              onChange={(e) => setSelectedMarketerId(e.target.value)}
              dir="rtl"
              className="w-full bg-[#FAF8FD] border border-purple-200/90 rounded-2xl py-3 px-4 text-xs sm:text-sm text-purple-950 font-bold focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
            >
              <option value="admin">الإدارة (حجز مباشر — لا عمولة 0%)</option>
              {marketers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.code})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. حقل نوع الحجز: حجز كلي 7% - حجز جزئي 5% */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">نوع الحجز</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isAwaitingDeposit}
              onClick={() => setCommissionType('full')}
              className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 flex flex-col items-center justify-center gap-0.5 ${
                commissionType === 'full'
                  ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                  : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
              }`}
            >
              <span>حجز كلي (7%)</span>
              <span className={`text-[10px] ${commissionType === 'full' ? 'text-purple-200' : 'text-slate-400'}`}>
                {isManagement ? 'لا عمولة للإدارة' : 'عمولة 7% للمسوق'}
              </span>
            </button>
            <button
              type="button"
              disabled={isAwaitingDeposit}
              onClick={() => setCommissionType('partial')}
              className={`py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 flex flex-col items-center justify-center gap-0.5 ${
                commissionType === 'partial'
                  ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                  : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
              }`}
            >
              <span>حجز جزئي (5%)</span>
              <span className={`text-[10px] ${commissionType === 'partial' ? 'text-purple-200' : 'text-slate-400'}`}>
                {isManagement ? 'لا عمولة للإدارة' : 'عمولة 5% للمسوق'}
              </span>
            </button>
          </div>
        </div>

        {/* Status explanation card */}
        {isManagement ? (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>المسوق: <strong>الإدارة</strong></span>
            </span>
            <span className="font-bold text-slate-800">
              0 ر.س (الإدارة لا تأخذ عمولة)
            </span>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                المسوق: <strong>{selectedMarketer?.name}</strong> ({commissionPercent}%)
              </span>
            </span>
            <span className="font-bold font-mono text-emerald-800">
              تضاف تلقائياً للوحة المسوق: {marketerCommission} ر.س
            </span>
          </div>
        )}
      </div>

      {/* Financial Summary Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100/90 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الدخول</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{checkInDate}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">تاريخ الخروج</span>
            <span className="font-bold text-slate-900 font-mono text-sm">{checkOutDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">عدد الليالي</span>
            <span className="font-bold text-slate-900 text-sm font-mono">{nightsCount}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">الإجمالي</span>
            <span className="font-bold text-purple-900 text-sm font-mono">{totalPrice} ر.س</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {isManagement
              ? 'عمولة المسوق (حجز مباشر للإدارة):'
              : `عمولة المسوق (${selectedMarketer?.name || ''} - ${commissionPercent}%):`}
          </span>
          <span className="font-bold text-emerald-700 font-mono text-sm">
            {isManagement ? '0 ر.س (لا عمولة)' : `${marketerCommission} ر.س`}
          </span>
        </div>
      </div>

      {/* 15-Minute Countdown Warning Banner (If awaiting deposit) */}
      {isAwaitingDeposit && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white rounded-3xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-200" />
              <span className="font-bold text-sm">الحجز معلق بانتظار تحويل العربون</span>
            </div>
            <span className="bg-black/20 text-white px-3 py-1 rounded-full font-mono font-bold text-xs">
              {Math.floor(depositSecondsLeft / 60)}:{String(depositSecondsLeft % 60).padStart(2, '0')} متبقية
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <p>
                العميل: <strong>{currentOverride?.waitingCustomerName || customerName || 'قيد الانتظار'}</strong>
              </p>
              <p>
                الجوال: <span className="font-mono">{currentOverride?.waitingCustomerPhone || customerPhone}</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-amber-100 text-[11px] block">العربون المطلوب:</span>
              <span className="font-bold text-base font-mono">{currentOverride?.waitingDepositAmount || depositAmount} ر.س</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs font-bold">
            {(canEditDeposit || isAdmin) && (
              <button
                type="button"
                onClick={() => {
                  setTempDepositValue(currentOverride?.waitingDepositAmount || depositAmount);
                  setEditDepositModalOpen(true);
                }}
                className="py-2.5 px-3 bg-white text-amber-950 rounded-xl hover:bg-amber-50 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-800" />
                <span>تعديل العربون قبل التأكيد</span>
              </button>
            )}

            {(canCreateContract || isAdmin) && (
              <button
                type="button"
                onClick={() => setInfoModalType('contract')}
                className="py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-200" />
                <span>إنشاء العقد المعتمد</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleInstantBooking}
              className="py-2.5 px-3 bg-purple-950 hover:bg-purple-900 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200" />
              <span>تأكيد الحجز النهائي</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Pending Discounts Review Banner */}
      {isAdmin && pendingDiscountBookings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 text-right">
          <div className="flex items-center justify-between border-b pb-2.5 border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                طلبات خصم معلقة بانتظار موافقة الإدارة ({pendingDiscountBookings.length})
              </h4>
            </div>
            <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
              موافقة الإدارة مطلوبة
            </span>
          </div>

          <div className="space-y-2">
            {pendingDiscountBookings.map((bk) => (
              <div
                key={bk.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{bk.customerName}</span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold">
                      {bk.bookingNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">({bk.propertyName})</span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1">
                    مبلغ الخصم المطلوب: <strong className="font-mono text-amber-700 text-sm">{bk.discountRequestedAmount || bk.discount} ر.س</strong> — السبب: <span className="font-semibold text-slate-800">{bk.discountReason || 'إلغاء الفطور'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => respondToBookingDiscount(bk.id, true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>الموافقة على الخصم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToBookingDiscount(bk.id, false)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>رفض الخصم</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Booking Form & Deposit Actions */}
      <div id="new-booking-form" className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100/90 space-y-4 scroll-mt-6">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <button
            onClick={() => {
              setSelectedDates([]);
              setCustomerName('');
              setCustomerPhone('05');
              setExtraServices([]);
              setHasDiscount(false);
              setDiscountAmount(0);
            }}
            className="text-xs text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
          >
            مسح التحديد
          </button>
          <h4 className="font-bold text-[#2E1045] text-sm sm:text-base">حجز جديد</h4>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold block text-right">اسم العميل (اختياري)</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="ادخل الاسم (اختياري)"
            dir="rtl"
            className="w-full bg-[#FAF8FD] border border-purple-200/80 rounded-2xl py-3 px-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-500 font-bold block text-right">رقم الجوال</label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            dir="ltr"
            className="w-full bg-[#FAF8FD] border border-purple-200/80 rounded-2xl py-3 px-4 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-mono text-left"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-600 font-bold block text-right flex items-center gap-1.5">
              <span>العربون المطلوب</span>
              {(canEditDeposit || isAdmin) && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                  ✓ مصرح لك بتعديل العربون
                </span>
              )}
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              الافتراضي: {selectedProperty.defaultDeposit || 250} ر.س
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
              disabled={!canEditDeposit && !isAdmin}
              placeholder="0"
              dir="rtl"
              className="w-full bg-[#FAF8FD] border border-purple-200/80 rounded-2xl py-3 px-4 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-mono font-bold"
            />
          </div>
        </div>

        {/* Section: خدمات حمران وطلب الخصم */}
        <div className="rounded-3xl border-2 border-purple-200/90 bg-gradient-to-b from-[#FAF7FD] to-[#F5EEFD] p-4 sm:p-5 space-y-4 shadow-xs text-right">
          <div className="flex items-center justify-between border-b pb-3 border-purple-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="font-extrabold text-[#2E1045] text-xs sm:text-sm flex items-center gap-2">
                  <span>{selectedPropertyId === 'hamran' ? 'خدمات حمران وطلب الخصم' : `خدمات ${selectedProperty.name} وطلب الخصم`}</span>
                  <span className="text-[10px] bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full font-bold border border-purple-200">
                    خاص بالحجز والعقد
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  إضافة خدمات لعرض العميل والعقد تلقائياً + طلب خصم معتمد من الإدارة
                </p>
              </div>
            </div>
          </div>

          {/* 1. إضافة خدمة */}
          <div className="space-y-2.5 bg-white p-3.5 rounded-2xl border border-purple-100/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-700" />
                <span>إضافة خدمة إضافية (مساج، تنسيق الغرفة، بوفيه...)</span>
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                دون موافقة الإدارة ✓
              </span>
            </div>

            <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100 text-[11px] text-purple-950 leading-relaxed font-medium">
              ℹ️ من قسم «خدمات حمران وطلب الخصم»، اضغطي <strong>«إضافة خدمة»</strong>، واكتبي اسمها مثل المساج أو تنسيق الغرفة ومبلغها.
              تُضاف الخدمة إلى عرض العميل والعقد تلقائيًا، دون موافقة الإدارة. مبلغها لا يدخل في التقويم أو العمولة.
            </div>

            {/* Quick suggestions tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 self-center">أمثلة سريعة:</span>
              {[
                { name: 'مساج', price: 200 },
                { name: 'تنسيق الغرفة', price: 150 },
                { name: 'بوفيه إضافي', price: 300 },
                { name: 'سلة فواكه وضيافة', price: 100 },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const newSvc: BookingService = {
                      id: `svc-${Date.now()}-${idx}`,
                      name: preset.name,
                      price: preset.price,
                    };
                    setExtraServices((prev) => [...prev, newSvc]);
                  }}
                  className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>+ {preset.name}</span>
                  <span className="font-mono text-purple-700 font-black">({preset.price} ر.س)</span>
                </button>
              ))}
            </div>

            {/* List of currently added services */}
            {extraServices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-purple-950 block">الخدمات المضافة لهذا الحجز:</span>
                <div className="space-y-1">
                  {extraServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="flex items-center justify-between p-2 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        <span className="font-bold text-slate-900">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-purple-950 text-sm">
                          +{Number(svc.price).toLocaleString('ar-SA')} ر.س
                        </span>
                        <button
                          type="button"
                          onClick={() => setExtraServices((prev) => prev.filter((s) => s.id !== svc.id))}
                          className="w-6 h-6 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="حذف الخدمة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center px-1 text-xs pt-1">
                  <span className="text-slate-500 font-medium">إجمالي الخدمات الإضافية المضافة:</span>
                  <span className="font-black font-mono text-purple-950 text-sm">
                    +{extraServicesTotal.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>
            )}

            {/* Add Custom Service Input Row / Button */}
            {showAddServiceForm ? (
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      اسم الخدمة (مثل: مساج أو تنسيق الغرفة):
                    </label>
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="مثال: مساج، تنسيق الغرفة..."
                      dir="rtl"
                      className="w-full bg-white border border-purple-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      مبلغ الخدمة (بالريال):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="200"
                        dir="rtl"
                        className="w-full bg-white border border-purple-200 rounded-xl py-2 px-3 pr-4 pl-9 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-purple-600"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                        ر.س
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddServiceForm(false);
                      setNewServiceName('');
                      setNewServicePrice('');
                    }}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newServiceName.trim()) return;
                      const priceNum = Math.max(0, Number(newServicePrice) || 0);
                      const newSvc: BookingService = {
                        id: `svc-${Date.now()}`,
                        name: newServiceName.trim(),
                        price: priceNum,
                      };
                      setExtraServices((prev) => [...prev, newSvc]);
                      setNewServiceName('');
                      setNewServicePrice('');
                      setShowAddServiceForm(false);
                    }}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  >
                    حفظ وإضافة الخدمة
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddServiceForm(true)}
                className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-dashed border-purple-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-purple-700" />
                <span>{extraServices.length > 0 ? '+ إضافة خدمة أخرى' : '+ إضافة خدمة'}</span>
              </button>
            )}
          </div>

          {/* 2. حقل طلب الخصم */}
          <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-purple-100/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-800">حقل طلب الخصم (مثل: إلغاء الفطور أو تخفيض)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => {
                    setHasDiscount(e.target.checked);
                    if (!e.target.checked) setDiscountAmount(0);
                    else if (discountAmount === 0) setDiscountAmount(100);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-700" />
              </label>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              إذا طلب العميل إلغاء الفطور مثلًا، ندخل مبلغ الخصم وسببه، ثم حفظ طلب الحجز.
              يصل تنبيه للإدارة للموافقة أو الرفض. بعد الموافقة، يتحدث سعر الحجز في التقويم والعقد وتُحسب العمولة على السعر بعد الخصم.
            </p>

            {hasDiscount && (
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/90 space-y-2.5 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      مبلغ الخصم (بالريال):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                        placeholder="100"
                        dir="rtl"
                        className="w-full bg-white border border-amber-300 rounded-xl py-2 px-3 pr-4 pl-9 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-600"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                        ر.س
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      سبب الخصم:
                    </label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="مثال: إلغاء الفطور"
                      dir="rtl"
                      className="w-full bg-white border border-amber-300 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/60">
                  <span className="text-amber-900 font-medium">حالة الاعتماد:</span>
                  {isAdmin ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      ✓ خصم معتمد مباشرة (بصفتك إدارة)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      ⏳ سيُرسل تنبيه للإدارة للموافقة أو الرفض
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. ملخص الحسبة الدقيقة (نفس مثال العميل تماماً) */}
          <div className="bg-[#2E1045] text-white p-4 rounded-2xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between border-b border-purple-800/80 pb-2">
              <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>ملخص الحسبة الدقيقة (حسب معايير الإدارة):</span>
              </span>
              <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full font-mono">
                {nightsCount} {nightsCount === 1 ? 'ليلة' : 'ليالٍ'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-purple-300 block mb-0.5">سعر الوحدة</span>
                <span className="font-mono font-black text-sm">{totalPrice.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-amber-300 block mb-0.5">
                  الخصم {hasDiscount ? `(${discountReason || 'إلغاء الفطور'})` : ''}
                </span>
                <span className="font-mono font-black text-sm text-amber-300">
                  {hasDiscount && discountAmount > 0 ? `-${discountAmount.toLocaleString('ar-SA')}` : '0'} ر.س
                </span>
              </div>

              <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-400/30">
                <span className="text-[10px] text-emerald-200 block mb-0.5">سعر التقويم وأساس العمولة</span>
                <span className="font-mono font-black text-sm text-emerald-300">
                  {calendarPrice.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-purple-300 block mb-0.5">الخدمات الإضافية</span>
                <span className="font-mono font-black text-sm text-purple-200">
                  +{extraServicesTotal.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-purple-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-purple-300">✅ إجمالي العميل في العرض والعقد:</span>
                <strong className="font-mono text-base text-amber-300 font-black">
                  {clientTotal.toLocaleString('ar-SA')} ر.س
                </strong>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-purple-200">
                <span>
                  عمولة المسوق ({isManagement ? 'إدارة' : `${commissionPercent}%`}):{' '}
                  <strong className="font-mono text-emerald-300 font-bold">
                    {isManagement ? '0 ر.س (إدارة)' : `${marketerCommission.toLocaleString('ar-SA')} ر.س`}
                  </strong>
                </span>
                <span className="text-slate-400">|</span>
                <span>
                  التأمين المستقل:{' '}
                  <strong className="font-mono text-amber-200">{insuranceAmount} ر.س</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 15-Minute Deposit Request Button */}
        <button
          onClick={handleRequestDeposit}
          disabled={!isPhoneValid}
          className="btn-amber-shiny w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:animate-none"
        >
          <Clock className="w-4 h-4 text-amber-900" />
          <span>طلب العربون (مهلة 15 دقيقة)</span>
        </button>

        {!isPhoneValid && (
          <p className="text-[10px] text-center text-slate-500 -mt-1">
            أدخل رقم جوال العميل لتفعيل زر طلب العربون
          </p>
        )}

        {/* Receipt Attachment & Confirmation Section */}
        <div className="rounded-2xl border border-purple-100 bg-[#FAF8FD] p-3 space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer bg-white border border-dashed border-purple-300 rounded-xl px-3 py-2.5 text-xs text-purple-900 font-bold hover:bg-purple-50/50 transition-colors">
            <Paperclip className="w-4 h-4 text-purple-700" />
            <span className="truncate">{receiptFile?.name || 'إرفاق صورة الإيصال البنكي'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleReceiptChange(e.target.files?.[0])}
            />
          </label>

          {receiptError && <p className="text-[10px] text-rose-700 font-bold">{receiptError}</p>}

          {receiptFile && (
            <div className="relative">
              <img
                src={receiptFile.dataUrl}
                alt="صورة الإيصال البنكي"
                className="w-full max-h-48 object-contain rounded-xl border border-slate-200 bg-white"
              />
              <button
                type="button"
                onClick={() => setReceiptFile(null)}
                className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full bg-white/90 border border-slate-200 text-rose-600 flex items-center justify-center cursor-pointer hover:bg-rose-50"
                title="حذف الصورة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={handleConfirmWithReceipt}
            disabled={!isConfirmReady}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد الحجز</span>
          </button>

          {!isConfirmReady && (
            <p className="text-[10px] text-center text-slate-500">
              لتفعيل الزر:{' '}
              {[
                selectedDates.length === 0 && 'اختر الأيام',
                customerName.trim() === '' && 'اسم العميل',
                !isPhoneValid && 'رقم الجوال',
                !(depositAmount > 0) && 'مبلغ العربون',
                !receiptFile && 'صورة الإيصال البنكي',
              ]
                .filter(Boolean)
                .join(' - ')}
            </p>
          )}
        </div>

        {/* Instant Booking Button */}
        <button
          onClick={handleInstantBooking}
          className="btn-mauve-shiny w-full py-4 px-4 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>حجز فوري ({nightsCount} ليلة) وإصدار العقد</span>
        </button>
      </div>

      {/* Info / Photos / Location / Contract Modal */}
      {infoModalType && (
        <div
          onClick={() => setInfoModalType(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[85vh]"
          >
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                {infoModalType === 'info' && <MapPin className="w-4 h-4 text-purple-300" />}
                {infoModalType === 'photos' && <Film className="w-4 h-4 text-purple-300" />}
                {infoModalType === 'location' && <MapPin className="w-4 h-4 text-purple-300" />}
                {infoModalType === 'contract' && <FileText className="w-4 h-4 text-purple-300" />}
                <span>
                  {infoModalType === 'info' && `معلومات استراحة ${selectedProperty.name}`}
                  {infoModalType === 'photos' && `ألبوم صور وفيديو ${selectedProperty.name}`}
                  {infoModalType === 'location' && `لوكيشن استراحة ${selectedProperty.name}`}
                  {infoModalType === 'contract' && `عقد استراحة ${selectedProperty.name}`}
                </span>
              </h4>
              <button
                onClick={() => setInfoModalType(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {infoModalType === 'info' && (
                <div className="space-y-3">
                  <p className="text-slate-700 leading-relaxed font-medium">{selectedProperty.subtitle}</p>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-slate-700">
                    <div>• السعة: <strong>{selectedProperty.capacity} فرد</strong></div>
                    <div>• غرف النوم: <strong>{selectedProperty.bedrooms}</strong></div>
                    <div>• دورات المياه: <strong>{selectedProperty.bathrooms}</strong></div>
                    <div>• المساحة: <strong>{selectedProperty.areaM2} م²</strong></div>
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      • المسبح: {selectedProperty.poolType}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl text-purple-950 space-y-1">
                    <p>• وقت الدخول: {selectedProperty.checkInTimeText}</p>
                    <p>• وقت الخروج: {selectedProperty.checkOutTimeText}</p>
                    <p>• التأمين المسترد: {insuranceAmount} ريال</p>
                  </div>
                </div>
              )}

              {infoModalType === 'photos' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedProperty.images || [selectedProperty.coverImage]).map((img, idx) => (
                      <div key={idx} className="h-28 rounded-2xl overflow-hidden border border-purple-100">
                        <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {infoModalType === 'location' && (
                <div className="space-y-3 text-center">
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-1">
                    <p className="font-bold text-slate-900">{selectedProperty.location}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedProperty.name} ${selectedProperty.location}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 text-white font-bold text-xs shadow-md"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>فتح الموقع مباشرة على خرائط Google</span>
                  </a>
                </div>
              )}

              {infoModalType === 'contract' && (
                <div className="space-y-3.5">
                  <div className="bg-gradient-to-r from-[#200738] to-[#391263] text-white p-3.5 rounded-2xl flex items-center justify-between border border-purple-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-black text-amber-300 text-sm">AMASA</span>
                        <h5 className="font-bold text-xs">عقد إيجار شاليه موثق</h5>
                      </div>
                      <p className="text-[10px] text-purple-200 mt-0.5">
                        صيغة العقد المعتمدة لـ ({selectedProperty.name})
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                      موثق ومعتمد
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200 text-slate-700">
                      <div>المؤجر: <strong>إدارة AMASA</strong></div>
                      <div>المستأجر: <strong>{customerName || 'العميل الكريم'}</strong></div>
                      <div>رقم الجوال: <strong className="font-mono">{customerPhone}</strong></div>
                      <div>الفترة: <strong>{nightsCount} ليلة ({checkInDate} إلى {checkOutDate})</strong></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-purple-50/80 p-2 rounded-xl border border-purple-100 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">الإجمالي:</span>
                        <strong className="font-mono text-purple-900">{totalPrice} ر.س</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">العربون:</span>
                        <strong className="font-mono text-amber-800">{depositAmount} ر.س</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">المتبقي:</span>
                        <strong className="font-mono text-emerald-800">{remainingAmount} ر.س</strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="font-bold text-[#2E1045] flex items-center justify-between">
                        <span>شروط وأحكام العقد المعتمدة:</span>
                        {(canCreateContract || isAdmin) && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                            ✓ صلاحية إنشاء العقد مفعلة
                          </span>
                        )}
                      </p>
                      <div className="space-y-1 max-h-36 overflow-y-auto text-slate-700 pr-1">
                        {selectedProperty.contractTerms.map((term, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60">
                            <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{term}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-purple-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setInfoModalType(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  if (infoModalType === 'info') sendQuickInfo();
                  else if (infoModalType === 'photos') sendQuickPhotos();
                  else if (infoModalType === 'location') sendQuickLocation();
                  else if (infoModalType === 'contract') {
                    const msg = `عقد إيجار شاليه ${selectedProperty.name} (منصة AMASA)\nالعميل: ${customerName || 'عميل'}\nالجوال: ${customerPhone}\nالفترة: من ${checkInDate} إلى ${checkOutDate} (${nightsCount} ليلة)\nالإجمالي: ${totalPrice} ريال | العربون: ${depositAmount} ريال | المتبقي: ${remainingAmount} ريال | التأمين: ${insuranceAmount} ريال\n\nالشروط والأحكام:\n${selectedProperty.contractTerms.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
                    openWhatsAppMessageModal(msg);
                  }
                  setInfoModalType(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال هذا المحتوى للعميل عبر واتساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Contract Modal */}
      {confirmedContractData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-l from-purple-900 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base">تم اعتماد الحجز وتوليد العقد المعتمد</h4>
                <span className="text-xs text-purple-200 font-mono">{confirmedContractData.bookingNumber}</span>
              </div>
              <button
                onClick={() => setConfirmedContractData(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200 text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed select-text shadow-inner">
                {confirmedContractData.contractText}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-purple-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setConfirmedContractData(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
              <a
                href={confirmedContractData.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال العقد عبر واتساب للعميل</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Message Sent / Preview Modal */}
      {sentMessageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-200" />
                <h4 className="font-bold text-sm sm:text-base">{sentMessageData.title}</h4>
              </div>
              <button
                onClick={() => setSentMessageData(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs flex-1">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 flex items-center justify-between gap-2">
                <span className="font-bold text-emerald-950">رقم جوال العميل:</span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    const nextPhone = e.target.value;
                    setCustomerPhone(nextPhone);
                    const clean = nextPhone.replace(/\D/g, '').replace(/^0/, '966');
                    const nextUrl = `https://wa.me/${clean}?text=${encodeURIComponent(sentMessageData.text)}`;
                    setSentMessageData({ ...sentMessageData, phone: nextPhone, whatsappUrl: nextUrl });
                  }}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 font-mono font-bold text-emerald-900 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-200 w-36 text-left"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">نص الرسالة المرسلة للعميل:</span>
                <div className="bg-[#EFEAE2] p-3.5 rounded-2xl border border-slate-300 text-slate-900 whitespace-pre-wrap font-sans text-xs leading-relaxed max-h-64 overflow-y-auto select-text shadow-inner">
                  {sentMessageData.text}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sentMessageData.text);
                  alert('تم نسخ نص الرسالة إلى الحافظة بنجاح');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>نسخ النص</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSentMessageData(null)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  إغلاق
                </button>
                <a
                  href={sentMessageData.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setSentMessageData(null)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>فتح واتساب الآن</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Deposit Modal */}
      {editDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-purple-100 flex flex-col">
            <div className="bg-gradient-to-l from-amber-600 via-amber-700 to-yellow-700 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-200" />
                <h4 className="font-bold text-base">تعديل مبلغ العربون قبل تأكيد الحجز</h4>
              </div>
              <button
                onClick={() => setEditDepositModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-950">
                <p className="font-bold">صلاحية الموظف لتعديل العربون:</p>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  يمكنك تعديل وتخصيص قيمة العربون المطلوبة من العميل قبل اعتماد الحجز النهائي، وسيتم تحديث الحسابات فورياً.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">مبلغ العربون الجديد (بالريال):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tempDepositValue}
                    onChange={(e) => setTempDepositValue(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    dir="rtl"
                    className="w-full bg-[#FAF8FD] border border-amber-300 rounded-2xl py-3 px-4 text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-xs pointer-events-none">
                    ر.س
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 font-bold block">
                  نسب مقترحة من إجمالي الحجز ({totalPrice} ر.س):
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTempDepositValue(Math.round(totalPrice * 0.2))}
                    className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 text-center text-[11px] cursor-pointer"
                  >
                    20% ({Math.round(totalPrice * 0.2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempDepositValue(Math.round(totalPrice * 0.3))}
                    className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 text-center text-[11px] cursor-pointer"
                  >
                    30% ({Math.round(totalPrice * 0.3)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempDepositValue(Math.round(totalPrice * 0.5))}
                    className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-xl border border-purple-200 text-center text-[11px] cursor-pointer"
                  >
                    50% ({Math.round(totalPrice * 0.5)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempDepositValue(selectedProperty.defaultDeposit || 250)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center text-[11px] cursor-pointer"
                  >
                    الافتراضي
                  </button>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600 font-sans">المتبقي للتحصيل:</span>
                <span className="font-bold text-purple-900 text-sm">
                  {Math.max(0, totalPrice - tempDepositValue)} ر.س
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-purple-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setEditDepositModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  setDepositAmount(tempDepositValue);
                  if (selectedDates.length > 0) {
                    updateWaitingDepositAmount(selectedPropertyId, selectedDates, tempDepositValue);
                  }
                  setEditDepositModalOpen(false);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتحديث العربون فورياً</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Send Discount Request to Management Modal - إرسال طلب الخصم للإدارة */}
      {discountModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 text-right">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-purple-100 flex flex-col">
            <div className="bg-gradient-to-l from-purple-900 via-indigo-900 to-purple-950 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base">إرسال طلب الخصم للإدارة</h4>
                  <span className="text-[10px] text-purple-200 font-mono">
                    {discountModalBooking.bookingNumber} - {discountModalBooking.customerName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDiscountModalBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200/90 text-purple-950">
                <p className="font-bold text-xs flex items-center gap-1.5 text-purple-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>طلب خصم معتمد (إلغاء فطور أو سبب آخر):</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  سيصل تنبيه فوري للإدارة بالمبلغ والسبب لمراجعة الطلب والموافقة عليه أو رفضه. بعد الموافقة، يتحدث سعر الحجز بالتقويم والعقد وتُحسب العمولة على السعر بعد الخصم.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">مبلغ الخصم المطلوب (بالريال):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={modalDiscountAmount}
                    onChange={(e) => setModalDiscountAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="100"
                    dir="rtl"
                    className="w-full bg-[#FAF8FD] border border-purple-300 rounded-2xl py-3 px-4 text-base font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-xs pointer-events-none">
                    ر.س
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">سبب طلب الخصم:</label>
                <input
                  type="text"
                  value={modalDiscountReason}
                  onChange={(e) => setModalDiscountReason(e.target.value)}
                  placeholder="مثال: إلغاء الفطور"
                  dir="rtl"
                  className="w-full bg-[#FAF8FD] border border-purple-300 rounded-2xl py-3 px-4 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">سعر الحجز الحالي:</span>
                <span className="font-bold text-purple-950 font-mono text-sm">{discountModalBooking.totalPrice} ر.س</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-purple-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDiscountModalBooking(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (modalDiscountAmount <= 0) {
                    alert('فضلاً أدخل مبلغ الخصم المطلوب');
                    return;
                  }
                  requestBookingDiscount(discountModalBooking.id, modalDiscountAmount, modalDiscountReason || 'إلغاء الفطور');
                  setDiscountModalBooking(null);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>إرسال طلب الخصم للإدارة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
