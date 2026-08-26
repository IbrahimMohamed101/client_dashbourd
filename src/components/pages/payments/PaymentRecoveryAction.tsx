import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/types/paymentTypes";
import { verifyPayment } from "@/utils/fetchPaymentsData";

interface PaymentRecoveryActionProps {
  payment: Payment;
}

export function PaymentRecoveryAction({ payment }: PaymentRecoveryActionProps) {
  const queryClient = useQueryClient();
  const paymentId = payment.id || payment._id || "";
  const mutation = useMutation({
    mutationFn: () => verifyPayment(paymentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["payments-list"] }),
        queryClient.invalidateQueries({ queryKey: ["payment-details", paymentId] }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions-list"] }),
      ]);
      toast.success("تم التحقق من الدفعة ومزامنة الاشتراك");
    },
    onError: (error: Error & { normalizedMessage?: string }) => {
      toast.error(error.normalizedMessage || "تعذر مزامنة الدفعة. راجع حالتها وحاول مرة أخرى.");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={mutation.isPending || !paymentId}
          aria-label={`مزامنة الدفعة ${payment.reference || paymentId}`}
        >
          <RefreshCw className={`ml-1 size-4 ${mutation.isPending ? "animate-spin" : ""}`} />
          مزامنة
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle>مزامنة الدفعة مع ميسر؟</AlertDialogTitle>
          <AlertDialogDescription className="text-right leading-6">
            سيتحقق الخادم من حالة الدفعة لدى ميسر، ثم يطبقها مرة واحدة فقط إذا كانت
            مدفوعة ولم تُطبّق بعد. لن يُنشئ دفعًا جديدًا ولن يكرر الاشتراك المطبق.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-start">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "جارٍ التحقق..." : "تحقق وطبّق"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
