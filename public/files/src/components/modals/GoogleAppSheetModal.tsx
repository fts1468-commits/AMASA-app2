import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  Database,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  LogOut,
  ChevronLeft,
  Calendar,
  Users,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initGoogleAuth,
  googleSignIn,
  googleLogout,
  getAccessToken,
} from '../../services/googleAuth';
import {
  createAppSheetSpreadsheet,
  syncAllDataToSheet,
  getSavedSpreadsheetInfo,
  saveSpreadsheetInfo,
  disconnectSpreadsheet,
  setAutoSyncPreference,
  fetchBookingsFromSheet,
  AppSheetSyncStatus,
} from '../../services/googleSheetsService';
import { useApp } from '../../context/AppContext';

interface GoogleAppSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAppSheetModal: React.FC<GoogleAppSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bookings, properties, marketers } = useApp();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [syncStatus, setSyncStatus] = useState<AppSheetSyncStatus>(getSavedSpreadsheetInfo());
  const [activeTab, setActiveTab] = useState<'sync' | 'guide' | 'schema'>('sync');

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const [manualSheetInput, setManualSheetInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize Auth listener
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(Boolean(token));
      },
      () => {
        setCurrentUser(null);
        setHasToken(false);
      }
    );

    // Refresh sync status
    setSyncStatus(getSavedSpreadsheetInfo());

    // Check if we already have an active access token in memory
    getAccessToken().then((token) => {
      if (token) setHasToken(true);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setHasToken(true);
        setStatusMessage({
          type: 'success',
          text: `تم تسجيل الدخول بنجاح بحساب Google (${res.user.email})`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'تعذر تسجيل الدخول بحساب Google. يرجى المحاولة مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign Out
  const handleGoogleSignOut = async () => {
    try {
      await googleLogout();
      setCurrentUser(null);
      setHasToken(false);
      setStatusMessage({
        type: 'info',
        text: 'تم تسجيل الخروج من حساب Google.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Create new AppSheet spreadsheet
  const handleCreateSpreadsheet = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const result = await createAppSheetSpreadsheet(
        'AMASA - نموذج الحجوزات و Google AppSheet'
      );

      // Now sync existing data right away
      await syncAllDataToSheet(result.spreadsheetId, bookings, properties, marketers);

      setSyncStatus(getSavedSpreadsheetInfo());
      setStatusMessage({
        type: 'success',
        text: 'تم إنشاء جدول AppSheet في حسابك بنجاح ومزامنة جميع الحجوزات الحالية!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء إنشاء الجدول في Google Drive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Sync data to existing sheet
  const handleSyncData = async () => {
    if (!syncStatus.spreadsheetId) return;
    try {
      setLoading(true);
      setStatusMessage(null);
      const result = await syncAllDataToSheet(
        syncStatus.spreadsheetId,
        bookings,
        properties,
        marketers
      );
      setSyncStatus(getSavedSpreadsheetInfo());
      setStatusMessage({
        type: 'success',
        text: `تمت مزامنة (${result.count}) حجز وكافة السجلات مع جدول Google بنجاح!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'فشلت المزامنة. يرجى التأكد من صلاحيات الوصول.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Test pull from sheet
  const handlePullData = async () => {
    if (!syncStatus.spreadsheetId) return;
    try {
      setLoading(true);
      setStatusMessage(null);
      const rows = await fetchBookingsFromSheet(syncStatus.spreadsheetId);
      setStatusMessage({
        type: 'success',
        text: `تم فحص الجدول بنجاح: تم العثور على (${rows.length}) صف مسجل في Google Sheets.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'فشل فحص بيانات الجدول.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Connect existing sheet
  const handleConnectManual = () => {
    if (!manualSheetInput.trim()) return;
    let sheetId = manualSheetInput.trim();
    // Check if user pasted full URL
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    saveSpreadsheetInfo(sheetId, 'جدول Google Sheets مربوط يدوياً');
    setSyncStatus(getSavedSpreadsheetInfo());
    setShowManualInput(false);
    setManualSheetInput('');
    setStatusMessage({
      type: 'success',
      text: 'تم ربط جدول البيانات بنجاح! يمكنك الآن بدء المزامنة.',
    });
  };

  // Disconnect sheet
  const handleDisconnect = () => {
    if (window.confirm('هل أنت متأكد من إلغاء ربط جدول Google Sheets الحالي؟')) {
      disconnectSpreadsheet();
      setSyncStatus(getSavedSpreadsheetInfo());
      setStatusMessage({
        type: 'info',
        text: 'تم فك ارتباط الجدول.',
      });
    }
  };

  // Toggle Auto Sync
  const handleToggleAutoSync = () => {
    const nextVal = !syncStatus.autoSync;
    setAutoSyncPreference(nextVal);
    setSyncStatus((prev) => ({ ...prev, autoSync: nextVal }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-purple-100 flex flex-col max-h-[92vh] font-['Tajawal',sans-serif]">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#13103c] via-[#21124d] to-[#12082b] p-5 text-white flex items-center justify-between border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border border-emerald-400/30 flex items-center justify-center text-white shadow-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">
                  الربط مع منصة Google AppSheet و Google Workspace
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  AppSheet Ready
                </span>
              </div>
              <p className="text-xs text-purple-200">
                مزامنة بيانات النماذج والحجوزات وحركات الحراس لحظياً مع جداول Google وبناء تطبيق جوال فوري
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-100 px-4 bg-slate-50/80 text-xs font-bold gap-2 pt-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sync'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>الربط والمزامنة الحية</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>دليل إنشاء تطبيق AppSheet (30 ثانية)</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'schema'
                ? 'border-purple-700 text-purple-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>بنية الجداول والأعمدة</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                  : 'bg-purple-50 text-purple-900 border border-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* Google Account Authentication Section */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Google User"
                        className="w-10 h-10 rounded-full border border-purple-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          حساب Google المتصل
                        </span>
                        {currentUser && hasToken && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                            نشط ومصرح
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {currentUser
                          ? `${currentUser.displayName || 'مستخدم Google'} (${currentUser.email})`
                          : 'سجل الدخول بحساب Google Workspace لربط الجداول وتفعيل AppSheet'}
                      </p>
                    </div>
                  </div>

                  {currentUser && hasToken ? (
                    <button
                      type="button"
                      onClick={handleGoogleSignOut}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>تسجيل الدخول عبر Google</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Connected Spreadsheet Card */}
              {syncStatus.connected && syncStatus.spreadsheetId ? (
                <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200 rounded-2xl p-4.5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">
                            {syncStatus.spreadsheetName}
                          </h4>
                          <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                            متصل وجاهز للربط
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-800">
                          ID: {syncStatus.spreadsheetId.slice(0, 16)}...
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={syncStatus.spreadsheetUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>فتح في Google Sheets</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href={`https://www.appsheet.com/Template/App/new?source=sheets`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                        <span>فتح في AppSheet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleSyncData}
                      disabled={loading || !hasToken}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      <span>مزامنة كافة الحجوزات والسجلات الآن ({bookings.length} حجز)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePullData}
                      disabled={loading || !hasToken}
                      className="w-full py-2.5 px-3 bg-white hover:bg-emerald-100/50 text-emerald-950 font-bold border border-emerald-300 rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Database className="w-4 h-4 text-emerald-700" />
                      <span>فحص وتحديث السجلات من Google Sheets</span>
                    </button>
                  </div>

                  {/* Auto Sync & Options */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-emerald-200/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncStatus.autoSync}
                        onChange={handleToggleAutoSync}
                        className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                      />
                      <span className="font-bold text-slate-800">
                        مزامنة تلقائية عند إنشاء أو تعديل أي حجز في التطبيق
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>قطع الاتصال بالجدول</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Not Connected State: Create New or Connect Existing */
                <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center space-y-4 bg-gradient-to-b from-purple-50/40 to-white">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center mx-auto shadow-md">
                    <FileSpreadsheet className="w-7 h-7 text-emerald-100" />
                  </div>

                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      لم يتم ربط جدول Google Sheets حتى الآن
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      أنشئ جدول بيانات جديد مصمم خصيصاً لمنصة AppSheet بنقرة واحدة، أو اربط جدولاً موجوداً مسبقاً في حسابك.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCreateSpreadsheet}
                      disabled={loading || !hasToken}
                      className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>إنشاء نموذج AppSheet في Google Drive فوراً</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowManualInput(!showManualInput)}
                      className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-slate-50 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <LinkIcon className="w-4 h-4 text-purple-600" />
                      <span>ربط جدول حالي برابطه أو معرفه</span>
                    </button>
                  </div>

                  {!hasToken && (
                    <p className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 rounded-xl p-2 inline-block">
                      ⚠️ يرجى النقر على «تسجيل الدخول عبر Google» أعلاه أولاً لمنح الصلاحية للتطبيق في Drive.
                    </p>
                  )}
                </div>
              )}

              {/* Manual Sheet Link Input */}
              {showManualInput && (
                <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-bold text-purple-950">
                    ربط جدول Google Sheets موجود مسبقاً:
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ضع رابط Google Sheet أو Spreadsheet ID هنا..."
                      value={manualSheetInput}
                      onChange={(e) => setManualSheetInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs focus:outline-hidden focus:border-purple-600 text-left font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={handleConnectManual}
                      className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      ربط الجدول
                    </button>
                  </div>
                </div>
              )}

              {/* Live Preview Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[11px] text-slate-500 block">إجمالي الحجوزات</span>
                  <span className="text-lg font-black text-slate-900">{bookings.length}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[11px] text-slate-500 block">حركات اليوم</span>
                  <span className="text-lg font-black text-purple-900">
                    {bookings.filter((b: any) => b.guestArrived || b.checkedOut).length}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[11px] text-slate-500 block">العقارات المسجلة</span>
                  <span className="text-lg font-black text-emerald-900">{properties.length}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[11px] text-slate-500 block">المسوقين المعتمدين</span>
                  <span className="text-lg font-black text-indigo-900">{marketers.length}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-5 space-y-2 shadow-md">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-300" />
                  <h4 className="font-bold text-sm">
                    كيفية إنشاء تطبيق AppSheet متكامل لجوالك في 30 ثانية
                  </h4>
                </div>
                <p className="text-xs text-purple-200 leading-relaxed">
                  منصة Google AppSheet تقوم تلقائياً بتحويل جدول بيانات Google المصمم هنا إلى تطبيق جوال حقيقي
                  يحتوي على نماذج إدخال، أزرار اتصال بالعملاء، وحفظ مباشر.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-900 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">
                      إنشاء جدول البيانات المهيأ
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      من تبويب «الربط والمزامنة الحية»، اضغط زر «إنشاء نموذج AppSheet في Google Drive فوراً». سيتم إنشاء الجدول بأسماء الأعمدة المعتمدة.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-900 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">
                      التوجه إلى منصة Google AppSheet
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      انتقل إلى الرابط{' '}
                      <a
                        href="https://www.appsheet.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-700 font-bold underline"
                      >
                        appsheet.com
                      </a>
                      {' '}وسجّل الدخول بنفس حساب Google. اضغط على{' '}
                      <strong className="text-slate-900">«Create» ثم «App» ثم «Start with existing data»</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-900 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">
                      اختيار الملف المنشأ من Google Drive
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      اختر ملف <strong className="text-slate-900">«AMASA - نموذج الحجوزات و Google AppSheet»</strong>.
                      سيقوم AppSheet بالتعرف الذكي على الأعمدة (تاريخ الدخول كـ Date، الجوال كـ Phone، الأسعار كـ Price).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center shrink-0 text-xs">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-emerald-950">
                      تطبيق جوال فوري للحراس والمسوقين!
                    </h5>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      يمكنك مشاركة التطبيق مع الحارس لتسجيل الدخول والخروج واستلام التأمين عبر هاتفه، أو للمسوقين لحجز الشاليهات، وستنعكس أي حركة فوراً هنا وفي Google Sheets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <a
                  href="https://www.appsheet.com/Template/App/new?source=sheets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-amber-300" />
                  <span>فتح معالج إنشاء التطبيقات في AppSheet ↗</span>
                </a>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2">
                  جداول نموذج البيانات المهيأة لـ AppSheet:
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-purple-900">1. جدول «الحجوزات» (Bookings)</span>
                      <span className="text-[10px] text-slate-500 font-mono">24 عمود</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      رقم الحجز (Key) · اسم العميل · الجوال · الهوية الوطنية · العقار · القسم · تاريخ الدخول · تاريخ الخروج · عدد الليالي · سعر الليلة · الإجمالي · العربون المدفوع · المتبقي · التأمين · المسوق · عمولة المسوق · حالة الحجز · وصول النزيل · مغادرة النزيل · ملاحظات.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-purple-900">2. جدول «حركات_الدخول_والخروج» (CheckInOut)</span>
                      <span className="text-[10px] text-slate-500 font-mono">15 عمود</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      تاريخ الحركة · رقم الحجز · اسم النزيل · رقم الجوال · العقار · وصول النزيل · وقت الوصول · استلام التأمين نقداً · مغادرة النزيل · وقت المغادرة · إرجاع التأمين.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-purple-900">3. جدول «العقارات_والوحدات» (Properties)</span>
                      <span className="text-[10px] text-slate-500 font-mono">11 عمود</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      كود العقار · اسم العقار · الموقع · سعر وسط الأسبوع · سعر نهاية الأسبوع · عدد الوحدات · السعة · الغرف · الحمامات · الآيبان.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-purple-900">4. جدول «المسوقين_والعمولات» (Marketers)</span>
                      <span className="text-[10px] text-slate-500 font-mono">8 أعمدة</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      كود المسوق · اسم المسوق · رقم الجوال · البريد · نسبة العمولة (5%) · رقم الحساب البنكي · اسم البنك · حالة العقد.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-purple-700" />
            <span>بياناتك محمية ومشفرة عبر تصريحات Google Workspace الرسمية</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
