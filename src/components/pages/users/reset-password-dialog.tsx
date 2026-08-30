import { useEffect, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CopyIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import api from "@/lib/apis";
import type { User } from "@/types/userTypes";
import { getAdminCustomerErrorMessage } from "@/utils/fetchUsersData";

type DirectPasswordResetResult = {
  userId: string;
  phoneE164: string;
  password: string;
  passwordChangedAt?: string | null;
  forcePasswordChange: false;
  sessionsRevoked: boolean;
  directLoginReady: boolean;
};

type PasswordCredentials = {
  customerName: string | null;
  phoneE164: string;
  password: string;
  sessionsRevoked: boolean;
};

const malformedResetCredentialsMessage =
  "تمت إعادة تعيين كلمة المرور، ولكن تعذر عرض كلمة المرور الجديدة. حدّث بيانات العميل قبل تنفيذ إعادة تعيين أخرى حتى لا تفقد كلمة المرور التي تم إنشاؤها.";

async function resetCustomerPasswordDirect({
  userId,
  reason,
}: {
  userId: string;
  reason: string;
}) {
  const response = await api.post<{ status: boolean; data: DirectPasswordResetResult }>(
    `/api/dashboard/customer-management/${userId}/password-reset`,
    { reason },
    { suppressGlobalForbiddenToast: true }
  );
  return response.data.data;
}

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
  const [credentials, setCredentials] = useState<PasswordCredentials | null>(null);
  const [malformedSuccessOpen, setMalformedSuccessOpen] = useState(false);
  const requestInFlightRef = useRef(false);
  const queryClient = useQueryClient();
  const resetPassword = useMutation({
    mutationFn: resetCustomerPasswordDirect,
    retry: false,
    gcTime: 0,
  });
  const protectedState =
    resetPassword.isPending || Boolean(credentials) || malformedSuccessOpen;

  useBlocker({
    disabled: !protectedState,
    enableBeforeUnload: false,
    shouldBlockFn: () => protectedState,
  });

  function refreshCustomerData() {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["user-details", user.id] });
  }

  function closeCredentials() {
    setCredentials(null);
    setReason("");
    resetPassword.reset();
    refreshCustomerData();
  }

  function closeMalformedSuccess() {
    setMalformedSuccessOpen(false);
    setReason("");
    resetPassword.reset();
    refreshCustomerData();
  }

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!protectedState) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [protectedState]);

  useEffect(() => {
    return () => {
      setCredentials(null);
      setMalformedSuccessOpen(false);
      requestInFlightRef.current = false;
      resetPassword.reset();
    };
  }, [resetPassword]);

  function submitReset() {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 3) {
      ToastMessage("اكتب سبب إعادة التعيين قبل المتابعة", "error");
      return;
    }
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    resetPassword.mutate(
      { userId: user.id, reason: normalizedReason },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          const phoneE164 = result.phoneE164 || user.phoneE164 || user.phone;
          if (!phoneE164 || !result.password || result.forcePasswordChange !== false) {
            setMalformedSuccessOpen(true);
            return;
          }

          setCredentials({
            customerName: user.fullName,
            phoneE164,
            password: result.password,
            sessionsRevoked: result.sessionsRevoked,
          });
        },
        onError: (error) => {
          ToastMessage(getAdminCustomerErrorMessage(error), "error");
        },
        onSettled: () => {
          requestInFlightRef.current = false;
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
              سيتم إنشاء كلمة مرور جديدة ونهائية تعمل مباشرة في تطبيق العميل، مع تسجيل
              خروج العميل من كل الأجهزة وإلغاء الجلسات القديمة. كلمة المرور ستظهر مرة
              واحدة فقط بعد التنفيذ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="reset-reason">
              سبب إعادة التعيين — مطلوب
            </label>
            <Textarea
              id="reset-reason"
              value={reason}
              disabled={resetPassword.isPending}
              onChange={(event) => setReason(event.target.value)}
              placeholder="مثال: العميل حضر إلى الفرع وطلب إعادة تعيين كلمة المرور"
              className="min-h-24"
              maxLength={500}
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            بعد التنفيذ لن تعمل كلمة المرور القديمة. أعطِ العميل كلمة المرور الجديدة فقط.
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

      <NewPasswordDialog credentials={credentials} onClose={closeCredentials} />

      <Dialog open={malformedSuccessOpen}>
        <DialogContent
          dir="rtl"
          showCloseButton={false}
          className="max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-amber-600" />
              تعذر عرض كلمة المرور الجديدة
            </DialogTitle>
            <DialogDescription>{malformedResetCredentialsMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={closeMalformedSuccess}>
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NewPasswordDialog({
  credentials,
  onClose,
}: {
  credentials: PasswordCredentials | null;
  onClose: () => void;
}) {
  const open = Boolean(credentials);

  async function copyValue(value: string, message: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      ToastMessage(message, "success");
    } catch {
      ToastMessage("تعذر النسخ تلقائيًا. انسخ البيانات يدويًا.", "error");
    }
  }

  const copyText = credentials
    ? [
        `اسم العميل: ${credentials.customerName || "—"}`,
        `رقم الجوال: ${credentials.phoneE164}`,
        `كلمة المرور الجديدة: ${credentials.password}`,
        "كلمة المرور تعمل مباشرة في التطبيق ولا تحتاج تغييرًا عند أول دخول.",
      ].join("\n")
    : "";

  return (
    <Dialog open={open}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="max-w-xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2Icon className="size-5 text-emerald-600" />
            تمت إعادة تعيين كلمة المرور
          </DialogTitle>
          <DialogDescription>
            هذه هي كلمة المرور الجديدة النهائية. يمكن للعميل تسجيل الدخول بها مباشرة من
            التطبيق ولا يحتاج إلى شاشة تغيير كلمة مرور إضافية.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <dl className="grid gap-4 text-sm">
                <CredentialRow label="اسم العميل" value={credentials.customerName || "—"} />
                <CredentialRow label="رقم الجوال" value={credentials.phoneE164} ltr />
                <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
                  <dt className="text-muted-foreground">كلمة المرور الجديدة</dt>
                  <dd className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                    <bdi
                      dir="ltr"
                      className="min-w-0 flex-1 select-all break-all rounded-md border bg-background px-3 py-2 text-left font-mono text-lg font-bold [unicode-bidi:isolate]"
                    >
                      {credentials.password}
                    </bdi>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        copyValue(credentials.password, "تم نسخ كلمة المرور الجديدة")
                      }
                    >
                      <CopyIcon data-icon="inline-start" />
                      نسخ
                    </Button>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
                <span>
                  كلمة المرور القديمة لم تعد تعمل، والجلسات القديمة أُلغيت. يمكن تسجيل
                  الدخول الآن برقم الجوال وكلمة المرور الظاهرة أعلاه.
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              احفظ أو انسخ كلمة المرور قبل الضغط على «تم». لن تظهر مرة أخرى بعد إغلاق
              هذه النافذة.
            </div>
          </div>
        ) : null}

        <DialogFooter className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Button
            type="button"
            variant="outline"
            onClick={() => copyValue(copyText, "تم نسخ بيانات الدخول الجديدة")}
          >
            <CopyIcon data-icon="inline-start" />
            نسخ بيانات الدخول
          </Button>
          <Button type="button" onClick={onClose}>
            تم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>
        <bdi
          dir={ltr ? "ltr" : "rtl"}
          className={
            ltr
              ? "block select-all break-all text-left font-medium tabular-nums [unicode-bidi:isolate]"
              : "block select-all break-words text-right font-medium [unicode-bidi:isolate]"
          }
        >
          {value}
        </bdi>
      </dd>
    </div>
  );
}
