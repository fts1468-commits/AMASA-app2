import React, { useState, useEffect } from 'react';
import {
  CalendarPlus,
  User,
  Phone,
  Percent,
  CheckCircle2,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BookingService } from '../../types';
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
  const [notes, setNotes] = useState('');
  const [assignedMarketerId, setAssignedMarketerId] = useState(
    !isAdmin && currentMarketerId ? currentMarketerId : 'admin'
  );

  // Extra services & discount request state
  const [extraServices, setExtraServices] = useState<BookingService[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<string>('');
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);

  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('إلغاء الفطور');

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
      if (!isAdmin && currentMarketerId) {
        setAssignedMarketerId(currentMarketerId);
      } else if (isAdmin) {
        setAssignedMarketerId('admin');
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
  const extraServicesTotal = extraServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const calendarPrice = Math.max(0, rawTotal - (hasDiscount ? discountAmount : 0));
  const clientTotal = calendarPrice + extraServicesTotal;
  const isManagement = assignedMarketerId === 'admin' || !assignedMarketerId;
  const commissionRate = isManagement ? 0 : (commType === 'full' ? 7 : 5);
  const commissionAmount = isManagement ? 0 : Math.round(calendarPrice * (commissionRate / 100));

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
      totalPrice: calendarPrice,
      discount: hasDiscount ? discountAmount : 0,
      discountReason: hasDiscount ? discountReason : undefined,
      discountStatus: isAdmin
        ? (hasDiscount && discountAmount > 0 ? 'approved' : 'none')
        : (hasDiscount && discountAmount > 0 ? 'pending_approval' : 'none'),
      discountRequestedAmount: hasDiscount ? discountAmount : 0,
      extraServices,
      depositPaid: deposit,
      marketerId: isManagement ? undefined : assignedMarketerId,
      commissionRatePercent: isManagement ? 0 : commissionRate,
      notes,
    });

    setCustName('');
    setCustPhone('05');
    setExtraServices([]);
    setHasDiscount(false);
    setDiscountAmount(0);
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
                اختيار المسوق ونوع الحجز (كلي 7% - جزئي 5%) وتضاف العمولة تلقائياً للمسوق
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

          {/* اسم المسوق ونوع الحجز */}
          <div className="bg-purple-50/60 border border-purple-200/90 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b pb-2.5 border-purple-100">
              <span className="font-bold text-[#2E1045] text-xs sm:text-sm">اسم المسوق ونوع الحجز</span>
              {isManagement ? (
                <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  حجز مباشر للإدارة (0%)
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  عمولة {commissionRate}% مستحقة
                </span>
              )}
            </div>

            {/* الحقل الأول: اسم المسوق (الإدارة - أسماء المسوقين) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>اسم المسوق:</span>
                {isManagement && (
                  <span className="text-[10px] text-purple-700 font-normal">
                    الإدارة لا تأخذ عمولة
                  </span>
                )}
              </label>
              <select
                value={assignedMarketerId}
                onChange={(e) => setAssignedMarketerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-bold text-purple-950 cursor-pointer text-xs"
              >
                <option value="admin">الإدارة (حجز مباشر — لا عمولة 0%)</option>
                {marketers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            {/* الحقل الثاني: نوع الحجز (حجز كلي 7% - حجز جزئي 5%) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">نوع الحجز:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCommType('full')}
                  className={`py-2 px-3 rounded-xl border font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    commType === 'full'
                      ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                      : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <span>حجز كلي — 7%</span>
                  <span className={`text-[10px] ${commType === 'full' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {isManagement ? 'لا عمولة للإدارة' : 'عمولة 7% للمسوق'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCommType('partial')}
                  className={`py-2 px-3 rounded-xl border font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    commType === 'partial'
                      ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                      : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <span>حجز جزئي — 5%</span>
                  <span className={`text-[10px] ${commType === 'partial' ? 'text-purple-200' : 'text-slate-400'}`}>
                    {isManagement ? 'لا عمولة للإدارة' : 'عمولة 5% للمسوق'}
                  </span>
                </button>
              </div>
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

          {/* Section: خدمات حمران وطلب الخصم */}
          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-[#FAF7FD] to-[#F5EEFD] p-3.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b pb-2 border-purple-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <h4 className="font-bold text-purple-950 text-xs">
                  {activeProp.id === 'hamran' ? 'خدمات حمران وطلب الخصم' : `خدمات ${activeProp.name} وطلب الخصم`}
                </h4>
              </div>
              <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                تلقائي بالعقد + موافقة خصم
              </span>
            </div>

            {/* 1. إضافة خدمة */}
            <div className="space-y-2 bg-white p-3 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-purple-700" />
                  <span>إضافة خدمة إضافية (مساج، تنسيق الغرفة...)</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.2 rounded-md border border-emerald-200">
                  دون موافقة الإدارة ✓
                </span>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                تُضاف الخدمة إلى عرض العميل والعقد تلقائيًا، دون موافقة الإدارة. مبلغها لا يدخل في التقويم أو العمولة.
              </p>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  { name: 'مساج', price: 200 },
                  { name: 'تنسيق الغرفة', price: 150 },
                  { name: 'بوفيه إضافي', price: 300 },
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
                    className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold px-2 py-0.5 rounded-lg cursor-pointer"
                  >
                    + {preset.name} ({preset.price} ر.س)
                  </button>
                ))}
              </div>

              {extraServices.length > 0 && (
                <div className="space-y-1 pt-1">
                  {extraServices.map((svc) => (
                    <div key={svc.id} className="flex justify-between items-center p-1.5 bg-purple-50 rounded-lg text-xs">
                      <span>• {svc.name}</span>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-purple-950">+{svc.price} ر.س</strong>
                        <button
                          type="button"
                          onClick={() => setExtraServices((prev) => prev.filter((s) => s.id !== svc.id))}
                          className="text-rose-600 hover:text-rose-800 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] pt-1 font-bold text-purple-900">
                    <span>إجمالي الخدمات:</span>
                    <span className="font-mono">+{extraServicesTotal} ر.س</span>
                  </div>
                </div>
              )}

              {showAddServiceForm ? (
                <div className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="اسم الخدمة (مثل مساج)"
                      className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs"
                    />
                    <input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      placeholder="المبلغ (ر.س)"
                      className="bg-white border border-purple-200 rounded-lg px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceForm(false)}
                      className="px-2 py-1 text-slate-500 text-xs"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newServiceName.trim()) return;
                        setExtraServices((prev) => [
                          ...prev,
                          { id: `svc-${Date.now()}`, name: newServiceName.trim(), price: Number(newServicePrice) || 0 },
                        ]);
                        setNewServiceName('');
                        setNewServicePrice('');
                        setShowAddServiceForm(false);
                      }}
                      className="px-3 py-1 bg-purple-700 text-white rounded-lg text-xs font-bold"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddServiceForm(true)}
                  className="w-full py-1.5 text-xs text-purple-800 font-bold bg-purple-50 hover:bg-purple-100 rounded-lg border border-dashed border-purple-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{extraServices.length > 0 ? '+ إضافة خدمة أخرى' : '+ إضافة خدمة'}</span>
                </button>
              )}
            </div>

            {/* 2. طلب الخصم */}
            <div className="space-y-2 bg-white p-3 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  <span>طلب خصم (إلغاء الفطور مثلاً)</span>
                </span>
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
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-700" />
                </label>
              </div>

              {hasDiscount && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">مبلغ الخصم (ر.س):</label>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">سبب الخصم:</label>
                      <input
                        type="text"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder="مثل: إلغاء الفطور"
                        className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-900 leading-tight">
                    {isAdmin
                      ? '✓ بصفتك إدارة: يطبق الخصم مباشرة ويتحدث سعر التقويم والعمولة.'
                      : '⏳ سيُرسل تنبيه للإدارة للموافقة، وبعد الموافقة يتحدث سعر التقويم والعقد وتُحسب العمولة على السعر بعد الخصم.'}
                  </p>
                </div>
              )}
            </div>

            {/* 3. ملخص الحسبة الدقيقة */}
            <div className="bg-[#2E1045] text-white p-3 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <div className="bg-white/10 p-2 rounded-lg">
                  <span className="text-[10px] text-purple-300 block">سعر الوحدة ({nights} ليالٍ)</span>
                  <span className="font-mono font-bold">{rawTotal} ر.س</span>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                  <span className="text-[10px] text-amber-300 block">الخصم {hasDiscount ? `(${discountReason})` : ''}</span>
                  <span className="font-mono font-bold text-amber-300">
                    {hasDiscount && discountAmount > 0 ? `-${discountAmount}` : '0'} ر.س
                  </span>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded-lg col-span-2 flex items-center justify-between px-3">
                  <span className="text-[11px] text-emerald-200">✅ سعر الحجز بالتقويم وأساس العمولة:</span>
                  <strong className="font-mono text-emerald-300 text-sm">{calendarPrice} ر.س</strong>
                </div>
                <div className="bg-white/10 p-2 rounded-lg col-span-2 flex items-center justify-between px-3">
                  <span className="text-[11px] text-purple-200">الخدمات الإضافية (مثل مساج):</span>
                  <strong className="font-mono text-purple-100">+{extraServicesTotal} ر.س</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-purple-800 flex items-center justify-between text-xs">
                <span className="text-purple-300">✅ إجمالي العميل في العرض والعقد:</span>
                <strong className="font-mono text-amber-300 text-base font-black">{clientTotal} ر.س</strong>
              </div>

              <div className="flex items-center justify-between text-[11px] text-purple-200 pt-1">
                <span>
                  عمولة المسوق ({isManagement ? 'إدارة' : `${commissionRate}%`}):{' '}
                  <strong className="font-mono text-emerald-300">
                    {isManagement ? '0 ر.س (إدارة)' : `${commissionAmount} ر.س`}
                  </strong>
                </span>
                <span>
                  التأمين المستقل: <strong className="font-mono text-amber-200">{activeProp.insuranceAmount || 300} ر.س</strong>
                </span>
              </div>
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
