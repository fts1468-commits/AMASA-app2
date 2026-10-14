import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  Download,
  Copy,
  Check,
  Search,
  FolderOpen,
  X,
  Layers,
  Database,
  Layout,
  Terminal,
  FileCheck,
  Package,
} from 'lucide-react';

export interface ProjectFileInfo {
  path: string;
  name: string;
  downloadUrl: string;
  category: 'config' | 'logic' | 'tabs' | 'components' | 'dist';
  description: string;
  sizeHint: string;
}

const ALL_PROJECT_FILES: ProjectFileInfo[] = [
  // Config
  {
    path: 'package.json',
    name: 'package.json',
    downloadUrl: '/files/package.json',
    category: 'config',
    description: 'ملف الحزم والاعتماديات وتشغيل أوامر البناء',
    sizeHint: '~1.5 KB',
  },
  {
    path: 'index.html',
    name: 'index.html',
    downloadUrl: '/files/index.html',
    category: 'config',
    description: 'ملف البداية الرئيسي وخط تجوال (Tajawal)',
    sizeHint: '~1.6 KB',
  },
  {
    path: 'vite.config.ts',
    name: 'vite.config.ts',
    downloadUrl: '/files/vite.config.ts',
    category: 'config',
    description: 'إعدادات مجمع ومحول Vite و Tailwind v4',
    sizeHint: '~800 B',
  },
  {
    path: 'tsconfig.json',
    name: 'tsconfig.json',
    downloadUrl: '/files/tsconfig.json',
    category: 'config',
    description: 'إعدادات مترجم TypeScript والمسارات',
    sizeHint: '~600 B',
  },
  {
    path: 'metadata.json',
    name: 'metadata.json',
    downloadUrl: '/files/metadata.json',
    category: 'config',
    description: 'بيانات التطبيق في Google AI Studio',
    sizeHint: '~250 B',
  },

  // State & Logic
  {
    path: 'src/types.ts',
    name: 'types.ts',
    downloadUrl: '/files/src/types.ts',
    category: 'logic',
    description: 'واجهات وأنواع البيانات (الحجوزات، العقارات، الموظفين، الأدوار)',
    sizeHint: '~7.5 KB',
  },
  {
    path: 'src/context/AppContext.tsx',
    name: 'AppContext.tsx',
    downloadUrl: '/files/src/context/AppContext.tsx',
    category: 'logic',
    description: 'مزوّد الحالة المركزي، الصلاحيات، وحساب العمولات والعمليات',
    sizeHint: '~85 KB',
  },
  {
    path: 'src/data/mock.ts',
    name: 'mock.ts',
    downloadUrl: '/files/src/data/mock.ts',
    category: 'logic',
    description: 'البيانات الافتراضية للشاليهات الخمسة، الموظفين، والحارس',
    sizeHint: '~45 KB',
  },
  {
    path: 'src/lib/storage.ts',
    name: 'storage.ts',
    downloadUrl: '/files/src/lib/storage.ts',
    category: 'logic',
    description: 'طبقة التخزين المعزولة وسهلة الاستبدال بقاعدة بيانات',
    sizeHint: '~2.5 KB',
  },
  {
    path: 'src/lib/sound.ts',
    name: 'sound.ts',
    downloadUrl: '/files/src/lib/sound.ts',
    category: 'logic',
    description: 'محاكي التنبيهات الصوتية ونظام الإشعارات',
    sizeHint: '~3.2 KB',
  },

  // Main Tabs & Layout
  {
    path: 'src/App.tsx',
    name: 'App.tsx',
    downloadUrl: '/files/src/App.tsx',
    category: 'tabs',
    description: 'المكون الرئيسي وحاوية الشاشات والتوجيه',
    sizeHint: '~4.5 KB',
  },
  {
    path: 'src/index.css',
    name: 'index.css',
    downloadUrl: '/files/src/index.css',
    category: 'tabs',
    description: 'تنسيقات CSS، الأزرار اللامعة (btn-mauve-shiny) والأنيميشن',
    sizeHint: '~4.2 KB',
  },
  {
    path: 'src/components/calendar/CalendarTab.tsx',
    name: 'CalendarTab.tsx',
    downloadUrl: '/files/src/components/calendar/CalendarTab.tsx',
    category: 'tabs',
    description: 'شاشة التقويم الشهري التفاعلي، حجز الفترات، وتعطيل الأيام',
    sizeHint: '~50 KB',
  },
  {
    path: 'src/components/dashboard/DashboardTab.tsx',
    name: 'DashboardTab.tsx',
    downloadUrl: '/files/src/components/dashboard/DashboardTab.tsx',
    category: 'tabs',
    description: 'لوحة التحكم المركزية، حركات الدخول والخروج، وإجراءات الحارس',
    sizeHint: '~68 KB',
  },
  {
    path: 'src/components/bookings/BookingsTab.tsx',
    name: 'BookingsTab.tsx',
    downloadUrl: '/files/src/components/bookings/BookingsTab.tsx',
    category: 'tabs',
    description: 'شاشة إدارة الحجوزات، الفلاتر، وإيصالات الدفع والتأمين',
    sizeHint: '~75 KB',
  },
  {
    path: 'src/components/properties/PropertiesTab.tsx',
    name: 'PropertiesTab.tsx',
    downloadUrl: '/files/src/components/properties/PropertiesTab.tsx',
    category: 'tabs',
    description: 'شاشة العقارات الخمسة، الأقسام، الأسعار ومشاركة البيانات',
    sizeHint: '~74 KB',
  },
  {
    path: 'src/components/marketers/MarketersTab.tsx',
    name: 'MarketersTab.tsx',
    downloadUrl: '/files/src/components/marketers/MarketersTab.tsx',
    category: 'tabs',
    description: 'شاشة إدارة المسوقين، نسب العمولات (5%)، والتقارير المالية',
    sizeHint: '~86 KB',
  },
  {
    path: 'src/components/more/MoreTab.tsx',
    name: 'MoreTab.tsx',
    downloadUrl: '/files/src/components/more/MoreTab.tsx',
    category: 'tabs',
    description: 'شاشة المزيد، الملف الشخصي، العقد، وسجل النشاط والتحميلات',
    sizeHint: '~40 KB',
  },

  // Modals & UI Components
  {
    path: 'src/components/Header.tsx',
    name: 'Header.tsx',
    downloadUrl: '/files/src/components/Header.tsx',
    category: 'components',
    description: 'شريط الرأس العلوي، الإشعارات، وتبديل الحسابات',
    sizeHint: '~12 KB',
  },
  {
    path: 'src/components/BottomNav.tsx',
    name: 'BottomNav.tsx',
    downloadUrl: '/files/src/components/BottomNav.tsx',
    category: 'components',
    description: 'شريط التنقل السفلي الثابت مع دعم آيفون (Safe-Area)',
    sizeHint: '~4.0 KB',
  },
  {
    path: 'src/components/ToastNotification.tsx',
    name: 'ToastNotification.tsx',
    downloadUrl: '/files/src/components/ToastNotification.tsx',
    category: 'components',
    description: 'إشعارات البوب أب التلقائية مع مؤقت التقدم التنازلي',
    sizeHint: '~4.5 KB',
  },
  {
    path: 'src/components/auth/LoginScreen.tsx',
    name: 'LoginScreen.tsx',
    downloadUrl: '/files/src/components/auth/LoginScreen.tsx',
    category: 'components',
    description: 'شاشة تسجيل الدخول بـ Gmail واستعادة كلمة المرور',
    sizeHint: '~22 KB',
  },
  {
    path: 'src/components/modals/AuthModal.tsx',
    name: 'AuthModal.tsx',
    downloadUrl: '/files/src/components/modals/AuthModal.tsx',
    category: 'components',
    description: 'نافذة تبديل الحسابات والمعاينة السريعة للأدوار',
    sizeHint: '~32 KB',
  },
  {
    path: 'src/components/modals/BookingModal.tsx',
    name: 'BookingModal.tsx',
    downloadUrl: '/files/src/components/modals/BookingModal.tsx',
    category: 'components',
    description: 'نافذة إنشاء حجز جديد وتحديد الأسعار وتفاصيل النزيل',
    sizeHint: '~14 KB',
  },
  {
    path: 'src/components/modals/NotificationsModal.tsx',
    name: 'NotificationsModal.tsx',
    downloadUrl: '/files/src/components/modals/NotificationsModal.tsx',
    category: 'components',
    description: 'مركز الإشعارات المفلترة حسب الدور والموظف المستهدف',
    sizeHint: '~12 KB',
  },
  {
    path: 'src/components/modals/TemplatesModal.tsx',
    name: 'TemplatesModal.tsx',
    downloadUrl: '/files/src/components/modals/TemplatesModal.tsx',
    category: 'components',
    description: 'إدارة وتعديل قوالب الرسائل وصيغ الواتساب المعتمدة',
    sizeHint: '~22 KB',
  },
  {
    path: 'src/components/modals/PropertyModals.tsx',
    name: 'PropertyModals.tsx',
    downloadUrl: '/files/src/components/modals/PropertyModals.tsx',
    category: 'components',
    description: 'نوافذ عرض الموقع والإحداثيات، الصور، والعقد الموحد',
    sizeHint: '~20 KB',
  },
  {
    path: 'src/components/more/GuardProfileCard.tsx',
    name: 'GuardProfileCard.tsx',
    downloadUrl: '/files/src/components/more/GuardProfileCard.tsx',
    category: 'components',
    description: 'بطاقة ملف الحارس الشخصي وإدارة بياناته',
    sizeHint: '~7.0 KB',
  },
  {
    path: 'src/components/more/CommissionRequestsSection.tsx',
    name: 'CommissionRequestsSection.tsx',
    downloadUrl: '/files/src/components/more/CommissionRequestsSection.tsx',
    category: 'components',
    description: 'قسم طلبات صرف العمولات وإرفاق إيصال التحويل',
    sizeHint: '~28 KB',
  },

  // Dist Ready Files
  {
    path: 'amasa-dist.zip',
    name: 'amasa-dist.zip (حزمة الإنتاج)',
    downloadUrl: '/amasa-dist.zip',
    category: 'dist',
    description: 'مجلد الإنتاج الكامل المترجم والجاهز للنشر والاستضافة فوراً',
    sizeHint: '~250 KB',
  },
  {
    path: 'amasa-source.zip',
    name: 'amasa-source.zip (الكود كاملاً)',
    downloadUrl: '/amasa-source.zip',
    category: 'dist',
    description: 'أرشيف الكود المصدري كاملاً شاملاً جميع المكونات والإعدادات',
    sizeHint: '~140 KB',
  },
];

