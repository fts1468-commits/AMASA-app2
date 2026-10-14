import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Send,
  Eye,
  Paperclip,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Booking, CommissionRequest } from '../../types';

export const CommissionRequestsSection: React.FC = () => {
  const {
    isAdmin,
    isGuard,
    currentMarketer,
    currentMarketerId,
    bookings,
    commissionRequests,
    getEligibleCommissionBookings,
    createCommissionRequest,
    markCommissionTransferred,
    rejectCommissionRequest,
    markCommissionRequestSeen,
  } = useApp();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getFirstDayOfMonth = () => getTodayStr().slice(0, 8) + '01';

  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getTodayStr());
  const [statusMessage, setStatusMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Receipt & Contract preview modals
  const [viewReceiptModal, setViewReceiptModal] = useState<CommissionRequest | null>(null);
  const [viewContractModal, setViewContractModal] = useState<Booking | null>(null);

  // Admin approval forms
  const [receiptFiles, setReceiptFiles] = useState<Record<string, { name: string; dataUrl?: string }>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);

  const STATUS_META = {
    pending: { text: 'بانتظار تدقيق الإدارة', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    transferred: { text: 'تم التحويل', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    rejected: { text: 'مرفوض', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  };

  const eligibleBookings = useMemo(() => {
    if (isAdmin || isGuard) return [];
    return getEligibleCommissionBookings(currentMarketerId, fromDate, toDate);
  }, [isAdmin, isGuard, getEligibleCommissionBookings, currentMarketerId, fromDate, toDate]);

  const totalEligibleCommission = eligibleBookings.reduce(
    (sum, b) => sum + (b.marketerCommission || 0),
    0
  );

  const todayStr = getTodayStr();
  const isBookingCompletedOrPast = (b: Booking) =>
    b.status === 'completed' || (b.status === 'confirmed' && b.checkOutDate < todayStr);

  const periodBookings = useMemo(() => {
    if (isAdmin || isGuard) return [];
    return bookings
      .filter(
        (b) =>
          b.marketerId === currentMarketerId &&
          b.status !== 'cancelled' &&
          b.checkInDate >= fromDate &&
          b.checkInDate <= toDate
      )
      .sort((a, b) => (a.checkInDate < b.checkInDate ? 1 : -1));
  }, [isAdmin, isGuard, bookings, currentMarketerId, fromDate, toDate]);

  const completedInPeriod = periodBookings.filter(isBookingCompletedOrPast);
  const completedSalesTotal = completedInPeriod.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const eligibleSalesTotal = eligibleBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const effectiveRate =
    eligibleSalesTotal > 0
      ? Math.round((totalEligibleCommission / eligibleSalesTotal) * 1000) / 10
      : 0;

  const fullCommissionsCount = eligibleBookings.filter(
    (b) => (b.commissionRatePercent || 5) === 7
  ).length;
  const partialCommissionsCount = eligibleBookings.length - fullCommissionsCount;

  const completionPercent =
    periodBookings.length > 0
      ? Math.round((completedInPeriod.length / periodBookings.length) * 100)
      : 0;

  const eligibleSet = new Set(eligibleBookings.map((b) => b.id));

  const formatContractMessage = (b: Booking) => {
    return (
      b.contractMessage ||
      `عقد حجز ${b.propertyName}${b.sectionName ? ' (' + b.sectionName + ')' : ''}
رقم الحجز: ${b.bookingNumber}
المستأجر: ${b.customerName}
من ${b.checkInDate} إلى ${b.checkOutDate} (${b.nightsCount} ليلة)
الإجمالي: ${b.totalPrice} ر.س | العربون: ${b.depositPaid} ر.س | المتبقي: ${b.remainingAmount} ر.س | التأمين: ${b.insuranceAmount} ر.س`
    );
  };

  if (isGuard) return null;

  const myRequests = commissionRequests.filter((r) => r.marketerId === currentMarketerId);
  const pendingRequestsForAdmin = commissionRequests.filter((r) => r.status === 'pending');
  const pastRequestsForAdmin = commissionRequests.filter((r) => r.status !== 'pending').slice(0, 6);

  const handleSubmitRequest = () => {
    const res = createCommissionRequest({ fromDate, toDate });
    setStatusMessage({ ok: res.ok, text: res.message });
  };

  const handleFileUpload = (reqId: string, file?: File) => {
    setFileError(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setReceiptFiles((prev) => ({ ...prev, [reqId]: { name: file.name } }));
      setFileError('حجم الملف كبير، يرجى استخدام صورة أقل من 2MB لعرضها للموظف.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptFiles((prev) => ({
        ...prev,
        [reqId]: { name: file.name, dataUrl: String(reader.result) },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenReceipt = (req: CommissionRequest) => {
    setViewReceiptModal(req);
    if (!isAdmin && !req.seenByMarketer) {
      markCommissionRequestSeen(req.id);
    }
  };

  const isImageReceipt = (url?: string) => !!url && url.startsWith('data:image');
  const isPdfReceipt = (url?: string) => !!url && url.startsWith('data:application/pdf');

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-purple-200/90 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-purple-950">
            {isAdmin ? 'طلبات صرف العمولة (تدقيق وتحويل)' : 'طلب العمولة'}
          </h3>
          <p className="text-[11px] text-slate-500">
            {isAdmin
              ? 'راجع طلبات الموظفين، أرفق إيصال التحويل البنكي ثم أكّد التحويل'
              : 'اختر الفترة الزمنية وأرسل الطلب للإدارة للتدقيق'}
          </p>
        </div>
      </div>

      {/* Marketer Request Form */}
      {!isAdmin && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="space-y-1">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> من تاريخ
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-[#FAF8FD] border border-purple-200 rounded-xl px-3 py-2 font-mono"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> إلى تاريخ
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-[#FAF8FD] border border-purple-200 rounded-xl px-3 py-2 font-mono"
              />
            </label>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">حجوزات مستحقة في الفترة</span>
              <span className="font-bold text-purple-950 font-mono text-base">{eligibleBookings.length}</span>
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">إجمالي العمولة</span>
              <span className="font-bold text-emerald-700 font-mono text-base">
                {totalEligibleCommission} ر.س
              </span>
            </div>
          </div>

          {/* Period Analysis Box */}
          <div className="rounded-2xl border border-purple-100 bg-white p-3 space-y-3">
            <h4 className="text-xs font-black text-purple-950">تحليل بياناتي في هذه الفترة</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-50/70 rounded-xl p-2.5 border border-purple-100">
                <span className="text-[10px] text-slate-400 block">عدد الحجوزات</span>
                <span className="font-bold text-purple-950 font-mono text-base">{periodBookings.length}</span>
              </div>
              <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-100">
                <span className="text-[10px] text-slate-400 block">المنجزة (منتهية)</span>
                <span className="font-bold text-emerald-800 font-mono text-base">
                  {completedInPeriod.length} <span className="text-[10px]">({completionPercent}%)</span>
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <span className="text-[10px] text-slate-400 block">قيمة الحجوزات المنجزة</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{completedSalesTotal} ر.س</span>
              </div>
              <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-100">
                <span className="text-[10px] text-slate-400 block">نسبة العمولة الفعلية</span>
                <span className="font-bold text-amber-800 font-mono text-base">{effectiveRate}%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold">
                حجز كلي 7%: {fullCommissionsCount}
              </span>
              <span className="px-2 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold">
                حجز جزئي 5%: {partialCommissionsCount}
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                مستحقة في الطلب: {eligibleBookings.length}
              </span>
            </div>

            {periodBookings.length === 0 ? (
              <p className="text-[11px] text-slate-400">لا توجد حجوزات لك في هذه الفترة.</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                {periodBookings.map((b) => {
                  const rate = b.commissionRatePercent || 5;
                  const isDone = isBookingCompletedOrPast(b);
                  const isEligible = eligibleSet.has(b.id);

                  return (
                    <div
                      key={b.id}
                      className="border border-slate-100 rounded-xl p-2.5 text-[11px] space-y-1.5 bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-800">{b.bookingNumber}</span>
                        <span className="flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] border ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isDone ? 'منجز' : 'قادم / جارٍ'}
                          </span>
                          {b.commissionStatus === 'paid' && (
                            <span className="px-1.5 py-0.5 rounded-md font-bold text-[10px] border bg-slate-100 text-slate-600 border-slate-200">
                              صُرفت
                            </span>
                          )}
                          {isEligible && (
                            <span className="px-1.5 py-0.5 rounded-md font-bold text-[10px] border bg-purple-50 text-purple-800 border-purple-200">
                              ضمن الطلب
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="text-slate-600">
                        {b.customerName} · <span className="font-mono">{b.checkInDate} ← {b.checkOutDate}</span> · {b.propertyName}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          <span className="font-mono">{b.totalPrice} ر.س</span> · نسبة{' '}
                          <strong className="text-purple-800">{rate}%</strong> ={' '}
                          <strong className="text-emerald-700 font-mono">{b.marketerCommission} ر.س</strong>
                        </span>
                        {isDone && (
                          <button
                            onClick={() => setViewContractModal(b)}
                            className="px-2.5 py-1 bg-white border border-purple-200 text-purple-900 rounded-lg font-bold flex items-center gap-1 cursor-pointer hover:bg-purple-50"
                          >
                            <FileText className="w-3 h-3" />
                            <span>العقد</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed">
            * يدخل في الطلب الحجوزات المؤكدة والمكتملة فقط. لا تُحتسب الحجوزات الملغاة أو غير المؤكدة أو التي صُرفت عمولتها، ولا الحجوزات الداخلة في طلب سابق قيد التدقيق.
          </p>

          <button
            onClick={handleSubmitRequest}
            disabled={eligibleBookings.length === 0 || !currentMarketer}
            className="btn-mauve-shiny w-full py-3 px-4 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>إرسال طلب العمولة للإدارة</span>
          </button>

          {statusMessage && (
            <div
              className={`text-xs font-bold p-2.5 rounded-xl border ${
                statusMessage.ok
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* History of Marketer Requests */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-700">طلباتي السابقة</h4>
            {myRequests.length === 0 ? (
              <p className="text-[11px] text-slate-400">لا توجد طلبات بعد.</p>
            ) : (
              myRequests.map((req) => (
                <div
                  key={req.id}
                  className="border border-slate-100 rounded-2xl p-3 text-xs space-y-2 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-700">
                      {req.fromDate} ← {req.toDate}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${STATUS_META[req.status].cls}`}>
                      {STATUS_META[req.status].text}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">
                      {req.bookingIds.length} حجز ·{' '}
                      <strong className="text-emerald-700 font-mono">{req.amount} ر.س</strong>
                    </span>
                    {req.status === 'transferred' && (
                      <button
                        onClick={() => handleOpenReceipt(req)}
                        className="px-3 py-1.5 bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>إيصال التحويل</span>
                        {!req.seenByMarketer && (
                          <span className="bg-amber-400 text-amber-950 text-[9px] px-1.5 rounded-full">
                            جديد
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {req.status === 'rejected' && req.adminNote && (
                    <p className="text-rose-700 text-[11px] flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {req.adminNote}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Admin Approval Queue */}
      {isAdmin && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700">
            بانتظار التدقيق ({pendingRequestsForAdmin.length})
          </h4>

          {pendingRequestsForAdmin.length === 0 && (
            <p className="text-[11px] text-slate-400">لا توجد طلبات معلقة حالياً.</p>
          )}

          {pendingRequestsForAdmin.map((req) => (
            <div
              key={req.id}
              className="border border-amber-200 bg-amber-50/40 rounded-2xl p-3 text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <strong className="text-slate-900">{req.marketerName}</strong>
                <span className="font-mono text-emerald-700 font-bold">{req.amount} ر.س</span>
              </div>

              <div className="text-slate-600 font-mono">
                {req.fromDate} ← {req.toDate} · {req.bookingIds.length} حجز
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white border border-dashed border-purple-300 rounded-xl px-3 py-2 text-purple-900 font-bold hover:bg-purple-50/50 transition-colors">
                <Paperclip className="w-4 h-4" />
                <span className="truncate">
                  {receiptFiles[req.id]?.name || 'إرفاق إيصال التحويل البنكي (صورة أو PDF)'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(req.id, e.target.files?.[0])}
                />
              </label>

              {fileError && <p className="text-[10px] text-amber-700">{fileError}</p>}

              <input
                type="text"
                value={adminNotes[req.id] || ''}
                onChange={(e) => setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="ملاحظة (تُستخدم عند الرفض)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={!receiptFiles[req.id]}
                  onClick={() =>
                    markCommissionTransferred(
                      req.id,
                      receiptFiles[req.id].name,
                      receiptFiles[req.id].dataUrl
                    )
                  }
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد التحويل</span>
                </button>
                <button
                  onClick={() => rejectCommissionRequest(req.id, adminNotes[req.id])}
                  className="py-2.5 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-rose-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>رفض</span>
                </button>
              </div>
            </div>
          ))}

          {pastRequestsForAdmin.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700">آخر الطلبات المعالجة</h4>
              {pastRequestsForAdmin.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between text-xs border border-slate-100 rounded-xl p-2.5"
                >
                  <span>
                    {req.marketerName} · <span className="font-mono">{req.amount} ر.س</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] ${STATUS_META[req.status].cls}`}>
                      {STATUS_META[req.status].text}
                    </span>
                    {req.status === 'transferred' && (
                      <button
                        onClick={() => handleOpenReceipt(req)}
                        className="text-purple-700 font-bold cursor-pointer"
                      >
                        الإيصال
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contract Preview Modal */}
      {viewContractModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewContractModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> عقد الحجز {viewContractModal.bookingNumber}
              </h4>
              <button onClick={() => setViewContractModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre
              className="whitespace-pre-wrap text-xs leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3 font-[inherit]"
              dir="rtl"
            >
              {formatContractMessage(viewContractModal)}
            </pre>

            <div className="text-[11px] text-slate-600">
              نسبة العمولة: <strong className="text-purple-800">{viewContractModal.commissionRatePercent || 5}%</strong> · العمولة:{' '}
              <strong className="text-emerald-700 font-mono">{viewContractModal.marketerCommission} ر.س</strong>
            </div>
          </div>
        </div>
      )}

      {/* Receipt View Modal */}
      {viewReceiptModal && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewReceiptModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> إيصال التحويل البنكي
              </h4>
              <button onClick={() => setViewReceiptModal(null)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-0.5">
              <div>
                الفترة: <span className="font-mono">{viewReceiptModal.fromDate} ← {viewReceiptModal.toDate}</span>
              </div>
              <div>
                المبلغ المحوّل: <strong className="text-emerald-700 font-mono">{viewReceiptModal.amount} ر.س</strong>
              </div>
              <div>
                تاريخ التحويل: <span className="font-mono">{viewReceiptModal.processedAt}</span>
              </div>
            </div>

            {isImageReceipt(viewReceiptModal.receiptDataUrl) ? (
              <img
                src={viewReceiptModal.receiptDataUrl}
                alt="إيصال التحويل"
                className="w-full rounded-2xl border border-slate-200"
              />
            ) : isPdfReceipt(viewReceiptModal.receiptDataUrl) ? (
              <a
                href={viewReceiptModal.receiptDataUrl}
                download={viewReceiptModal.receiptFileName || 'receipt.pdf'}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-purple-700 text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" /> تنزيل الإيصال (PDF)
              </a>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <FileText className="w-4 h-4 text-purple-700" />
                <span className="font-mono">{viewReceiptModal.receiptFileName || 'مرفق الإيصال'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
