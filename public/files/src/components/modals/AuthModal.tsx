import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Key,
  Shield,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  LogIn,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentMarketerId,
    marketers,
    guard,
    switchUser,
    isAdmin,
    isGuard,
    userAccounts,
    currentUserAccount,
    loginWithGmailAndPassword,
    loginWithGoogleQuick,
    changePassword,
    grantAllMarketersContractAndDepositPermissions,
    authModalMode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'google_quick' | 'gmail' | 'password' | 'roles'>(() => {
    if (authModalMode === 'change_password') return 'password';
    if (authModalMode === 'login') return 'gmail';
    return 'google_quick';
  });

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password reset/customization
  const [selectedAccountId, setSelectedAccountId] = useState(currentUserAccount?.id || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setAuthStatusMessage({ type: 'error', message: 'يرجى إدخال بريد Gmail.' });
      return;
    }
    const res = loginWithGmailAndPassword(emailInput, passwordInput);
    if (res.success) {
      setAuthStatusMessage({ type: 'success', message: res.message });
      setTimeout(() => {
        setAuthStatusMessage(null);
        onClose();
      }, 700);
    } else {
      setAuthStatusMessage({ type: 'error', message: res.message });
    }
  };

  const handleQuickLoginFill = (email: string, pass: string) => {
    setEmailInput(email);
    setPasswordInput(pass);
    setAuthStatusMessage(null);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordStatusMsg({ type: 'error', message: 'يرجى إدخال كلمة المرور الجديدة.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ type: 'error', message: 'كلمة المرور وتأكيدها غير متطابقين.' });
      return;
    }
    const res = changePassword(selectedAccountId, newPassword);
    if (res.success) {
      setPasswordStatusMsg({ type: 'success', message: res.message });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordStatusMsg(null), 3000);
    } else {
      setPasswordStatusMsg({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-l from-[#1f0b38] via-[#35105c] to-[#1a0833] p-5 text-white flex items-center justify-between border-b border-purple-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-400/30 flex items-center justify-center text-white shadow-md">
              <span className="font-serif font-black text-lg text-amber-300">A</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">نظام الدخول والحسابات | AMASA</h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2 py-0.5 rounded-full font-bold">
                  أماسا
                </span>
              </div>
              <p className="text-xs text-purple-200">
                تسجيل الدخول عبر Gmail، تعيين كلمات المرور، وإدارة صلاحيات الموظفين
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="grid grid-cols-4 bg-purple-50/80 p-1.5 border-b border-purple-100 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('google_quick');
              setAuthStatusMessage(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'google_quick' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="truncate">دخول سريع (Google)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('gmail');
              setAuthStatusMessage(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'gmail' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-purple-700" />
            <span className="truncate">Gmail وكلمة السر</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('password');
              setPasswordStatusMsg(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'password' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">تخصيص كلمة السر</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('roles');
              setAuthStatusMessage(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'roles' ? 'bg-white text-purple-950 shadow-xs' : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate">الصلاحيات</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: GOOGLE QUICK */}
          {activeTab === 'google_quick' && (
            <div className="space-y-3.5">
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-amber-950">
                  <p className="font-bold">دخول فوري بنقرة واحدة بحسابات GMAIL المعتمدة:</p>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    اختر أي حساب للمعاينة والتشغيل الفوري، أو استخدم تبويب Gmail وكلمة السر للدخول التقليدي.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {userAccounts.map((acc) => {
                  const isActive =
                    (acc.role === 'admin' && isAdmin) ||
                    (acc.role === 'guard' && isGuard) ||
                    (acc.role === 'marketer' && !isAdmin && !isGuard && currentMarketerId === acc.marketerId);

                  let roleBadge = 'مسوق (عمولة 5%)';
                  let badgeCls = 'bg-purple-100 text-purple-900';
                  if (acc.role === 'admin') {
                    roleBadge = 'الإدارة العامة (كامل الصلاحيات)';
                    badgeCls = 'bg-emerald-100 text-emerald-900 font-bold';
                  } else if (acc.role === 'guard') {
                    roleBadge = 'الحارس (دخول وخروج اليوم)';
                    badgeCls = 'bg-amber-100 text-amber-900 font-bold';
                  }

                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        loginWithGoogleQuick(acc.id);
                        onClose();
                      }}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            acc.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                          }
                          alt={acc.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-purple-200"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{acc.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeCls}`}>{roleBadge}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-slate-500 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-purple-600" />
                            <span>{acc.email}</span>
                            {acc.password && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans">
                                كلمة السر: {acc.password}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="bg-purple-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3" />
                          <span>نشط حالياً</span>
                        </span>
                      ) : (
                        <span className="text-purple-700 font-bold text-xs bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200">
                          دخول
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GMAIL & PASSWORD FORM */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200 text-purple-950">
                <p className="font-bold">دخول الإدارة، المسوقين، والحارس عن طريق بريد GMAIL وكلمة المرور:</p>
                <p className="text-[11px] text-purple-900/80 mt-0.5">
                  أدخل بريد Gmail وكلمة السر المخصصة لحسابك للوصول إلى منصة AMASA.
                </p>
              </div>

              {authStatusMessage && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    authStatusMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {authStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{authStatusMessage.message}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">بريد GMAIL المسجل:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="example@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono font-medium text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">كلمة المرور:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      dir="ltr"
                      className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono font-medium text-left"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول إلى AMASA</span>
                </button>
              </form>

              {/* Quick Fill credentials */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] text-slate-500 font-bold block">
                  أزرار تعبئة سريعة للتجربة الفورية:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleQuickLoginFill('admin.amasa@gmail.com', 'admin')}
                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-right text-purple-950 font-medium transition-colors cursor-pointer"
                  >
                    👑 <strong>الإدارة العامة</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">admin.amasa@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLoginFill('guard.amasa@gmail.com', 'guard')}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-right text-amber-950 font-medium transition-colors cursor-pointer"
                  >
                    🔑 <strong>حارس العقارات</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">guard.amasa@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLoginFill('ahmed.shammari@gmail.com', 'ahmed')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right text-slate-800 font-medium transition-colors cursor-pointer"
                  >
                    🤝 <strong>المسوق أحمد</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">ahmed.shammari@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLoginFill('sarah.otb@gmail.com', 'sarah')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-right text-slate-800 font-medium transition-colors cursor-pointer"
                  >
                    🤝 <strong>المسوقة سارة</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">sarah.otb@gmail.com</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PASSWORD CUSTOMIZATION */}
          {activeTab === 'password' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-emerald-950">
                <p className="font-bold">إنشاء وتعيين كلمة سر مخصصة لكل مستخدم:</p>
                <p className="text-[11px] text-emerald-900/80 mt-0.5">
                  يمكن للإدارة والمسوقين والحارس إنشاء كلمة سر خاصة ومستقلة لكل حساب يتم حفظها والاعتماد عليها فورياً.
                </p>
              </div>

              {passwordStatusMsg && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    passwordStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {passwordStatusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordStatusMsg.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اختر الحساب المراد تعيين كلمة سر جديدة له:</label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-600 outline-hidden"
                  >
                    {userAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.email}) - [كلمة السر الحالية: {acc.password || 'غير محددة'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">كلمة المرور الجديدة:</label>
                    <input
                      type="text"
                      required
                      placeholder="اكتب كلمة السر الجديدة"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      dir="ltr"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono font-bold text-left"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">تأكيد كلمة المرور:</label>
                    <input
                      type="text"
                      required
                      placeholder="أعد كتابة كلمة السر"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      dir="ltr"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 outline-hidden font-mono font-bold text-left"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Key className="w-4 h-4" />
                  <span>حفظ وتثبيت كلمة المرور الجديدة</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-purple-950">صلاحيات الموظفين المعتمدة في AMASA:</p>
                  <p className="text-[11px] text-purple-900/80">
                    تم منح جميع الموظفين والمسوقين صلاحيات إنشاء العقد وتعديل العربون قبل تأكيد الحجز.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={grantAllMarketersContractAndDepositPermissions}
                    className="shrink-0 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    تأكيد وتفعيل للجميع
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                <div
                  onClick={() => {
                    switchUser('admin');
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    isAdmin ? 'border-purple-600 bg-purple-50/70 shadow-xs' : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">الإدارة العامة (AMASA Executive)</span>
                      {isAdmin && <Check className="w-4 h-4 text-purple-700" />}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      كامل الصلاحيات، التحكم بجميع الشاليهات، تعديل الأسعار، اعتماد العمولات، والتقارير المالية.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => {
                    switchUser('guard');
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    isGuard ? 'border-amber-600 bg-amber-50/70 shadow-xs' : 'border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">الحارس ({guard.name.split(' ')[0]})</span>
                      {isGuard && <Check className="w-4 h-4 text-amber-700" />}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      دخول وخروج اليوم فقط، استلام العقارات، تسجيل الخروج، وتذكيرات الواتساب (محجوبة عنه الأسعار والعمولات).
                    </p>
                  </div>
                </div>

                {/* Marketers list */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-700" />
                    المسوقون والموظفون (عمولة 5% + صلاحيات العقود والعربون):
                  </span>
                  {marketers.map((m) => {
                    const isSelected = !isAdmin && !isGuard && currentMarketerId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          switchUser('marketer', m.id);
                          onClose();
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected ? 'border-purple-600 bg-purple-50/70 shadow-xs' : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-xl object-cover shrink-0 border border-purple-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{m.name}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                {m.code}
                              </span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                عمولة 5%
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-semibold">
                                ✓ إنشاء عقد
                              </span>
                              <span className="text-[10px] bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded font-semibold">
                                ✓ تعديل العربون
                              </span>
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-purple-700 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="font-bold text-purple-950 font-sans">الحساب النشط:</span>
            <span>{currentUserAccount?.name}</span>
            <span className="text-slate-400">({currentUserAccount?.email})</span>
          </div>
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
