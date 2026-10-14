import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Key,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService, STORAGE_KEYS } from '../../lib/storage';

interface ResetTokenRecord {
  token: string;
  accountId: string;
  expiresAt: number;
}

const getActiveResetTokens = (): ResetTokenRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESET_TOKENS);
    if (!raw) return [];
    const list = JSON.parse(raw) as ResetTokenRecord[];
    return list.filter((r) => r.expiresAt > Date.now());
  } catch {
    return [];
  }
};

const saveResetTokens = (tokens: ResetTokenRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RESET_TOKENS, JSON.stringify(tokens));
  } catch {}
};

const generateRandomHexToken = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const normalizePhoneDigits = (val: string) => val.replace(/\D/g, '').slice(-9);

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, 2);
  const stars = '*'.repeat(Math.max(2, user.length - 2));
  return `${visible}${stars}@${domain}`;
};

interface LoginScreenProps {
  onAuthed: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthed }) => {
  const { userAccounts, marketers, guard, loginWithGmailAndPassword, changePassword } = useApp();

  const [mode, setMode] = useState<'login' | 'forgot' | 'sent' | 'reset' | 'done'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password
  const [phoneInput, setPhoneInput] = useState('');
  const [sentInfo, setSentInfo] = useState<{ masked: string; link: string; token: string; delivered: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset password
  const [activeResetToken, setActiveResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Detect #reset=TOKEN in URL on mount or hash change
  useEffect(() => {
    try {
      const match = window.location.hash.match(/reset=([a-f0-9]+)/i);
      if (match) {
        const token = match[1];
        const valid = getActiveResetTokens().find((r) => r.token === token);
        if (valid) {
          setActiveResetToken(token);
          setMode('reset');
        } else {
          setMessage({
            ok: false,
            text: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. اطلب رابطاً جديداً.',
          });
        }
      }
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const emailNorm = email.trim().toLowerCase();
    if (!/^[^\s@]+@gmail\.com$/i.test(emailNorm)) {
      setMessage({ ok: false, text: 'أدخل بريد Gmail صحيحاً (مثال: name@gmail.com).' });
      return;
    }
    if (!password) {
      setMessage({ ok: false, text: 'أدخل كلمة المرور.' });
      return;
    }

    const res = loginWithGmailAndPassword(emailNorm, password);
    if (res.success) {
      onAuthed();
    } else {
      setMessage({ ok: false, text: res.message });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanPhone = normalizePhoneDigits(phoneInput);
    if (cleanPhone.length < 9) {
      setMessage({ ok: false, text: 'أدخل رقم الجوال كاملاً (مثال: 0551234567).' });
      return;
    }

    // Match phone against userAccounts or marketers or guard
    const matchedAccount = userAccounts.find((acc) => {
      const phones = [
        acc.phone,
        marketers.find((m) => m.id === acc.marketerId)?.phone,
        acc.role === 'guard' ? guard.phone : undefined,
      ].filter(Boolean) as string[];

      return phones.some((p) => normalizePhoneDigits(p) === cleanPhone);
    });

    if (!matchedAccount) {
      setMessage({ ok: false, text: 'لا يوجد حساب مرتبط برقم الجوال هذا في النظام.' });
      return;
    }

    setIsSubmitting(true);
    const token = generateRandomHexToken();
    const tokens = getActiveResetTokens().filter((t) => t.accountId !== matchedAccount.id);
    tokens.push({
      token,
      accountId: matchedAccount.id,
      expiresAt: Date.now() + 1800 * 1000, // 30 minutes
    });
    saveResetTokens(tokens);

    let baseUrl = '';
    try {
      baseUrl = window.location.href.split('#')[0];
    } catch {}
    const resetLink = `${baseUrl}#reset=${token}`;

    setSentInfo({
      masked: maskEmail(matchedAccount.email),
      link: resetLink,
      token,
      delivered: false,
    });
    setIsSubmitting(false);
    setMode('sent');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const tokenObj = getActiveResetTokens().find((r) => r.token === activeResetToken);
    if (!tokenObj) {
      setMessage({ ok: false, text: 'انتهت صلاحية الرابط. اطلب رابطاً جديداً.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ ok: false, text: 'كلمة السر يجب ألا تقل عن 6 خانات.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ ok: false, text: 'كلمة المرور وتأكيدها غير متطابقين.' });
      return;
    }

    const res = changePassword(tokenObj.accountId, newPassword);
    if (!res.success) {
      setMessage({ ok: false, text: res.message });
      return;
    }

    // Invalidate token
    saveResetTokens(getActiveResetTokens().filter((r) => r.token !== tokenObj.token));
    try {
      window.history.replaceState(null, '', window.location.href.split('#')[0]);
    } catch {}

    setNewPassword('');
    setConfirmPassword('');
    setActiveResetToken(null);
    setMode('done');
  };

  const fillQuickAccount = (em: string, pass: string) => {
    setEmail(em);
    setPassword(pass);
    setMessage(null);
  };

  const inputCls =
    'w-full bg-[#FAF8FD] border border-purple-200/80 rounded-2xl py-3 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-purple-500 focus:ring-2 focus:ring-purple-100';

  return (
    <div className="min-h-screen bg-[#F8F5FC] flex items-center justify-center p-4 font-['Tajawal',sans-serif]" dir="rtl">
      <div className="w-full max-w-sm space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-purple-800 to-indigo-900 text-amber-300 flex items-center justify-center shadow-lg border border-purple-300/30">
            <span className="font-serif font-black text-2xl">A</span>
          </div>
          <h1 className="text-xl font-black text-purple-950">AMASA | منصة إدارة الشاليهات</h1>
          <p className="text-xs text-slate-500">
            منصة إدارة وحجوزات الشاليهات والاستراحات الفاخرة وعمليات الدخول والخروج
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-100 space-y-4">
          {message && (
            <div
              className={`flex items-start gap-2 text-xs font-bold p-2.5 rounded-xl border ${
                message.ok
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {message.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3">
              <h2 className="text-sm font-black text-purple-950">تسجيل الدخول</h2>

              <label className="block space-y-1">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> بريد Gmail
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className={`${inputCls} text-left font-mono`}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> كلمة السر
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} text-left font-mono pl-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                className="btn-mauve-shiny w-full py-3.5 rounded-2xl text-white text-sm font-bold cursor-pointer"
              >
                دخول
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setMode('forgot');
                }}
                className="w-full text-center text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>

              {/* Demo quick fill credentials */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold text-center">
                  حسابات تجريبية سريعة بنقرة واحدة:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('sakt2008@gmail.com', 'Amasa@2026')}
                    className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold border border-purple-200 cursor-pointer text-right truncate"
                  >
                    👑 المالك (الإدارة)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('guard.amasa@gmail.com', 'guard')}
                    className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-200 cursor-pointer text-right truncate"
                  >
                    🔑 الحارس (أبو راشد)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('ahmed.shammari@gmail.com', 'ahmed')}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 cursor-pointer text-right truncate"
                  >
                    🤝 أحمد الشمري
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('sarah.otb@gmail.com', 'sarah')}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 cursor-pointer text-right truncate"
                  >
                    🤝 سارة العتيبي
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE: FORGOT */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <h2 className="text-sm font-black text-purple-950">استعادة كلمة المرور</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                أدخل رقم الجوال المسجل في حسابك، وسنرسل رابط تغيير كلمة السر إلى بريد Gmail المرتبط به.
              </p>

              <label className="block space-y-1">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> رقم الجوال
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="05xxxxxxxx"
                  className={`${inputCls} text-left font-mono`}
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-mauve-shiny w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الرابط إلى البريد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setMode('login');
                }}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-purple-800 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" /> رجوع لتسجيل الدخول
              </button>
            </form>
          )}

          {/* MODE: SENT */}
          {mode === 'sent' && sentInfo && (
            <div className="space-y-3">
              <h2 className="text-sm font-black text-purple-950">تحقق من بريدك</h2>
              <div className="space-y-2.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  الرابط مرتبط بالبريد <strong className="font-mono" dir="ltr">{sentInfo.masked}</strong> وصالح لمدة 30 دقيقة.
                </p>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-2">
                  <p className="font-bold">رابط إعادة التعيين المباشر:</p>
                  <p className="font-mono break-all bg-white/80 rounded-lg p-2 border border-amber-200 text-[10px]" dir="ltr">
                    {sentInfo.link}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveResetToken(sentInfo.token);
                      setMessage(null);
                      setMode('reset');
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                  >
                    فتح رابط التغيير مباشرة
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setMode('login');
                }}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-purple-800 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" /> رجوع لتسجيل الدخول
              </button>
            </div>
          )}

          {/* MODE: RESET */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <h2 className="text-sm font-black text-purple-950 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> تغيير كلمة السر
              </h2>

              <label className="block space-y-1">
                <span className="text-xs text-slate-500 font-bold">
                  كلمة السر الجديدة (6 خانات فأكثر)
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputCls} text-left font-mono`}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-slate-500 font-bold">تأكيد كلمة السر</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputCls} text-left font-mono`}
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                إظهار كلمة السر
              </label>

              <button
                type="submit"
                className="btn-mauve-shiny w-full py-3.5 rounded-2xl text-white text-sm font-bold cursor-pointer"
              >
                حفظ كلمة السر الجديدة
              </button>
            </form>
          )}

          {/* MODE: DONE */}
          {mode === 'done' && (
            <div className="space-y-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-sm font-black text-purple-950">تم تغيير كلمة السر بنجاح</h2>
              <p className="text-xs text-slate-500">
                يمكنك الآن تسجيل الدخول بكلمة السر الجديدة.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setMode('login');
                }}
                className="btn-mauve-shiny w-full py-3 rounded-2xl text-white text-sm font-bold cursor-pointer"
              >
                الذهاب لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
