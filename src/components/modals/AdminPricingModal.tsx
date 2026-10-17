import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Property, PropertySection, DateOverride } from '../../types';
import { useApp } from '../../context/AppContext';

export type SeasonPeriodType = 'auto' | 'weekday' | 'weekend' | 'extended_holiday' | 'eid_summer';

interface AdminPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  selectedProperty: Property;
  activeSection?: PropertySection;
  currentOverride?: DateOverride;
  onSave: (pricingData: {
    price: number;
    seasonPeriod: SeasonPeriodType;
    adminFeePercent: number;
    adminFeeAmount: number;
    marketerCommissionPercent: number;
    marketerCommissionAmount: number;
    unitNetPrice: number;
    umSeifCommission: number;
    note?: string;
  }) => void;
}

const SEASON_OPTIONS: { id: SeasonPeriodType; label: string }[] = [
  { id: 'auto', label: 'بحسب إعداد أيام الأسبوع' },
  { id: 'weekday', label: 'وسط الأسبوع' },
  { id: 'weekend', label: 'ويكند' },
  { id: 'extended_holiday', label: 'إجازة مطولة' },
  { id: 'eid_summer', label: 'عيد / إجازة صيفية' },
];

export const AdminPricingModal: React.FC<AdminPricingModalProps> = ({
  isOpen,
  onClose,
  selectedDates,
  selectedProperty,
  activeSection,
  currentOverride,
  onSave,
}) => {
  const { operatingSettings } = useApp();

  // Initial base price
  const initialBasePrice = useMemo(() => {
    if (currentOverride?.price !== undefined) return currentOverride.price;
    if (activeSection) return activeSection.priceWeekday;
    return selectedProperty.basePriceWeekday || 800;
  }, [currentOverride, activeSection, selectedProperty]);

  const [basePrice, setBasePrice] = useState<number>(initialBasePrice);
  const [unitNetPrice, setUnitNetPrice] = useState<number>(() => {
    if (currentOverride?.unitNetPrice !== undefined) return currentOverride.unitNetPrice;
    return 200; // default as in screenshot
  });
  const [seasonPeriod, setSeasonPeriod] = useState<SeasonPeriodType>(
    (currentOverride?.seasonPeriod as SeasonPeriodType) || 'weekday'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [note, setNote] = useState<string>(currentOverride?.note || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state whenever modal opens or inputs change
  useEffect(() => {
    if (isOpen) {
      const p = currentOverride?.price !== undefined
        ? currentOverride.price
        : (activeSection ? activeSection.priceWeekday : selectedProperty.basePriceWeekday || 800);
      setBasePrice(p);

      const net = currentOverride?.unitNetPrice !== undefined
        ? currentOverride.unitNetPrice
        : 200;
      setUnitNetPrice(net);

      setSeasonPeriod((currentOverride?.seasonPeriod as SeasonPeriodType) || 'weekday');
      setNote(currentOverride?.note || '');
      setIsDropdownOpen(false);
    }
  }, [isOpen, currentOverride, activeSection, selectedProperty]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Calculate admin fee based on operatingSettings
  const calculateAdminFeePerNight = (sp: SeasonPeriodType): number => {
    const fees = operatingSettings?.adminFees || {
      weekday: 50,
      weekend: 100,
      extendedHoliday: 150,
      eidSummer: 200,
    };
    if (sp === 'weekend') return fees.weekend;
    if (sp === 'extended_holiday') return fees.extendedHoliday;
    if (sp === 'eid_summer') return fees.eidSummer;
    if (sp === 'weekday') return fees.weekday;
    // 'auto' mode: check first date or default to weekday
    if (selectedDates.length > 0) {
      const d = new Date(selectedDates[0]);
      const weekendDays = operatingSettings?.weekendDays || [4, 5];
      return weekendDays.includes(d.getDay()) ? fees.weekend : fees.weekday;
    }
    return fees.weekday;
  };

  const adminFeeAmount = calculateAdminFeePerNight(seasonPeriod);
  const marketerCommPercent = operatingSettings?.marketerCommissions?.partial ?? 5;
  const marketerCommAmount = Math.round(basePrice * (marketerCommPercent / 100));
  const umSeifCommission = Math.max(0, basePrice - unitNetPrice);

  const handleApply = () => {
    onSave({
      price: Number(basePrice) || 0,
      seasonPeriod,
      adminFeePercent: Math.round((adminFeeAmount / (basePrice || 1)) * 100),
      adminFeeAmount,
      marketerCommissionPercent: marketerCommPercent,
      marketerCommissionAmount: marketerCommAmount,
      unitNetPrice: Number(unitNetPrice) || 0,
      umSeifCommission,
      note,
    });
    onClose();
  };

  if (!isOpen) return null;

  const nightsCount = selectedDates.length || 1;
  const nightsLabel = nightsCount === 1
    ? 'ليلة واحدة محددة'
    : nightsCount === 2
    ? 'ليلتان محددتان'
    : `${nightsCount} ليالٍ محددة`;

  const selectedOption = SEASON_OPTIONS.find((opt) => opt.id === seasonPeriod) || SEASON_OPTIONS[1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl p-6 sm:p-7 relative border border-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header (Exact Match to IMG_1633.jpeg) */}
        <div className="flex items-start justify-between pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              تعديل السعر
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-0.5">
              {nightsLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-700 hover:text-slate-900 transition-colors p-1 -mt-1 -ml-1 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Fields Container */}
        <div className="space-y-4 pt-1">
          {/* Field 1: سعر الليلة (ر.س) */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              سعر الليلة (ر.س)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={basePrice === 0 ? '' : basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-full h-13 px-4 rounded-2xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 bg-white font-mono font-bold text-lg text-slate-900 outline-hidden transition-all text-right"
              placeholder="800"
            />
          </div>

          {/* Field 2: صافي الوحدة (ر.س) */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800">
              صافي الوحدة (ر.س)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={unitNetPrice === 0 ? '' : unitNetPrice}
              onChange={(e) => setUnitNetPrice(Number(e.target.value))}
              className="w-full h-13 px-4 rounded-2xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 bg-white font-mono font-bold text-lg text-slate-900 outline-hidden transition-all text-right"
              placeholder="200"
            />
          </div>

          {/* Field 3: فترة الرسوم/المواسم */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-xs sm:text-sm font-bold text-emerald-800">
              فترة الرسوم/المواسم
            </label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="w-full h-13 px-4 rounded-2xl border border-purple-200 focus:border-purple-600 bg-white flex items-center justify-between text-right text-slate-800 font-bold text-sm cursor-pointer shadow-2xs hover:border-purple-400 transition-all"
            >
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`w-4 h-4 text-slate-600 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <span className="truncate">{selectedOption.label}</span>
            </button>

            {/* Custom Dropdown Menu matching IMG_1633.jpeg */}
            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-50 bg-white border border-purple-100 rounded-2xl shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                {SEASON_OPTIONS.map((opt) => {
                  const isSelected = opt.id === seasonPeriod;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSeasonPeriod(opt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-right text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 text-purple-950 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-5 text-purple-700">
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field 4: ملاحظة التعديل */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-emerald-800">
              ملاحظة التعديل
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: خصم خاص للمواسم أو تعديل إداري"
              className="w-full h-16 sm:h-20 px-4 rounded-2xl border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 bg-white text-xs sm:text-sm text-slate-800 outline-hidden transition-all text-right"
            />
          </div>

          {/* Action Button: تطبيق السعر */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="w-full h-13 rounded-2xl bg-[#5E17EB] hover:bg-[#4F10CE] active:scale-[0.99] text-white font-extrabold text-base shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>تطبيق السعر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
