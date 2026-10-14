import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Film,
  FileText,
  Building,
  Save,
  Check,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PropertyModalsProps {
  type: 'details' | 'photos' | 'location' | 'contract' | null;
  onClose: () => void;
}

export const PropertyModals: React.FC<PropertyModalsProps> = ({ type, onClose }) => {
  const {
    selectedProperty,
    updateProperty,
    isAdmin,
    canCreateContract,
    togglePropertyPublished,
    openTemplatesModal,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [contractTermsText, setContractTermsText] = useState(
    selectedProperty.contractTerms.join('\n')
  );
  const [inTime, setInTime] = useState(selectedProperty.checkInTimeText || 'الساعة ٥ م');
  const [outTime, setOutTime] = useState(selectedProperty.checkOutTimeText || 'الساعة ٢ م');
  const [insurance, setInsurance] = useState(selectedProperty.insuranceAmount || 300);
  const [iban, setIban] = useState(selectedProperty.iban || '');
  const [activeSectionTab, setActiveSectionTab] = useState<string>('section-1');

  useEffect(() => {
    if (selectedProperty.id === 'al-taraf' && activeSectionTab === 'all') {
      setActiveSectionTab(selectedProperty.sections?.[0]?.id || 'section-1');
    }
  }, [selectedProperty.id, selectedProperty.sections, activeSectionTab]);

  if (!type) return null;

  const handleSaveContractTerms = () => {
    const list = contractTermsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    updateProperty(selectedProperty.id, {
      contractTerms: list,
      checkInTimeText: inTime,
      checkOutTimeText: outTime,
      insuranceAmount: Number(insurance),
      iban,
      bankName,
    });
    setIsEditing(false);
  };

  const hasSections = selectedProperty.sections && selectedProperty.sections.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-purple-100 max-h-[90vh] flex flex-col font-['Tajawal',sans-serif]" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-l from-purple-900 via-purple-800 to-indigo-900 p-4 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-purple-200">{selectedProperty.name}</span>
            <h3 className="font-bold text-base text-white">
              {type === 'details' && 'معلومات ومواصفات المكان'}
              {type === 'photos' && 'ألبوم الصور والفيديو'}
              {type === 'location' && 'موقع الاستراحة (اللوكيشن)'}
              {type === 'contract' && 'عقد وبنود إيجار الاستراحة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TYPE: DETAILS */}
          {type === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProperty.coverImage}
                    alt={selectedProperty.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border border-purple-100"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{selectedProperty.name}</h4>
                    <p className="text-slate-500 mt-0.5">{selectedProperty.location}</p>
                    <p className="text-purple-700 font-bold font-mono mt-0.5">
                      {selectedProperty.basePriceWeekday} ر.س / ليلة
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => togglePropertyPublished(selectedProperty.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    selectedProperty.isPublished
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  <span>{selectedProperty.isPublished ? 'معروض للجميع' : 'موقوف كاملاً'}</span>
                </button>
              </div>

              {hasSections && (
                <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                    <span>
                      {selectedProperty.id === 'al-taraf'
                        ? 'خيارات حجز الترف:'
                        : `${selectedProperty.name} أقسام مستقلة:`}
                    </span>
                    <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full">
                      {selectedProperty.id === 'al-taraf' ? 'قسم واحد أو قسمين' : 'تصفح الأقسام والأسعار'}
                    </span>
                  </div>
                  <div className={`grid ${selectedProperty.id === 'al-taraf' ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`}>
                    {selectedProperty.sections.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSectionTab(sec.id)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeSectionTab === sec.id
                            ? 'bg-[#6B2896] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-purple-100/50 border border-purple-150'
                        }`}
                      >
                        {sec.name}
                      </button>
                    ))}
                    {selectedProperty.id !== 'al-taraf' && (
                      <button
                        type="button"
                        onClick={() => setActiveSectionTab('all')}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeSectionTab === 'all'
                            ? 'bg-[#6B2896] text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-purple-100/50 border border-purple-150'
                        }`}
                      >
                        كامل العقار
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-1">
                <span className="font-bold text-purple-950 block">بيانات الحساب البنكي:</span>
                <p>• البنك: <strong>{selectedProperty.bankName}</strong></p>
                <p>• المستفيد: <strong>{selectedProperty.accountHolder}</strong></p>
                <p className="font-mono text-purple-900 text-[11px]">• الآيبان: {selectedProperty.iban}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">السعة</span>
                  <span className="font-bold text-purple-950 font-mono text-sm">{selectedProperty.capacity} فرد</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">غرف النوم</span>
                  <span className="font-bold text-purple-950 font-mono text-sm">{selectedProperty.bedrooms}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">دورات المياه</span>
                  <span className="font-bold text-purple-950 font-mono text-sm">{selectedProperty.bathrooms}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المساحة</span>
                  <span className="font-bold text-purple-950 font-mono text-sm">{selectedProperty.areaM2} م²</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2">المرافق والتجهيزات:</span>
                <div className="space-y-1.5">
                  {selectedProperty.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TYPE: PHOTOS */}
          {type === 'photos' && (
            <div className="space-y-3">
              <p className="text-slate-600">
                معرض صور حية لعقار <strong className="text-purple-900">{selectedProperty.name}</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(selectedProperty.images || [selectedProperty.coverImage]).map((img, idx) => (
                  <div key={idx} className="rounded-2xl overflow-hidden border border-purple-100 group">
                    <img
                      src={img}
                      alt={`${selectedProperty.name} - صورة ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TYPE: LOCATION */}
          {type === 'location' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-700 shrink-0 mt-1" />
                <div>
                  <span className="font-bold text-sm text-purple-950 block">العنوان الدقيق:</span>
                  <p className="text-slate-700 mt-1">{selectedProperty.location}</p>
                </div>
              </div>

              <a
                href={`https://maps.google.com/?q=${selectedProperty.coordinates.lat},${selectedProperty.coordinates.lng}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-center block transition-colors shadow-xs"
              >
                فتح اللوكيشن في خرائط Google
              </a>
            </div>
          )}

          {/* TYPE: CONTRACT */}
          {type === 'contract' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  <span>عقد وبنود الإيجار المعتمد لعقار {selectedProperty.name}</span>
                </div>
                {(isAdmin || canCreateContract) && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs text-purple-800 hover:text-purple-950 font-bold cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'إلغاء التعديل' : 'تعديل الصيغة'}</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-purple-200">
                  <h5 className="font-bold text-slate-800 text-xs">تعديل بنود وأوقات العقد:</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">وقت الدخول:</label>
                      <input
                        type="text"
                        value={inTime}
                        onChange={(e) => setInTime(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">وقت الخروج:</label>
                      <input
                        type="text"
                        value={outTime}
                        onChange={(e) => setOutTime(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">مبلغ التأمين (ريال):</label>
                      <input
                        type="number"
                        value={insurance}
                        onChange={(e) => setInsurance(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">البنك:</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">الشروط والأحكام:</label>
                    <textarea
                      rows={5}
                      value={contractTermsText}
                      onChange={(e) => setContractTermsText(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl leading-relaxed text-xs"
                    />
                  </div>

                  <button
                    onClick={handleSaveContractTerms}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ صيغة العقد الجديدة</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">وقت الدخول:</span>
                      <span className="font-bold text-slate-800">{selectedProperty.checkInTimeText}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">وقت الخروج:</span>
                      <span className="font-bold text-slate-800">{selectedProperty.checkOutTimeText}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">مبلغ التأمين:</span>
                      <span className="font-bold text-purple-900 font-mono">{selectedProperty.insuranceAmount} ريال</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">العربون الافتراضي:</span>
                      <span className="font-bold text-emerald-800 font-mono">{selectedProperty.defaultDeposit} ريال</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 mb-1.5">الشروط والأحكام المعتمدة:</p>
                    <div className="space-y-1 text-slate-700 leading-relaxed">
                      {selectedProperty.contractTerms.map((term, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="font-mono text-purple-700 font-bold">{idx + 1}.</span>
                          <span>{term}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-purple-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openTemplatesModal('contract');
                  }}
                  className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تعديل صيغ وقوالب رسائل الواتساب والعقد العامة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-slate-800 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
