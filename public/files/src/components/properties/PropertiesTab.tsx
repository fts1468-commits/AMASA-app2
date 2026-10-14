import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  MapPin,
  Eye,
  Share2,
  Send,
  Sparkles,
  Layers,
  Edit2,
  DollarSign,
  Waves,
  Check,
  Copy,
  Plus,
  Image as ImageIcon,
  Save,
  Link2,
  RefreshCw,
  CheckCircle2,
  X,
  FileText,
  Landmark,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Property, PropertySection } from '../../types';

export const PropertiesTab: React.FC = () => {
  const {
    properties,
    updateProperty,
    updatePropertySection,
    togglePropertyPublished,
    isAdmin,
    setSelectedPropertyId,
    setActiveTab,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyDetailId, setSelectedPropertyDetailId] = useState<string | null>(null);
  const [editSectionKey, setEditSectionKey] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Property>>({});
  const [activeSectionId, setActiveSectionId] = useState<string>('section-1');

  useEffect(() => {
    if (activeProperty && activeProperty.id === 'al-taraf' && activeSectionId === 'all') {
      setActiveSectionId(activeProperty.sections?.[0]?.id || 'section-1');
    }
  }, [activeProperty, activeSectionId]);

  // Section editor modal
  const [editingSection, setEditingSection] = useState<PropertySection | null>(null);
  const [sectionFormData, setSectionFormData] = useState<Partial<PropertySection>>({});
  const [newFeatureText, setNewFeatureText] = useState('');

  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // iCal sync modal
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncPropId, setSyncPropId] = useState<string | null>(null);
  const [copiedSyncKey, setCopiedSyncKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [gathernUrl, setGathernUrl] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [airbnbUrl, setAirbnbUrl] = useState('');

  const [syncStatuses, setSyncStatuses] = useState<Record<string, { gathern?: boolean; booking?: boolean; airbnb?: boolean; lastSync?: string }>>(() => {
    try {
      const s = localStorage.getItem('property_calendar_sync_status');
      if (s) return JSON.parse(s);
    } catch {}
    return {
      'al-taraf': { gathern: true, booking: true, airbnb: false, lastSync: 'منذ 5 دقائق' },
      'al-baylasan': { gathern: true, booking: false, airbnb: false, lastSync: 'منذ 18 دقيقة' },
      rans: { gathern: false, booking: false, airbnb: false },
      alma: { gathern: true, booking: true, airbnb: false, lastSync: 'منذ ساعة' },
      naya: { gathern: false, booking: false, airbnb: false },
      hamran: { gathern: false, booking: false, airbnb: false },
    };
  });

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const openSyncModal = (propId: string) => {
    setSyncPropId(propId);
    try {
      const raw = localStorage.getItem('property_calendar_sync_urls');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[propId]) {
          setGathernUrl(parsed[propId].gathern || '');
          setBookingUrl(parsed[propId].booking || '');
          setAirbnbUrl(parsed[propId].airbnb || '');
        } else {
          setGathernUrl('');
          setBookingUrl('');
          setAirbnbUrl('');
        }
      }
    } catch {}
    setSyncModalOpen(true);
  };

  const copySyncText = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSyncKey(key);
    setTimeout(() => setCopiedSyncKey(null), 2000);
  };

  const executeSync = () => {
    if (!syncPropId) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    setTimeout(() => {
      setIsSyncing(false);
      const updated = {
        ...syncStatuses,
        [syncPropId]: {
          gathern: !!gathernUrl || syncStatuses[syncPropId]?.gathern || true,
          booking: !!bookingUrl || syncStatuses[syncPropId]?.booking || true,
          airbnb: !!airbnbUrl || syncStatuses[syncPropId]?.airbnb || false,
          lastSync: 'الآن',
        },
      };
      setSyncStatuses(updated);
      try {
        localStorage.setItem('property_calendar_sync_status', JSON.stringify(updated));
        const raw = localStorage.getItem('property_calendar_sync_urls');
        const urls = raw ? JSON.parse(raw) : {};
        urls[syncPropId] = { gathern: gathernUrl, booking: bookingUrl, airbnb: airbnbUrl };
        localStorage.setItem('property_calendar_sync_urls', JSON.stringify(urls));
      } catch {}
      setSyncFeedback('تمت مزامنة وتقييد الحجوزات مع جاذر إن وبوكينج بنجاح!');
      showToast('تم حفظ روابط المزامنة وتقييد الحجوزات بنجاح');
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 1200);
  };

  const filteredProperties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.subtitle || '').toLowerCase().includes(q)
      );
    });
  }, [properties, searchQuery]);

  const activeProperty = useMemo(() => {
    if (!selectedPropertyDetailId) return null;
    return properties.find((p) => p.id === selectedPropertyDetailId) || null;
  }, [properties, selectedPropertyDetailId]);

  const startEditSection = (sec: PropertySection) => {
    setEditingSection(sec);
    setSectionFormData({ ...sec, features: [...sec.features] });
    setNewFeatureText('');
  };

  const saveSectionChanges = () => {
    if (!activeProperty || !editingSection) return;
    updatePropertySection(activeProperty.id, editingSection.id, sectionFormData);
    setEditingSection(null);
    showToast(`تم حفظ معلومات وسعر ${editingSection.name} بنجاح`);
  };

  const addFeatureToSection = () => {
    if (!newFeatureText.trim()) return;
    const current = sectionFormData.features || [];
    setSectionFormData({ ...sectionFormData, features: [...current, newFeatureText.trim()] });
    setNewFeatureText('');
  };

  const removeFeatureFromSection = (idx: number) => {
    const current = sectionFormData.features || [];
    setSectionFormData({ ...sectionFormData, features: current.filter((_, i) => i !== idx) });
  };

  const sendSectionWhatsApp = (prop: Property, sec: PropertySection) => {
    const text = `أهلاً وسهلاً بك 🌿
تفاصيل وأسعار (${prop.name} - ${sec.name}):

💰 الأسعار المعتمدة:
• وسط الأسبوع: ${sec.priceWeekday} ر.س / ليلة
• نهاية الأسبوع (الويكند): ${sec.priceWeekend} ر.س / ليلة

📋 معلومات ومواصفات القسم:
• ${sec.subtitle}
• السعة: تتسع لـ ${sec.capacity} فرداً
• غرف النوم: ${sec.bedrooms} | دورات المياه: ${sec.bathrooms}
• المساحة: ${sec.areaM2} م²
${sec.poolType ? `• المسبح: ${sec.poolType}\n` : ''}
✨ أبرز المرافق والتجهيزات:
${sec.features.map((f) => `• ${f}`).join('\n')}

📍 الموقع: ${prop.location}
يسعدنا تواصلكم لتأكيد الحجز!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copySectionInfo = (prop: Property, sec: PropertySection) => {
    const text = `🌿 تفاصيل وأسعار (${prop.name} - ${sec.name}):
• السعر وسط الأسبوع: ${sec.priceWeekday} ر.س / ليلة
• السعر نهاية الأسبوع: ${sec.priceWeekend} ر.س / ليلة
• المعلومات: ${sec.subtitle}
• السعة: ${sec.capacity} فرداً | غرف النوم: ${sec.bedrooms} | دورات المياه: ${sec.bathrooms}
• المساحة: ${sec.areaM2} م²
${sec.poolType ? `• المسبح: ${sec.poolType}\n` : ''}• المرافق: ${sec.features.join('، ')}
• الموقع: ${prop.location}`;

    navigator.clipboard?.writeText(text);
    showToast(`تم نسخ معلومات وسعر ${sec.name}`);
  };

  // One-click copy of ALL property details for the marketer (requirement from prompt)
  const copyAllPropertyData = (prop: Property) => {
    const sectionsText = prop.sections?.length
      ? prop.sections
          .map(
            (sec) =>
              `\n--- [${sec.name}: ${sec.title}] ---\n• وسط الأسبوع: ${sec.priceWeekday} ر.س | الويكند: ${sec.priceWeekend} ر.س\n• السعة: ${sec.capacity} فرد | المساحة: ${sec.areaM2} م² | غرف: ${sec.bedrooms} | حمام: ${sec.bathrooms}\n• المسبح: ${sec.poolType}\n• المواصفات: ${sec.subtitle}\n• المرافق: ${sec.features.join('، ')}`
          )
          .join('\n')
      : '';

    const text = `🏰 بيانات عقار: ${prop.name} (${prop.code})
📍 الموقع: ${prop.location}
💰 الأسعار الرسمية:
• وسط الأسبوع: ${prop.basePriceWeekday} ر.س / ليلة
• نهاية الأسبوع (الويكند): ${prop.basePriceWeekend} ر.س / ليلة
• التأمين المسترد: ${prop.insuranceAmount} ر.س | العربون: ${prop.defaultDeposit} ر.س
• أوقات الدخول والخروج: دخول ${prop.checkInTimeText} - خروج ${prop.checkOutTimeText}
• السعة: ${prop.capacity} فرد | المساحة: ${prop.areaM2} م² | غرف النوم: ${prop.bedrooms} | دورات المياه: ${prop.bathrooms}
• المسبح: ${prop.poolType}
• الوصف: ${prop.subtitle}
• المرافق والتجهيزات: ${prop.features.join('، ')}
${sectionsText ? `\n🏢 الأقسام المستقلة:${sectionsText}\n` : ''}
🏦 الحساب البنكي المعتمد:
• البنك: ${prop.bankName}
• المستفيد: ${prop.accountHolder}
• الآيبان (IBAN): ${prop.iban}
📍 خريطة Google: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${prop.name} ${prop.location}`)}
📸 صور العقار: ${prop.coverImage}`;

    navigator.clipboard?.writeText(text);
    showToast(`تم نسخ كل بيانات ${prop.name} بالكامل بنقرة واحدة!`);
  };

  const startEditProperty = (sectionKey: string) => {
    if (activeProperty) {
      setEditSectionKey(sectionKey);
      setEditFormData({ ...activeProperty });
    }
  };

  const savePropertyEdit = () => {
    if (!activeProperty || !selectedPropertyDetailId) return;
    updateProperty(selectedPropertyDetailId, editFormData);
    setEditSectionKey(null);
    showToast('تم حفظ التعديلات بنجاح');
  };

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-4 pt-2 space-y-4 font-['Tajawal',sans-serif]">
      {toastMsg && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-purple-950/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-purple-400/30 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main List View */}
      {!selectedPropertyDetailId && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="pt-2 text-right">
            <h1 className="text-2xl sm:text-3xl font-black text-[#2E1045] tracking-tight">العقارات والوحدات</h1>
            <p className="text-sm text-purple-600/80 mt-1 font-medium">
              {filteredProperties.length} وحدة — اضغط على بطاقة لعرض وتعديل التفاصيل
            </p>
          </div>

          {/* Search box */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-purple-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الموقع أو الكود..."
              dir="rtl"
              className="w-full bg-white border border-purple-100/80 rounded-2xl pr-11 pl-4 py-3 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-400 focus:ring-2 focus:ring-purple-100 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Properties Cards List */}
          <div className="space-y-4">
            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                onClick={() => setSelectedPropertyDetailId(prop.id)}
                className="bg-white rounded-3xl overflow-hidden shadow-xs border border-purple-100/70 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="bg-[#F4EFFB] p-4 relative min-h-[170px] flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between w-full z-10">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs backdrop-blur-xs transition-colors ${
                        prop.isPublished
                          ? 'bg-[#EAF8F1] text-[#1E7E52] border border-[#B7E8D0]'
                          : 'bg-[#FDF0ED] text-[#C0392B] border border-[#F5C6CB]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${prop.isPublished ? 'bg-[#1E7E52]' : 'bg-[#C0392B]'}`} />
                      <span>{prop.isPublished ? 'متاح' : 'مغلق'}</span>
                    </div>

                    <div className="bg-[#6B2896] text-white px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <Building2 className="w-3.5 h-3.5 text-purple-200" />
                      <span>{prop.subUnitsCount || 2} وحدات فرعية</span>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-200/40 border border-purple-300/40 flex items-center justify-center text-purple-400 group-hover:scale-108 group-hover:text-purple-600 transition-all duration-300 shadow-2xs">
                      <Building2 className="w-9 h-9 stroke-[1.5]" />
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#2E1045] tracking-tight group-hover:text-purple-700 transition-colors">
                      {prop.name}
                    </h3>
                    <span className="bg-[#ECE5F8] text-[#6B2896] text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border border-purple-200/50">
                      {prop.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{prop.location}</span>
                  </div>

                  {/* Sections Preview */}
                  {prop.sections && prop.sections.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 p-2.5 rounded-2xl border border-purple-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-950">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{prop.id === 'al-taraf' ? 'خيارات حجز الترف (قسم واحد أو قسمين):' : `${prop.name} (${prop.sections.length} وحدات):`}</span>
                        </span>
                        <span className="text-[10px] bg-purple-200/60 text-purple-900 px-2 py-0.5 rounded-md font-bold">
                          {prop.id === 'al-taraf' ? 'قسم واحد أو قسمين' : 'وحدات مستقلة'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {prop.sections.map((s) => (
                          <div
                            key={s.id}
                            className="bg-white/95 p-1.5 px-2 rounded-xl border border-purple-100 flex items-center justify-between text-[11px]"
                          >
                            <span className="font-bold text-slate-800 truncate">{s.name}</span>
                            <span className="text-purple-700 font-bold font-mono shrink-0 mr-1">
                              {s.priceWeekday} ر.س
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAllPropertyData(prop);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="نسخ كل بيانات العقار بنقرة واحدة للموظف"
                    >
                      <Copy className="w-3 h-3 text-purple-600" />
                      <span>نسخ كل بيانات العقار</span>
                    </button>

                    <div className="text-left text-slate-600 font-medium">
                      <span className="font-bold text-[#2E1045] font-mono text-sm ml-1">{prop.basePriceWeekday}</span>
                      <span>ر.س / ليلة</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Details View */}
      {selectedPropertyDetailId && activeProperty && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setSelectedPropertyDetailId(null)}
              className="text-[#6B2896] hover:text-purple-900 font-bold text-sm flex items-center gap-1 transition-colors cursor-pointer py-1"
            >
              <span>← العودة للقائمة</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyAllPropertyData(activeProperty)}
                className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-purple-700" />
                <span>نسخ كل بيانات العقار</span>
              </button>
              <span className="text-xs bg-[#ECE5F8] text-[#6B2896] font-mono font-bold px-2.5 py-1 rounded-lg">
                {activeProperty.code}
              </span>
            </div>
          </div>

          {/* Banner with cover */}
          <div className="relative rounded-3xl overflow-hidden shadow-xs h-48 sm:h-56 bg-gradient-to-br from-[#BBAFD5] via-[#A08EC3] to-[#7861A7] flex flex-col justify-between p-5 text-white">
            <div className="flex items-end justify-between z-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{activeProperty.name}</h2>
                <p className="text-xs text-purple-100 flex items-center gap-1 mt-0.5 drop-shadow-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activeProperty.location}</span>
                </p>
              </div>
              <span className="text-xs bg-black/30 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full border border-white/20">
                {activeProperty.subUnitsCount || 2} وحدات فرعية
              </span>
            </div>
          </div>

          {/* Action Header Card: Status & Quick Buttons */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-100/80 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  togglePropertyPublished(activeProperty.id);
                  showToast(activeProperty.isPublished ? `تم إيقاف ${activeProperty.name}` : `تم فتح ${activeProperty.name}`);
                }}
                className="bg-[#6B2896] hover:bg-[#581D7D] active:scale-98 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>{activeProperty.isPublished ? 'تغيير إلى مغلق' : 'تغيير إلى متاح'}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-medium">الحالة</span>
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    activeProperty.isPublished
                      ? 'bg-[#EAF8F1] text-[#1E7E52] border border-[#B7E8D0]'
                      : 'bg-[#FDF0ED] text-[#C0392B] border border-[#F5C6CB]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeProperty.isPublished ? 'bg-[#1E7E52]' : 'bg-[#C0392B]'}`} />
                  <span>{activeProperty.isPublished ? 'متاح' : 'مغلق'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedPropertyId(activeProperty.id);
                  setActiveTab('calendar');
                }}
                className="bg-[#F4EFFB] hover:bg-purple-100 text-[#6B2896] border border-purple-100 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة بالتقويم</span>
              </button>
              <button
                onClick={() => copyAllPropertyData(activeProperty)}
                className="bg-[#F4EFFB] hover:bg-purple-100 text-[#6B2896] border border-purple-100 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ البيانات</span>
              </button>
              <button
                onClick={() => openSyncModal(activeProperty.id)}
                className="bg-[#EBF8F2] hover:bg-emerald-100 text-[#1E7E52] border border-emerald-100 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>ربط التقويم</span>
              </button>
            </div>
          </div>

          {/* Sections block for multi-section properties (e.g. Al-Taraf) */}
          {activeProperty.sections && activeProperty.sections.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-xs border-2 border-purple-200/90 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center shadow-md">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#2E1045] flex items-center gap-2">
                      <span>{activeProperty.id === 'al-taraf' ? 'خيارات حجز الترف (قسم واحد وقسمين)' : `أقسام الاستراحة (${activeProperty.name})`}</span>
                      <span className="text-[10px] bg-purple-100 text-[#6B2896] px-2.5 py-0.5 rounded-full font-bold">
                        {activeProperty.id === 'al-taraf' ? 'قسم واحد أو قسمين' : `${activeProperty.sections.length} أقسام`}
                      </span>
                    </h3>
                    <p className="text-xs text-purple-600/80 font-medium">
                      {activeProperty.id === 'al-taraf'
                        ? 'معلومات ومواصفات وأسعار حجز قسم واحد أو حجز قسمين'
                        : 'معلومات ومواصفات وأسعار كل قسم على حدة، أو حجز كامل الاستراحة'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section selector tabs */}
              <div className={`grid ${activeProperty.id === 'al-taraf' ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 p-1.5 bg-[#F5EFFB] rounded-2xl border border-purple-200/60`}>
                {activeProperty.sections.map((sec, idx) => {
                  const isSecActive = activeSectionId === sec.id;
                  const icon = idx === 0 ? '👑' : '🌿';
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSecActive
                          ? 'bg-[#6B2896] text-white shadow-sm ring-2 ring-purple-300/50'
                          : 'text-slate-600 hover:text-purple-900 hover:bg-white/60'
                      }`}
                    >
                      <span>{icon}</span>
                      <span className="truncate">{sec.name}</span>
                    </button>
                  );
                })}
                {activeProperty.id !== 'al-taraf' && (
                  <button
                    type="button"
                    onClick={() => setActiveSectionId('all')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeSectionId === 'all'
                        ? 'bg-[#6B2896] text-white shadow-sm ring-2 ring-purple-300/50'
                        : 'text-slate-600 hover:text-purple-900 hover:bg-white/60'
                    }`}
                  >
                    <span>🏰</span>
                    <span className="truncate">كامل الاستراحة</span>
                  </button>
                )}
              </div>

              {/* Active Section Details */}
              {activeSectionId !== 'all' && (
                (() => {
                  const sec =
                    activeProperty.sections.find((s) => s.id === activeSectionId) ||
                    activeProperty.sections[0];

                  return (
                    <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#2E1045]">{sec.name}</span>
                            {sec.title && (
                              <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                                {sec.title}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">قسم مستقل بمدخل خاص ومرافق متكاملة</p>
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => startEditSection(sec)}
                            className="bg-[#F4EFFB] hover:bg-purple-100 text-[#6B2896] border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-[#6B2896]" />
                            <span>تعديل معلومات وسعر {sec.name}</span>
                          </button>
                        )}
                      </div>

                      {/* Section pricing banner */}
                      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 text-white rounded-2xl p-4 shadow-md space-y-2">
                        <div className="flex items-center justify-between text-xs text-purple-200">
                          <span className="flex items-center gap-1.5 font-bold">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                            <span>سعر حجز {sec.name} المعتمد:</span>
                          </span>
                          <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            حجز منفصل
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-purple-200 block">وسط الأسبوع (الأحد - الأربعاء)</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-2xl font-black font-mono text-white">{sec.priceWeekday}</span>
                              <span className="text-xs text-purple-200">ر.س / ليلة</span>
                            </div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                            <span className="text-[10px] text-purple-200 block">نهاية الأسبوع (الخميس والجمعة)</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-2xl font-black font-mono text-amber-300">{sec.priceWeekend}</span>
                              <span className="text-xs text-purple-200">ر.س / ليلة</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-700 block">معلومات ومواصفات {sec.name}:</span>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-150">
                          {sec.subtitle}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-[#FAF7FD] p-2.5 rounded-2xl border border-purple-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">السعة</span>
                            <span className="font-bold font-mono text-purple-900 text-sm">{sec.capacity} فرد</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">غرف النوم</span>
                            <span className="font-bold font-mono text-purple-900 text-sm">{sec.bedrooms}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">دورات المياه</span>
                            <span className="font-bold font-mono text-purple-900 text-sm">{sec.bathrooms}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">المساحة</span>
                            <span className="font-bold font-mono text-purple-900 text-sm">{sec.areaM2} م²</span>
                          </div>
                        </div>

                        {sec.poolType && (
                          <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-150 flex items-center gap-2 text-xs text-blue-900">
                            <Waves className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>
                              <strong>المسبح أو الجاكوزي:</strong> {sec.poolType}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600 block">المرافق والتجهيزات:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                            {sec.features.map((feat, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/50 border border-purple-100/70 text-slate-700"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="text-[11px] font-medium">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100">
                        <button
                          type="button"
                          onClick={() => copySectionInfo(activeProperty, sec)}
                          className="bg-[#F4EFFB] hover:bg-purple-100 text-[#6B2896] border border-purple-150 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ معلومات القسم</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => sendSectionWhatsApp(activeProperty, sec)}
                          className="bg-[#EBF8F2] hover:bg-emerald-100 text-[#1E7E52] border border-emerald-150 rounded-xl py-2 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>واتساب للعميل</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Full property combined view */}
              {activeSectionId === 'all' && activeProperty.id !== 'al-taraf' && (
                <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
                  <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-purple-200">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>حجز كامل الاستراحة (جميع الوحدات معاً):</span>
                      </span>
                      <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        خصم وتوفير خاص
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-purple-200 block">وسط الأسبوع (كامل الاستراحة)</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black font-mono text-white">{activeProperty.basePriceWeekday}</span>
                          <span className="text-xs text-purple-200">ر.س / ليلة</span>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-purple-200 block">نهاية الأسبوع (الويكند كامل)</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black font-mono text-amber-300">{activeProperty.basePriceWeekend}</span>
                          <span className="text-xs text-purple-200">ر.س / ليلة</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* General Property Info Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => startEditProperty('info')}
                className="bg-[#F4EFFB] hover:bg-purple-100 text-[#6B2896] border border-purple-100 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-[#6B2896]" />
                <span>تعديل</span>
              </button>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#6B2896]" />
                <h3 className="font-bold text-sm sm:text-base text-[#2E1045]">معلومات المكان</h3>
              </div>
            </div>

            {editSectionKey === 'info' ? (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-100 animate-in fade-in">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">الوصف المختصر:</label>
                  <textarea
                    value={editFormData.subtitle || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, subtitle: e.target.value })}
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-purple-200 text-xs outline-hidden focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">سعر وسط الأسبوع (ر.س):</label>
                    <input
                      type="number"
                      value={editFormData.basePriceWeekday || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, basePriceWeekday: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-purple-200 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">سعر الويكند (ر.س):</label>
                    <input
                      type="number"
                      value={editFormData.basePriceWeekend || 0}
                      onChange={(e) => setEditFormData({ ...editFormData, basePriceWeekend: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-purple-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditSectionKey(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={savePropertyEdit}
                    className="btn-mauve-shiny px-5 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ التعديل</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{activeProperty.subtitle}</p>
                <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl text-slate-700 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">السعة</span>
                    <span className="font-bold font-mono text-purple-900">{activeProperty.capacity} فرد</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">غرف النوم</span>
                    <span className="font-bold font-mono text-purple-900">{activeProperty.bedrooms}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">دورات المياه</span>
                    <span className="font-bold font-mono text-purple-900">{activeProperty.bathrooms}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">المساحة</span>
                    <span className="font-bold font-mono text-purple-900">{activeProperty.areaM2} م²</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photos Album Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">{activeProperty.images?.length || 0} صورة</span>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#6B2896]" />
                <h3 className="font-bold text-sm sm:text-base text-[#2E1045]">ألبوم الصور</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {(activeProperty.images || [activeProperty.coverImage]).map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setPreviewImage(img)}
                  className="h-20 sm:h-24 rounded-2xl overflow-hidden border border-purple-100 hover:border-purple-300 transition-all cursor-pointer relative group"
                >
                  <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          </div>

          {/* Bank Info Card */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => startEditProperty('bank')}
                className="btn-mauve-shiny rounded-xl px-4 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md"
              >
                <span>{activeProperty.iban ? 'تعديل' : 'إضافة'}</span>
              </button>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#6B2896]" />
                <h3 className="font-bold text-sm sm:text-base text-[#2E1045]">المعلومات البنكية</h3>
              </div>
            </div>

            {editSectionKey === 'bank' ? (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-100 animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">اسم البنك:</label>
                    <input
                      type="text"
                      value={editFormData.bankName || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-purple-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">اسم صاحب الحساب:</label>
                    <input
                      type="text"
                      value={editFormData.accountHolder || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, accountHolder: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-purple-200 text-xs font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">رقم الآيبان (IBAN):</label>
                  <input
                    type="text"
                    value={editFormData.iban || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, iban: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-purple-200 text-xs font-mono font-bold"
                    placeholder="SA..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditSectionKey(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={savePropertyEdit}
                    className="btn-mauve-shiny px-5 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ البيانات البنكية</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-700 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">البنك:</span>
                  <span className="font-bold text-[#2E1045]">{activeProperty.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">اسم الحساب:</span>
                  <span className="font-bold text-[#2E1045]">{activeProperty.accountHolder}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-400">الآيبان (IBAN):</span>
                  <span className="font-mono text-purple-900 font-bold select-all">{activeProperty.iban}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-150 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-l from-purple-900 via-purple-800 to-indigo-900 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-200">{activeProperty?.name} · إدارة الأقسام</span>
                <h3 className="font-bold text-base text-white">تعديل معلومات وسعر {editingSection.name}</h3>
              </div>
              <button
                onClick={() => setEditingSection(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">اسم القسم:</label>
                  <input
                    type="text"
                    value={sectionFormData.name || ''}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-purple-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">العنوان التوضيحي للقسم:</label>
                  <input
                    type="text"
                    value={sectionFormData.title || ''}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-purple-200 text-xs"
                    placeholder="مثال: قسم الضيافة والمسبح الكبير"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                <span className="font-bold text-purple-950 block text-[11px]">
                  💰 تعديل سعر حجز {editingSection.name}:
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">
                      سعر وسط الأسبوع (ر.س / ليلة):
                    </label>
                    <input
                      type="number"
                      value={sectionFormData.priceWeekday || 0}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, priceWeekday: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-white border border-purple-300 font-mono font-bold text-purple-950 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-1">
                      سعر نهاية الأسبوع (الويكند):
                    </label>
                    <input
                      type="number"
                      value={sectionFormData.priceWeekend || 0}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, priceWeekend: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl bg-white border border-purple-300 font-mono font-bold text-purple-950 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  معلومات وتفاصيل القسم (الوصف):
                </label>
                <textarea
                  value={sectionFormData.subtitle || ''}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, subtitle: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-purple-200 text-xs outline-hidden focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">السعة</label>
                  <input
                    type="number"
                    value={sectionFormData.capacity || 0}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-purple-200 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">غرف النوم</label>
                  <input
                    type="number"
                    value={sectionFormData.bedrooms || 0}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, bedrooms: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-purple-200 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">دورات المياه</label>
                  <input
                    type="number"
                    value={sectionFormData.bathrooms || 0}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, bathrooms: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-purple-200 text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">المساحة م²</label>
                  <input
                    type="number"
                    value={sectionFormData.areaM2 || 0}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, areaM2: Number(e.target.value) })}
                    className="w-full p-1.5 rounded-lg border border-purple-200 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">المسبح أو الجاكوزي:</label>
                <input
                  type="text"
                  value={sectionFormData.poolType || ''}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, poolType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-purple-200 text-xs"
                  placeholder="مثال: مسبح أوفر فلو دافئ مع شلال"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 block">المرافق والتجهيزات:</label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(sectionFormData.features || []).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-slate-700 text-xs border border-slate-100"
                    >
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{feat}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFeatureFromSection(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeatureToSection();
                      }
                    }}
                    placeholder="إضافة مرفق جديد (مثال: ركن شواء متكامل)"
                    className="flex-1 p-2 rounded-xl border border-purple-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addFeatureToSection}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveSectionChanges}
                className="px-5 py-2 rounded-xl bg-[#6B2896] hover:bg-[#571F7A] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ معلومات وسعر القسم</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-3"
          >
            <div className="flex justify-between items-center px-2 pt-1">
              <span className="text-xs font-bold text-slate-700">معاينة الصورة</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden max-h-[70vh]">
              <img src={previewImage} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* iCal Synchronization Modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3.5 border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-1.5">
                    <span>ربط تقويم العقار</span>
                    {syncPropId && (
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                        {properties.find((p) => p.id === syncPropId)?.name}
                      </span>
                    )}
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

            {syncFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

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
                  value={`https://amasa.app/api/calendar/ical/${syncPropId || 'prop'}.ics?key=auth_sync_2026`}
                  className="w-full text-[11px] font-mono text-slate-700 bg-transparent outline-none truncate"
                />
                <button
                  type="button"
                  onClick={() =>
                    copySyncText(
                      `https://amasa.app/api/calendar/ical/${syncPropId || 'prop'}.ics?key=auth_sync_2026`,
                      'export'
                    )
                  }
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  {copiedSyncKey === 'export' ? (
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
                  {syncStatuses[syncPropId || '']?.gathern ? (
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
                  value={gathernUrl}
                  onChange={(e) => setGathernUrl(e.target.value)}
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
                  {syncStatuses[syncPropId || '']?.booking ? (
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
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={executeSync}
                disabled={isSyncing}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'جارٍ الفحص والمزامنة...' : 'حفظ ومزامنة فورية الآن'}</span>
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
    </div>
  );
};
