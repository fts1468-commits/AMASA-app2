import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  User,
  Phone,
  Percent,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getResolvedDatePrice } from '../../lib/pricingService';

export const BookingModal: React.FC = () => {
  const {
    bookingModalOpen,
    setBookingModalOpen,
    preselectedDateForBooking,
    preselectedSectionForBooking,
    dateOverrides,
    properties,
    selectedPropertyId,
    marketers,
    isAdmin,
    currentMarketerId,
    activePermissions,
    canEditDeposit,
    addBooking,
  } = useApp();

  const [propId, setPropId] = useState(selectedPropertyId);
  const [sectionId, setSectionId] = useState<string>('');
  const [commType, setCommType] = useState<'full' | 'partial'>('partial');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('05');
  const [inDate, setInDate] = useState('');
  const [outDate, setOutDate] = useState('');
  const [deposit, setDeposit] = useState<number>(250);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [assignedMarketerId, setAssignedMarketerId] = useState(
    isAdmin ? marketers[0]?.id || '' : currentMarketerId
  );

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (bookingModalOpen) {
      setPropId(selectedPropertyId);
      const prop = properties.find((p) => p.id === selectedPropertyId);
      if (prop?.sections && prop.sections.length > 0) {
        setSectionId(preselectedSectionForBooking || prop.sections[0].id);
      } else {
        setSectionId('');
      }

      const today = preselectedDateForBooking || todayStr;
      const validIn = today < todayStr ? todayStr : today;
      setInDate(validIn);
      const nextD = new Date(validIn);
      nextD.setDate(nextD.getDate() + 1);
      setOutDate(nextD.toISOString().split('T')[0]);

      if (prop?.defaultDeposit) {
        setDeposit(prop.defaultDeposit);
      }
      if (!isAdmin) {
        setAssignedMarketerId(currentMarketerId);
      }
    }
  }, [bookingModalOpen, preselectedDateForBooking, preselectedSectionForBooking, selectedPropertyId, properties, isAdmin, currentMarketerId, todayStr]);

  if (!bookingModalOpen) return null;

  const activeProp = properties.find((p) => p.id === propId) || properties[0];
  const inTime = new Date(inDate).getTime();
  const outTime = new Date(outDate).getTime();
  const nights = Math.max(1, Math.round((outTime - inTime) / (1000 * 60 * 60 * 24))) || 1;

  const selectedSection = activeProp.sections?.find((s) => s.id === sectionId);
  const baseNightly = inDate
    ? getResolvedDatePrice(propId, sectionId || undefined, inDate, dateOverrides, properties)
    : (selectedSection?.priceWeekday || activeProp.basePriceWeekday);
  const rawTotal = baseNightly * nights;
  const netTotal = Math.max(0, rawTotal - discount);
  const commissionRate = commType === 'full' ? 7 : 5;
  const commissionAmount = Math.round(netTotal * (commissionRate / 100));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim() || !inDate || !outDate) return;

    if (inDate < todayStr) {
      alert('يمنع إنشاء أو قبول أي حجز على تواريخ فائتة. يرجى اختيار تاريخ اليوم أو تاريخ قادم.');
      return;
    }

    addBooking({
      propertyId: propId,
      sectionId: sectionId || undefined,
      sectionName: selectedSection?.name || undefined,
      customerName: custName,
      customerPhone: custPhone,
      checkInDate: inDate,
      checkOutDate: outDate,
      nightsCount: nights,
      nightlyPrice: baseNightly,
      totalPrice: netTotal,
      discount,
      depositPaid: deposit,
      marketerId: assignedMarketerId || undefined,
      commissionRatePercent: commissionRate,
      notes,
    });

    setCustName('');
    setCustPhone('05');
    setDiscount(0);
    setNotes('');
    setBookingModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 max-h-[92vh] flex flex-col">
        <div className="bg-gradient-to-l from-purple-900 via-purple-800 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-purple-200 backdrop-blur-xs">
              <CalendarPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">تسجيل حجز استراحة جديد</h3>
              <p className="text-xs text-purple-200">
                يتم احتساب عمولة الموظف تلقائياً (جزئي 5% - كلي 7%) عند إتمام الحجز
              </p>
            </div>
          </div>
          <button
            onClick={() => setBookingModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">اختر الاستراحة / العقار:</label>
            <select
              value={propId}
              onChange={(e) => {
                const newId = e.target.value;
                setPropId(newId);
                const targetProp = properties.find((p) => p.id === newId);
                if (targetProp?.sections && targetProp.sections.length > 0) {
                  setSectionId(targetProp.sections[0].id);
                } else {
                  setSectionId('');
                }
              }}
              className="w-full px-3.5 py-2.5 bg-purple-50/70 border border-purple-200 text-purple-950 font-bold rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.location.split('-')[1] || p.location} ({p.basePriceWeekday} ر.س / ليلة)
                </option>
              ))}
            </select>
          </div>

          {activeProp.sections && activeProp.sections.length > 0 && (
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                {activeProp.id === 'montaja-al-taraf'
                  ? 'اختر الوحدة المطلوبة للحجز في منتجع الترف:'
                  : 'اختر الوحدة أو القسم المطلوب:'}
              </label>
              <div
                className={`grid grid-cols-1 ${
                  activeProp.id === 'montaja-al-taraf'
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-2'
                } gap-2`}
              >
                {activeProp.sections.map((sec) => {
                  const isSecSelected = sectionId === sec.id;
                  const isCombo = sec.id.startsWith('resort-combo');
                  const secPrice = inDate
                    ? getResolvedDatePrice(propId, sec.id, inDate, dateOverrides, properties)
                    : sec.priceWeekday;

                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSectionId(sec.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        isSecSelected
                          ? 'bg-purple-800 text-white border-purple-800 shadow-md ring-2 ring-purple-600 ring-offset-1'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-1">
                        <span className="font-bold text-xs truncate">{sec.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                            isSecSelected
                              ? 'bg-white/20 text-white'
                              : isCombo
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isCombo
                            ? 'مدمجة تلقائياً'
                            : activeProp.id === 'montaja-al-taraf'
                            ? 'وحدة مستقلة'
                            : 'مستقلة'}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80 line-clamp-1">{sec.subtitle}</span>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-bold font-mono">
                        <span>السعر لليوم: {secPrice} ر.س</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم العميل (النزيل):</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="الاسم الثلاثي"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم الجوال (واتساب):</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="05xxxxxxxx"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">تاريخ الدخول:</label>
              <input
                type="date"
                required
                min={todayStr}
                value={inDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val < todayStr) return;
                  setInDate(val);
                  if (outDate <= val) {
                    const nextD = new Date(val);
                    nextD.setDate(nextD.getDate() + 1);
                    setOutDate(nextD.toISOString().split('T')[0]);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">تاريخ الخروج:</label>
              <input
                type="date"
                required
                min={inDate || todayStr}
                value={outDate}
                onChange={(e) => setOutDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
              />
            </div>
          </div>

          {isAdmin ? (
            <div>
              <label className="font-bold text-slate-700 block mb-1">تنسيب الحجز لمسوق:</label>
              <select
                value={assignedMarketerId}
                onChange={(e) => setAssignedMarketerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden"
              >
                <option value="">حجز مباشر للإدارة (بدون عمولة مسوق)</option>
                {marketers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
              <span className="text-slate-600">المسوق المسجل:</span>
              <span className="font-bold text-purple-950 font-mono">
                {marketers.find((m) => m.id === currentMarketerId)?.name}
              </span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">عمولة الموظف — نوع الحجز:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCommType('full')}
                className={`py-2.5 px-3 rounded-xl border font-bold transition-all cursor-pointer ${
                  commType === 'full'
                    ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                    : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                }`}
              >
                حجز كلي — 7%
              </button>
              <button
                type="button"
                onClick={() => setCommType('partial')}
                className={`py-2.5 px-3 rounded-xl border font-bold transition-all cursor-pointer ${
                  commType === 'partial'
                    ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                    : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                }`}
              >
                حجز جزئي — 5%
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 block">مبلغ العربون المطلوب (ريال):</label>
              {(canEditDeposit || isAdmin) && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  ✓ مصرح لك بتعديل العربون
                </span>
              )}
            </div>
            <input
              type="number"
              min={0}
              step={50}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              disabled={!canEditDeposit && !isAdmin}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-purple-600 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ملاحظات وطلبات خاصة:</label>
            <textarea
              rows={2}
              placeholder="مثال: عائلة، طلبوا سرير إضافي..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden"
            />
          </div>

          <div className="p-4 bg-gradient-to-l from-purple-50 to-indigo-50/70 rounded-2xl border border-purple-200 space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span>عدد الليالي:</span>
              <span className="font-bold font-mono">{nights} ليالي</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>الإجمالي:</span>
              <span className="font-mono">{netTotal} ر.س</span>
            </div>
            <div className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-purple-200 text-emerald-800 font-bold">
              <span className="flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>عمولة المسوق المكتسبة ({commissionRate}%):</span>
              </span>
              <span className="text-sm font-mono text-emerald-700">{commissionAmount} ر.س</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد الحجز واحتساب العمولة</span>
            </button>
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
