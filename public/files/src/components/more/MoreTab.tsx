import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Key,
  Users,
  Briefcase,
  FileText,
  MessageSquare,
  History,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  Copy,
  Edit,
  Printer,
  Download,
  AlertCircle,
  X,
  CreditCard,
  Building,
  FileCode2,
  FileSpreadsheet,
  Smartphone,
  Database,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarketersTab } from '../marketers/MarketersTab';
import { GuardProfileCard } from './GuardProfileCard';
import { CommissionRequestsSection } from './CommissionRequestsSection';
import { IndividualFilesModal } from '../modals/IndividualFilesModal';
import { GoogleAppSheetModal } from '../modals/GoogleAppSheetModal';

interface MoreTabProps {
  onOpenRoleSwitcher: () => void;
  onOpenContract: () => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({ onOpenRoleSwitcher, onOpenContract }) => {
  const {
    isAdmin,
    isGuard,
    userRole,
    currentMarketer,
    guard,
    activityLogs,
    marketers,
    bookings,
    setActiveTab,
    openTemplatesModal,
    canViewMarketers,
    canManageTemplates,
    canViewRentalContract,
    canViewActivityLogs,
    updateMarketerProfile,
    updateGuardProfile,
    logout,
  } = useApp();

  const [selectedMarketerId, setSelectedMarketerId] = useState(
    currentMarketer?.id || marketers[0]?.id || 'm1'
  );
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [contractViewModalOpen, setContractViewModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [financialsModalOpen, setFinancialsModalOpen] = useState(false);
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [appSheetModalOpen, setAppSheetModalOpen] = useState(false);
  const [showMarketersPanel, setShowMarketersPanel] = useState(true);
  const [showGuardProfile, setShowGuardProfile] = useState(true);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNationalId, setEditNationalId] = useState('');
  const [editBankName, setEditBankName] = useState('مصرف الراجحي');
  const [editIban, setEditIban] = useState('');
  const [editContractNum, setEditContractNum] = useState('');
  const [editContractDate, setEditContractDate] = useState('');
  const [editContractExpiry, setEditContractExpiry] = useState('');

  const targetMarketer = marketers.find((m) => m.id === selectedMarketerId) || currentMarketer || marketers[0];

  const openEditModal = () => {
    if (!targetMarketer) return;
    setEditName(targetMarketer.name);
    setEditPhone(targetMarketer.phone);
    setEditEmail(targetMarketer.email);
    setEditNationalId(targetMarketer.nationalId || '1088923412');
    setEditBankName(targetMarketer.bankName || 'مصرف الراجحي');
    setEditIban(targetMarketer.bankAccount || '');
    setEditContractNum(targetMarketer.contract?.contractNumber || `MKT-CTR-2026-${targetMarketer.code.replace('MK-', '')}`);
    setEditContractDate(targetMarketer.contract?.contractDate || '2026-01-15');
    setEditContractExpiry(targetMarketer.contract?.expiryDate || '2027-01-15');
    setEditProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMarketer) return;

    if (!isAdmin) {
      updateMarketerProfile(targetMarketer.id, {
        name: editName,
        phone: editPhone,
        email: editEmail,
        nationalId: editNationalId,
        bankName: editBankName,
        bankAccount: editIban,
      });
      setEditProfileModalOpen(false);
      return;
    }

    updateMarketerProfile(targetMarketer.id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      nationalId: editNationalId,
      bankName: editBankName,
      bankAccount: editIban,
      contract: {
        contractNumber: editContractNum,
        contractDate: editContractDate,
        expiryDate: editContractExpiry,
        commissionRatePercent: targetMarketer.contract?.commissionRatePercent || 5,
        status: targetMarketer.contract?.status || 'active',
        firstParty: 'إدارة استراحات وشاليهات أماسا (AMASA)',
        firstPartyRepresentative: 'الإدارة العامة والتشغيل',
        secondParty: editName,
        secondPartyPhone: editPhone,
        secondPartyEmail: editEmail,
        secondPartyNationalId: editNationalId,
        isSigned: true,
        signedDate: targetMarketer.contract?.signedDate || editContractDate,
        terms: targetMarketer.contract?.terms || [
          'الالتزام بالأسعار المعتمدة للشاليهات والاستراحات من قبل إدارة AMASA.',
          'يحق للموظف إنشاء وتعديل عقود الإيجار المعتمدة والتنسيق مع النزلاء.',
          'يحق للموظف تعديل مبلغ العربون قبل تأكيد الحجز.',
          'تصرف العمولة (5%) من كل حجز مؤكد لحساب الموظف البنكي المعتمد.',
        ],
      },
    });

