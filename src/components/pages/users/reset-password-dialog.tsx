import { useEffect, useState } from "react";
import { KeyRoundIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "@tanstack/react-router";

import { ToastMessage } from "@/components/global/ToastMessage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useResetAdminCustomerPasswordMutation } from "@/hooks/useUsersQuery";
import type { User } from "@/types/userTypes";
import { getAdminCustomerErrorMessage } from "@/utils/fetchUsersData";
import type { CredentialsDialogData } from "./temporary-credentials-dialog";
import { TemporaryCredentialsDialog } from "./temporary-credentials-dialog";

const malformedResetCredentialsMessage =
  "تمت إعادة التعيين ولكن تعذر عرض كلمة المرور المؤقتة. تحقق من حالة المستخدم قبل إعادة المحاولة.";

export function ResetPasswordDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [credentials, setCredentials] = useState<CredentialsDialogData | null>(
    null
  );
  const queryClient = useQueryClient();
  const resetPassword = useResetAdminCustomerPasswordMutation();
  const resetPasswordMutationState = resetPassword.reset;

  useBlocker({
    disabled: !resetPassword.isPending,
    enableBeforeUnload: false,
    shouldBlockFn: () => resetPassword.isPending,
  });

  function closeCredentials() {
    setCredentials(null);
    setReason("");
    resetPasswordMutationState();
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["user-details", user.id] });
  }

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!resetPassword.isPending) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [resetPassword.isPending]);

  useEffect(() => {
    return () => {
      setCredentials(null);
      resetPasswordMutationState();
    };
  }, [resetPasswordMutationState]);

  function submitReset() {
    resetPassword.mutate(
      {
        userId: user.id,
        payload: reason.trim() ? { reason: reason.trim() } : {},
      },
      {
        onSuccess: (result) => {
          const phoneE164 = result.phoneE164 || user.phoneE164 || user.phone;
          if (
            !phoneE164 ||
            !result.temporaryPassword ||
            !result.temporaryPasswordExpiresAt
          ) {
            resetPasswordMutationState();
            ToastMessage(malformedResetCredentialsMessage, "error");
            return;
          }
          onOpenChange(false);
          setCredentials({
            title: "تمت إعادة تعيين كلمة المرور",
            customerName: user.fullName,
            phoneE164,
            temporaryPassword: result.temporaryPassword,
            expiresAt: result.temporaryPasswordExpiresAt,
            sessionsRevoked: result.sessionsRevoked,
          });
          resetPasswordMutationState();
        },
        onError: (error) => {
          ToastMessage(getAdminCustomerErrorMessage(error), "error");
        },
      }
    );
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && resetPassword.isPending) return;
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-w-lg"
          onEscapeKeyDown={(event) => {
            if (resetPassword.isPending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (resetPassword.isPending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
            <DialogDescription>
              سيتم إلغاء جلسات العميل الحالية وإنشاء كلمة مرور مؤقتة جديدة.
              سيُطلب من العميل تغييرها عند تسجيل الدخول التالي.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reset-reason">
              سبب إعادة التعيين
            </label>
            <Textarea
              id="reset-reason"
              value={reason}
              disabled={resetPassword.isPending}
              onChange={(event) => setReason(event.target.value)}
              placeholder="العميل حضر إلى الفرع وطلب إعادة تعيين كلمة المرور"
              className="min-h-24"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              onClick={submitReset}
              disabled={resetPassword.isPending}
            >
              <KeyRoundIcon data-icon="inline-start" />
              {resetPassword.isPending ? "جاري الإعادة..." : "تأكيد الإعادة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={resetPassword.isPending}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemporaryCredentialsDialog
        credentials={credentials}
        onClose={closeCredentials}
      />
    </>
  );
}
