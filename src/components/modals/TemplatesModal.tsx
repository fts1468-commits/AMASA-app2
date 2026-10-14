import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  CheckCircle2,
  FileText,
  RotateCcw,
  Save,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  X,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useApp, fillTemplate } from '../../context/AppContext';
import { MessageTemplates } from '../../types';
import { INITIAL_TEMPLATES } from '../../data/mock';

interface TemplateMeta {
  id: keyof MessageTemplates;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  availableTags: { tag: string; label: string; sample: string }[];
}

const TEMPLATES_META: TemplateMeta[] = [
  {
    id: 'depositRequest',
    title: 'صيغة طلب العربون',
    badge: 'مهلة 15 دقيقة',
    subtitle: 'الرسالة المرسلة للعميل فور اختيار الليالي لتحويل العربون',
    description:
      'تُرسل عبر رابط واتساب برقم العميل مباشرة عند الضغط على "طلب العربون"، مع توضيح رقم الآيبان والبنك وإمهاله 15 دقيقة لتحويل العربون وتثبيت الحجز.',
    availableTags: [
      { tag: '{اسم_العميل}', label: 'اسم العميل', sample: 'علي السالم' },
      { tag: '{رقم_الجوال}', label: 'رقم الجوال', sample: '0555123456' },
      { tag: '{اسم_العقار}', label: 'اسم العقار', sample: 'كوخ البيلسان' },
      { tag: '{عدد_الليالي}', label: 'عدد الليالي', sample: '2' },
      { tag: '{مبلغ_العربون}', label: 'مبلغ العربون', sample: '250' },
      { tag: '{المبلغ_الإجمالي}', label: 'المبلغ الإجمالي', sample: '1500' },
      { tag: '{المبلغ_المتبقي}', label: 'المتبقي عند الدخول', sample: '1250' },
      { tag: '{مبلغ_التأمين}', label: 'مبلغ التأمين', sample: '300' },
      { tag: '{اسم_البنك}', label: 'اسم البنك', sample: 'مصرف الراجحي' },
      { tag: '{اسم_الحساب}', label: 'اسم الحساب المستفيد', sample: 'مؤسسة الشاليهات الفاخرة' },
      { tag: '{رقم_الآيبان}', label: 'رقم الآيبان (IBAN)', sample: 'SA0380000000608010167519' },
      { tag: '{مهلة_الدفع}', label: 'مهلة الدفع', sample: '15 دقيقة' },
    ],
  },
  {
    id: 'bookingConfirmation',
    title: 'صيغة تأكيد الحجز',
    badge: 'إشعار فوري',
    subtitle: 'رسالة إشعار العميل بتأكيد الحجز بعد اعتماد إيصال التحويل',
    description:
      'تُرسل للعميل بعد إرفاق إيصال تحويل العربون والضغط على زر "تأكيد الحجز"، مع إشعار بالبيانات وتفاصيل الإقامة ورقم الحجز.',
    availableTags: [
      { tag: '{اسم_العميل}', label: 'اسم العميل', sample: 'علي السالم' },
      { tag: '{رقم_الحجز}', label: 'رقم الحجز', sample: 'BK-2026-105' },
      { tag: '{اسم_العقار}', label: 'اسم العقار', sample: 'كوخ البيلسان' },
      { tag: '{تاريخ_الدخول}', label: 'تاريخ الدخول', sample: 'الأحد 4 أكتوبر 2026' },
      { tag: '{وقت_الدخول}', label: 'وقت الدخول', sample: 'الساعة ٥ م' },
      { tag: '{تاريخ_الخروج}', label: 'تاريخ الخروج', sample: 'الإثنين 5 أكتوبر 2026' },
      { tag: '{وقت_الخروج}', label: 'وقت الخروج', sample: 'الساعة ٢ م' },
      { tag: '{المبلغ_الإجمالي}', label: 'المبلغ الإجمالي', sample: '600' },
      { tag: '{مبلغ_العربون}', label: 'العربون المدفوع', sample: '250' },
      { tag: '{المبلغ_المتبقي}', label: 'المبلغ المتبقي', sample: '350' },
    ],
  },
  {
    id: 'paymentCompletion',
    title: 'صيغة طلب إكمال الدفع',
    badge: 'تحصيل المتبقي',
    subtitle: 'رسالة تذكير العميل بدفع المبلغ المتبقي المستحق قبل موعد الدخول',
    description:
      'تُرسل للنزيل عبر واتساب لتذكيره بسداد باقي قيمة الإقامة مع بيانات الحساب البنكي والآيبان ومبلغ التأمين المسترد.',
    availableTags: [
      { tag: '{اسم_العميل}', label: 'اسم العميل', sample: 'علي السالم' },
      { tag: '{رقم_الحجز}', label: 'رقم الحجز', sample: 'BK-2026-105' },
      { tag: '{اسم_العقار}', label: 'اسم العقار', sample: 'الترف' },
      { tag: '{المبلغ_الإجمالي}', label: 'المبلغ الإجمالي', sample: '1200' },
      { tag: '{مبلغ_العربون}', label: 'العربون المسدد', sample: '300' },
      { tag: '{المبلغ_المتبقي}', label: 'المبلغ المتبقي للتحصيل', sample: '900' },
      { tag: '{مبلغ_التأمين}', label: 'مبلغ التأمين', sample: '500' },
      { tag: '{اسم_البنك}', label: 'اسم البنك', sample: 'مصرف الراجحي' },
      { tag: '{رقم_الآيبان}', label: 'رقم الآيبان (IBAN)', sample: 'SA0380000000608010167519' },
    ],
  },
  {
    id: 'contract',
    title: 'صيغة العقد والشروط',
    badge: 'العقد الرسمي',
    subtitle: 'عقد الإيجار وبنود الشروط والأحكام ومبلغ التأمين الإلزامي',
    description:
      'صيغة العقد النظامية المعتمدة التي تُرسل عبر رابط واتساب برقم العميل فور تأكيد الحجز، وتحتوي على مواعيد الدخول والخروج والأسعار والشروط والأحكام.',
    availableTags: [
      { tag: '{اسم_العقار}', label: 'اسم العقار', sample: 'كوخ زهرة البيلسان' },
      { tag: '{اسم_العميل}', label: 'اسم العميل', sample: 'علي' },
      { tag: '{رقم_الجوال}', label: 'رقم الجوال', sample: '0555123456' },
      { tag: '{تاريخ_الدخول}', label: 'يوم وتاريخ الدخول', sample: 'الأحد 4 اكتوبر ( 10 ) 2026 م' },
      { tag: '{وقت_الدخول}', label: 'وقت الدخول', sample: 'الساعة ٥ م' },
      { tag: '{تاريخ_الخروج}', label: 'يوم وتاريخ الخروج', sample: 'الأحد 4 اكتوبر ( 10 ) 2026 م' },
      { tag: '{وقت_الخروج}', label: 'وقت الخروج', sample: 'الساعة ٢ م' },
      { tag: '{المبلغ_الإجمالي}', label: 'المبلغ المتفق عليه', sample: '300' },
      { tag: '{مبلغ_العربون}', label: 'العربون', sample: '250' },
      { tag: '{المبلغ_المتبقي}', label: 'المتبقي', sample: '50' },
      { tag: '{مبلغ_التأمين}', label: 'التأمين', sample: '300' },
      { tag: '{شروط_العقد}', label: 'بنود الشروط والأحكام', sample: '1. يلتزم المستأجر بتسليم الاستراحة في الوقت المحدد.' },
    ],
  },
  {
    id: 'checkoutReminder',
    title: 'صيغة تذكير الخروج',
    badge: 'إشعار المغادرة',
    subtitle: 'رسالة تذكير النزيل بموعد الخروج الساعة 2 ظهراً لتفادي الخصم من التأمين',
    description:
      'تُرسل تلقائياً عبر واتساب بالزر الأول في بطاقة دخول اليوم للشاشة الرئيسية.',
    availableTags: [
      { tag: '{اسم_العميل}', label: 'اسم العميل', sample: 'علي' },
      { tag: '{اسم_العقار}', label: 'اسم العقار', sample: 'كوخ البيلسان' },
      { tag: '{وقت_الخروج}', label: 'وقت الخروج', sample: 'الساعة 2 م' },
    ],
  },
];

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: keyof MessageTemplates;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, initialTab = 'depositRequest' }) => {
  const { messageTemplates, updateMessageTemplates, resetMessageTemplates } = useApp();
  const [activeTab, setActiveTab] = useState<keyof MessageTemplates>(initialTab);
  const [localTemplates, setLocalTemplates] = useState<MessageTemplates>(messageTemplates);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [insertedTagNotice, setInsertedTagNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setLocalTemplates(messageTemplates);
  }, [messageTemplates, isOpen]);

  if (!isOpen) return null;

  const currentMeta = TEMPLATES_META.find((m) => m.id === activeTab) || TEMPLATES_META[0];
  const currentText = (localTemplates[activeTab] as string) || '';

  const updateCurrentText = (newVal: string) => {
    setLocalTemplates((prev) => ({ ...prev, [activeTab]: newVal }));
  };

  const insertTag = (tag: string) => {
    const updated = currentText ? `${currentText} ${tag}` : tag;
    updateCurrentText(updated);
    setInsertedTagNotice(tag);
    setTimeout(() => setInsertedTagNotice(null), 1500);
  };

  const handleSaveAll = () => {
    updateMessageTemplates(localTemplates);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetCurrent = () => {
    if (window.confirm(`هل أنت متأكد من استعادة الصيغة الافتراضية لـ "${currentMeta.title}"؟`)) {
      const defaultText = INITIAL_TEMPLATES[activeTab];
      if (typeof defaultText === 'string') {
        updateCurrentText(defaultText);
      }
    }
  };

  const handleResetAll = () => {
    if (window.confirm('هل تريد استعادة جميع صيغ وقوالب الرسائل والعقود إلى نصوصها الأصلية؟')) {
      resetMessageTemplates();
      setLocalTemplates(INITIAL_TEMPLATES);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const generateLivePreview = () => {
    const vars: Record<string, string> = {};
    currentMeta.availableTags.forEach((t) => {
      const cleanKey = t.tag.replace(/[{}]/g, '');
      vars[cleanKey] = t.sample;
    });
    return fillTemplate(currentText, vars);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-purple-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-l from-purple-950 via-purple-900 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-purple-200 border border-white/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>إدارة وتعديل صيغ وقوالب الرسائل والعقود</span>
              </h3>
              <p className="text-xs text-purple-200 mt-0.5">
                تخصيص نصوص رسائل الواتساب، طلبات العربون، تأكيد الحجوزات، وبنود العقد
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Tabs */}
        <div className="bg-purple-50/70 border-b border-purple-100 px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {TEMPLATES_META.map((meta) => {
            const isActive = activeTab === meta.id;
            return (
              <button
                key={meta.id}
                onClick={() => setActiveTab(meta.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-purple-100/60 border border-purple-100'
                }`}
              >
                <span>{meta.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-purple-900/60 text-purple-100' : 'bg-slate-100 text-slate-600'}`}>
                  {meta.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{currentMeta.title}</span>
                <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                  {currentMeta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{currentMeta.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetCurrent}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="استعادة النص الافتراضي لهذا القالب"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          </div>

          {/* Tags list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
                <span>المتغيرات التلقائية المتاحة (اضغط لإدراج المتغير في مكان المؤشر أو نسخه):</span>
              </label>
              {insertedTagNotice && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" /> تم إدراج {insertedTagNotice}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {currentMeta.availableTags.map(({ tag, label }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => insertTag(tag)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 cursor-pointer"
                  title={`إدراج ${label}`}
                >
                  <Copy className="w-3 h-3 text-purple-500" />
                  <span className="font-bold">{tag}</span>
                  <span className="text-[10px] text-slate-500 font-sans">({label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor and Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">محرر نص الصيغة:</span>
                <span className="text-slate-400 font-mono">
                  {currentText.length} حرف · {currentText.split('\n').length} أسطر
                </span>
              </div>
              <textarea
                value={currentText}
                onChange={(e) => updateCurrentText(e.target.value)}
                rows={13}
                dir="rtl"
                className="w-full p-3.5 bg-white border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-sans outline-hidden shadow-2xs resize-y"
                placeholder="أدخل صيغة الرسالة هنا..."
              />
            </div>

            {/* Live WhatsApp Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>معاينة حية لشكل الرسالة على واتساب:</span>
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  واتساب جاهز
                </span>
              </div>

              <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200 min-h-[295px] flex flex-col justify-end">
                <div className="bg-white rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-emerald-100 max-w-[95%] space-y-2 mr-auto self-start">
                  <div className="text-[11px] sm:text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans select-text">
                    {generateLivePreview()}
                  </div>
                  <div className="text-left pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(generateLivePreview())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold bg-white/80 hover:bg-white px-3 py-1 rounded-full border border-emerald-200 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>تجربة فتح الرسالة في تطبيق واتساب</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-purple-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetAll}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط كافة القوالب</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              onClick={handleSaveAll}
              className="btn-mauve-shiny px-6 py-2.5 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>تم حفظ التعديلات بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ واعتماد التعديلات</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
