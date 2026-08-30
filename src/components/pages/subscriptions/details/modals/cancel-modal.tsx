import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCancelSubscriptionMutation } from "@/hooks/useSubscriptionsQuery";
import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/lib/apiErrors";
import {
  executeFinancialControl,
  fetchFinancialControlPreview,
  type FinancialControlAction,
  type RefundChannel,
  type RefundMode,
} from "@/features/subscription-financial-control/subscriptionFinancialControlApi";
import { Calculator, Loader2, TriangleAlertIcon, WalletCards } from "lucide-react";
import { ToastMessage } from "@/components/global/ToastMessage";

interface CancelModalProps {
  subscriptionId: string;
  isOpen: boolean;
  onClose: () => void;
  isStacked?: boolean;
}

const REFUND_CHANNEL_LABELS: Record<RefundChannel, string> = {
  moyasar: "ميسر",
  payment_gateway: "بوابة دفع أخرى",
  cash: "كاش",
  bank_transfer: "تحويل بنكي",
};

function makeOperationKey() {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replaceAll("-", "_")
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `subfin_${random}`.slice(0, 120);
}

function sar(halala: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(Math.max(0, Number(halala || 0)) / 100);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function CancelModal({
  subscriptionId,
  isOpen,
  onClose,
  isStacked = false,
}: CancelModalProps) {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const queryClient = useQueryClient();
  const { mutateAsync: cancelSubscription, isPending: isLegacyCancelPending } =
    useCancelSubscriptionMutation();

  const [action, setAction] = useState<FinancialControlAction>("cancel");
  const [refundMode, setRefundMode] = useState<RefundMode>("full");
  const [refundChannel, setRefundChannel] = useState<RefundChannel>("moyasar");
  const [paymentId, setPaymentId] = useState("");
  const [partialAmountSar, setPartialAmountSar] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [operationKey, setOperationKey] = useState(makeOperationKey);

  const previewQuery = useQuery({
    queryKey: ["subscription-financial-control", subscriptionId],
    queryFn: () => fetchFinancialControlPreview(subscriptionId),
    enabled: isOpen && isSuperadmin,
    staleTime: 0,
    retry: false,
  });

  const preview = previewQuery.data;
  const refundablePayments = useMemo(
    () => (preview?.payments || []).filter((payment) => payment.refundableHalala > 0),
    [preview?.payments]
  );
  const selectedPayment = useMemo(
    () => refundablePayments.find((payment) => payment.paymentId === paymentId) || null,
    [paymentId, refundablePayments]
  );

  useEffect(() => {
    if (!isOpen) return;
    setAction("cancel");
    setRefundMode("full");
    setRefundChannel("moyasar");
    setPaymentId("");
    setPartialAmountSar("");
    setReason("");
    setNote("");
    setConfirmed(false);
    setOperationKey(makeOperationKey());
  }, [isOpen, subscriptionId]);

  useEffect(() => {
    if (!isOpen || !isSuperadmin) return;
    if (!paymentId || !refundablePayments.some((payment) => payment.paymentId === paymentId)) {
      setPaymentId(refundablePayments[0]?.paymentId || "");
    }
  }, [isOpen, isSuperadmin, paymentId, refundablePayments]);

  const resetOperationKey = () => {
    setOperationKey(makeOperationKey());
    setConfirmed(false);
  };

  const financialMutation = useMutation({
    mutationFn: async () => {
      const includesRefund = action === "refund" || action === "cancel_and_refund";
      const amountHalala = Math.round(Number(partialAmountSar) * 100);
      return executeFinancialControl(subscriptionId, {
        action,
        operationKey,
        reason: reason.trim(),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(includesRefund
          ? {
              paymentId,
              refundMode,
              refundChannel,
              ...(refundMode === "partial" ? { amountHalala } : {}),
            }
          : {}),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["subscription-details", subscriptionId] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions-list"] }),
        queryClient.invalidateQueries({
          queryKey: ["subscription-financial-control", subscriptionId],
        }),
      ]);
      const message =
        action === "cancel"
          ? "تم إلغاء الاشتراك بنجاح"
          : action === "refund"
            ? "تم تسجيل الاسترجاع محاسبيًا فقط — لم يتم تحويل أي أموال"
            : "تم إلغاء الاشتراك وتسجيل الاسترجاع محاسبيًا — لم يتم تحويل أي أموال";
      ToastMessage(message, "success");
      onClose();
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      if (parsed.code === "REFUND_RECORD_IN_PROGRESS") {
        ToastMessage("هناك عملية تسجيل استرجاع أخرى على نفس الدفعة. حاول مرة أخرى بعد لحظات.", "error");
        return;
      }
      ToastMessage(parsed.message || "تعذر تنفيذ العملية", "error");
    },
  });

  const handleLegacyCancel = async () => {
    try {
      await cancelSubscription(subscriptionId);
      ToastMessage("تم إلغاء الاشتراك بنجاح", "success");
      onClose();
    } catch (error) {
      console.error(error);
      ToastMessage("حدث خطأ أثناء إلغاء الاشتراك", "error");
    }
  };

  if (!isSuperadmin) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <TriangleAlertIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <DialogTitle className="text-xl">إلغاء الاشتراك</DialogTitle>
            <DialogDescription className="pt-2 text-base">
              هل أنت متأكد من رغبتك في إلغاء هذا الاشتراك؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row-reverse gap-2 pt-4 sm:flex-row sm:justify-start">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLegacyCancelPending}>
              تراجع
            </Button>
            <Button type="button" variant="destructive" onClick={handleLegacyCancel} disabled={isLegacyCancelPending}>
              {isLegacyCancelPending ? "جاري الإلغاء..." : "نعم، إلغاء الاشتراك"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const includesRefund = action === "refund" || action === "cancel_and_refund";
  const includesCancel = action === "cancel" || action === "cancel_and_refund";
  const partialAmountHalala = Math.round(Number(partialAmountSar) * 100);
  const invalidPartial =
    refundMode === "partial" &&
    (!Number.isFinite(partialAmountHalala) ||
      partialAmountHalala <= 0 ||
      !selectedPayment ||
      partialAmountHalala > selectedPayment.refundableHalala);
  const cancellationBlocked = includesCancel && (isStacked || preview?.canCancel === false);
  const submitDisabled =
    financialMutation.isPending ||
    previewQuery.isLoading ||
    previewQuery.isError ||
    reason.trim().length < 3 ||
    !confirmed ||
    cancellationBlocked ||
    (includesRefund && (!selectedPayment || selectedPayment.refundableHalala <= 0)) ||
    (includesRefund && refundMode === "partial" && invalidPartial);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !financialMutation.isPending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-red-100">
              <WalletCards className="size-5 text-red-700" />
            </div>
            <div>
              <DialogTitle className="text-xl">الإلغاء والاسترجاع المحاسبي</DialogTitle>
              <DialogDescription className="mt-1">
                متاح للسوبر أدمن فقط. هذه الشاشة تسجل أثر الاسترجاع في التقارير ولا تنفذ أي تحويل مالي.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
          <div className="flex items-start gap-2">
            <Calculator className="mt-0.5 size-4 shrink-0" />
            <p>
              تسجيل الاسترجاع هنا <strong>محاسبي فقط</strong>. لن يتم الاتصال بميسر أو أي بوابة دفع ولن يتم إرسال أموال للعميل.
            </p>
          </div>
        </div>

        {previewQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border p-8 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            جاري مراجعة الدفعات وحالة الاشتراك...
          </div>
        ) : previewQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            تعذر تحميل بيانات الاسترجاع. أغلق النافذة وحاول مرة أخرى.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">حالة الاشتراك</p>
                <p className="mt-1 font-semibold">{preview?.subscription.status || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">قابل للتسجيل كاسترجاع</p>
                <p className="mt-1 font-semibold">{sar(preview?.totalRefundableHalala || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">بانتظار رد فعلي</p>
                <p className="mt-1 font-semibold">{sar(preview?.pendingSettlementHalala || 0)}</p>
              </div>
            </div>

            {isStacked ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                هذا اشتراك متعدد الباقات. تسجيل الاسترجاع المحاسبي متاح، لكن إلغاء الحاوية كاملة ما زال محميًا حتى يكتمل مسار الإلغاء الآمن للباقات المجمعة.
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-semibold">نوع العملية</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  ["cancel", "إلغاء فقط"],
                  ["refund", "استرجاع محاسبي فقط"],
                  ["cancel_and_refund", "إلغاء + استرجاع محاسبي"],
                ] as const).map(([value, label]) => {
                  const blocked = value !== "refund" && (isStacked || preview?.canCancel === false);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={blocked}
                      onClick={() => {
                        setAction(value);
                        resetOperationKey();
                      }}
                      className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        action === value
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-background hover:bg-muted"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {includesRefund ? (
              <div className="space-y-4 rounded-xl border p-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">الدفعة المرتبطة بالاسترجاع</label>
                  <select
                    value={paymentId}
                    onChange={(event) => {
                      setPaymentId(event.target.value);
                      setPartialAmountSar("");
                      resetOperationKey();
                    }}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {refundablePayments.length === 0 ? (
                      <option value="">لا توجد دفعات متاحة</option>
                    ) : null}
                    {refundablePayments.map((payment) => (
                      <option key={payment.paymentId} value={payment.paymentId}>
                        {sar(payment.refundableHalala)} متاح — {payment.method || payment.provider || "دفعة"} — {formatDate(payment.paidAt)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">طريقة رد المبلغ المخطط لها</label>
                  <select
                    value={refundChannel}
                    onChange={(event) => {
                      setRefundChannel(event.target.value as RefundChannel);
                      resetOperationKey();
                    }}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    {(preview?.refundChannels || Object.keys(REFUND_CHANNEL_LABELS)).map((channel) => (
                      <option key={channel} value={channel}>
                        {REFUND_CHANNEL_LABELS[channel as RefundChannel]}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    هذا اختيار للتتبع والتحليل فقط. لا ينفذ النظام أي تحويل من هذه الشاشة.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode("full");
                      setPartialAmountSar("");
                      resetOperationKey();
                    }}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                      refundMode === "full" ? "border-primary bg-primary/10 text-primary" : "bg-background"
                    }`}
                  >
                    كامل {selectedPayment ? `(${sar(selectedPayment.refundableHalala)})` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode("partial");
                      resetOperationKey();
                    }}
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                      refundMode === "partial" ? "border-primary bg-primary/10 text-primary" : "bg-background"
                    }`}
                  >
                    جزئي
                  </button>
                </div>

                {refundMode === "partial" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">المبلغ بالريال</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={partialAmountSar}
                      onChange={(event) => {
                        setPartialAmountSar(event.target.value);
                        resetOperationKey();
                      }}
                      placeholder="مثال: 150.00"
                      className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                    />
                    {invalidPartial ? (
                      <p className="text-xs font-medium text-red-600">
                        أدخل مبلغًا أكبر من صفر ولا يتجاوز {sar(selectedPayment?.refundableHalala || 0)}.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-semibold">سبب العملية *</label>
              <textarea
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  resetOperationKey();
                }}
                rows={3}
                maxLength={500}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="مثال: طلب العميل إلغاء الاشتراك واسترجاع المتبقي"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">ملاحظة داخلية</label>
              <textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                  resetOperationKey();
                }}
                rows={2}
                maxLength={1000}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="اختياري"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-1"
              />
              <span>
                أفهم أن هذا الإجراء {includesCancel ? "قد يلغي الاشتراك و" : ""}
                {includesRefund ? "يسجل الاسترجاع في الحسابات فقط بدون تحويل أموال." : "لا يمكن التراجع عنه."}
              </span>
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={financialMutation.isPending}>
            إغلاق
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitDisabled}
            onClick={() => financialMutation.mutate()}
          >
            {financialMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري التسجيل...
              </>
            ) : includesRefund ? (
              "تأكيد التسجيل المحاسبي"
            ) : (
              "تأكيد الإلغاء"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
