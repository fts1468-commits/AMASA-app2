import React, { useState, useEffect } from 'react';
import {
  ChevronsUpDown,
  Check,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OperatingSettings } from '../../types';

interface OperatingSettingsSectionProps {
  onSaved?: () => void;
}

export const OperatingSettingsSection: React.FC<OperatingSettingsSectionProps> = ({ onSaved }) => {
  const { operatingSettings, updateOperatingSettings, marketers, triggerBrowserNotification } = useApp();

  // Local state for all fields
  const [weekdayFee, setWeekdayFee] = useState<number>(operatingSettings.adminFees.weekday);
  const [weekendFee, setWeekendFee] = useState<number>(operatingSettings.adminFees.weekend);
  const [extendedHolidayFee, setExtendedHolidayFee] = useState<number>(
    operatingSettings.adminFees.extendedHoliday
  );
  const [eidSummerFee, setEidSummerFee] = useState<number>(operatingSettings.adminFees.eidSummer);

  // Weekend days: 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday, 5: Friday, 6: Saturday
  const [weekendDays, setWeekendDays] = useState<number[]>(operatingSettings.weekendDays || [4, 5]);

  // Recipient of admin fees
  const [adminFeeRecipient, setAdminFeeRecipient] = useState<string>(
    operatingSettings.adminFeeRecipient || 'ام سيف'
  );

  // Marketer commission percentages
  const [commissionPartial, setCommissionPartial] = useState<number>(
    operatingSettings.marketerCommissions.partial
  );
  const [commissionFull, setCommissionFull] = useState<number>(
    operatingSettings.marketerCommissions.full
  );

  // Achievement bonus settings
  const [bonusEnabled, setBonusEnabled] = useState<boolean>(
    operatingSettings.achievementBonus.enabled
  );
  const [monthlyTarget, setMonthlyTarget] = useState<number>(
    operatingSettings.achievementBonus.monthlyTarget
  );
  const [bonusRate, setBonusRate] = useState<number>(
    operatingSettings.achievementBonus.bonusRate
  );
  const [calculationBase, setCalculationBase] = useState<'commissions' | 'bookings_total'>(
    operatingSettings.achievementBonus.calculationBase
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if operatingSettings changes
  useEffect(() => {
    setWeekdayFee(operatingSettings.adminFees.weekday);
    setWeekendFee(operatingSettings.adminFees.weekend);
    setExtendedHolidayFee(operatingSettings.adminFees.extendedHoliday);
    setEidSummerFee(operatingSettings.adminFees.eidSummer);
    setWeekendDays(operatingSettings.weekendDays || [4, 5]);
    setAdminFeeRecipient(operatingSettings.adminFeeRecipient || 'ام سيف');
    setCommissionPartial(operatingSettings.marketerCommissions.partial);
    setCommissionFull(operatingSettings.marketerCommissions.full);
    setBonusEnabled(operatingSettings.achievementBonus.enabled);
    setMonthlyTarget(operatingSettings.achievementBonus.monthlyTarget);
    setBonusRate(operatingSettings.achievementBonus.bonusRate);
    setCalculationBase(operatingSettings.achievementBonus.calculationBase);
  }, [operatingSettings]);

  const toggleWeekendDay = (dayIndex: number) => {
    if (weekendDays.includes(dayIndex)) {
      if (weekendDays.length > 1) {
        setWeekendDays(weekendDays.filter((d) => d !== dayIndex));
      }
    } else {
      setWeekendDays([...weekendDays, dayIndex].sort());
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updated: Partial<OperatingSettings> = {
      adminFees: {
        weekday: Number(weekdayFee) || 0,
        weekend: Number(weekendFee) || 0,
        extendedHoliday: Number(extendedHolidayFee) || 0,
        eidSummer: Number(eidSummerFee) || 0,
      },
      weekendDays,
      adminFeeRecipient,
      marketerCommissions: {
        partial: Number(commissionPartial) || 0,
        full: Number(commissionFull) || 0,
      },
      achievementBonus: {
        enabled: bonusEnabled,
        monthlyTarget: Number(monthlyTarget) || 0,
        bonusRate: Number(bonusRate) || 0,
        calculationBase,
      },
    };

    updateOperatingSettings(updated);
    setSavedSuccess(true);
    triggerBrowserNotification(
      '✓ تم حفظ إعدادات التشغيل والعمولة',
      'تم تحديث الرسوم الإدارية وأيام الويكند والعمولات وتم ربطها بالتقويم والحجوزات بنجاح.',
      'system'
    );

    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
    }, 1800);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-purple-100 max-w-xl mx-auto space-y-6" dir="rtl">
      {/* 1. قسم: الرسوم الإدارية لكل ليلة بالريال */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-[#1F4D36]">
          الرسوم الإدارية لكل ليلة بالريال
        </h3>

        {/* وسط الأسبوع */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            وسط الأسبوع
          </label>
          <input
            type="number"
            min={0}
            value={weekdayFee}
            onChange={(e) => setWeekdayFee(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="50"
          />
        </div>

        {/* الويكند */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            الويكند
          </label>
          <input
            type="number"
            min={0}
            value={weekendFee}
            onChange={(e) => setWeekendFee(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="100"
          />
        </div>

        {/* الإجازات المطولة */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            الإجازات المطولة
          </label>
          <input
            type="number"
            min={0}
            value={extendedHolidayFee}
            onChange={(e) => setExtendedHolidayFee(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="150"
          />
        </div>

        {/* الأعياد والإجازة الصيفية */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            الأعياد والإجازة الصيفية
          </label>
          <input
            type="number"
            min={0}
            value={eidSummerFee}
            onChange={(e) => setEidSummerFee(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="200"
          />
        </div>

        {/* أيام الويكند */}
        <div className="space-y-2.5 pt-1 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            أيام الويكند
          </label>
          
          {/* Row 1: الاثنين، الثلاثاء، الأربعاء، الخميس */}
          <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-medium text-slate-800">
            {/* الاثنين (1) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>الاثنين</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(1)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(1)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(1) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>

            {/* الثلاثاء (2) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>الثلاثاء</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(2)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(2)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(2) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>

            {/* الأربعاء (3) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>الأربعاء</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(3)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(3)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(3) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>

            {/* الخميس (4) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>الخميس</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(4)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(4)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(4) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>
          </div>

          {/* Row 2: الأحد، السبت، الجمعة */}
          <div className="flex items-center justify-end gap-6 text-xs sm:text-sm font-medium text-slate-800 pt-1">
            {/* الأحد (0) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>الأحد</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(0)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(0)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(0) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>

            {/* السبت (6) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>السبت</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(6)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(6)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(6) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>

            {/* الجمعة (5) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <span>الجمعة</span>
              <button
                type="button"
                onClick={() => toggleWeekendDay(5)}
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                  weekendDays.includes(5)
                    ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                    : 'bg-white border-slate-300'
                }`}
              >
                {weekendDays.includes(5) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            </label>
          </div>
        </div>

        {/* صاحبة عداد الرسوم الإدارية */}
        <div className="space-y-1.5 pt-2 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            صاحبة عداد الرسوم الإدارية
          </label>
          <div className="relative">
            <select
              value={adminFeeRecipient}
              onChange={(e) => setAdminFeeRecipient(e.target.value)}
              className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 pl-10 text-right font-bold text-sm text-slate-800 appearance-none focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs cursor-pointer"
            >
              <option value="ام سيف">ام سيف</option>
              {marketers
                .filter((m) => m.name !== 'ام سيف' && !m.name.includes('أم سيف'))
                .map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
              <ChevronsUpDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            الرسوم تخصم من سعر الحجز لكل ليلة وتضاف إلى عداد أم سيف. حجوزات نظام أم سيف معفاة منها.
          </p>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* 2. قسم: عمولة المسوقة من إجمالي الحجز % */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-[#1F4D36]">
          عمولة المسوقة من إجمالي الحجز %
        </h3>

        {/* جزئي بدون متابعة */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            جزئي بدون متابعة
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={commissionPartial}
            onChange={(e) => setCommissionPartial(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="5"
          />
        </div>

        {/* كامل مع متابعة */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            كامل مع متابعة
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={commissionFull}
            onChange={(e) => setCommissionFull(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="7"
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* 3. قسم: مكافأة الإنجاز – صندوق الإدارة */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-[#1F4D36]">
          مكافأة الإنجاز – صندوق الإدارة
        </h3>

        {/* تفعيل استحقاق مكافأة الإنجاز */}
        <div className="flex items-center justify-end gap-2.5 text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none">
          <span>تفعيل استحقاق مكافأة الإنجاز</span>
          <button
            type="button"
            onClick={() => setBonusEnabled(!bonusEnabled)}
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
              bonusEnabled
                ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-2xs'
                : 'bg-white border-slate-300'
            }`}
          >
            {bonusEnabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>
        </div>

        {/* الهدف الشهري من الحجوزات */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            الهدف الشهري من الحجوزات
          </label>
          <input
            type="number"
            min={1}
            value={monthlyTarget}
            onChange={(e) => setMonthlyTarget(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="15"
          />
        </div>

        {/* نسبة المكافأة % */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            نسبة المكافأة %
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={bonusRate}
            onChange={(e) => setBonusRate(Number(e.target.value))}
            className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 text-right font-mono font-bold text-base text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs"
            placeholder="10"
          />
        </div>

        {/* أساس احتساب المكافأة */}
        <div className="space-y-1.5 text-right">
          <label className="block text-xs sm:text-sm font-bold text-[#1F4D36]">
            أساس احتساب المكافأة
          </label>
          <div className="relative">
            <select
              value={calculationBase}
              onChange={(e) =>
                setCalculationBase(e.target.value as 'commissions' | 'bookings_total')
              }
              className="w-full h-12 bg-white border border-slate-300 rounded-2xl px-4 pl-10 text-right font-bold text-sm text-slate-800 appearance-none focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 shadow-2xs cursor-pointer"
            >
              <option value="commissions">مجموع عمولات المسوقة</option>
              <option value="bookings_total">إجمالي قيمة الحجوزات</option>
            </select>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
              <ChevronsUpDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            تحتسب الحجوزات المكتملة والمحصلة حسب شهر المغادرة. اعتماد المكافأة وصرفها من الإدارة.
          </p>
        </div>
      </div>

      {/* زر الحفظ النهائي: بنفس لون وزر الصورة بالضبط */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-4 px-6 rounded-2xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-300 animate-in zoom-in" />
              <span>✓ تم حفظ وتطبيق القواعد بنجاح</span>
            </>
          ) : (
            <span>حفظ القواعد للحجوزات الجديدة</span>
          )}
        </button>
      </div>
    </div>
  );
};
