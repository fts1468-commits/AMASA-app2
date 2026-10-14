import React, { useState } from 'react';
import { X, Building2, Plus, Sparkles, MapPin, DollarSign, Users, ShieldAlert, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose }) => {
  const { addProperty } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState(() => `#${Math.floor(10000 + Math.random() * 90000)}`);
  const [subtitle, setSubtitle] = useState('');
  const [location, setLocation] = useState('الرياض - حي الرمال');
  const [basePriceWeekday, setBasePriceWeekday] = useState<number>(1000);
  const [basePriceWeekend, setBasePriceWeekend] = useState<number>(1400);
  const [capacity, setCapacity] = useState<number>(25);
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [areaM2, setAreaM2] = useState<number>(650);
  const [poolType, setPoolType] = useState('مسبح خاص مع جلسة استجمام ومسطحات خضراء');
  const [bankName, setBankName] = useState('مصرف الراجحي');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('SA0380000201608010998877');
  const [defaultDeposit, setDefaultDeposit] = useState<number>(300);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(400);

  // Quick initial unit setup
  const [hasSubUnits, setHasSubUnits] = useState(false);
  const [unit1Name, setUnit1Name] = useState('قسم واحد');
  const [unit1PriceWeekday, setUnit1PriceWeekday] = useState<number>(600);
  const [unit1PriceWeekend, setUnit1PriceWeekend] = useState<number>(850);
  const [unit2Name, setUnit2Name] = useState('قسمين');
  const [unit2PriceWeekday, setUnit2PriceWeekday] = useState<number>(1000);
  const [unit2PriceWeekend, setUnit2PriceWeekend] = useState<number>(1400);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const generatedSections = hasSubUnits
        ? [
            {
              id: `sec-${Date.now()}-1`,
              name: unit1Name.trim() || 'قسم 1',
              title: `${unit1Name.trim() || 'قسم 1'} المستقل`,
              subtitle: 'وحدة مستقلة مجهزة بجميع وسائل الراحة',
              priceWeekday: Number(unit1PriceWeekday) || basePriceWeekday,
              priceWeekend: Number(unit1PriceWeekend) || basePriceWeekend,
              capacity: Math.max(10, Math.floor(capacity / 2)),
              bedrooms: Math.max(1, Math.floor(bedrooms / 2)),
              bathrooms: Math.max(1, Math.floor(bathrooms / 2)),
              areaM2: Math.floor(areaM2 / 2),
              poolType: poolType,
              features: ['مدخل ومسبح خاص', 'مجلس ضيافة', 'جلسات خارجية'],
              images: [
                'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
              ],
              isAvailable: true,
            },
            {
              id: `sec-${Date.now()}-2`,
              name: unit2Name.trim() || 'قسم 2',
              title: `${unit2Name.trim() || 'قسم 2'} المستقل`,
              subtitle: 'وحدة مستقلة بمرافق ومسبح متكامل',
              priceWeekday: Number(unit2PriceWeekday) || basePriceWeekday,
              priceWeekend: Number(unit2PriceWeekend) || basePriceWeekend,
              capacity: capacity,
              bedrooms: bedrooms,
              bathrooms: bathrooms,
              areaM2: areaM2,
              poolType: poolType,
              features: ['كامل مرافق العقار', 'مجلس كبير', 'مسبحين ومسطحات واسعة'],
              images: [
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
              ],
              isAvailable: true,
            },
          ]
        : [];

      addProperty({
        name: name.trim(),
        code: code.trim() || `#${Math.floor(10000 + Math.random() * 90000)}`,
        subtitle: subtitle.trim() || `استراحة وشاليه ${name.trim()} الفاخر بأحدث المواصفات`,
        location: location.trim(),
        basePriceWeekday: Number(basePriceWeekday),
        basePriceWeekend: Number(basePriceWeekend),
        capacity: Number(capacity),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        areaM2: Number(areaM2),
        poolType: poolType.trim(),
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim() || name.trim(),
        iban: iban.trim(),
        defaultDeposit: Number(defaultDeposit),
        insuranceAmount: Number(insuranceAmount),
        subUnitsCount: generatedSections.length > 0 ? generatedSections.length : 1,
        sections: generatedSections.length > 0 ? generatedSections : undefined,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-purple-100 flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">إضافة عقار جديد</h3>
                <span className="text-[10px] bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                  <span>تفعيل تلقائي للجميع</span>
                </span>
              </div>
              <p className="text-xs text-purple-200 font-medium mt-0.5">
                إضافة استراحة أو منتجع وتخصيص أسعاره وتقويمه ووحداته بسهولة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Main Info */}
          <div className="space-y-3 bg-purple-50/50 p-3.5 sm:p-4 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>المعلومات الأساسية للعقار</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  اسم العقار <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: شاليهات الريم، منتجع الواحة"
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  رمز العقار (Code):
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="#83835"
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-600 font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  الوصف المختصر للعقار:
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="مثال: شاليه ملكي فاخر بمسبح دافئ ومسطحات خضراء وجلسات شواء"
                  className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-600 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  الموقع والحي:
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="الرياض - حي الرمال / طريق الثمامة"
                    className="w-full bg-white border border-purple-200 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-600 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3 bg-[#FAF7FD] p-3.5 sm:p-4 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>الأسعار الافتراضية (لكل ليلة)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  وسط الأسبوع (ر.س):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={basePriceWeekday}
                    onChange={(e) => setBasePriceWeekday(Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono"
                  />
                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-400">ر.س</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  نهاية الأسبوع / الويكند (ر.س):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={basePriceWeekend}
                    onChange={(e) => setBasePriceWeekend(Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-900 font-mono"
                  />
                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-400">ر.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Units Toggle */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-purple-200 bg-white space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-purple-950 block">
                  هل يحتوي هذا العقار على أقسام أو وحدات حجز مستقلة؟
                </span>
                <span className="text-[11px] text-purple-700/80">
                  مثل (قسم واحد، قسمين) أو (وحدات مستقلة بأسعار منفصلة)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHasSubUnits(!hasSubUnits)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  hasSubUnits ? 'bg-[#6B2896]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                    hasSubUnits ? '-translate-x-7' : '-translate-x-1'
                  }`}
                />
              </button>
            </div>

            {hasSubUnits && (
              <div className="pt-2 border-t border-purple-100 space-y-2.5 animate-in fade-in duration-150">
                <span className="text-[11px] font-bold text-purple-900 block">
                  تحديد الوحدتين الأوليين (يمكنك إضافة المزيد لاحقاً في أي وقت):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      اسم الوحدة 1:
                    </label>
                    <input
                      type="text"
                      value={unit1Name}
                      onChange={(e) => setUnit1Name(e.target.value)}
                      placeholder="قسم واحد"
                      className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs font-medium"
                    />
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <input
                        type="number"
                        placeholder="وسط"
                        value={unit1PriceWeekday}
                        onChange={(e) => setUnit1PriceWeekday(Number(e.target.value))}
                        className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-mono"
                      />
                      <input
                        type="number"
                        placeholder="ويكند"
                        value={unit1PriceWeekend}
                        onChange={(e) => setUnit1PriceWeekend(Number(e.target.value))}
                        className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-mono text-purple-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                      اسم الوحدة 2:
                    </label>
                    <input
                      type="text"
                      value={unit2Name}
                      onChange={(e) => setUnit2Name(e.target.value)}
                      placeholder="قسمين"
                      className="w-full bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs font-medium"
                    />
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      <input
                        type="number"
                        placeholder="وسط"
                        value={unit2PriceWeekday}
                        onChange={(e) => setUnit2PriceWeekday(Number(e.target.value))}
                        className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-mono"
                      />
                      <input
                        type="number"
                        placeholder="ويكند"
                        value={unit2PriceWeekend}
                        onChange={(e) => setUnit2PriceWeekend(Number(e.target.value))}
                        className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-[11px] font-mono text-purple-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span>المواصفات والسعة</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">السعة (أشخاص):</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">غرف النوم:</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">دورات المياه:</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">المساحة (م²):</label>
                <input
                  type="number"
                  value={areaM2}
                  onChange={(e) => setAreaM2(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">نوع المسبح والمرافق الخارجية:</label>
              <input
                type="text"
                value={poolType}
                onChange={(e) => setPoolType(e.target.value)}
                placeholder="مسبح خاص مع جلسة استجمام ومسطحات خضراء"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-3 bg-purple-50/40 p-3.5 sm:p-4 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
              <span>الحساب البنكي والعربون</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">اسم البنك:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-700 block mb-1">اسم المستفيد بالحساب:</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="اسم صاحب الحساب"
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-[10px] font-bold text-slate-700 block mb-1">رقم الآيبان (IBAN):</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">العربون الافتراضي (ر.س):</label>
                <input
                  type="number"
                  value={defaultDeposit}
                  onChange={(e) => setDefaultDeposit(Number(e.target.value))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">مبلغ التأمين المسترد (ر.س):</label>
                <input
                  type="number"
                  value={insuranceAmount}
                  onChange={(e) => setInsuranceAmount(Number(e.target.value))}
                  className="w-full bg-white border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وتفعيل العقار فوراً للجميع</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