    setEditProfileModalOpen(false);
  };

  const currentMarketerBookings = bookings.filter((b) => b.marketerId === targetMarketer?.id);
  const totalSales = currentMarketerBookings.filter((b) => b.status !== 'cancelled').reduce((sum, b) => sum + b.totalPrice, 0);
  const totalCommission = currentMarketerBookings.filter((b) => b.status !== 'cancelled').reduce((sum, b) => sum + b.marketerCommission, 0);
  const paidCommission = currentMarketerBookings.filter((b) => b.commissionStatus === 'paid').reduce((sum, b) => sum + b.marketerCommission, 0);
  const pendingCommission = totalCommission - paidCommission;

  return (
    <div className="pb-28 max-w-3xl mx-auto px-3 sm:px-4 pt-3 space-y-4 font-['Tajawal',sans-serif]">
      {/* Current User Role Summary Card */}
      <div className="bg-white p-5 rounded-3xl shadow-xs border border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {isAdmin ? (
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            ) : isGuard ? (
              <Key className="w-6 h-6 text-amber-300" />
            ) : (
              <UserCheck className="w-6 h-6 text-amber-300" />
            )}
          </div>
          <div>
            <span className="text-xs text-purple-700 font-bold block">الحساب والصلاحية الحالية:</span>
            <h3 className="text-base font-bold text-slate-900">
              {isAdmin
                ? 'الإدارة العامة (كامل الصلاحيات)'
                : isGuard
                ? `الحارس (${guard.name})`
                : `${currentMarketer?.name} (شاشة الموظف)`}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {isAdmin
                ? 'إشراف وتحكم شامل بكافة العمليات'
                : isGuard
                ? `جوال: ${guard.phone} · متابعة دخول وخروج اليوم فقط`
                : `كود الموظف: ${currentMarketer?.code} · عمولة 5% · عقد ساري`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {isAdmin && (
            <button
              onClick={onOpenRoleSwitcher}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              تبديل الحساب
            </button>
          )}
          <button
            onClick={logout}
            className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 justify-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Main Actions List & Marketers Panel */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-purple-100 space-y-4">
        {/* لوحة المسوقين والعمولات (5%) - تظهر مباشرة داخل هذا العنصر */}
        {canViewMarketers && (
          <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-b from-purple-50/70 via-white to-white p-3.5 sm:p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      لوحة المسوقين والعمولات (5%)
                    </h3>
                    <span className="text-[11px] bg-purple-100 text-purple-900 border border-purple-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      5% عمولة موثقة
                    </span>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                      {marketers.length} مسوقين معتمدين
                    </span>
                  </div>
                  <p className="text-xs text-purple-900 font-medium mt-0.5">
                    إدارة حسابات المسوقين، كشوف العمولات 5%، العقود، بيانات العامل، والصلاحيات
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowMarketersPanel(!showMarketersPanel)}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 btn-beam-shine"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>{showMarketersPanel ? 'إخفاء اللوحة' : 'إظهار لوحة المسوقين'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('marketers')}
                  className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="فتح في شاشة مستقلة كاملة"
                >
                  تكبير ↗
                </button>
              </div>
            </div>

            {/* محتوى لوحة المسوقين داخل هذا العنصر */}
            {showMarketersPanel && (
              <div className="pt-3 animate-in fade-in duration-200">
                <MarketersTab embedded={true} />
              </div>
            )}
          </div>
        )}

        {/* ملف الحارس أبو راشد - مصمم بنفس فخامة وتفاصيل ملف المسوق */}
        {isAdmin && (
          <div className="rounded-2xl border border-purple-200/90 bg-gradient-to-b from-purple-50/70 via-white to-white p-3.5 sm:p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      ملف الحارس أبو راشد (مشرف العقارات والاستراحات)
                    </h3>
                    <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      حساب موثق
                    </span>
                    <span className="text-[11px] bg-purple-100 text-purple-900 border border-purple-200 font-bold px-2 py-0.5 rounded-full">
                      راتب 3,500 ر.س
                    </span>
                  </div>
                  <p className="text-xs text-purple-900 font-medium mt-0.5">
                    البيانات الشخصية، الاتصال، الآيبان لتحويل الراتب، المهام الميدانية، والتحكم بالملف
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowGuardProfile(!showGuardProfile)}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 btn-beam-shine"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>{showGuardProfile ? 'إخفاء ملف الحارس' : 'إظهار ملف الحارس'}</span>
                </button>
              </div>
            </div>

            {showGuardProfile && (
              <div className="pt-3 animate-in fade-in duration-200">
                <GuardProfileCard guard={guard} isAdmin={isAdmin} onSave={updateGuardProfile} />
              </div>
            )}
          </div>
        )}

        {/* إذا كان المستخدم الحالي هو الحارس نفسه، يظهر ملفه الشخصي كاملاً فوراً */}
        {isGuard && (
          <div className="animate-in fade-in duration-200">
            <GuardProfileCard guard={guard} isAdmin={false} />
          </div>
        )}

        {/* باقي خيارات وأدوات قسم المزيد */}
        <div className="divide-y divide-slate-100 pt-2 border-t border-purple-100/70">
        {!isGuard && (
          <div
            onClick={() => setFinancialsModalOpen(true)}
            className="py-3.5 px-2 flex items-center justify-between hover:bg-purple-50/50 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  {isAdmin
                    ? 'كشف حساب العمولات والتقارير المالية'
                    : 'كشف حساب عمولاتي والتقارير المالية'}
                </span>
                <span className="text-xs text-slate-500">
                  {isAdmin
                    ? 'جدول تدقيق مستحقات المسوقين وصرف المبالغ'
                    : 'مبيعاتك وعمولاتك المصروفة والمعلقة'}
                </span>
              </div>
            </div>
            <span className="text-purple-700 font-bold text-xs">عرض</span>
          </div>
        )}

        {/* Message Templates Manager (Admin or permitted marketer) */}
        {canManageTemplates && (
          <div
            onClick={() => openTemplatesModal('depositRequest')}
            className="py-3.5 px-3 flex items-center justify-between hover:bg-purple-100/50 rounded-2xl cursor-pointer transition-all bg-gradient-to-r from-purple-50 to-indigo-50/50 border border-purple-200/80 shadow-2xs my-1"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 block">
                    إدارة صيغ وقوالب الرسائل والعقود
                  </span>
                </div>
                <span className="text-xs text-purple-900 font-medium">
                  تعديل صيغ: طلب العربون · تأكيد الحجز · طلب إكمال الدفع · العقد والتأمين
                </span>
              </div>
            </div>
            <span className="text-purple-800 font-bold text-xs bg-white border border-purple-200 px-3 py-1.5 rounded-xl shadow-2xs">
              تعديل القوالب
            </span>
          </div>
        )}

        {/* Rental Contract View */}
        {canViewRentalContract && (
          <div
            onClick={onOpenContract}
            className="py-3.5 px-2 flex items-center justify-between hover:bg-purple-50/50 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  عقد إيجار الشاليه والبنود الموحدة للنزلاء
                </span>
                <span className="text-xs text-slate-500">
                  الشروط والتعليمات المعتمدة للنزلاء والتأمين
                </span>
              </div>
            </div>
            <span className="text-purple-700 font-bold text-xs">استعراض</span>
          </div>
        )}

        {/* Activity Logs (Audit Log) */}
        {!isGuard && canViewActivityLogs && (
          <div
            onClick={() => setLogsModalOpen(true)}
            className="py-3.5 px-2 flex items-center justify-between hover:bg-purple-50/50 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  سجل العمليات والصلاحيات (Audit Log)
                </span>
                <span className="text-xs text-slate-500">
                  متابعة الحجوزات المسجلة وتعديل الصلاحيات بالوقت والتاريخ
                </span>
              </div>
            </div>
            <span className="text-purple-700 font-bold text-xs">
              عرض ({activityLogs.length})
            </span>
          </div>
        )}

        {/* Integration with Google AppSheet and Google Workspace */}
        {isAdmin && (
          <div className="py-4 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-purple-50/80 border border-emerald-300 shadow-2xs my-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900 block">
                      الربط مع منصة Google AppSheet و Google Workspace
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      مزامنة جداول وتطبيق جوال فوري
                    </span>
                  </div>
                  <span className="text-xs text-emerald-950 font-medium block mt-0.5">
                    تحويل بيانات الحجوزات ونموذج الإدخال إلى تطبيق هاتف في AppSheet ومزامنة حية مع Google Sheets
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAppSheetModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <Smartphone className="w-4 h-4 text-amber-300" />
                <span>إعدادات ومزامنة AppSheet</span>
              </button>
            </div>
          </div>
        )}

        {/* Download Project & Production Build */}
        {isAdmin && (
          <div className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 border border-emerald-200/80 shadow-2xs my-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    تحميل ملفات المشروع ونسخة الإنتاج
                  </span>
                  <span className="text-xs text-emerald-800 font-medium">
                    مجلد الإنتاج الجاهز للاستضافة والكود المصدري
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="space-y-1">
                <a
                  href="/amasa-dist.zip"
                  download="amasa-dist.zip"
                  className="w-full px-3.5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل نسخة الإنتاج الجاهزة (dist.zip)</span>
                </a>
                <p className="text-[11px] text-emerald-800 text-center font-medium leading-tight">
                  ✓ مبنية ومترجمة بالكامل (Zero Dependencies) · تعمل بدون npm وبدون إنترنت
                </p>
              </div>

              <div className="space-y-1">
                <a
                  href="/amasa-source.zip"
                  download="amasa-source.zip"
                  className="w-full px-3.5 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل الكود المصدري كاملاً (source.zip)</span>
                </a>
                <p className="text-[11px] text-purple-700 text-center font-medium leading-tight">
                  الكود المصدري النظيف للمطورين · يتطلب npm install للتطوير
                </p>
              </div>
            </div>

            {/* Quick Offline Run Guide Note */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-950 flex items-start gap-2">
              <span className="font-bold text-emerald-700 shrink-0">⚡ تشغيل نسخة الإنتاج فوراً بدون إنترنت:</span>
              <span className="text-[11px] leading-relaxed text-emerald-900">
                فك ضغط <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">amasa-dist.zip</code> ثم نفّذ <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">node serve.cjs</code> أو <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">python3 serve.py</code> وسيعمل التطبيق مباشرة على المتصفح.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFilesModalOpen(true)}
              className="w-full py-2.5 px-3 bg-white hover:bg-purple-50 text-purple-950 font-bold border border-purple-200 rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <FileCode2 className="w-4 h-4 text-purple-700" />
              <span>استعراض وتحميل الملفات بشكل فردي (30+ ملف كود ومكوّن)</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Profile Modal */}
      {profileModalOpen && targetMarketer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-l from-[#1f0b38] via-[#35105c] to-[#1a0833] p-5 text-white flex items-center justify-between border-b border-purple-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-400/30 flex items-center justify-center text-white shadow-md">
                  <UserCheck className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">الملف الشخصي للموظف</h3>
                  <p className="text-xs text-purple-200">
                    بيانات الموظف، رقم الجوال، إيميل الدخول، والعقد المبرم مع الإدارة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50/50 rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900">{targetMarketer.name}</h4>
                  <span className="text-xs text-purple-700 font-mono font-bold">{targetMarketer.code}</span>
                  <p className="text-slate-500 mt-1">تاريخ الانضمام: {targetMarketer.joinDate}</p>
                </div>
                <button
                  onClick={openEditModal}
                  className="px-3 py-1.5 bg-white text-purple-900 border border-purple-200 rounded-xl font-bold cursor-pointer hover:bg-purple-50"
                >
                  تعديل البيانات
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-500 block">رقم الجوال:</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{targetMarketer.phone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-500 block">البريد الإلكتروني:</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{targetMarketer.email}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-500 block">رقم الهوية:</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{targetMarketer.nationalId}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[11px] text-slate-500 block">البنك المعتمد:</span>
                  <span className="text-sm font-bold text-slate-900">{targetMarketer.bankName}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 col-span-2">
                  <span className="text-[11px] text-slate-500 block">رقم الآيبان (IBAN):</span>
                  <span className="text-xs font-bold text-purple-900 font-mono select-all">
                    {targetMarketer.bankAccount || 'غير مسجل'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Viewer Modal */}
      {contractViewModalOpen && targetMarketer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-l from-[#1f0b38] via-[#35105c] to-[#1a0833] p-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">عقد وساطة وتسويق موثق</h4>
                <span className="text-xs text-purple-200 font-mono">{targetMarketer.contract?.contractNumber}</span>
              </div>
              <button
                onClick={() => setContractViewModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="text-center pb-4 border-b border-slate-200 space-y-1">
                <span className="font-serif font-bold text-purple-900 text-xs">AMASA RESORTS & CHALETS</span>
                <h3 className="text-base font-black text-slate-900">عقد تسويق وإدارة حجوزات الشاليهات</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  رقم: {targetMarketer.contract?.contractNumber} · تاريخ: {targetMarketer.contract?.contractDate}
                </p>
              </div>

              <div className="space-y-2 text-slate-700 bg-slate-50 p-4 rounded-2xl">
                <p className="font-bold text-purple-950 mb-1">بنود العقد المعتمدة:</p>
                {(targetMarketer.contract?.terms || []).map((term, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {idx + 1}. {term}
                  </p>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => window.print()}
                className="btn-mauve-shiny flex-1 py-2 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة العقد</span>
              </button>
              <button
                onClick={() => setContractViewModalOpen(false)}
                className="px-4 py-2 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <h4 className="font-bold text-base text-slate-900">تعديل بيانات الملف والعقد</h4>
              <button onClick={() => setEditProfileModalOpen(false)} className="text-slate-500">✕</button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهوية:</label>
                  <input
                    type="text"
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">البنك:</label>
                  <input
                    type="text"
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الآيبان (IBAN):</label>
                <input
                  type="text"
                  value={editIban}
                  onChange={(e) => setEditIban(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              {isAdmin && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                  <span className="font-bold text-purple-900 block">بيانات العقد (للإدارة فقط):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editContractNum}
                      onChange={(e) => setEditContractNum(e.target.value)}
                      placeholder="رقم العقد"
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                    <input
                      type="date"
                      value={editContractDate}
                      onChange={(e) => setEditContractDate(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                    <input
                      type="date"
                      value={editContractExpiry}
                      onChange={(e) => setEditContractExpiry(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-mauve-shiny flex-1 py-2 text-white font-bold rounded-xl cursor-pointer">
                  حفظ البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setEditProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-purple-100 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-purple-700" />
                <span>سجل النشاطات والعمليات</span>
              </h4>
              <button onClick={() => setLogsModalOpen(false)} className="text-slate-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{log.details}</p>
                  <span className="text-[10px] text-purple-700 font-semibold block">
                    بواسطة: {log.actorName} ({log.actorRole === 'admin' ? 'الإدارة' : 'موظف'})
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setLogsModalOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Financials Summary Modal */}
      {financialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <h4 className="font-bold text-base text-purple-900">تقرير العمولات والمبيعات</h4>
              <button onClick={() => setFinancialsModalOpen(false)} className="text-slate-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-purple-50 p-3.5 rounded-2xl">
                <div>
                  <span className="text-[10px] text-purple-700 block">إجمالي مبيعاتك:</span>
                  <span className="text-base font-bold text-purple-950 font-mono">{totalSales.toLocaleString()} ر.س</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block">إجمالي العمولات (5%):</span>
                  <span className="text-base font-bold text-emerald-800 font-mono">{totalCommission.toLocaleString()} ر.س</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">المصروفة (محوّلة):</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{paidCommission.toLocaleString()} ر.س</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block">المعلقة:</span>
                  <span className="text-sm font-bold text-amber-800 font-mono">{pendingCommission.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setFinancialsModalOpen(false)}
              className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Individual Files Downloader Modal */}
      <IndividualFilesModal
        isOpen={filesModalOpen}
        onClose={() => setFilesModalOpen(false)}
      />

      {/* Google AppSheet & Google Workspace Modal */}
      <GoogleAppSheetModal
        isOpen={appSheetModalOpen}
        onClose={() => setAppSheetModalOpen(false)}
      />
    </div>
  );
};
