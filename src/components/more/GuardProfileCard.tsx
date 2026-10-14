import React, { useState } from 'react';
import { Guard } from '../../types';
import {
  ShieldCheck,
  UserCheck,
  Phone,
  Mail,
  Copy,
  Edit2,
  Calendar,
  CreditCard,
  Briefcase,
  Wallet,
  Check,
  Lock,
  X,
  Key,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface GuardProfileCardProps {
  guard: Guard;
  isAdmin: boolean;
  onSave?: (data: Partial<Guard>) => void;
}

export const GuardProfileCard: React.FC<GuardProfileCardProps> = ({
  guard,
  isAdmin,
  onSave,
}) => {
  const { switchUser } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Guard>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const startEdit = () => {
    setFormData({
      name: guard.name || '',
      jobTitle: guard.jobTitle || 'حارس ومشرف الاستراحات والعقارات',
      phone: guard.phone || '',
      email: guard.email || '',
      nationalId: guard.nationalId || '',
      startDate: guard.startDate || '',
      iban: guard.iban || '',
      salary: guard.salary !== undefined ? guard.salary : 3500,
      avatar: guard.avatar || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && onSave) {
      onSave({
        name: (formData.name || '').trim() || guard.name,
        jobTitle: (formData.jobTitle || '').trim() || guard.jobTitle,
        phone: (formData.phone || '').trim() || guard.phone,
        email: (formData.email || '').trim() || guard.email,
        nationalId: (formData.nationalId || '').trim() || guard.nationalId,
        startDate: formData.startDate || guard.startDate,
        iban: (formData.iban || '').trim() || guard.iban,
        salary: formData.salary !== undefined ? Number(formData.salary) : guard.salary,
        avatar: (formData.avatar || '').trim() || guard.avatar,
      });
      setIsEditModalOpen(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3500);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const salaryNum = Number(guard.salary) || 3500;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-purple-100 space-y-5 font-['Tajawal',sans-serif]">
      {/* Top Banner / Card Header matching Marketer Profile Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <img
            src={
              guard.avatar ||
              'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80'
            }
            alt={guard.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-300 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-lg font-bold text-slate-900">{guard.name}</h4>
              <span className="text-xs font-mono bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md font-bold">
                #GRD-01
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                حساب حارس نشط وموثق
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {guard.jobTitle || 'حارس ومشرف الاستراحات والعقارات المعتمد لدى إدارة شاليهات واستراحات ماسة (AMASA)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => switchUser('guard')}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 transition-colors cursor-pointer"
              title="الدخول بشاشة الحارس أبو راشد لتجربة حركات اليوم واستلام التأمين"
            >
              <Key className="w-4 h-4 text-purple-700" />
              <span>دخول بحساب أبو راشد</span>
            </button>
          )}

          {isAdmin ? (
            <button
              type="button"
              onClick={startEdit}
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>تعديل بيانات الحارس</span>
            </button>
          ) : (
            <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-800" />
              <span>ملفك الشخصي المعتمد</span>
            </span>
          )}
        </div>
      </div>

      {justSaved && (
        <div className="text-xs text-emerald-800 font-bold bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تم حفظ وتحديث الملف الشخصي للحارس أبو راشد بنجاح!</span>
        </div>
      )}

      {/* Profile Grid Info: Identical to Marketer Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Name */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">اسم الحارس:</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">{guard.name}</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-purple-700" />
        </div>

        {/* Phone with call and copy button */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">رقم جوال الحارس:</span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
              {guard.phone}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`tel:${guard.phone}`}
              className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-colors"
              title="اتصال هاتفي"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => copyToClipboard(guard.phone, 'phone')}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors"
              title="نسخ رقم الجوال"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Email with copy */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <span className="text-[11px] text-slate-500 font-bold block">إيميل الدخول للتطبيق:</span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block truncate">
              {guard.email}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(guard.email, 'email')}
            className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg cursor-pointer transition-colors"
            title="نسخ الإيميل"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* National ID */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">رقم الهوية الوطنية:</span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
              {guard.nationalId || '1034567890'}
            </span>
          </div>
          <UserCheck className="w-5 h-5 text-slate-500" />
        </div>

        {/* Job Title */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">المسمى الوظيفي:</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">
              {guard.jobTitle || 'حارس ومشرف الاستراحات والعقارات'}
            </span>
          </div>
          <Briefcase className="w-5 h-5 text-slate-500" />
        </div>

        {/* Start Date */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-bold block">تاريخ المباشرة:</span>
            <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
              {guard.startDate || '2025-06-01'}
            </span>
          </div>
          <Calendar className="w-5 h-5 text-slate-500" />
        </div>

        {/* Salary Highlight Card */}
        <div className="p-3.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] text-purple-200 font-bold block">الراتب الشهري المعتمد:</span>
            <span className="text-base font-black font-mono mt-0.5 block">
              {salaryNum.toLocaleString('en-US')} ر.س
            </span>
          </div>
          <Wallet className="w-6 h-6 text-amber-300" />
        </div>

        {/* Bank Account / IBAN */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between md:col-span-2">
          <div className="min-w-0 pr-1">
            <span className="text-[11px] text-slate-500 font-bold block">
              رقم الآيبان البنكي (IBAN) لتحويل الراتب:
            </span>
            <span className="text-xs font-bold text-purple-900 font-mono mt-0.5 block truncate select-all">
              {guard.iban || 'SA5580000201608010199999'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <CreditCard className="w-5 h-5 text-purple-700" />
            <button
              type="button"
              onClick={() => copyToClipboard(guard.iban || '', 'iban')}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors"
              title="نسخ الآيبان"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {copiedKey && (
        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200 animate-in fade-in">
          تم نسخ {copiedKey === 'phone' ? 'رقم الجوال' : copiedKey === 'email' ? 'البريد الإلكتروني' : 'رقم الآيبان'} إلى الحافظة بنجاح
        </div>
      )}

      {/* Field Operations & Responsibilities */}
      <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 space-y-2">
        <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>المهام والصلاحيات الميدانية للحارس أبو راشد:</span>
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
            <span>تسجيل وتأكيد وصول النزلاء اليومي عبر شاشة الحارس</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
            <span>استلام وتوثيق مبالغ التأمين (نقداً أو إلكترونياً)</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
            <span>فحص الشاليه والمرافق والمسبح عند الخروج والمغادرة</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
            <span>إرجاع التأمين للنزيل وتأكيد خلو الذمة وتسليم المفتاح</span>
          </div>
        </div>
      </div>

      {/* Edit Guard Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-l from-[#1f0b38] via-[#35105c] to-[#1a0833] p-5 text-white flex items-center justify-between border-b border-purple-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-900 border border-purple-400/30 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">تعديل الملف الشخصي للحارس أبو راشد</h3>
                  <p className="text-xs text-purple-200">تحديث بيانات الحارس والراتب والحساب البنكي</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">اسم الحارس</span>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600"
                    required
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">المسمى الوظيفي</span>
                  <input
                    type="text"
                    value={formData.jobTitle || ''}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">رقم الجوال</span>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono text-left"
                    dir="ltr"
                    required
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">البريد الإلكتروني للدخول</span>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono text-left"
                    dir="ltr"
                    required
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">رقم الهوية الوطنية</span>
                  <input
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">تاريخ المباشرة</span>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-slate-700">الراتب الشهري (ر.س)</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono"
                  />
                </label>

                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-bold text-slate-700">رقم الآيبان (IBAN)</span>
                  <input
                    type="text"
                    value={formData.iban || ''}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono text-left"
                    dir="ltr"
                  />
                </label>

                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-bold text-slate-700">رابط الصورة الرمزية (Avatar URL)</span>
                  <input
                    type="text"
                    value={formData.avatar || ''}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono text-left"
                    dir="ltr"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
