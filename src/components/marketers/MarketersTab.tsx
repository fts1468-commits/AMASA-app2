import React, { useState, useMemo } from 'react';
import { GuardProfileCard } from '../more/GuardProfileCard';
import { CommissionRequestsSection } from '../more/CommissionRequestsSection';
import {
  Users,
  Percent,
  Download,
  Printer,
  Plus,
  Wallet,
  Briefcase,
  Shield,
  CreditCard,
  CheckCircle2,
  Clock,
  Check,
  Building,
  UserCheck,
  TrendingUp,
  FileCheck,
  UserPlus,
  Eye,
  Edit,
  DollarSign,
  Phone,
  Mail,
  Lock,
  FileText,
  BadgeAlert,
  ArrowRight,
  CalendarDays,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Marketer, MarketerPermissions, UserRole } from '../../types';

interface MarketersTabProps {
  embedded?: boolean;
}

export const MarketersTab: React.FC<MarketersTabProps> = ({ embedded = false }) => {
  const {
    marketers,
    bookings,
    isAdmin,
    isGuard,
    userRole,
    currentMarketerId,
    updateMarketerPermissions,
    updateMarketerProfile,
    addMarketer,
    addAdminAccount,
    setMarketerAccountRole,
    userAccounts,
    payoutAllMarketerCommissions,
    payMarketerCommission,
    switchUser,
    grantAllMarketersContractAndDepositPermissions,
    guard,
    updateGuardProfile,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'commissions' | 'profile' | 'permissions'>('commissions');
  const [selectedMarketerId, setSelectedMarketerId] = useState<string>(
    userRole === 'marketer' && currentMarketerId ? currentMarketerId : marketers[0]?.id || 'm1'
  );

  // Add marketer/admin modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAccountType, setAddAccountType] = useState<UserRole>('marketer');
  const [addError, setAddError] = useState<string | null>(null);

  // Role upgrade confirm
  const [roleChangeTarget, setRoleChangeTarget] = useState<UserRole | null>(null);

  // Contract preview modal
  const [viewContractModalOpen, setViewContractModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);

  // Payout confirmation modal
  const [payoutConfirmMarketer, setPayoutConfirmMarketer] = useState<Marketer | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState<'all' | 'ready_for_payout' | 'paid' | 'pending'>('all');

  // Form fields for adding marketer
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formIban, setFormIban] = useState('');
  const [formBankName, setFormBankName] = useState('مصرف الراجحي');

  // Form fields for editing marketer profile & contract
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNationalId, setEditNationalId] = useState('');
  const [editIban, setEditIban] = useState('');
  const [editBankName, setEditBankName] = useState('مصرف الراجحي');
  const [editContractNum, setEditContractNum] = useState('');
  const [editContractDate, setEditContractDate] = useState('');
  const [editContractExpiry, setEditContractExpiry] = useState('');

  const currentMarketer = useMemo(() => {
    return marketers.find((m) => m.id === selectedMarketerId) || marketers[0];
  }, [marketers, selectedMarketerId]);

  const openEditModal = (m: Marketer) => {
    setEditName(m.name || '');
    setEditPhone(m.phone || '');
    setEditEmail(m.email || '');
    setEditNationalId(m.nationalId || '');
    setEditIban(m.bankAccount || '');
    setEditBankName(m.bankName || 'مصرف الراجحي');
    setEditContractNum(m.contract?.contractNumber || `MKT-CTR-2026-${m.code.replace('MK-', '')}`);
    setEditContractDate(m.contract?.contractDate || m.joinDate || '2026-01-01');
    setEditContractExpiry(m.contract?.expiryDate || '2027-01-01');
    setEditProfileModalOpen(true);
  };

  const handleSaveProfileAndContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMarketer) return;

    const contractObj = {
      contractNumber: editContractNum,
      contractDate: editContractDate,
      expiryDate: editContractExpiry,
      commissionRatePercent: 5,
      status: currentMarketer.contract?.status || 'active',
      firstParty: 'إدارة استراحات وشاليهات ماسة (AMASA)',
      firstPartyRepresentative: 'المدير العام التنفيذي',
      secondParty: editName,
      secondPartyPhone: editPhone,
      secondPartyEmail: editEmail,
      secondPartyNationalId: editNationalId,
      terms: currentMarketer.contract?.terms || [
        'يستحق المسوق عمولة تسويق ثابتة قدرها 5% من القيمة الإجمالية لكل حجز مؤكد ومكتمل يتم إبرامه عبر رمزه التسويقي المعتمد.',
        'يتم تحويل العمولات المستحقة دورياً وفورياً إلى الحساب البنكي المعتمد والمثبت في هذا العقد.',
        'يلتزم المسوق بالترويج وفق سياسات وأسعار شاليهات ماسة الرسمية، والحفاظ التام على سرية وخصوصية بيانات النزلاء.',
        'يمنح المسوق صلاحية إصدار عقود الإيجار المعتمدة وتعديل مبالغ العربون المبدئي بما يخدم مصلحة التشغيل وتسهيل الحجوزات.',
      ],
      isSigned: true,
      signedDate: editContractDate,
      notes: currentMarketer.contract?.notes || 'عقد وساطة وتسويق موثق إلكترونياً',
    };

    updateMarketerProfile(currentMarketer.id, {
      name: editName,
      phone: editPhone,
      email: editEmail,
      nationalId: editNationalId,
      bankAccount: editIban,
      bankName: editBankName,
      contract: contractObj,
    });

    setEditProfileModalOpen(false);
    setToastMessage(`تم تحديث الملف الشخصي والعقد للمسوق ${editName} بنجاح`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Marketer Stats List
  const marketerStats = useMemo(() => {
    return marketers.map((m) => {
      const allBks = bookings.filter((b) => b.marketerId === m.id);
      const completedBks = allBks.filter((b) => b.status === 'completed');
      const activeBks = allBks.filter((b) => b.status === 'confirmed' || b.status === 'pending_payment' || b.status === 'waiting_deposit');

      const totalSales = allBks
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      const completedSales = completedBks.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      const totalCommission = allBks
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05)), 0);

      const paidCommission = allBks
        .filter((b) => b.commissionStatus === 'paid')
        .reduce((sum, b) => sum + (b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05)), 0);

      const readyCommission = allBks
        .filter((b) => b.commissionStatus === 'ready_for_payout')
        .reduce((sum, b) => sum + (b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05)), 0);

      const pendingCommission = allBks
        .filter((b) => b.commissionStatus === 'pending')
        .reduce((sum, b) => sum + (b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05)), 0);

      const totalDueCommission = readyCommission + pendingCommission;
      const completionRate = allBks.length > 0 ? Math.round((completedBks.length / allBks.length) * 100) : 0;

      return {
        marketer: m,
        allBookings: allBks,
        completedBookings: completedBks,
        activeBookings: activeBks,
        totalBookingsCount: allBks.length,
        completedBookingsCount: completedBks.length,
        activeBookingsCount: activeBks.length,
        totalSales,
        completedSales,
        completionRate,
        commissionRate: m.commissionRate || 0.05,
        totalCommission,
        paidCommission,
        readyCommission,
        pendingCommission,
        totalDueCommission,
      };
    });
  }, [marketers, bookings]);

  const currentStat = useMemo(() => {
    return marketerStats.find((s) => s.marketer.id === currentMarketer?.id) || marketerStats[0];
  }, [marketerStats, currentMarketer]);

  // Filtered Bookings for the selected marketer
  const marketerFilteredBookings = useMemo(() => {
    if (!currentMarketer) return [];
    let list = bookings.filter((b) => b.marketerId === currentMarketer.id);

    if (commissionStatusFilter !== 'all') {
      list = list.filter((b) => b.commissionStatus === commissionStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.bookingNumber?.toLowerCase().includes(q) ||
          b.customerName?.toLowerCase().includes(q) ||
          b.customerPhone?.includes(q) ||
          b.propertyName?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, currentMarketer, commissionStatusFilter, searchQuery]);

  const exportCsv = () => {
    if (!currentMarketer) return;
    const headers = [
      'رقم الحجز',
      'تاريخ الحجز',
      'اسم العميل',
      'رقم الجوال',
      'العقار',
      'تاريخ الدخول',
      'تاريخ الخروج',
      'الليالي',
      'إجمالي الحجز (ر.س)',
      'نسبة العمولة',
      'مبلغ العمولة (ر.س)',
      'حالة الحجز',
      'حالة العمولة',
    ];

    const rows = marketerFilteredBookings.map((b) => [
      b.bookingNumber,
      b.createdAt ? b.createdAt.split('T')[0] : b.checkInDate,
      b.customerName,
      b.customerPhone,
      b.propertyName,
      b.checkInDate,
      b.checkOutDate,
      b.nightsCount,
      b.totalPrice,
      '5%',
      b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05),
      b.status === 'completed' ? 'مكتمل' : 'مؤكد',
      b.commissionStatus === 'paid' ? 'مسددة ومحولة' : b.commissionStatus === 'ready_for_payout' ? 'جاهزة للصرف' : 'قيد الانتظار',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `كشف_عمولات_${currentMarketer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const togglePermission = (key: keyof MarketerPermissions) => {
    if (!isAdmin || !currentMarketer) return;
    updateMarketerPermissions(currentMarketer.id, {
      [key]: !currentMarketer.permissions[key],
    });
  };

  const handlePayoutConfirm = (marketerId: string) => {
    payoutAllMarketerCommissions(marketerId);
    const m = marketers.find((it) => it.id === marketerId);
    setPayoutConfirmMarketer(null);
    setToastMessage(`تمت تسوية وصرف كافة العمولات المستحقة بنجاح للمسوق: ${m?.name}`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    setAddError(null);
    if (addAccountType === 'admin') {
      const res = addAdminAccount({
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail,
      });
      if (!res.success) {
        setAddError(res.message);
        return;
      }
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setAddModalOpen(false);
      setAddAccountType('marketer');
      setToastMessage(`${res.message}. كلمة السر المؤقتة: ${res.password} (سلّمها له وليغيّرها بعد الدخول)`);
      setTimeout(() => setToastMessage(null), 30000);
      return;
    }

    addMarketer({
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || `marketer.${Date.now().toString().slice(-4)}@gmail.com`,
      nationalId: formNationalId.trim() || '1000000000',
      bankAccount: formIban.trim(),
      bankName: formBankName,
    });

    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormNationalId('');
    setFormIban('');
    setAddModalOpen(false);
    setToastMessage('تمت إضافة المسوق الجديد وتوليد عقده المعتمد بنجاح بنسبة عمولة 5%');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const permissionsList: { key: keyof MarketerPermissions; title: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      key: 'canCreateBooking',
      title: 'إضافة حجوزات جديدة',
      description: 'السماح للمسوق بتسجيل وتأكيد حجوزات النزلاء الخاصة به في النظام',
      icon: Plus,
    },
    {
      key: 'canEditPrices',
      title: 'تعديل الأسعار والخصومات',
      description: 'إمكانية إعطاء خصومات محددة أو تغيير سعر الليلة المعتمد',
      icon: DollarSign,
    },
    {
      key: 'canViewAllBookings',
      title: 'الاطلاع على كافة الحجوزات',
      description: 'رؤية حجوزات جميع المسوقين والإدارة بدلاً من حصرها بحجوزاته فقط',
      icon: Eye,
    },
    {
      key: 'canBlockDates',
      title: 'إغلاق وتجميد التواريخ',
      description: 'إمكانية قفل أيام محددة وجعلها غير متاحة للحجز',
      icon: Lock,
    },
    {
      key: 'canViewCustomerContacts',
      title: 'رؤية أرقام هواتف العملاء',
      description: 'إظهار وسيلة الاتصال المباشرة بالعميل وتفاصيل الهوية',
      icon: Phone,
    },
    {
      key: 'canExportReports',
      title: 'تصدير التقارير والفواتير',
      description: 'تحميل كشوف الحساب وسندات الحجز بصيغة PDF وإكسل',
      icon: FileText,
    },
    {
      key: 'canCreateContract',
      title: 'إنشاء وإصدار العقود الرسمية وتعديل صيغتها',
      description: 'توليد عقد إيجار موثق للعميل برقم تسلسلي معتمد وتعديل بنود وشروط العقد قبل إرساله',
      icon: FileCheck,
    },
    {
      key: 'canEditDeposit',
      title: 'تعديل مبلغ العربون قبل تأكيد الحجز',
      description: 'السماح بتعديل وتخصيص قيمة العربون للعميل بحرية قبل اعتماد الحجز النهائي',
      icon: Edit,
    },
    {
      key: 'canViewFinancials',
      title: 'الاطلاع على الأرباح والتقارير المالية',
      description: 'رؤية إجمالي إيرادات الاستراحات والتقارير المحاسبية العامة',
      icon: CreditCard,
    },
    {
      key: 'canViewCalendar',
      title: 'إظهار صفحة التقويم والأسعار',
      description: 'السماح للمسوق بالوصول لصفحة التقويم وجداول الأسعار، أو إخفائها عنه في الشريط السفلي والقائمة',
      icon: CalendarDays,
    },
    {
      key: 'canViewProperties',
      title: 'إظهار صفحة العقار والوحدات',
      description: 'السماح للمسوق بالوصول لصفحة تفاصيل وأقسام العقار، أو إخفائها عنه في الشريط السفلي والقائمة',
      icon: Building,
    },
    {
      key: 'canViewDashboard',
      title: 'إظهار صفحة لوحة التحكم المركزية',
      description: 'السماح للمسوق بالوصول للوحة التحكم ومتابعة حركة الدخول والخروج وفلاتر الحجوزات، أو إخفائها',
      icon: Briefcase,
    },
    {
      key: 'canViewMarketers',
      title: 'إظهار صفحة وزر المسوقين والعمولات',
      description: 'السماح للمسوق بالوصول لبيانات المسوقين والعمولات والزر العلوي في الهيدر، أو إخفائها عنه تماماً',
      icon: Users,
    },
  ];

  return (
    <div className={embedded ? "space-y-4 font-['Tajawal',sans-serif] w-full" : "pb-28 max-w-5xl mx-auto px-3 sm:px-4 pt-3 space-y-4 font-['Tajawal',sans-serif]"}>
      {/* Guard Profile Card */}
      {(isAdmin) && (
        <GuardProfileCard guard={guard} isAdmin={isAdmin} onSave={updateGuardProfile} />
      )}

      {/* Commission Requests Section */}
      {!isGuard && <CommissionRequestsSection />}

      {/* Top Banner & Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <span>إدارة المسوقين والعمولات والملفات الشخصية</span>
            </h2>
            <span className="text-xs bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full font-bold border border-purple-200 flex items-center gap-1">
              <Percent className="w-3 h-3 text-purple-700" />
              5% عمولة ثابتة وموثقة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            كشف مالي تفصيلي بالعمولات والمبالغ لكل مسوق، ملفات المسوقين الشخصية، والعقود الرسمية المبرمة مع الإدارة
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === 'commissions' && (
            <>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="تصدير كشف إكسل بالعمولات والمبالغ"
              >
                <Download className="w-3.5 h-3.5 text-purple-700" />
                <span>تصدير كشف (CSV)</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="طباعة كشف العمولات"
              >
                <Printer className="w-3.5 h-3.5 text-purple-700" />
                <span>طباعة</span>
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-mauve-shiny flex items-center justify-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مسوق</span>
            </button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub Tabs Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1.5 bg-purple-100/70 rounded-2xl border border-purple-200/80">
        <button
          onClick={() => setActiveSubTab('commissions')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'commissions'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-purple-900 hover:text-purple-950 hover:bg-purple-200/40'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>كشف العمولات والمبالغ (خاص بالمسوق)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-purple-900 hover:text-purple-950 hover:bg-purple-200/40'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>الملف الشخصي والعقد المبرم</span>
        </button>

        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'permissions'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-purple-900 hover:text-purple-950 hover:bg-purple-200/40'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>مصفوفة الصلاحيات</span>
        </button>
      </div>

      {/* Profile & Contract Info (Moved from MoreTab) */}
      {activeSubTab === 'profile' && currentMarketer && (
        <div className="bg-gradient-to-br from-white via-purple-50/40 to-indigo-50/30 rounded-3xl p-5 shadow-xs border border-purple-200/90 relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <h3 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-purple-700" />
                <span>الملف الشخصي للموظف والعقد</span>
              </h3>
            </div>
            <span className="text-[10px] bg-purple-700 text-white font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
              خاص بالموظف
            </span>
          </div>
          
          <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                {currentMarketer?.name?.charAt(0) || 'م'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">{currentMarketer?.name}</h4>
                  <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md font-mono font-bold">
                    {currentMarketer?.code}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                    موظف ومسوق معتمد
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="font-mono">{currentMarketer?.phone}</span>
                  <span>·</span>
                  <span className="font-mono">{currentMarketer?.email}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                  <span className="text-purple-900 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    العقد: {currentMarketer?.contract?.contractNumber}
                  </span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ساري وموثق
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-r border-slate-100 pr-0 md:pr-4">
              <button
                onClick={() => setViewContractModalOpen(true)}
                className="btn-mauve-shiny flex-1 md:flex-initial px-4 py-2 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>عرض الملف والعقد</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(currentMarketer)}
                  className="flex-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                <button
                  onClick={() => setViewContractModalOpen(true)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>العقد</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketers Pills Bar */}
      <div className="bg-white p-3 rounded-2xl border border-purple-100 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-700" />
            <span>اختر المسوق لاستعراض بياناته وعمولاته:</span>
          </span>
          <span className="text-[11px] text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
            {marketers.length} مسوقين معتمدين
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {marketers.map((m) => {
            const isSelected = m.id === currentMarketer?.id;
            const st = marketerStats.find((s) => s.marketer.id === m.id);

            return (
              <button
                key={m.id}
                onClick={() => setSelectedMarketerId(m.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-purple-300 hover:bg-white'
                }`}
              >
                <img
                  src={m.avatar}
                  alt={m.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-purple-300 shrink-0"
                />
                <div className="text-right">
                  <span className="text-xs font-bold block whitespace-nowrap">{m.name}</span>
                  <span className={`text-[10px] font-mono block ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                    {m.code} · عمولة مستحقة: {st?.totalDueCommission || 0} ر.س
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: COMMISSIONS REPORT */}
      {activeSubTab === 'commissions' && currentMarketer && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-[#200738] via-[#2d0c4d] to-[#391263] text-white p-5 rounded-3xl shadow-sm border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={currentMarketer.avatar}
                alt={currentMarketer.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    كشف عمولات المسوق: {currentMarketer.name}
                  </h3>
                  <span className="text-xs bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md font-mono font-bold">
                    {currentMarketer.code}
                  </span>
                  <span className="text-xs bg-purple-700/60 text-purple-200 px-2 py-0.5 rounded-md font-bold">
                    نسبة العمولة: 5%
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-1 flex items-center gap-3 flex-wrap font-mono">
                  <span>جوال: {currentMarketer.phone}</span>
                  <span>·</span>
                  <span>البنك: {currentMarketer.bankName || 'مصرف الراجحي'}</span>
                  <span>·</span>
                  <span>الآيبان: {currentMarketer.bankAccount || 'غير مسجل'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (currentStat?.readyCommission || 0) > 0 && (
                <button
                  onClick={() => setPayoutConfirmMarketer(currentMarketer)}
                  className="btn-mauve-shiny px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4 text-emerald-300" />
                  <span>تسوية وصرف العمولات الجاهزة ({currentStat?.readyCommission} ر.س)</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-xs">
              <span className="text-xs text-purple-700 font-bold block flex items-center justify-between">
                <span>إجمالي العمولات المستحقة (5%)</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </span>
              <span className="text-2xl font-black text-purple-950 font-mono mt-1 block">
                {currentStat?.totalDueCommission || 0} <span className="text-xs font-bold">ر.س</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {currentStat?.readyCommission || 0} ر.س جاهز للصرف
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-xs text-emerald-700 font-bold block flex items-center justify-between">
                <span>عمولات جاهزة للصرف الفوري</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </span>
              <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
                {currentStat?.readyCommission || 0} <span className="text-xs font-bold">ر.س</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                حجوزات مكتملة ومؤكدة بالكامل
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-xs">
              <span className="text-xs text-teal-700 font-bold block flex items-center justify-between">
                <span>عمولات مسددة ومحولة للبنك</span>
                <Wallet className="w-4 h-4 text-teal-600" />
              </span>
              <span className="text-2xl font-black text-teal-900 font-mono mt-1 block">
                {currentStat?.paidCommission || 0} <span className="text-xs font-bold">ر.س</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                تم تحويلها إلى حساب المسوق
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-700 font-bold block flex items-center justify-between">
                <span>إجمالي مبيعات حجوزات المسوق</span>
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {currentStat?.totalSales || 0} <span className="text-xs font-bold">ر.س</span>
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                من {currentStat?.completedBookingsCount || 0} حجز مكتمل
              </span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="بحث برقم الحجز أو اسم العميل أو العقار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-3 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-600 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
                حالة العمولة:
              </span>
              <button
                onClick={() => setCommissionStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  commissionStatusFilter === 'all'
                    ? 'bg-purple-900 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                الكل ({currentStat?.totalBookingsCount || 0})
              </button>
              <button
                onClick={() => setCommissionStatusFilter('ready_for_payout')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  commissionStatusFilter === 'ready_for_payout'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                جاهزة للصرف
              </button>
              <button
                onClick={() => setCommissionStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  commissionStatusFilter === 'paid'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}
              >
                تم الصرف
              </button>
              <button
                onClick={() => setCommissionStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  commissionStatusFilter === 'pending'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                قيد الإتمام
              </button>
            </div>
          </div>

          {/* Detailed Commissions Table */}
          <div className="bg-white rounded-3xl border border-purple-100 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-700" />
                  <span>جدول كشف العمولات والمبالغ التفصيلي للحجوزات</span>
                  <span className="text-xs bg-purple-50 text-purple-900 px-2 py-0.5 rounded-md font-mono font-bold">
                    {marketerFilteredBookings.length} عملية حجز
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  حساب دقيق لنسبة 5% من كل حجز، تاريخ الإقامة، وحالة استحقاق وصرف العمولة للمسوق
                </p>
              </div>
            </div>

            {marketerFilteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">لا توجد حجوزات مطابقة للفلاتر المحددة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-purple-50/70 text-slate-700 border-b border-purple-100 font-bold">
                      <th className="py-3.5 px-4">رقم الحجز والتاريخ</th>
                      <th className="py-3.5 px-3">العميل</th>
                      <th className="py-3.5 px-3">العقار والمدة</th>
                      <th className="py-3.5 px-3">إجمالي الحجز</th>
                      <th className="py-3.5 px-3">النسبة</th>
                      <th className="py-3.5 px-3 font-mono">مبلغ العمولة</th>
                      <th className="py-3.5 px-3 text-center">حالة العمولة</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marketerFilteredBookings.map((b) => {
                      const comm = b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05);
                      const isPaid = b.commissionStatus === 'paid';
                      const isReady = b.commissionStatus === 'ready_for_payout';

                      return (
                        <tr key={b.id} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-xs bg-purple-50 text-purple-900 px-2 py-0.5 rounded-md border border-purple-200 block w-fit">
                              {b.bookingNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                              {b.createdAt ? b.createdAt.split('T')[0] : b.checkInDate}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{b.customerName}</span>
                            <span className="text-[11px] text-slate-500 font-mono block">{b.customerPhone}</span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-800 block">{b.propertyName}</span>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {b.checkInDate} ({b.nightsCount} ليالٍ)
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-slate-900 text-xs">{b.totalPrice} ر.س</span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[11px]">
                              {b.commissionRatePercent || 5}%
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-mono font-black text-purple-950 bg-purple-100/70 border border-purple-200 px-2.5 py-1 rounded-lg text-xs inline-block">
                              {comm} ر.س
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                isPaid
                                  ? 'bg-teal-100 text-teal-900 border border-teal-200'
                                  : isReady
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isPaid ? (
                                <>
                                  <Check className="w-3 h-3 text-teal-700" />
                                  <span>تم الصرف</span>
                                </>
                              ) : isReady ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>جاهزة للصرف</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>قيد الإتمام</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {isAdmin && !isPaid && (
                                <button
                                  onClick={() => payMarketerCommission(b.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                                  title="اعتماد صرف وتحويل عمولة هذا الحجز فقط"
                                >
                                  صرف الآن
                                </button>
                              )}
                              {isPaid && (
                                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                                  مسددة
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-100/60 font-bold text-slate-900 border-t-2 border-purple-200">
                      <td colSpan={3} className="py-3 px-4 text-left">
                        المجموع الإجمالي للحجوزات المعروضة:
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {marketerFilteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)} ر.س
                      </td>
                      <td className="py-3 px-3 font-mono">5%</td>
                      <td className="py-3 px-3 font-mono text-purple-950 font-black text-xs">
                        {marketerFilteredBookings.reduce(
                          (sum, b) => sum + (b.marketerCommission || Math.round((b.totalPrice || 0) * 0.05)),
                          0
                        )}{' '}
                        ر.س
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-center text-slate-500 text-[11px]">
                        كشف معتمد وموثق
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PROFILE & CONTRACT */}
      {activeSubTab === 'profile' && currentMarketer && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-700" />
                <span>الملف الشخصي للمسوق والعقد المبرم مع الإدارة</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                بيانات تسجيل الدخول للتطبيق، وسائل الاتصال، الحساب البنكي، والعقد الرسمي الموثق
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(currentMarketer)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-purple-700" />
                <span>تعديل بيانات الملف والعقد</span>
              </button>
              <button
                onClick={() => setViewContractModalOpen(true)}
                className="btn-mauve-shiny flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>معاينة العقد الرسمي كاملاً</span>
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-purple-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={currentMarketer.avatar}
                  alt={currentMarketer.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-300 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-bold text-slate-900">{currentMarketer.name}</h4>
                    <span className="text-xs font-mono bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md font-bold">
                      {currentMarketer.code}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      حساب نشط وموثق
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    مسوق ووسيط عقاري معتمد لدى إدارة شاليهات واستراحات ماسة (AMASA)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => switchUser('marketer', currentMarketer.id)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
                  title="الدخول بحساب هذا المسوق لتجربة النظام والصلاحيات"
                >
                  <Users className="w-4 h-4 text-purple-700" />
                  <span>دخول بحساب {currentMarketer.name.split(' ')[0]}</span>
                </button>
              </div>
            </div>

            {/* Profile Grid Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">اسم المسوق:</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{currentMarketer.name}</span>
                </div>
                <Users className="w-5 h-5 text-purple-700" />
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">رقم جوال المسوق:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{currentMarketer.phone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`tel:${currentMarketer.phone}`} className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(currentMarketer.phone, 'phone')}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <span className="text-[11px] text-slate-500 font-bold block">إيميل الدخول للتطبيق:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block truncate">{currentMarketer.email}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(currentMarketer.email, 'email')}
                  className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">رقم الهوية الوطنية:</span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{currentMarketer.nationalId || '1088923412'}</span>
                </div>
                <UserCheck className="w-5 h-5 text-slate-500" />
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">البنك المعتمد:</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{currentMarketer.bankName || 'مصرف الراجحي'}</span>
                </div>
                <Building className="w-5 h-5 text-slate-500" />
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <span className="text-[11px] text-slate-500 font-bold block">رقم الآيبان (IBAN):</span>
                  <span className="text-xs font-bold text-purple-900 font-mono mt-0.5 block truncate">
                    {currentMarketer.bankAccount || 'لم يتم تسجيل آيبان'}
                  </span>
                </div>
                <CreditCard className="w-5 h-5 text-purple-700 shrink-0" />
              </div>
            </div>

            {copiedKey && (
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                تم نسخ {copiedKey === 'phone' ? 'رقم الجوال' : 'البريد الإلكتروني'} إلى الحافظة بنجاح
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PERMISSIONS MATRIX */}
      {activeSubTab === 'permissions' && currentMarketer && (
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-700" />
                <span>مصفوفة صلاحيات المسوق: {currentMarketer.name}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'التحكم المباشر في الصلاحيات الممنوحة للمسوق، بما في ذلك إظهار أو إخفاء الصفحات والأدوات'
                  : 'استعراض الصلاحيات الممنوحة لك من قبل الإدارة'}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={grantAllMarketersContractAndDepositPermissions}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>تأكيد صلاحية العقود والعربون للجميع</span>
              </button>
            )}
          </div>

          {/* Admin Role Upgrade / Downgrade Section */}
          {isAdmin && (
            (() => {
              const acc = userAccounts.find(
                (a) => a.marketerId === currentMarketer.id || a.id === currentMarketer.id
              );
              const isCurrentlyAdmin = acc?.role === 'admin';
              const nextRole: UserRole = isCurrentlyAdmin ? 'marketer' : 'admin';

              return (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-sm text-amber-950">
                        {isCurrentlyAdmin
                          ? 'هذا الحساب عضو إدارة (كامل الصلاحيات)'
                          : 'ترقية إلى إدارة'}
                      </h5>
                      <p className="text-[11px] text-amber-900/80 mt-0.5">
                        {isCurrentlyAdmin
                          ? 'يرى كل ما تراه الإدارة. يمكنك إرجاعه إلى مسوق.'
                          : 'يصبح لهذا المسوق كامل صلاحيات الإدارة، وتبقى حجوزاته وعمولاته محفوظة.'}
                      </p>
                    </div>

                    {roleChangeTarget === null && (
                      <button
                        onClick={() => setRoleChangeTarget(nextRole)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
                          isCurrentlyAdmin
                            ? 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'bg-purple-700 hover:bg-purple-800 text-white'
                        }`}
                      >
                        {isCurrentlyAdmin ? 'إرجاع إلى مسوق' : 'ترقية إلى إدارة'}
                      </button>
                    )}
                  </div>

                  {roleChangeTarget !== null && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-amber-950">
                        {roleChangeTarget === 'admin'
                          ? `تأكيد منح ${currentMarketer.name} كامل صلاحيات الإدارة؟`
                          : `تأكيد إرجاع ${currentMarketer.name} إلى مسوق؟`}
                      </span>
                      <button
                        onClick={() => {
                          const res = setMarketerAccountRole(currentMarketer.id, roleChangeTarget);
                          setRoleChangeTarget(null);
                          setToastMessage(res.message);
                          setTimeout(() => setToastMessage(null), 5000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        نعم، تأكيد
                      </button>
                      <button
                        onClick={() => setRoleChangeTarget(null)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}

          {/* Permissions Matrix Switches */}
          <div className="divide-y divide-slate-100 border border-purple-100 rounded-2xl overflow-hidden bg-slate-50/40">
            {permissionsList.map((item) => {
              const isEnabled = !!currentMarketer.permissions[item.key];
              const Icon = item.icon;

              return (
                <div
                  key={item.key}
                  onClick={() => togglePermission(item.key)}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isAdmin ? 'hover:bg-purple-50/50 cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isEnabled ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{item.title}</span>
                      <span className="text-[11px] text-slate-500 leading-tight">{item.description}</span>
                    </div>
                  </div>

                  <div
                    className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                      isEnabled ? 'bg-purple-700 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contract View / Print Modal */}
      {viewContractModalOpen && currentMarketer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl border border-purple-100 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-base text-slate-900">
                  معاينة العقد الرسمي المبرم بين المسوق والإدارة
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-purple-700" />
                  <span>طباعة العقد</span>
                </button>
                <button
                  onClick={() => setViewContractModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 leading-relaxed text-xs">
              <div className="text-center pb-6 border-b-2 border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-purple-800 tracking-wider">
                  المملكة العربية السعودية · وثيقة رسمية معتمدة
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  عقد وساطة وتسويق عقاري رسمي موثق
                </h2>
                <p className="text-xs text-slate-500">
                  إدارة استراحات وشاليهات ماسة (AMASA) · ترخيص وساطة عقارية معتمد
                </p>
                <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-mono text-slate-600">
                  <span>رقم العقد: {currentMarketer.contract?.contractNumber || `MKT-CTR-2026-${currentMarketer.code.replace('MK-', '')}`}</span>
                  <span>·</span>
                  <span>تاريخ العقد: {currentMarketer.contract?.contractDate || currentMarketer.joinDate}</span>
                  <span>·</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    حالة العقد: ساري وموثق
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-1">
                  <span className="text-[11px] font-bold text-purple-800 block">
                    الطرف الأول (المنشأة المالكة والمشغلة):
                  </span>
                  <p className="font-bold text-slate-900 text-xs">إدارة استراحات وشاليهات ماسة (AMASA)</p>
                  <p className="text-[11px] text-slate-600">
                    ويمثلها: {currentMarketer.contract?.firstPartyRepresentative || 'المدير العام التنفيذي'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 space-y-1">
                  <span className="text-[11px] font-bold text-purple-800 block">
                    الطرف الثاني (المسوق والوسيط العقاري):
                  </span>
                  <p className="font-bold text-slate-900 text-xs">{currentMarketer.name}</p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    الهوية: {currentMarketer.nationalId} · الجوال: {currentMarketer.phone}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 border-r-4 border-purple-700 pr-2">
                  بنود وشروط الاتفاقية:
                </h4>
                <div className="space-y-2 text-slate-700 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                  {(currentMarketer.contract?.terms || []).map((term, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-purple-800 shrink-0 font-mono text-[11px]">{idx + 1}.</span>
                      <span className="leading-relaxed">{term}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                تم إنشاء وتوثيق هذا العقد عبر منصة شاليهات ماسة المركزية
              </span>
              <button
                onClick={() => setViewContractModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Contract Modal */}
      {editProfileModalOpen && currentMarketer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-700" />
                <span>تعديل الملف الشخصي والعقد للمسوق</span>
              </h4>
              <button
                onClick={() => setEditProfileModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfileAndContract} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المسوق الكامل:</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">إيميل الدخول للتطبيق:</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهوية الوطنية:</label>
                  <input
                    type="text"
                    value={editNationalId}
                    onChange={(e) => setEditNationalId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">البنك المعتمد:</label>
                  <select
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden"
                  >
                    <option value="مصرف الراجحي">مصرف الراجحي</option>
                    <option value="البنك الأهلي السعودي">البنك الأهلي السعودي</option>
                    <option value="بنك الإنماء">بنك الإنماء</option>
                    <option value="بنك الرياض">بنك الرياض</option>
                    <option value="بنك البلاد">بنك البلاد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رقم الآيبان البنكي (IBAN):</label>
                <input
                  type="text"
                  value={editIban}
                  onChange={(e) => setEditIban(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                />
              </div>

              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2">
                <span className="font-bold text-purple-900 block">بيانات العقد المبرم:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">رقم العقد:</label>
                    <input
                      type="text"
                      value={editContractNum}
                      onChange={(e) => setEditContractNum(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">تاريخ الإبرام:</label>
                    <input
                      type="date"
                      value={editContractDate}
                      onChange={(e) => setEditContractDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">تاريخ التجديد:</label>
                    <input
                      type="date"
                      value={editContractExpiry}
                      onChange={(e) => setEditContractExpiry(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="btn-mauve-shiny flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer"
                >
                  حفظ وتحديث الملف والعقد
                </button>
                <button
                  type="button"
                  onClick={() => setEditProfileModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Confirm Modal */}
      {payoutConfirmMarketer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>تسوية وصرف عمولة المسوق</span>
              </h4>
              <button
                onClick={() => setPayoutConfirmMarketer(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const st = marketerStats.find((s) => s.marketer.id === payoutConfirmMarketer.id);
              const due = st ? st.totalDueCommission : 0;

              return (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3 p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                    <img
                      src={payoutConfirmMarketer.avatar}
                      alt={payoutConfirmMarketer.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-purple-200"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{payoutConfirmMarketer.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        كود: {payoutConfirmMarketer.code} · جوال: {payoutConfirmMarketer.phone}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-950 block">
                        إجمالي العمولة المستحقة للصرف (5%):
                      </span>
                      <span className="text-[10px] text-emerald-700">تشمل الحجوزات المكتملة والمؤكدة</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-emerald-800 font-mono">{due}</span>
                      <span className="text-xs font-bold text-emerald-800 mr-1">ر.س</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handlePayoutConfirm(payoutConfirmMarketer.id)}
                      className="btn-mauve-shiny flex-1 py-2.5 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>تأكيد التحويل والصرف ({due} ر.س)</span>
                    </button>
                    <button
                      onClick={() => setPayoutConfirmMarketer(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Marketer / Admin Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-purple-100">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-700" />
                <span>
                  {addAccountType === 'admin'
                    ? 'إضافة عضو إدارة (كامل الصلاحيات)'
                    : 'إضافة مسوق جديد وتوليد عقده'}
                </span>
              </h4>
              <button
                onClick={() => setAddModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع الحساب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddAccountType('marketer')}
                    className={`py-2.5 px-3 rounded-xl border font-bold cursor-pointer transition-all ${
                      addAccountType === 'marketer'
                        ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                        : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    مسوق
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddAccountType('admin')}
                    className={`py-2.5 px-3 rounded-xl border font-bold cursor-pointer transition-all ${
                      addAccountType === 'admin'
                        ? 'bg-purple-700 border-purple-700 text-white shadow-md'
                        : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    إدارة (كامل الصلاحيات)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {addAccountType === 'admin' ? 'الاسم الكامل:' : 'اسم المسوق الكامل:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تركي بن فهد"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    required
                    placeholder="05xxxxxxxx"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">إيميل الدخول (Gmail):</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                  />
                </div>
              </div>

              {addAccountType === 'marketer' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">رقم الهوية الوطنية:</label>
                      <input
                        type="text"
                        placeholder="10xxxxxxxx"
                        value={formNationalId}
                        onChange={(e) => setFormNationalId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">البنك:</label>
                      <select
                        value={formBankName}
                        onChange={(e) => setFormBankName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden"
                      >
                        <option value="مصرف الراجحي">مصرف الراجحي</option>
                        <option value="البنك الأهلي السعودي">البنك الأهلي السعودي</option>
                        <option value="بنك الإنماء">بنك الإنماء</option>
                        <option value="بنك الرياض">بنك الرياض</option>
                        <option value="بنك البلاد">بنك البلاد</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">رقم الآيبان (IBAN):</label>
                    <input
                      type="text"
                      placeholder="SA..."
                      value={formIban}
                      onChange={(e) => setFormIban(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono"
                    />
                  </div>
                </>
              )}

              {addError && <p className="text-rose-700 font-bold">{addError}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="btn-mauve-shiny flex-1 py-2.5 text-white rounded-xl font-bold cursor-pointer"
                >
                  {addAccountType === 'admin'
                    ? 'إضافة عضو الإدارة'
                    : 'تسجيل المسوق وإصدار العقد'}
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
