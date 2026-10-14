import React, { useState } from 'react';
import { X, Layers, Plus, Sparkles, DollarSign, Users, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPropertyId?: string;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  isOpen,
  onClose,
  targetPropertyId,
}) => {
  const { properties, selectedPropertyId, addPropertySection } = useApp();

  const activePropId = targetPropertyId || selectedPropertyId;
  const [propertyId, setPropertyId] = useState(activePropId);

  const currentProperty = properties.find((p) => p.id === propertyId) || properties[0];

  const [unitName, setUnitName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [priceWeekday, setPriceWeekday] = useState<number>(() => currentProperty?.basePriceWeekday || 800);
  const [priceWeekend, setPriceWeekend] = useState<number>(() => currentProperty?.basePriceWeekend || 1200);
  const [capacity, setCapacity] = useState<number>(15);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [areaM2, setAreaM2] = useState<number>(450);
  const [poolType, setPoolType] = useState('مسبح خاص مستقل مع جلسة استجمام');
  const [featuresText, setFeaturesText] = useState(
    'مدخل ومسبح خاص مستقل بالكامل\nمجلس ضيافة فخم مجهز\nجلسات خارجية ومسطحات خضراء\nشاشات ذكية وتكييف متطور'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !propertyId) return;

    setIsSubmitting(true);

    try {
      const features = featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      addPropertySection(propertyId, {
        name: unitName.trim(),
        title: `${unitName.trim()} المستقلة`,
        subtitle: subtitle.trim() || `وحدة حجز مستقلة بمدخل ومرافق خاصة داخل ${currentProperty?.name || 'العقار'}`,
        priceWeekday: Number(priceWeekday),
        priceWeekend: Number(priceWeekend),
        capacity: Number(capacity),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        areaM2: Number(areaM2),
        poolType: poolType.trim(),
        features: features.length > 0 ? features : ['مدخل ومسبح خاص مستقل'],
        images: [
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        ],
        coverImage: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        isAvailable: true,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-purple-100 flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">إضافة وحدة جديدة للعقار</h3>
                <span className="text-[10px] bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                  <span>تفعيل تلقائي</span>
                </span>
              </div>
              <p className="text-xs text-purple-200 font-medium mt-0.5">
                تخصيص وحدة حجز مستقلة بأسعار وتقويم ومواصفات خاصة
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
          {/* Target Property */}
          <div className="bg-purple-50/60 p-3 sm:p-3.5 rounded-2xl border border-purple-100 space-y-1.5">
            <label className="text-[11px] font-bold text-purple-950 block">
              العقار المراد إضافة الوحدة إليه:
            </label>
            <select
              value={propertyId}
              onChange={(e) => {
                const nextId = e.target.value;
                setPropertyId(nextId);
                const found = properties.find((p) => p.id === nextId);
                if (found) {
                  setPriceWeekday(found.basePriceWeekday || 800);
                  setPriceWeekend(found.basePriceWeekend || 1200);
                }
              }}
              className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-purple-600 cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Unit Basic Info */}
          <div className="space-y-3 bg-[#FAF7FD] p-3.5 sm:p-4 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              <span>بيانات الوحدة الجديدة</span>
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                اسم الوحدة <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="مثال: وحدة كاندي، القسم الشرقي، جناح كبار الشخصيات"
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-600 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                الوصف المختصر للوحدة:
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="مثال: طابع ريفي دافئ مع مسبح خاص وجلسات كوانين شتوية"
                className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-purple-600 font-medium"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3 bg-purple-50/40 p-3.5 sm:p-4 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>تسعيرة الليلة للوحدة</span>
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
                    value={priceWeekday}
                    onChange={(e) => setPriceWeekday(Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 font-mono"
                  />
                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-400">ر.س</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  الويكند / نهاية الأسبوع (ر.س):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={priceWeekend}
                    onChange={(e) => setPriceWeekend(Number(e.target.value))}
                    className="w-full bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs font-bold text-purple-900 font-mono"
                  />
                  <span className="absolute left-2.5 top-2 text-[10px] text-slate-400">ر.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-3 bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              <span>مواصفات وسعة الوحدة</span>
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
              <label className="text-[10px] font-bold text-slate-600 block mb-1">المسبح والمرافق:</label>
              <input
                type="text"
                value={poolType}
                onChange={(e) => setPoolType(e.target.value)}
                placeholder="مسبح خاص مع جلسات استجمام"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                المميزات الرئيسية (ميزة بكل سطر):
              </label>
              <textarea
                rows={3}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
              />
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
              disabled={isSubmitting || !unitName.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وتفعيل الوحدة فوراً للجميع</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
