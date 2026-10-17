import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  SlidersHorizontal,
  Link2,
  RefreshCw,
  Copy,
  Check,
  Plus,
  Layers,
  AlertTriangle,
  Pencil,
  Award,
  ShieldCheck,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Property } from '../../types';
import {
  getResolvedDatePrice,
  isDateBookedCrossProperty,
  isDateBlockedCrossProperty,
  getConsecutiveDatesRange,
  areDatesConsecutive,
  checkBookingRangeAvailability,
} from '../../lib/pricingService';
import { AddPropertyModal } from '../modals/AddPropertyModal';
import { AddUnitModal } from '../modals/AddUnitModal';
import { AdminPricingModal } from '../modals/AdminPricingModal';

export const CalendarTab: React.FC = () => {
  const {
    properties,
    selectedPropertyId,
    selectedProperty,
    setSelectedPropertyId,
    bookings,
    dateOverrides,
    setDateOverridesBulk,
    applySeasonalPricingPattern,
    togglePropertyPublished,
    setActiveTab,
    setBookingModalOpen,
    setPreselectedDateForBooking,
    setPreselectedDatesForBooking,
    setPreselectedSectionForBooking,
    setPreselectedCommissionType,
    nowTimestamp,
    triggerBrowserNotification,
    isAdmin,
    userRole,
    currentMarketer,
    operatingSettings,
  } = useApp();

  const todayStr = useMemo(() => {
    const now = new Date(nowTimestamp || Date.now());
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [nowTimestamp]);

  const [activeSectionId, setActiveSectionId] = useState<string>('all');
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [isAdminPricingModalOpen, setIsAdminPricingModalOpen] = useState(false);
  const [previewAsMarketer, setPreviewAsMarketer] = useState(false);
  const [pricingViewTab, setPricingViewTab] = useState<'partial' | 'full' | 'um_seif'>('full');
  const [showNightDetails, setShowNightDetails] = useState<boolean>(false);
  const [selectMode, setSelectMode] = useState<'range' | 'multi'>('range');
  const [selectedDates, setSelectedDates] = useState<string[]>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return [`${y}-${m}-${d}`];
  });
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [month, setMonth] = useState<number>(() => new Date().getMonth()); // 0-indexed
  const [priceInput, setPriceInput] = useState<number>(3000);
  const [panelMode, setPanelMode] = useState<'prices' | 'seasons'>('prices');
  const [targetStatus, setTargetStatus] = useState<'available' | 'blocked'>('available');
  const [savedStatusSuccess, setSavedStatusSuccess] = useState(false);
  const [savedPriceSuccess, setSavedPriceSuccess] = useState(false);
  const [calendarSize, setCalendarSize] = useState<'compact' | 'normal' | 'large'>('normal');

  // Double-booking prevention alert state
  const [blockedAlertMessage, setBlockedAlertMessage] = useState<string | null>(null);
  const blockedAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBlockedAlert = useCallback(
    (msg = 'اليوم محجوز ومؤكد ولا يمكن تكرار الحجز') => {
      setBlockedAlertMessage(msg);
      triggerBrowserNotification('⚠️ منع الحجز المزدوج', msg, 'system');
      if (blockedAlertTimeoutRef.current) clearTimeout(blockedAlertTimeoutRef.current);
      blockedAlertTimeoutRef.current = setTimeout(() => {
        setBlockedAlertMessage(null);
      }, 4500);
    },
    [triggerBrowserNotification]
  );

  const activeSection = useMemo(() => {
    if (!selectedProperty.sections || selectedProperty.sections.length === 0 || activeSectionId === 'all') {
      return null;
    }
    return selectedProperty.sections.find((s) => s.id === activeSectionId) || null;
  }, [selectedProperty, activeSectionId]);

  useEffect(() => {
    if ((selectedProperty.id === 'montaja-al-taraf' || selectedProperty.id === 'al-taraf' || selectedProperty.id === 'hamran') && activeSectionId === 'all') {
      if (selectedProperty.sections && selectedProperty.sections.length > 0) {
        setActiveSectionId(selectedProperty.sections[0].id);
      }
    }
  }, [selectedProperty.id, selectedProperty.sections, activeSectionId]);

  const isDateBooked = useCallback(
    (dateKey: string) => {
      return isDateBookedCrossProperty(selectedPropertyId, activeSection?.id, dateKey, bookings).isBooked;
    },
    [bookings, selectedPropertyId, activeSection]
  );

  // Filter out any past or already booked dates from selectedDates automatically
  useEffect(() => {
    setSelectedDates((prev) => {
      const filtered = prev.filter((d) => d >= todayStr && !isDateBooked(d));
      return filtered.length > 0 ? filtered : [todayStr];
    });
  }, [todayStr, isDateBooked]);

  useEffect(() => {
    if (selectedProperty.sections && selectedProperty.sections.length > 0) {
      setActiveSectionId(selectedProperty.sections[0].id);
    } else {
      setActiveSectionId('all');
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (activeSection) {
      setPriceInput(activeSection.priceWeekday);
    } else if (selectedProperty) {
      setPriceInput(selectedProperty.basePriceWeekday);
    }
  }, [activeSection, selectedProperty]);

  // iCal sync modal state
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [gathernIcalUrl, setGathernIcalUrl] = useState('');
  const [bookingIcalUrl, setBookingIcalUrl] = useState('');
  const [airbnbIcalUrl, setAirbnbIcalUrl] = useState('');

  const [syncStatuses, setSyncStatuses] = useState<Record<string, { gathern?: boolean; booking?: boolean; airbnb?: boolean; lastSync?: string }>>(() => {
    try {
      const saved = localStorage.getItem('property_calendar_sync_status');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'al-taraf': { gathern: true, booking: true, airbnb: false, lastSync: 'منذ 5 دقائق' },
      'al-baylasan': { gathern: true, booking: false, airbnb: false, lastSync: 'منذ 18 دقيقة' },
      'montaja-al-taraf': { gathern: true, booking: true, airbnb: false, lastSync: 'منذ دقيقة' },
      rans: { gathern: false, booking: false, airbnb: false },
      hamran: { gathern: false, booking: false, airbnb: false },
    };
  });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleManualSync = () => {
    setSyncing(true);
    setSyncSuccessMsg(null);
    setTimeout(() => {
      setSyncing(false);
      const updated = {
        ...syncStatuses,
        [selectedPropertyId]: {
          gathern: !!gathernIcalUrl || syncStatuses[selectedPropertyId]?.gathern || true,
          booking: !!bookingIcalUrl || syncStatuses[selectedPropertyId]?.booking || true,
          airbnb: !!airbnbIcalUrl || syncStatuses[selectedPropertyId]?.airbnb || false,
          lastSync: 'الآن',
        },
      };
      setSyncStatuses(updated);
      try {
        localStorage.setItem('property_calendar_sync_status', JSON.stringify(updated));
        const urlsObj = { [selectedPropertyId]: { gathern: gathernIcalUrl, booking: bookingIcalUrl, airbnb: airbnbIcalUrl } };
        localStorage.setItem('property_calendar_sync_urls', JSON.stringify(urlsObj));
      } catch {}
      setSyncSuccessMsg('تمت مزامنة وتقييد الحجوزات مع جاذر إن وبوكينج بنجاح!');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    }, 1200);
  };

  const monthsAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const daysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

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

  const daysMatrix = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: (null | {
      dayNum: number;
      dateKey: string;
      price: number;
      status: 'available' | 'booked' | 'blocked' | 'waiting_deposit';
      booking?: (typeof bookings)[0];
      depositRemainingSeconds: number;
      override?: (typeof dateOverrides)[string];
      isPast: boolean;
      isToday: boolean;
    })[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      items.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthPadded}-${dayPadded}`;
      const dayDate = new Date(year, month, d);
      const isWeekend = (operatingSettings?.weekendDays || [4, 5]).includes(dayDate.getDay());
      const unitKey = activeSection
        ? `${selectedPropertyId}_${activeSection.id}_${dateKey}`
        : `${selectedPropertyId}_${dateKey}`;
      const override = dateOverrides[unitKey] || dateOverrides[`${selectedPropertyId}_${dateKey}`];
      const price = getResolvedDatePrice(
        selectedPropertyId,
        activeSection?.id,
        dateKey,
        dateOverrides,
        properties,
        operatingSettings?.weekendDays
      );

      const { isBooked: crossBooked, matchedBooking } = isDateBookedCrossProperty(
        selectedPropertyId,
        activeSection?.id,
        dateKey,
        bookings
      );
      const { isBlocked: crossBlocked, isWaitingDeposit, waitingDepositExpiresAt } = isDateBlockedCrossProperty(
        selectedPropertyId,
        activeSection?.id,
        dateKey,
        dateOverrides
      );

      const isPast = dateKey < todayStr;
      const isToday = dateKey === todayStr;

      let status: 'available' | 'booked' | 'blocked' | 'waiting_deposit' = 'available';
      if (isPast) {
        // Automatically disabled & closed for all past dates
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

      let depositRemainingSeconds = 0;
      if (isWaitingDeposit && waitingDepositExpiresAt) {
        depositRemainingSeconds = Math.max(0, Math.floor((waitingDepositExpiresAt - nowTimestamp) / 1000));
      }

      items.push({
        dayNum: d,
        dateKey,
        price,
        status,
        booking: matchedBooking,
        depositRemainingSeconds,
        override,
        isPast,
        isToday,
      });
    }

    return items;
  }, [year, month, selectedPropertyId, selectedProperty, activeSection, bookings, dateOverrides, nowTimestamp, todayStr]);

  const handleDateClick = (dateKey: string) => {
    // 1. Strictly disable past dates
    if (dateKey < todayStr) return;

    // 2. Strictly prevent booking on confirmed red booked days (Rule 1)
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
      if (dateKey === start) {
        return;
      }
      // Propose range from start to dateKey
      const proposedRange = getConsecutiveDatesRange(start, dateKey);
      const check = checkBookingRangeAvailability(selectedPropertyId, activeSection?.id, proposedRange, bookings);
      if (!check.isFree) {
        showBlockedAlert(check.errorMessage || 'الحجز يتخلله أيام محجوزة');
        return;
      }
      setSelectedDates(proposedRange);
      return;
    }

    // Range already has 2 or more dates
    const start = selectedDates[0];
    const end = selectedDates[selectedDates.length - 1];

    if (dateKey === end) {
      // Shorten by 1 day from the end
      setSelectedDates(selectedDates.slice(0, -1));
      return;
    }

    if (dateKey === start) {
      // Shorten by 1 day from the start
      setSelectedDates(selectedDates.slice(1));
      return;
    }

    if (dateKey > end) {
      // Extending range forward
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
      // Extending backward or starting fresh
      const proposedRange = getConsecutiveDatesRange(dateKey, end);
      const check = checkBookingRangeAvailability(selectedPropertyId, activeSection?.id, proposedRange, bookings);
      if (check.isFree) {
        setSelectedDates(proposedRange);
      } else {
        // If extending backward crosses booked days, start fresh at clicked dateKey
        setSelectedDates([dateKey]);
      }
      return;
    }

    // Date is inside existing range: cut range to dateKey
    const proposedRange = getConsecutiveDatesRange(start, dateKey);
    setSelectedDates(proposedRange);
  };

  const sortedSelected = useMemo(() => [...selectedDates].sort(), [selectedDates]);
  const checkInDate = sortedSelected[0] || todayStr;
  const lastSelectedDate = sortedSelected[sortedSelected.length - 1] || checkInDate;

  const checkOutDate = useMemo(() => {
    const d = new Date(lastSelectedDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [lastSelectedDate]);

  const totalNights = Math.max(1, selectedDates.length);
  const selectedNightsCount = Math.max(1, selectedDates.length);
  const nightsLabel =
    selectedNightsCount === 1
      ? 'ليلة واحدة محددة'
      : selectedNightsCount === 2
      ? 'ليلتان محددتان'
      : `${selectedNightsCount} ليالٍ محددة`;

  const estimatedTotal = useMemo(() => {
    let sum = 0;
    sortedSelected.forEach((d) => {
      const unitKey = activeSection
        ? `${selectedPropertyId}_${activeSection.id}_${d}`
        : `${selectedPropertyId}_${d}`;
      const ov = dateOverrides[unitKey] || dateOverrides[`${selectedPropertyId}_${d}`];
      if (ov?.price !== undefined) {
        sum += ov.price;
      } else {
        const dateObj = new Date(d);
        const isWk = (operatingSettings?.weekendDays || [4, 5]).includes(dateObj.getDay());
        const bp = activeSection
          ? (isWk ? activeSection.priceWeekend : activeSection.priceWeekday)
          : (isWk ? selectedProperty.basePriceWeekend : selectedProperty.basePriceWeekday);
        sum += bp;
      }
    });
    return sum;
  }, [sortedSelected, dateOverrides, selectedPropertyId, selectedProperty, activeSection, operatingSettings]);

  const estimatedCommission = Math.round(
    estimatedTotal * ((operatingSettings?.marketerCommissions?.partial ?? 5) / 100)
  );

  const currentFirstDateKey = sortedSelected[0] || todayStr;
  const currentUnitKey = activeSection
    ? `${selectedPropertyId}_${activeSection.id}_${currentFirstDateKey}`
    : `${selectedPropertyId}_${currentFirstDateKey}`;
  const currentDateOverride = dateOverrides[currentUnitKey] || dateOverrides[`${selectedPropertyId}_${currentFirstDateKey}`];

  const currentNightlyPrice = useMemo(() => {
    if (currentDateOverride?.price !== undefined) {
      return currentDateOverride.price;
    }
    const dateObj = new Date(currentFirstDateKey);
    const isWk = (operatingSettings?.weekendDays || [4, 5]).includes(dateObj.getDay());
    return activeSection
      ? (isWk ? activeSection.priceWeekend : activeSection.priceWeekday)
      : (isWk ? selectedProperty.basePriceWeekend : selectedProperty.basePriceWeekday);
  }, [currentDateOverride, currentFirstDateKey, activeSection, selectedProperty, operatingSettings]);

  const marketerCommissionRate = currentMarketer?.commissionRate
    ? Math.round(currentMarketer.commissionRate * 100)
    : (operatingSettings?.marketerCommissions?.partial ?? 5);
  const marketerNightlyCommission = Math.round(currentNightlyPrice * (marketerCommissionRate / 100));
  const marketerTotalCommission = Math.round(estimatedTotal * (marketerCommissionRate / 100));

  const getSeasonPeriodLabel = (period?: string) => {
    switch (period) {
      case 'weekend':
        return 'ويكند';
      case 'extended_holiday':
        return 'إجازة مطولة';
      case 'eid_summer':
        return 'عيد / إجازة صيفية';
      case 'auto':
        return 'بحسب أيام الأسبوع';
      case 'weekday':
      default:
        return 'وسط الأسبوع';
    }
  };

  const formatArabicCurrency = (amount: number, withDecimals: boolean = true) => {
    return (
      amount.toLocaleString('ar-SA', {
        minimumFractionDigits: withDecimals ? 2 : 0,
        maximumFractionDigits: withDecimals ? 2 : 0,
      }) + ' ر.س.'
    );
  };

  const partialCommRate = operatingSettings?.marketerCommissions?.partial ?? 5;
  const fullCommRate = operatingSettings?.marketerCommissions?.full ?? 7;
  const partialCommTotal = Math.round(estimatedTotal * (partialCommRate / 100));
  const fullCommTotal = Math.round(estimatedTotal * (fullCommRate / 100));
  const avgNightlyPrice = Math.round(estimatedTotal / Math.max(1, selectedDates.length));

  const totalAdminFees = useMemo(() => {
    let sum = 0;
    const fees = operatingSettings?.adminFees || {
      weekday: 50,
      weekend: 100,
      extendedHoliday: 150,
      eidSummer: 200,
    };
    const weekendDays = operatingSettings?.weekendDays || [4, 5];
    sortedSelected.forEach((d) => {
      const unitKey = activeSection
        ? `${selectedPropertyId}_${activeSection.id}_${d}`
        : `${selectedPropertyId}_${d}`;
      const ov = dateOverrides[unitKey] || dateOverrides[`${selectedPropertyId}_${d}`];
      if (ov?.adminFeeAmount !== undefined) {
        sum += ov.adminFeeAmount;
      } else if (ov?.seasonPeriod === 'weekend') {
        sum += fees.weekend;
      } else if (ov?.seasonPeriod === 'extended_holiday') {
        sum += fees.extendedHoliday;
      } else if (ov?.seasonPeriod === 'eid_summer') {
        sum += fees.eidSummer;
      } else if (ov?.seasonPeriod === 'weekday') {
        sum += fees.weekday;
      } else {
        const dateObj = new Date(d);
        sum += weekendDays.includes(dateObj.getDay()) ? fees.weekend : fees.weekday;
      }
    });
    return sum;
  }, [sortedSelected, dateOverrides, selectedPropertyId, activeSection, operatingSettings]);

  const ownerNetProfitFull = estimatedTotal - fullCommTotal - totalAdminFees;
  const ownerNetProfitPartial = estimatedTotal - partialCommTotal - totalAdminFees;

  const currentUnitNetPerNight = currentDateOverride?.unitNetPrice !== undefined ? currentDateOverride.unitNetPrice : 200;
  const totalUnitNet = currentUnitNetPerNight * Math.max(1, selectedDates.length);
  const umSeifNetCommissionTotal = Math.max(0, estimatedTotal - totalUnitNet);
  const umSeifTotalDues = umSeifNetCommissionTotal + totalAdminFees;

  const nightDetailsList = useMemo(() => {
    const fees = operatingSettings?.adminFees || {
      weekday: 50,
      weekend: 100,
      extendedHoliday: 150,
      eidSummer: 200,
    };
    const weekendDays = operatingSettings?.weekendDays || [4, 5];
    const activeRate = pricingViewTab === 'full' ? fullCommRate : partialCommRate;

    return sortedSelected.map((d) => {
      const unitKey = activeSection
        ? `${selectedPropertyId}_${activeSection.id}_${d}`
        : `${selectedPropertyId}_${d}`;
      const ov = dateOverrides[unitKey] || dateOverrides[`${selectedPropertyId}_${d}`];
      let price = ov?.price;
      if (price === undefined) {
        const dateObj = new Date(d);
        const isWk = weekendDays.includes(dateObj.getDay());
        price = activeSection
          ? (isWk ? activeSection.priceWeekend : activeSection.priceWeekday)
          : (isWk ? selectedProperty.basePriceWeekend : selectedProperty.basePriceWeekday);
      }
      let fee = ov?.adminFeeAmount;
      if (fee === undefined) {
        if (ov?.seasonPeriod === 'weekend') fee = fees.weekend;
        else if (ov?.seasonPeriod === 'extended_holiday') fee = fees.extendedHoliday;
        else if (ov?.seasonPeriod === 'eid_summer') fee = fees.eidSummer;
        else if (ov?.seasonPeriod === 'weekday') fee = fees.weekday;
        else {
          const dateObj = new Date(d);
          fee = weekendDays.includes(dateObj.getDay()) ? fees.weekend : fees.weekday;
        }
      }
      const comm = Math.round(price * (activeRate / 100));
      const net = price - comm - fee;
      return {
        date: d,
        price,
        comm,
        fee,
        net,
      };
    });
  }, [sortedSelected, dateOverrides, selectedPropertyId, activeSection, selectedProperty, operatingSettings, pricingViewTab, fullCommRate, partialCommRate]);

  const handleSaveAdminPricing = (pricingData: {
    price: number;
    seasonPeriod: 'auto' | 'weekday' | 'weekend' | 'extended_holiday' | 'eid_summer';
    adminFeePercent: number;
    adminFeeAmount: number;
    marketerCommissionPercent: number;
    marketerCommissionAmount: number;
    unitNetPrice: number;
    umSeifCommission: number;
    note?: string;
  }) => {
    const validDates = selectedDates.filter((d) => d >= todayStr);
    if (validDates.length === 0) return;
    setDateOverridesBulk(
      selectedPropertyId,
      validDates,
      {
        price: pricingData.price,
        seasonPeriod: pricingData.seasonPeriod,
        adminFeePercent: pricingData.adminFeePercent,
        adminFeeAmount: pricingData.adminFeeAmount,
        marketerCommissionPercent: pricingData.marketerCommissionPercent,
        marketerCommissionAmount: pricingData.marketerCommissionAmount,
        unitNetPrice: pricingData.unitNetPrice,
        umSeifCommission: pricingData.umSeifCommission,
        note: pricingData.note,
      },
      activeSectionId
    );
    setPriceInput(pricingData.price);
    triggerBrowserNotification(
      '✓ تم حفظ وتطبيق التسعيرة',
      `تم تحديد السعر ${pricingData.price} ر.س وعمولة أم سيف ${pricingData.umSeifCommission} ر.س لـ ${validDates.length} ليلة`,
      'commission'
    );
  };

  const handleApplyStatus = (status: 'available' | 'blocked') => {
    const validDates = selectedDates.filter((d) => d >= todayStr);
    if (validDates.length === 0) return;
    setDateOverridesBulk(selectedPropertyId, validDates, { status }, activeSectionId);
  };

  const saveStatusSelection = () => {
    const validDates = selectedDates.filter((d) => d >= todayStr);
    if (validDates.length === 0) return;
    handleApplyStatus(targetStatus);
    setSavedStatusSuccess(true);
    setTimeout(() => setSavedStatusSuccess(false), 2000);
  };

  const handleApplyPrice = () => {
    const validDates = selectedDates.filter((d) => d >= todayStr);
    if (validDates.length === 0 || !priceInput) return;
    setDateOverridesBulk(selectedPropertyId, validDates, { price: Number(priceInput) }, activeSectionId);
    setSavedPriceSuccess(true);
    setTimeout(() => setSavedPriceSuccess(false), 2000);
  };

  const handleApplySeason = (season: keyof Property['seasonalPricing']) => {
    const validDates = selectedDates.filter((d) => d >= todayStr);
    if (validDates.length === 0) return;
    applySeasonalPricingPattern(selectedPropertyId, validDates, season, activeSectionId);
  };

  const seasonalPrices = useMemo(() => {
    if (activeSection) {
      return {
        weekday: activeSection.priceWeekday,
        weekend: activeSection.priceWeekend,
        summer: Math.round(activeSection.priceWeekday * 1.1),
        eid: Math.round(activeSection.priceWeekend * 1.5),
        vacation: Math.round(activeSection.priceWeekday * 1.25),
      };
    }
    return selectedProperty.seasonalPricing;
  }, [activeSection, selectedProperty]);

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-4 pt-2 space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#4A154B] via-[#5E17EB] to-[#43126C] rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">التقويم والأسعار</h2>
            <p className="text-[11px] text-purple-200">إدارة توافر العقارات والأسعار وتطبيق فترات المواسم</p>
          </div>
        </div>

        <button
          onClick={() => togglePropertyPublished(selectedPropertyId)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all backdrop-blur-xs cursor-pointer ${
            selectedProperty.isPublished
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/30'
              : 'bg-rose-500/30 text-rose-200 border border-rose-400/50 hover:bg-rose-500/40'
          }`}
          title="تغيير حالة عرض العقار لجميع الأيام"
        >
          {selectedProperty.isPublished ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-emerald-300" />
              <span>معروض لجميع الأيام</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-rose-300" />
              <span>العقار موقوف كاملاً</span>
            </>
          )}
        </button>
      </div>

      {/* Property Selector Pills & Calendar Link Button */}
      <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-purple-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {properties.map((p) => {
            const isSelected = p.id === selectedPropertyId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPropertyId(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-purple-50/70 text-slate-700 hover:bg-purple-100 hover:text-purple-900'
                }`}
              >
                {p.name}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsAddPropertyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100/90 text-purple-900 hover:bg-purple-200 border border-purple-200 transition-all shrink-0 cursor-pointer shadow-2xs"
            title="إضافة عقار جديد للنظام وتفعيله تلقائياً للجميع"
          >
            <Plus className="w-3.5 h-3.5 text-purple-800 stroke-[2.5]" />
            <span>إضافة عقار</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSyncModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs hover:shadow transition-all cursor-pointer border border-emerald-500/40"
          title="ربط تقويم العقار مع منصات جاذر إن و Booking.com تلقائياً"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <Link2 className="w-3.5 h-3.5" />
          <span>ربط العقار</span>
          {syncStatuses[selectedPropertyId]?.gathern || syncStatuses[selectedPropertyId]?.booking ? (
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
          ) : null}
        </button>
      </div>

      {/* Sub-Units Bar for properties with multiple independent units (e.g. Hamran: Alma & Naya) */}
      {selectedProperty.sections && selectedProperty.sections.length > 0 ? (
        <div className="bg-gradient-to-r from-[#FAF7FD] via-[#F5EEFB] to-[#FAF7FD] p-3 rounded-2xl border-2 border-purple-200/90 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                {selectedProperty.id === 'al-taraf'
                  ? 'خيارات حجز شاليه الترف (قسم واحد أو قسمين):'
                  : selectedProperty.id === 'montaja-al-taraf'
                  ? 'وحدات منتجع الترف المدمجة (تجمعان الأسعار تلقائياً من تقويم الترف والبيلسان):'
                  : selectedProperty.id === 'hamran'
                  ? 'الوحدات المستقلة داخل حمران (وحدتان مستقلتان فقط):'
                  : `أقسام ووحدات الحجز المستقلة داخل ${selectedProperty.name}:`}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddUnitModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-purple-800 hover:bg-purple-100/80 border border-purple-300 shadow-2xs transition-all cursor-pointer"
                title={`إضافة وحدة جديدة داخل ${selectedProperty.name}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>إضافة وحدة</span>
              </button>
              <span className="text-[10px] bg-purple-200/70 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                {selectedProperty.id === 'al-taraf'
                  ? 'قسمان للحجز (قسم واحد / قسمين)'
                  : selectedProperty.id === 'montaja-al-taraf'
                  ? 'وحدتان مدمجتان'
                  : `${selectedProperty.sections.length} وحدات مستقلة`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedProperty.sections.map((sec) => {
              const isSecActive = activeSectionId === sec.id;
              const isCombo = sec.id.startsWith('resort-combo');
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                    isSecActive
                      ? 'bg-purple-800 text-white border-purple-800 shadow-md ring-2 ring-purple-600 ring-offset-1'
                      : 'bg-white text-slate-800 border-purple-200/80 hover:bg-purple-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="font-bold text-xs sm:text-sm truncate">
                      {sec.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                        isSecActive
                          ? 'bg-white/20 text-white'
                          : isCombo
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isCombo ? 'مدمجة تلقائياً' : selectedProperty.id === 'al-taraf' ? 'خيار حجز' : selectedProperty.id === 'montaja-al-taraf' ? 'وحدة مستقلة' : 'مستقلة'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-90 truncate font-sans">
                    {sec.id === 'section-1'
                      ? 'مجلس ضيافة ملكي ومسبح أوفر فلو وجلسة شواء'
                      : sec.id === 'section-2'
                      ? 'كامل مرافق الترف: مجلس ومسبح وصالة وزجاج وجاكوزي'
                      : sec.id === 'resort-combo-1'
                      ? 'جمع الأسعار تلقائياً من تقويم الوحدتين (قسم واحد)'
                      : sec.id === 'resort-combo-2'
                      ? 'جمع الأسعار تلقائياً من تقويم الوحدتين (قسمين بالكامل)'
                      : sec.id === 'resort-taraf'
                      ? 'شاليه ملكي مستقل بجميع مرافقه ومسبحه'
                      : sec.id === 'resort-baylasan'
                      ? 'كوخ ريفي فاخر مستقل ومسبح خاص'
                      : sec.id === 'hamran-alma'
                      ? 'طابع بوهيمي ومسبح فيروزي'
                      : sec.id === 'hamran-naya'
                      ? 'منتجع عائلي ومسبح ألعاب مائية'
                      : sec.subtitle}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-bold font-mono">
                    <span>وسط: {sec.priceWeekday} ر.س</span>
                    <span>الويكند: {sec.priceWeekend} ر.س</span>
                  </div>
                </button>
              );
            })}

            {/* Quick Add Unit Button inside sections grid */}
            <button
              type="button"
              onClick={() => setIsAddUnitModalOpen(true)}
              className="p-2.5 rounded-xl border-2 border-dashed border-purple-300 bg-white/70 hover:bg-purple-100/60 text-purple-800 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center min-h-[78px]"
              title={`إضافة وحدة مستقلة جديدة إلى ${selectedProperty.name}`}
            >
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-800">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="font-bold text-xs">إضافة وحدة جديدة</span>
              <span className="text-[10px] text-purple-600/80">تخصيص اسم وسعر مستقل</span>
            </button>

            {selectedProperty.id !== 'montaja-al-taraf' && selectedProperty.id !== 'al-taraf' && selectedProperty.id !== 'hamran' && (
              <button
                type="button"
                onClick={() => setActiveSectionId('all')}
                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  activeSectionId === 'all'
                    ? 'bg-purple-800 text-white border-purple-800 shadow-md ring-2 ring-purple-600 ring-offset-1'
                    : 'bg-white text-slate-800 border-purple-200/80 hover:bg-purple-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs sm:text-sm truncate">
                    {`كامل ${selectedProperty.name}`}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      activeSectionId === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    شامل
                  </span>
                </div>
                <div className="text-[11px] opacity-90 truncate">
                  عرض تقويم وتسعيرة العقار كاملاً
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-bold font-mono">
                  <span>وسط: {selectedProperty.basePriceWeekday} ر.س</span>
                  <span>الويكند: {selectedProperty.basePriceWeekend} ر.س</span>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#FAF7FD] via-[#F5EEFB] to-[#FAF7FD] p-3 rounded-2xl border-2 border-purple-200/90 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-xl bg-purple-200/70 text-purple-800 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-purple-950 block">
                وحدات وأقسام عقار ({selectedProperty.name}):
              </span>
              <span className="text-[11px] text-purple-700/80">
                يمكنك تقسيم هذا العقار وإضافة وحدات مستقلة (كأقسام أو غرف) بأسعار وتقويم مستقل
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddUnitModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#6B2896] hover:bg-[#581F7D] text-white shadow-xs cursor-pointer shrink-0 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>إضافة وحدة للعقار</span>
          </button>
        </div>
      )}

      {/* Selection Mode Notice: Consecutive Dates Strictly Enforced */}
      <div className="bg-white rounded-2xl p-2.5 shadow-xs border border-purple-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#2E1045] font-bold">
          <CalendarDays className="w-4 h-4 text-purple-700 shrink-0" />
          <span>
            نظام حجز الفترات المتصلة (تحديد موعد الدخول والمغادرة) — الأيام متصلة حصراً ويمنع النظام أخذ أيام متفرقة للحجز الواحد.
          </span>
        </div>
        {selectedDates.length > 1 && (
          <button
            type="button"
            onClick={() => setSelectedDates([selectedDates[0] || todayStr])}
            className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-1 rounded-xl shrink-0 cursor-pointer border border-purple-200"
          >
            إعادة تعيين لليلة واحدة
          </button>
        )}
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100 space-y-4">
        {/* Month Header and Size controls */}
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
              className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-purple-50 text-purple-900 flex items-center justify-center transition-colors cursor-pointer"
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 min-w-[120px] justify-center">
              <span>{monthsAr[month]}</span>
              <span className="font-mono text-purple-700">{year}</span>
            </h3>

            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-purple-50 text-purple-900 flex items-center justify-center transition-colors cursor-pointer"
              title="الشهر القادم"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Double Booking Warning Banner */}
        {blockedAlertMessage && (
          <div className="bg-rose-50 border-2 border-rose-300 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between text-rose-950 font-bold text-xs sm:text-sm animate-in fade-in slide-in-from-top-1 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                ⚠️
              </span>
              <div>
                <p className="font-extrabold text-rose-900">{blockedAlertMessage}</p>
                <p className="text-[11px] text-rose-700 font-medium">
                  هذا اليوم مخصص بحالة مؤكد ولا يمكن قبول أو إنشاء أي حجز إضافي عليه منعاً للتضارب.
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
          {daysAr.map((day, idx) => (
            <div key={idx} className="text-xs font-bold text-slate-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysMatrix.map((item, idx) => {
            const heightCls =
              calendarSize === 'compact'
                ? 'h-13 sm:h-15'
                : calendarSize === 'large'
                ? 'h-22 sm:h-26'
                : 'h-16 sm:h-20';

            if (!item) {
              return <div key={`empty-${idx}`} className={`${heightCls} rounded-2xl bg-slate-50/50`} />;
            }

            const { dayNum, dateKey, price, status, depositRemainingSeconds, isPast, isToday } = item;
            const isConfirmedBooked = status === 'booked' || !!item.booking;
            const isSelected = selectedDates.includes(dateKey);

            let colorClasses = 'bg-[#E8F8F1] border-emerald-200 text-emerald-950';
            let label = `${price}`;

            if (isPast) {
              colorClasses = 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-55 cursor-not-allowed pointer-events-none';
              label = item.booking ? 'محجوز' : 'فائت';
            } else if (status === 'waiting_deposit') {
              colorClasses = 'bg-amber-100 border-amber-300 text-amber-950 btn-beam-shine';
              label = `انتظار (${Math.floor(depositRemainingSeconds / 60)}:${String(depositRemainingSeconds % 60).padStart(2, '0')})`;
            } else if (status === 'booked' || isConfirmedBooked) {
              colorClasses = 'bg-[#FEE2E2] border-2 border-rose-500 text-rose-950 font-black shadow-xs hover:border-rose-600';
              label = 'محجوز مؤكد';
            } else if (status === 'blocked') {
              colorClasses = 'bg-slate-100 border-slate-200 text-slate-400';
              label = 'مغلق';
            }

            // Bold & High Contrast styling for Today's Date
            const todayClasses = isToday
              ? 'ring-3 ring-slate-950 border-2 border-slate-950 shadow-lg scale-[1.02] z-10 !bg-white'
              : '';
            const selectedClasses = isSelected && !isToday
              ? 'ring-2 ring-purple-700 ring-offset-2 scale-98 shadow-sm font-black'
              : isSelected && isToday
              ? 'ring-4 ring-purple-700 ring-offset-2 !border-2 !border-slate-950 shadow-xl font-black'
              : '';

            return (
              <div
                key={dateKey}
                onClick={() => {
                  if (isPast) return;
                  if (isConfirmedBooked) {
                    showBlockedAlert('اليوم محجوز ومؤكد باللون الأحمر — لا يمكن أخذ حجز عليه');
                    return;
                  }
                  handleDateClick(dateKey);
                }}
                aria-disabled={isPast || isConfirmedBooked}
                title={isConfirmedBooked ? 'اليوم محجوز ومؤكد باللون الأحمر — لا يمكن أخذ حجز عليه' : undefined}
                className={`${heightCls} rounded-2xl border p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all relative select-none ${colorClasses} ${todayClasses} ${selectedClasses} ${
                  isPast
                    ? 'cursor-not-allowed pointer-events-none'
                    : isConfirmedBooked
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {/* Booked Locked Badge */}
                {(status === 'booked' || isConfirmedBooked) && !isToday && (
                  <span className="bg-rose-600 text-white text-[7.5px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs -mt-0.5 flex items-center gap-0.5">
                    🔒 مؤكد
                  </span>
                )}
                {/* High contrast Today Badge */}
                {isToday ? (
                  <div className="w-full flex items-center justify-between px-1 -mt-0.5">
                    <span className="bg-slate-950 text-white font-black text-[7.5px] sm:text-[9px] px-1.5 py-0.5 rounded-sm shadow-xs uppercase tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      اليوم
                    </span>
                    <span className="text-xs sm:text-sm font-black text-slate-950 font-mono">
                      {dayNum}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`leading-none pt-0.5 ${
                      isPast
                        ? 'font-medium text-slate-400 line-through decoration-slate-300'
                        : 'font-bold'
                    } ${calendarSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}
                  >
                    {dayNum}
                  </span>
                )}

                <div className="flex flex-col items-center w-full px-0.5">
                  <span
                    className={`truncate text-center w-full ${
                      isToday
                        ? 'font-mono font-black text-slate-950 text-[11px] sm:text-xs'
                        : isPast
                        ? 'text-[9px] font-bold text-slate-400'
                        : calendarSize === 'large'
                        ? 'font-mono font-bold text-xs sm:text-sm'
                        : 'font-mono font-bold text-[9px] sm:text-[10px]'
                    } ${
                      isPast
                        ? 'text-slate-400'
                        : isToday
                        ? 'text-slate-950'
                        : status === 'waiting_deposit'
                        ? 'text-amber-800'
                        : (status === 'booked' || isConfirmedBooked)
                        ? 'text-rose-950 font-black'
                        : 'text-emerald-800'
                    }`}
                  >
                    {label}
                  </span>
                  {!isPast && status === 'available' && (
                    <span className={`text-[8px] font-bold -mt-0.5 ${isToday ? 'text-slate-700' : 'text-emerald-600'}`}>
                      ر.س
                    </span>
                  )}
                </div>
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
            <span className="w-3.5 h-3.5 rounded-full bg-[#E8F8F1] border border-emerald-300" />
            <span className="text-slate-600 font-medium">متاح</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FEE2E2] border-2 border-rose-500" />
            <span className="text-rose-950 font-bold">مؤكد أحمر (لا يمكن الحجز عليه)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300" />
            <span className="text-slate-600 font-medium">انتظار العربون</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white" />
            <span className="text-slate-600 font-medium">مغلق (صيانة)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-purple-700 bg-white" />
            <span className="text-purple-900 font-bold">محدد ({selectedDates.length})</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Price / Seasons / Block */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100 space-y-3.5">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-700" />
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              لوحة التحكم – {selectedDates.length} يوم محدد
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDates([])}
            className="text-xs text-[#E11D48] hover:text-[#BE123C] font-bold cursor-pointer transition-colors"
          >
            مسح التحديد
          </button>
        </div>

        {/* Quick Open/Close Action for Selected Days */}
        <div className="relative border border-purple-200/90 rounded-2xl bg-white p-3 sm:p-4 overflow-hidden">
          <div className="space-y-3 px-2 sm:px-3 text-center">
            <span className="font-bold text-slate-900 text-sm sm:text-base">
              فتح / إغلاق الأيام المحددة
            </span>
            <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={saveStatusSelection}
                className="py-2 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm bg-[#D5C4EC] hover:bg-[#C6B3DF] text-slate-900 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {savedStatusSuccess ? '✓ تم الحفظ' : 'حفظ'}
              </button>
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setTargetStatus('blocked')}
                  className={`py-2 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                    targetStatus === 'blocked'
                      ? 'bg-[#EFE8F9] text-purple-950 border-purple-400 shadow-2xs font-extrabold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  مغلق
                </button>
                <button
                  type="button"
                  onClick={() => setTargetStatus('available')}
                  className={`py-2 px-4 sm:px-5 rounded-xl font-bold text-xs sm:text-sm transition-all border cursor-pointer ${
                    targetStatus === 'available'
                      ? 'bg-[#EFE8F9] text-purple-950 border-purple-400 shadow-2xs font-extrabold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  متاح
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Panel: Matches IMG_1632.jpeg exactly */}
        {isAdmin && !previewAsMarketer ? (
          <div className="bg-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-right">
            {/* Top Bar: Nights Count + Reset Button */}
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-sm sm:text-base">
                {nightsLabel}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDates([todayStr])}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
                title="إعادة التعيين لليوم"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Centered Price Section with Pencil Edit Button */}
            <div className="text-center pt-1 pb-2">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                إجمالي سعر الليالي
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-black text-3xl sm:text-4xl text-purple-950 font-mono tracking-tight">
                  {formatArabicCurrency(estimatedTotal)}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdminPricingModalOpen(true)}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-300 flex items-center justify-center text-purple-700 transition-colors shadow-2xs cursor-pointer shrink-0"
                  title="تعديل السعر (نافذة تعديل السعر)"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-slate-500 font-medium block mt-1.5 font-mono">
                متوسط الليلة {formatArabicCurrency(avgNightlyPrice)}
              </span>
            </div>

            {/* 3-Tab Segmented Control matching IMG_1632.jpeg */}
            <div className="bg-[#F3EEFA]/80 p-1 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPricingViewTab('partial')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  pricingViewTab === 'partial'
                    ? 'bg-white text-purple-950 font-black shadow-xs border border-purple-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                حجز جزئي
              </button>
              <button
                type="button"
                onClick={() => setPricingViewTab('full')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  pricingViewTab === 'full'
                    ? 'bg-white text-purple-950 font-black shadow-xs border border-purple-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                حجز كلي
              </button>
              <button
                type="button"
                onClick={() => setPricingViewTab('um_seif')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  pricingViewTab === 'um_seif'
                    ? 'bg-white text-purple-950 font-black shadow-xs border border-purple-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                أم سيف
              </button>
            </div>

            {/* تفاصيل الربح التقديري */}
            <div className="pt-2 space-y-2.5">
              <h5 className="font-black text-sm sm:text-base text-slate-900">
                تفاصيل الربح التقديري
              </h5>

              {pricingViewTab !== 'um_seif' ? (
                <>
                  {/* Row 1: إجمالي سعر الفترة */}
                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <span className="text-slate-700 font-medium">إجمالي سعر الفترة</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatArabicCurrency(estimatedTotal)}
                    </span>
                  </div>

                  {/* Row 2: عمولة المسوقة 5% */}
                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <div>
                      <span
                        className={
                          pricingViewTab === 'partial'
                            ? 'font-black text-purple-950'
                            : 'text-slate-700 font-medium'
                        }
                      >
                        عمولة المسوقة {partialCommRate}%
                      </span>
                      {pricingViewTab === 'full' && (
                        <span className="block text-[11px] text-slate-400">للمقارنة</span>
                      )}
                    </div>
                    <span
                      className={`font-mono ${
                        pricingViewTab === 'partial'
                          ? 'font-black text-purple-950 text-sm'
                          : 'font-bold text-slate-700'
                      }`}
                    >
                      {formatArabicCurrency(partialCommTotal)}
                    </span>
                  </div>

                  {/* Row 3: عمولة المسوقة 7% */}
                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <div>
                      <span
                        className={
                          pricingViewTab === 'full'
                            ? 'font-black text-purple-950'
                            : 'text-slate-700 font-medium'
                        }
                      >
                        عمولة المسوقة {fullCommRate}%
                      </span>
                      {pricingViewTab === 'partial' && (
                        <span className="block text-[11px] text-slate-400">للمقارنة</span>
                      )}
                    </div>
                    <span
                      className={`font-mono ${
                        pricingViewTab === 'full'
                          ? 'font-black text-purple-950 text-sm'
                          : 'font-bold text-slate-700'
                      }`}
                    >
                      {formatArabicCurrency(fullCommTotal)}
                    </span>
                  </div>

                  {/* Row 4: الرسوم الإدارية والتشغيلية */}
                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <span className="text-slate-700 font-medium">الرسوم الإدارية والتشغيلية</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatArabicCurrency(totalAdminFees)}
                    </span>
                  </div>

                  {/* Teal divider line as in IMG_1632.jpeg */}
                  <div className="border-t border-[#8FD2C9] my-2" />

                  {/* Row 5: صافي ربح المالك */}
                  <div className="flex items-center justify-between text-sm sm:text-base py-1">
                    <span className="font-black text-[#134E48]">صافي ربح المالك</span>
                    <span className="font-black text-[#134E48] font-mono text-base sm:text-lg">
                      {formatArabicCurrency(
                        pricingViewTab === 'full' ? ownerNetProfitFull : ownerNetProfitPartial
                      )}
                    </span>
                  </div>
                </>
              ) : (
                /* أم سيف Tab Details */
                <>
                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <span className="text-slate-700 font-medium">إجمالي سعر الفترة</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatArabicCurrency(estimatedTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <span className="text-slate-700 font-medium">صافي الوحدة للمالك ({selectedNightsCount} ليلة)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatArabicCurrency(totalUnitNet)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <div>
                      <span className="font-black text-purple-950">صافي عمولة أم سيف</span>
                      <span className="block text-[11px] text-purple-700">الفرق بين السعر وصافي الوحدة</span>
                    </div>
                    <span className="font-black text-purple-950 font-mono text-sm">
                      {formatArabicCurrency(umSeifNetCommissionTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm py-1">
                    <span className="text-slate-700 font-medium">الرسوم الإدارية (لصالح أم سيف)</span>
                    <span className="font-mono font-bold text-purple-900">
                      {formatArabicCurrency(totalAdminFees)}
                    </span>
                  </div>

                  <div className="border-t border-purple-200 my-2" />

                  <div className="flex items-center justify-between text-sm sm:text-base py-1">
                    <span className="font-black text-purple-950">إجمالي مستحقات أم سيف</span>
                    <span className="font-black text-purple-950 font-mono text-base sm:text-lg">
                      {formatArabicCurrency(umSeifTotalDues)}
                    </span>
                  </div>
                </>
              )}

              {/* Accordion: تفاصيل كل ليلة */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNightDetails((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-400">{showNightDetails ? '▼' : '◀'}</span>
                    <span>تفاصيل كل ليلة</span>
                  </span>
                  <span className="text-[11px] text-purple-700 font-mono font-medium">
                    {nightDetailsList.length} ليلة
                  </span>
                </button>

                {showNightDetails && (
                  <div className="mt-2.5 rounded-2xl border border-purple-100 bg-purple-50/40 p-3 space-y-2 text-xs animate-in fade-in duration-150">
                    {nightDetailsList.map((item, idx) => (
                      <div
                        key={item.date}
                        className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800 block text-[11px]">
                            {item.date}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            عمولة: {item.comm} ر.س · رسوم: {item.fee} ر.س
                          </span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="font-bold text-slate-900 block text-xs">
                            {item.price} ر.س
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            صافي: {item.net} ر.س
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin toggle for Marketer View Preview */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewAsMarketer(true)}
                  className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1.5 cursor-pointer text-xs transition-colors"
                  title="معاينة ما يراه المسوق المعتمد"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>معاينة واجهة المسوق بالتقويم</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Marketer Panel: Only Night Price and Commission at Partial & Full Bookings */
          <div className="bg-white border-2 border-purple-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 text-right">
            {/* Top Bar for Marketer */}
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-sm sm:text-base">
                {nightsLabel}
              </span>
              <div className="flex items-center gap-2">
                {previewAsMarketer && (
                  <button
                    type="button"
                    onClick={() => setPreviewAsMarketer(false)}
                    className="text-xs bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                  >
                    العودة للإدارة
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDates([todayStr])}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
                  title="إعادة التعيين لليوم"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 1. سعر الليلة للمسوق */}
            <div className="bg-[#FAF7FC] border border-purple-100 p-4 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-slate-500 block">
                المبلغ المحدد / سعر الليلة
              </span>
              <div className="flex items-baseline justify-center gap-1.5 font-mono">
                <span className="text-3xl sm:text-4xl font-black text-purple-950">
                  {currentNightlyPrice.toLocaleString('ar-SA')}
                </span>
                <span className="text-xs font-bold text-slate-600">ر.س / ليلة</span>
              </div>
              {selectedDates.length > 1 && (
                <p className="text-xs text-purple-800 font-mono font-medium pt-1.5 border-t border-purple-100/60 mt-1">
                  متوسط الليلة {avgNightlyPrice.toLocaleString('ar-SA')} ر.س · إجمالي الفترة ({selectedDates.length} ليالٍ):{' '}
                  <strong className="text-purple-950 font-bold font-mono">{estimatedTotal.toLocaleString('ar-SA')} ر.س</strong>
                </p>
              )}
            </div>

            {/* 2. عمولة المسوق عند الحجز الجزئي وعند الحجز الكلي فقط */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* عمولة الحجز الجزئي */}
              <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-purple-950 block">
                    عمولة الحجز الجزئي
                  </span>
                  <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full font-black font-mono">
                    نسبة {partialCommRate}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-2xl font-black text-purple-950">
                    {Math.round(currentNightlyPrice * (partialCommRate / 100)).toLocaleString('ar-SA')}
                  </span>
                  <span className="text-xs font-bold text-purple-800">ر.س / ليلة</span>
                </div>
                <div className="pt-1.5 border-t border-purple-200/60 text-[11px] text-purple-900 font-medium space-y-0.5">
                  <p>
                    إجمالي عمولة الفترة:{' '}
                    <strong className="font-mono font-black text-purple-950">
                      {partialCommTotal.toLocaleString('ar-SA')} ر.س
                    </strong>
                  </p>
                  <p className="text-[10px] text-purple-700">تُصرف لحسابك فور تأكيد الحجز الجزئي</p>
                </div>
              </div>

              {/* عمولة الحجز الكلي */}
              <div className="bg-emerald-50/70 border-2 border-emerald-300 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-950 block">
                    عمولة الحجز الكلي
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black font-mono">
                    نسبة {fullCommRate}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-2xl font-black text-emerald-950">
                    {Math.round(currentNightlyPrice * (fullCommRate / 100)).toLocaleString('ar-SA')}
                  </span>
                  <span className="text-xs font-bold text-emerald-800">ر.س / ليلة</span>
                </div>
                <div className="pt-1.5 border-t border-emerald-200 text-[11px] text-emerald-900 font-medium space-y-0.5">
                  <p>
                    إجمالي عمولة الفترة:{' '}
                    <strong className="font-mono font-black text-emerald-950">
                      {fullCommTotal.toLocaleString('ar-SA')} ر.س
                    </strong>
                  </p>
                  <p className="text-[10px] text-emerald-700">تُصرف لحسابك فور تأكيد الحجز ومتابعته</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Block whole property toggle */}
        <button
          type="button"
          onClick={() => togglePropertyPublished(selectedPropertyId)}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs border ${
            selectedProperty.isPublished
              ? 'bg-[#FFF5F5] hover:bg-[#FFE8E8] text-slate-900 border-[#FECDD3]'
              : 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-emerald-900 border-emerald-200'
          }`}
        >
          {selectedProperty.isPublished ? (
            <>
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600" />
              <span>إغلاق العقار كامل</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span>فتح العقار كامل لجميع الأيام</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Summary Chart */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100 space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>الشاركت السريع — ملخص الفترة والربح التقديري</span>
          </div>
          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 border border-purple-200/60 px-2.5 py-0.5 rounded-full font-bold">
            {totalNights} {totalNights === 1 ? 'ليلة' : 'ليالٍ'}
          </span>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 block mb-1">تاريخ الدخول</span>
            <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm truncate">
              {checkInDate}
            </span>
          </div>

          <div className="bg-slate-50/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 block mb-1">تاريخ الخروج</span>
            <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm truncate">
              {checkOutDate}
            </span>
          </div>

          <div className="bg-purple-50/60 p-2.5 sm:p-3 rounded-2xl border border-purple-100 flex flex-col justify-between">
            <span className="text-[10px] text-purple-700 block mb-1">عدد الليالي</span>
            <span className="font-extrabold text-purple-950 font-mono text-sm sm:text-base">
              {totalNights}
            </span>
          </div>

          <div className="bg-purple-50 p-2.5 sm:p-3 rounded-2xl border border-purple-200/80 flex flex-col justify-between">
            <span className="text-[10px] text-purple-800 block mb-1">إجمالي الفترة</span>
            <span className="font-extrabold text-purple-950 font-mono text-sm sm:text-base">
              {estimatedTotal} <span className="text-[10px] font-normal">ر.س</span>
            </span>
          </div>

          <div className="bg-emerald-50 p-2.5 sm:p-3 rounded-2xl border border-emerald-200 flex flex-col justify-between col-span-2 xs:col-span-1 sm:col-span-1">
            <span className="text-[10px] text-emerald-800 block mb-1">عمولة 5%</span>
            <span className="font-extrabold text-emerald-900 font-mono text-sm sm:text-base">
              {estimatedCommission} <span className="text-[10px] font-normal">ر.س</span>
            </span>
          </div>
        </div>

        {/* Hamran Services & Discount notice */}
        <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 rounded-2xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-purple-950 font-bold">
            <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              {selectedPropertyId === 'hamran'
                ? 'قسم خدمات حمران وطلب الخصم متاح بالحجز: إضافة الخدمات (كالمساج) تضاف للعقد تلقائياً + طلب خصم معتمد (كإلغاء الفطور).'
                : `قسم خدمات ${selectedProperty.name} وطلب الخصم متاح بالحجز الجديد مع اعتماد الإدارة للخصم.`}
            </span>
          </div>
        </div>

        {(() => {
          const isSelectionConsecutive = areDatesConsecutive(selectedDates);
          const hasBookedInSelection = selectedDates.some((d) => isDateBooked(d));
          const isButtonBlocked = checkInDate < todayStr || hasBookedInSelection || !isSelectionConsecutive;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Main button: Proceed to Bookings Tab with prefilled unit and dates */}
              <button
                disabled={isButtonBlocked}
                onClick={() => {
                  if (checkInDate < todayStr) return;
                  if (!isSelectionConsecutive) {
                    showBlockedAlert('تحديد أيام الحجز لازم تكون متصلة — يمنع النظام أخذ أيام متفرقة للحجز الواحد');
                    return;
                  }
                  if (hasBookedInSelection) {
                    showBlockedAlert('الحجز يتخلله أيام محجوزة');
                    return;
                  }
                  setPreselectedDateForBooking(checkInDate);
                  setPreselectedDatesForBooking(selectedDates);
                  if (activeSectionId && activeSectionId !== 'all') {
                    setPreselectedSectionForBooking(activeSectionId);
                  }
                  if (pricingViewTab === 'partial') {
                    setPreselectedCommissionType('partial');
                  } else if (pricingViewTab === 'full') {
                    setPreselectedCommissionType('full');
                  }
                  setActiveTab('bookings');
                }}
                className={`py-3.5 sm:py-4 px-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                  hasBookedInSelection
                    ? 'bg-rose-100 text-rose-900 border-2 border-rose-400 cursor-not-allowed shadow-none font-black'
                    : !isSelectionConsecutive
                    ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 cursor-not-allowed shadow-none font-black'
                    : checkInDate < todayStr
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'btn-mauve-shiny text-white cursor-pointer'
                }`}
              >
                {hasBookedInSelection ? (
                  <>
                    <span className="text-rose-600 font-black">⚠️</span>
                    <span>الحجز يتخلله أيام محجوزة</span>
                  </>
                ) : !isSelectionConsecutive ? (
                  <>
                    <span className="text-amber-600 font-black">⚠️</span>
                    <span>تحديد أيام الحجز لازم تكون متصلة</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>
                      {activeSection
                        ? `المتابعة لحجز (${activeSection.name}) وحقول الحجز الجديد`
                        : 'المتابعة لحقول الحجز الجديد وطلب العربون'}
                    </span>
                  </>
                )}
              </button>

              {/* Quick Instant Booking Modal */}
              <button
                type="button"
                disabled={isButtonBlocked}
                onClick={() => {
                  if (checkInDate < todayStr) return;
                  if (!isSelectionConsecutive) {
                    showBlockedAlert('تحديد أيام الحجز لازم تكون متصلة — يمنع النظام أخذ أيام متفرقة للحجز الواحد');
                    return;
                  }
                  if (hasBookedInSelection) {
                    showBlockedAlert('الحجز يتخلله أيام محجوزة');
                    return;
                  }
                  setPreselectedDateForBooking(checkInDate);
                  setPreselectedDatesForBooking(selectedDates);
                  if (activeSectionId && activeSectionId !== 'all') {
                    setPreselectedSectionForBooking(activeSectionId);
                  }
                  if (pricingViewTab === 'partial') {
                    setPreselectedCommissionType('partial');
                  } else if (pricingViewTab === 'full') {
                    setPreselectedCommissionType('full');
                  }
                  setBookingModalOpen(true);
                }}
                className={`py-3.5 sm:py-4 px-3 rounded-2xl font-bold text-xs sm:text-sm border-2 ${
                  hasBookedInSelection
                    ? 'border-rose-300 bg-rose-50 text-rose-900 cursor-not-allowed font-black'
                    : !isSelectionConsecutive
                    ? 'border-amber-300 bg-amber-50 text-amber-900 cursor-not-allowed font-black'
                    : 'border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-950 cursor-pointer shadow-xs'
                } flex items-center justify-center gap-2 transition-all disabled:opacity-70`}
              >
                <CalendarDays className="w-4 h-4 text-purple-700" />
                <span>
                  {hasBookedInSelection
                    ? 'الحجز يتخلله أيام محجوزة'
                    : !isSelectionConsecutive
                    ? 'الأيام متفرقة — يلزم فترات متصلة'
                    : 'فتح نافذة الحجز الفوري السريع'}
                </span>
              </button>
            </div>
          );
        })()}
      </div>

      {/* iCal Synchronization Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3.5 border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-1.5">
                    <span>ربط تقويم العقار</span>
                    <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                      {selectedProperty.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    مزامنة آلية ثنائية الاتجاه مع جاذر إن (Gathern) و Booking.com
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {syncSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            {/* Export Section */}
            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-[11px] flex items-center justify-center font-mono">
                    1
                  </span>
                  رابط تقويم العقار للتصدير (Export iCal)
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-semibold">
                  مباشر ومحدث
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                انسخ هذا الرابط وضعه في إعدادات التقويم بمنصة <b>جاذر إن</b> أو <b>Booking.com</b> لمنع الحجوزات المزدوجة وإغلاق الأيام المحجوزة تلقائياً:
              </p>

              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-200">
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={`https://amasa.app/api/calendar/ical/${selectedPropertyId}.ics?key=auth_sync_2026`}
                  className="w-full text-[11px] font-mono text-slate-700 bg-transparent outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `https://amasa.app/api/calendar/ical/${selectedPropertyId}.ics?key=auth_sync_2026`,
                      'export'
                    )
                  }
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  {copiedKey === 'export' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-mono">
                  2
                </span>
                استيراد تقويم المنصات الخارجية إلى النظام (Import iCal)
              </span>

              {/* Gathern */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <label className="text-xs font-bold text-slate-900">
                      رابط تقويم جاذر إن (Gathern Calendar iCal)
                    </label>
                  </div>
                  {syncStatuses[selectedPropertyId]?.gathern ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      متصل ونشط
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">غير مربوط بعد</span>
                  )}
                </div>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://gathern.co/calendars/.../sync.ics"
                  value={gathernIcalUrl}
                  onChange={(e) => setGathernIcalUrl(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Booking.com */}
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <label className="text-xs font-bold text-slate-900">
                      رابط تقويم بوكينج (Booking.com iCal)
                    </label>
                  </div>
                  {syncStatuses[selectedPropertyId]?.booking ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      متصل ونشط
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">غير مربوط بعد</span>
                  )}
                </div>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?t=..."
                  value={bookingIcalUrl}
                  onChange={(e) => setBookingIcalUrl(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Airbnb */}
              <div className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  منصات أخرى (Airbnb / منصة محلية) (اختياري)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  placeholder="https://www.airbnb.com/calendar/ical/...ics"
                  value={airbnbIcalUrl}
                  onChange={(e) => setAirbnbIcalUrl(e.target.value)}
                  className="w-full text-xs font-mono p-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-purple-700" />
                <span>تحديث المزامنة التلقائية: كل 10 دقائق</span>
              </span>
              <span className="text-slate-400 text-[10px]">
                آخر تحديث: {syncStatuses[selectedPropertyId]?.lastSync || 'لم يتم بعد'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>
                  {syncing ? 'جارٍ فحص ومزامنة التقويم...' : 'حفظ ومزامنة فورية الآن'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for adding properties, units and admin pricing */}
      <AddPropertyModal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
      />

      <AddUnitModal
        isOpen={isAddUnitModalOpen}
        onClose={() => setIsAddUnitModalOpen(false)}
        targetPropertyId={selectedPropertyId}
      />

      <AdminPricingModal
        isOpen={isAdminPricingModalOpen}
        onClose={() => setIsAdminPricingModalOpen(false)}
        selectedDates={selectedDates}
        selectedProperty={selectedProperty}
        activeSection={activeSection || undefined}
        currentOverride={currentDateOverride}
        onSave={handleSaveAdminPricing}
      />
    </div>
  );
};