interface IndividualFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IndividualFilesModal: React.FC<IndividualFilesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'جميع الملفات', icon: FolderOpen },
    { id: 'tabs', label: 'الشاشات الرئيسية', icon: Layout },
    { id: 'logic', label: 'الحالة والبيانات', icon: Database },
    { id: 'components', label: 'المكونات والنوافذ', icon: Layers },
    { id: 'config', label: 'إعدادات المشروع', icon: Terminal },
    { id: 'dist', label: 'حزم الإنتاج الجاهزة', icon: Package },
  ];

  const filteredFiles = useMemo(() => {
    return ALL_PROJECT_FILES.filter((file) => {
      const matchesCategory =
        selectedCategory === 'all' || file.category === selectedCategory;
      const matchesSearch =
        search.trim() === '' ||
        file.name.toLowerCase().includes(search.toLowerCase()) ||
        file.path.toLowerCase().includes(search.toLowerCase()) ||
        file.description.includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const copyPathToClipboard = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-purple-100 overflow-hidden font-['Tajawal',sans-serif]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileCode2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                تحميل ملفات المشروع بشكل فردي
              </h3>
              <p className="text-xs text-purple-200">
                يمكنك تحميل أي ملف برمجى أو مكوّن بشكل مستقل بنقرة زر واحدة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-purple-100 bg-purple-50/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن ملف بالاسم، المسار، أو الوظيفة..."
              className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-purple-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Categories Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-purple-100/60 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-purple-50">
          <div className="text-xs text-slate-500 font-medium px-1 flex items-center justify-between pb-1">
            <span>عدد الملفات المتاحة: {filteredFiles.length} ملف</span>
            <span className="text-[11px] text-purple-700">اضغط "تحميل الملف" للتنزيل المباشر</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {filteredFiles.map((file) => {
              const isCopied = copiedPath === file.path;
              return (
                <div
                  key={file.path}
                  className="bg-white rounded-2xl p-3 border border-purple-100 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          {file.name.split('.').pop() || 'file'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-purple-900 transition-colors">
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono block dir-ltr text-right">
                            {file.path}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono shrink-0">
                        {file.sizeHint}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {file.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={file.downloadUrl}
                      download={file.name}
                      className="flex-1 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل الملف</span>
                    </a>
                    <button
                      onClick={() => copyPathToClipboard(file.path)}
                      title="نسخ مسار الملف"
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFiles.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm">لا توجد ملفات تطابق البحث المحدد</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-purple-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>جميع الملفات الفردية جاهزة للتحميل الفوري</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
