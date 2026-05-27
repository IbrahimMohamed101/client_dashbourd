import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle } from "lucide-react";
import type {
  OneTimeOrderAction,
  OneTimeOrderActionRequest,
} from "@/types/oneTimeOrderTypes";

interface OneTimeOrderConfirmDialogProps {
  open: boolean;
  action: OneTimeOrderAction | null;
  requiresPickupCode: boolean;
  onClose: () => void;
  onConfirm: (body: OneTimeOrderActionRequest) => void;
  isPending: boolean;
}

export function OneTimeOrderConfirmDialog({
  open,
  action,
  requiresPickupCode,
  onClose,
  onConfirm,
  isPending,
}: OneTimeOrderConfirmDialogProps) {
  const [pickupCode, setPickupCode] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const handleConfirm = () => {
    const body: OneTimeOrderActionRequest = {};
    if (requiresPickupCode && pickupCode) {
      body.pickupCode = pickupCode;
    }
    if (action === "cancel" && cancelReason) {
      body.reason = cancelReason;
    }

    onConfirm(body);
    setPickupCode("");
    setCancelReason("");
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      onClose();
      setPickupCode("");
      setCancelReason("");
    }
  };

  const isFulfilled = action === "fulfill";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            {isFulfilled ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {isFulfilled ? "تأكيد استلام العميل للطلب" : "تأكيد إلغاء الطلب"}
          </AlertDialogTitle>

          <AlertDialogDescription className="pt-2 text-base">
            {isFulfilled
              ? "يرجى التأكد من أن العميل قد استلم الطلب فعلاً من الفرع."
              : "هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء بسهولة."}
          </AlertDialogDescription>

          {requiresPickupCode && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-foreground/80">
                رمز الاستلام
              </label>
              <Input
                placeholder="000000"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value)}
                className="h-12 border-2 text-center text-2xl font-bold tracking-[0.5em] focus-visible:ring-primary"
                dir="ltr"
                autoFocus
              />
            </div>
          )}

          {action === "cancel" && (
            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-foreground/80">
                سبب الإلغاء
              </label>
              <Input
                placeholder="أدخل سبب الإلغاء..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="focus-visible:ring-primary"
                dir="rtl"
                autoFocus
              />
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={
              isPending ||
              (requiresPickupCode && !pickupCode.trim()) ||
              (action === "cancel" && !cancelReason.trim())
            }
            className={
              action === "cancel"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : isFulfilled
                  ? "bg-emerald-600 px-8 font-bold hover:bg-emerald-700"
                  : ""
            }
          >
            {isFulfilled ? "تأكيد الاستلام" : "تأكيد الإلغاء"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
