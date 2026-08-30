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
import { ToastMessage } from "@/components/global/ToastMessage";
import { parseApiError } from "@/lib/apiErrors";
import {
  fetchFinancialControlPreview,
  settleRefund,
  type RefundChannel,
} from "@/features/subscription-financial-control/subscriptionFinancialControlApi";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

interface RefundSettlementModalProps {
  subscriptionId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CHANNEL_LABELS: Record<RefundChannel, string> = {
  moyasar: "ميسر",
  payment_gateway: "بوابة دفع أخرى",
  cash: "كاش",
  bank_transfer: "تحويل بنكي",
};

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

export function RefundSettlementModal({
  subscriptionId,
  isOpen,
  onClose,
}: RefundSettlementModalProps) {
  const queryClient = useQueryClient();
  const [refundId, setRefundId] = useState("");
  const [method, setMethod] = useState<RefundChannel>("moyasar");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const previewQuery = useQuery({
    queryKey: ["subscription-financial-control", subscriptionId],
    queryFn: () => fetchFinancialControlPreview(subscriptionId),
    enabled: isOpen,
    staleTime: 0,
    retry: false,
  });

  const pendingRefunds = useMemo(
    () =>
      (previewQuery.data?.refunds || []).filter(
        (refund) =>
          refund.executionMode === "recorded_only" &&
          refund.settlement.status !== "settled"
      ),
    [previewQuery.data?.refunds]
  );

  const selectedRefund = useMemo(
    () => pendingRefunds.find((refund) => refund.id === refundId) || null,
    [pendingRefunds, refundId]
  );

  useEffect(() => {
    if (!isOpen) return;
    setRefundId("");
    setReference("");
    setNote("");
    setConfirmed(false);
  }, [isOpen, subscriptionId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!refundId || !pendingRefunds.some((refund) => refund.id === refundId)) {
      const first = pendingRefunds[0];
      setRefundId(first?.id || "");
      setMethod(first?.refundChannel || "moyasar");
    }
  }, [isOpen, pendingRefunds, refundId]);

  useEffect(() => {
    if (selectedRefund?.refundChannel) setMethod(selectedRefund.refundChannel);
  }, [selectedRefund?.id, selectedRefund?.refundChannel]);

  const mutation = useMutation({
    mutationFn: () =>
      settleRefund(subscriptionId, refundId, {
        method,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["subscription-financial-control", subscriptionId],
      });
      ToastMessage("تم تأكيد أن المبلغ رُد فعليًا خارج النظام", "success");
      setConfirmed(false);
      setReference("");
      setNote("");
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      ToastMessage(parsed.message || "تعذر تأكيد التسوية", "error");
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" dir="rtl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <ShieldAlert className="size-5 text-amber-700" />
            </div>
            <div>
              <DialogTitle>تسوية رد الأموال</DialogTitle>
              <DialogDescription className="mt-1">
                هذا جزء منفصل عن الإلغاء. استخدمه فقط بعد أن تعيد المبلغ للعميل فعليًا خارج الداشبورد.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
          هذه الشاشة أيضًا لا ترسل أموالًا ولا تستدعي ميسر أو أي بوابة دفع. هي فقط تؤكد أن عملية الرد تمت بالفعل خارج النظام حتى لا يتم تنفيذها مرتين.
        </div>

        {previewQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            جاري تحميل الاسترجاعات المعلقة...
          </div>
        ) : previewQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            تعذر تحميل سجلات الاسترجاع.
          </div>
        ) : pendingRefunds.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-600" />
            <p className="font-semibold">لا توجد مبالغ بانتظار التسوية</p>
            <p className="mt-1 text-sm text-muted-foreground">
              كل الاسترجاعات المسجلة لهذا الاشتراك تمت تسويتها أو لا تحتاج إجراء يدوي.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">الاسترجاع المطلوب تسويته</label>
              <select
                value={refundId}
                onChange={(event) => {
                  setRefundId(event.target.value);
                  setConfirmed(false);
                  setReference("");
                  setNote("");
                }}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              >
                {pendingRefunds.map((refund) => (
                  <option key={refund.id} value={refund.id}>
                    {sar(refund.amountHalala)} — {CHANNEL_LABELS[refund.refundChannel || "moyasar"]} — {formatDate(refund.recordedAt)}
                  </option>
                ))}
              </select>
            </div>

            {selectedRefund ? (
              <div className="grid gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">المبلغ</p>
                  <p className="mt-1 font-bold">{sar(selectedRefund.amountHalala)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الطريقة المخططة</p>
                  <p className="mt-1 font-bold">
                    {CHANNEL_LABELS[selectedRefund.refundChannel || "moyasar"]}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-semibold">الطريقة التي تم بها الرد فعليًا</label>
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value as RefundChannel)}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              >
                {(previewQuery.data?.refundChannels || Object.keys(CHANNEL_LABELS)).map((channel) => (
                  <option key={channel} value={channel}>
                    {CHANNEL_LABELS[channel as RefundChannel]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">رقم مرجع / إيصال</label>
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={200}
                className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                placeholder="اختياري — رقم عملية ميسر أو رقم إيصال الكاش"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">ملاحظة</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                rows={2}
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
                أؤكد أن مبلغ {selectedRefund ? sar(selectedRefund.amountHalala) : "الاسترجاع"} تم رده للعميل فعليًا خارج النظام، وأريد فقط تسجيل التسوية لمنع التكرار.
              </span>
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            إغلاق
          </Button>
          <Button
            type="button"
            disabled={!selectedRefund || !confirmed || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري التأكيد...
              </>
            ) : (
              "تأكيد أن المبلغ تم رده"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
